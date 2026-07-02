# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server on http://localhost:3000
npm run build     # Production build (TypeScript errors are suppressed — see next.config.mjs)
npm run lint      # ESLint check
npm run start     # Start production server after build
```

No test suite is configured.

## Architecture

**Stack**: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Shadcn UI · PostgreSQL (`pg`) · Vercel Blob · `jose` (JWT) · `bcryptjs` (password hashing)

### Authentication

Auth is fully custom — no Supabase. Users are stored in the `public.users` table with bcrypt-hashed passwords. On login/register, a signed JWT is issued and stored as an HTTP-only cookie (`auth_token`).

- `lib/auth.ts` — `signToken`, `verifyToken`, `AUTH_COOKIE`, `COOKIE_OPTIONS`
- `app/api/auth/register/route.ts` — POST: create user, set cookie
- `app/api/auth/login/route.ts` — POST: verify credentials, set cookie
- `app/api/auth/logout/route.ts` — POST: clear cookie
- `middleware.ts` — JWT verification for `/dashboard` and `/org` routes (Edge-compatible via `jose`)

**Getting the current user in API routes:**
```ts
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'

const token = request.cookies.get(AUTH_COOKIE)?.value
const user = token ? await verifyToken(token) : null
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**Getting the current user in Server Components (layouts):**
```ts
import { cookies } from 'next/headers'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'

const cookieStore = await cookies()
const token = cookieStore.get(AUTH_COOKIE)?.value
const user = token ? await verifyToken(token) : null
if (!user) redirect('/auth/login')
```

### Database

All DB access goes through the `pg` pool in `lib/db.ts`.

- `lib/db.ts` — singleton `pg` Pool (default export); use `pool.query(text, params)` or `pool.connect()` for transactions

For simple queries use `pool.query()` directly. For multi-statement transactions use `pool.connect()` with explicit `BEGIN` / `COMMIT` / `ROLLBACK`:

```ts
const client = await pool.connect()
try {
  await client.query('BEGIN')
  // ... multiple queries ...
  await client.query('COMMIT')
} catch (e) {
  await client.query('ROLLBACK')
  throw e
} finally {
  client.release()
}
```

Always use `$1, $2, …` parameterized placeholders. Use `RETURNING *` after INSERT/UPDATE when the caller needs the resulting row.

### Data access layer (`lib/`)

Each domain has a server-side module in `lib/` that exports typed async functions:

| File | Domain |
|---|---|
| `lib/auth.ts` | JWT sign/verify utilities |
| `lib/organizations.ts` | Orgs, membership, roles (owner/admin/member/guest) |
| `lib/projects.ts` | Projects per org |
| `lib/tasks.ts` | Tasks per project, order index, audit log |
| `lib/comments.ts` | Soft-deleted comments on tasks |
| `lib/notifications.ts` | Per-user notifications with read tracking |
| `lib/teams.ts` | Teams, team members, team-role assignments |
| `lib/roles.ts` | Custom RBAC roles and permissions per org |
| `lib/attachments.ts` | File metadata (Vercel Blob URL stored in pg) |
| `lib/search.ts` | Full-text search via `search_text @@ plainto_tsquery(...)` |
| `lib/view-preferences.ts` | Per-user view/sort/filter state per project |

Lib functions that write records accept `userId` as an explicit parameter (passed in by the API route after auth). They do not perform auth themselves.

### API routes (`app/api/`)

Route handlers follow this pattern:
1. Extract and verify JWT cookie → get `user.id`
2. Validate inputs
3. Delegate to a `lib/` function for the DB work
4. Return `NextResponse.json()`

### Routing

```
/                          → landing page
/auth/login                → email/password login form
/auth/sign-up              → registration form
/dashboard                 → protected; layout checks JWT and redirects
/org/[slug]                → org overview
/org/[slug]/projects       → project list
/org/[slug]/projects/[id]  → project detail with task board/list/calendar views
/org/[slug]/settings       → org settings, members, teams, roles
```

### Database schema

The `public.users` table owns all auth and profile data:

```sql
users(id uuid PK, email text UNIQUE, password_hash text, first_name text, last_name text, avatar_url text, created_at, updated_at)
```

Run `scripts/002_auth_migration.sql` to create this table and update all FK references from `auth.users` to `public.users`.

### Environment variables

| Variable | Purpose |
|---|---|
| `POSTGRES_URL` | PostgreSQL connection string for `pg` pool |
| `JWT_SECRET` | Secret key for signing/verifying JWTs (min 32 chars) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for file uploads |

### Key conventions

- Server Components fetch data directly from `lib/` functions. Client Components call API routes.
- Dynamic SQL (`SET ${setClause}`) is built by mapping over `Object.entries(data)` — column names come from typed interfaces, not user input, so this is safe.
- Never store JWTs in localStorage; always use HTTP-only cookies.
- `lib/auth.ts` uses only `jose` — no Node.js APIs — so it is safe to import from middleware (Edge runtime).
