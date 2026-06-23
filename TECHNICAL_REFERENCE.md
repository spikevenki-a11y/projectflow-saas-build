# ProjectFlow Technical Reference

## Database Schema

### Organizations Table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
- SELECT: Users can view orgs they own or are members of
- INSERT: Only authenticated users can create orgs
- UPDATE: Only owners/admins can update
- DELETE: Only owners can delete
```

### Organization Members Table
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- RLS Policies
- SELECT: Users can view members of orgs they belong to
- INSERT: Only org admins/owners can add members
- UPDATE: Only org admins/owners can update roles
- DELETE: Only org admins/owners can remove members
```

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
- SELECT: All authenticated users can view profiles
- INSERT: Users can only create their own profile
- UPDATE: Users can only update their own profile
- DELETE: Users can only delete their own profile
```

## API Endpoints

### Authentication Endpoints
- `POST /auth/sign-up` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout (handled by middleware)
- `GET /auth/callback` - OAuth/email link callback

### Organization Endpoints (Implemented)
- `GET /api/organizations` - List user's organizations (via RLS)
- `POST /api/organizations` - Create new organization
- `GET /api/organizations/[id]` - Get organization details
- `PUT /api/organizations/[id]` - Update organization
- `DELETE /api/organizations/[id]` - Delete organization

### Member Endpoints (Implemented)
- `GET /api/organizations/[id]/members` - List organization members
- `POST /api/organizations/[id]/members` - Add member
- `PUT /api/organizations/[id]/members/[userId]` - Update member role
- `DELETE /api/organizations/[id]/members/[userId]` - Remove member

### Phase 2+ Endpoints (To Implement)
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

## Authentication Flow

### Sign Up
```
User fills form → POST /auth/sign-up → Supabase creates user → 
Email sent → User confirms email → Trigger creates profile → 
Auto-redirect to /auth/callback → Set session cookie → Redirect to /dashboard
```

### Login
```
User fills form → POST /auth/login → Supabase authenticates → 
Session created → Redirect to /auth/callback → Set session cookie → 
Redirect to /dashboard
```

### Protected Routes
```
Request → Middleware checks auth.users() → 
If no session, redirect to /auth/login → 
If session exists, allow access to route
```

## State Management

### Patterns Used
1. **Server-Side State**: Organization data fetched on server, passed to client
2. **Client-Side State**: useState for form inputs, loading states
3. **Context Pattern**: Ready for Phase 3 (not yet implemented)
4. **Real-time Subscriptions**: Ready with Supabase (Phase 3)

### Key Hooks
```typescript
// Fetch user session
const { data: { user } } = await supabase.auth.getUser()

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth state changes
})

// Client-side data fetching
const { data } = await supabase
  .from('organizations')
  .select('*')
  .eq('slug', slug)
  .single()
```

## Component Patterns

### Page Component Pattern
```typescript
'use client' // For interactivity

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Page() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Fetch data
  }, [])

  return <div>{/* UI */}</div>
}
```

### Server Component Pattern
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Component() {
  const supabase = await createClient()
  const { data } = await supabase.from('table').select('*')
  
  return <div>{/* UI with server data */}</div>
}
```

## Error Handling

### Supabase Errors
```typescript
const { data, error } = await supabase.from('table').select('*')

if (error) {
  // Handle:
  // - 401 (Unauthorized)
  // - 403 (Forbidden - RLS violation)
  // - 409 (Conflict - unique violation)
  // - 400 (Bad request)
}
```

### Auth Errors
```typescript
if (signUpError) {
  // Handle:
  // - 'User already registered'
  // - 'Invalid email'
  // - 'Weak password'
  // - Network errors
}
```

## Performance Optimization

### Current Optimizations
1. **RLS at Database Level**: No unnecessary queries
2. **Middleware Caching**: Session reused
3. **Component Splitting**: Lazy components ready
4. **Image Optimization**: Ready for Phase 5

### Future Optimizations
1. **Query Pagination**: For large member lists
2. **Batch Operations**: Multiple organization loads
3. **Caching Strategy**: Redis/Upstash (Phase X)
4. **Database Indexes**: Already created on org_id, user_id, slug

## Security Best Practices

### Implemented
1. ✅ RLS on all tables
2. ✅ Email confirmation required
3. ✅ Secure session handling
4. ✅ CSRF protection (Next.js built-in)
5. ✅ SQL injection prevention (Supabase parameterized)
6. ✅ XSS prevention (React sanitizes)

### Future
1. 🔄 Rate limiting (Upstash)
2. 🔄 API key authentication
3. 🔄 Webhook signing
4. 🔄 Audit logging

## Monitoring & Debugging

### Enable Debug Logs
```typescript
// In browser console
localStorage.debug = '*'

// In Supabase
// Dashboard → Logs → check auth and database logs
```

### Key Metrics to Monitor
- Auth success rate
- Query response times
- RLS policy violations
- Session duration
- Error rates

### Common Issues & Solutions

#### RLS Denying Access
```sql
-- Check if user is member
SELECT * FROM organization_members 
WHERE org_id = 'xxx' AND user_id = 'yyy'

-- Check policy
SELECT * FROM pg_policies 
WHERE tablename = 'organizations'
```

#### Session Not Persisting
```typescript
// Ensure middleware.ts is running
// Check cookies in browser DevTools
// Verify redirect URL is correct
```

#### Slow Queries
```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'organizations'

-- Add index if needed
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id)
```

## Testing Strategy

### Unit Testing (Future)
- Component render tests
- Utility function tests
- Helper function tests

### Integration Testing (Future)
- Auth flow testing
- Organization CRUD testing
- Member management testing

### E2E Testing (Future)
- Full user journey
- Multi-user scenarios
- Edge cases and errors

### Manual Testing Checklist
- [ ] Sign up with new email
- [ ] Confirm email and login
- [ ] Create organization
- [ ] View organization members
- [ ] Try to access another org
- [ ] Logout and verify redirect
- [ ] Test on mobile viewport

## Deployment Checklist

### Pre-Deployment
- [ ] All env vars configured
- [ ] Database migrations run
- [ ] RLS policies verified
- [ ] Auth settings correct in Supabase
- [ ] Email templates configured
- [ ] Error logging set up

### Post-Deployment
- [ ] Test sign up/login flow
- [ ] Verify email confirmation
- [ ] Check organization creation
- [ ] Monitor error rates
- [ ] Verify HTTPS/SSL
- [ ] Check database backups

## Infrastructure Diagram

```
┌─────────────────────────────────────────┐
│          User Browser                   │
└────────────────┬────────────────────────┘
                 │ HTTPS
┌─────────────────▼────────────────────────┐
│         Next.js Application              │
│  ├─ App Router (pages & layouts)        │
│  ├─ API Routes                          │
│  └─ Middleware (auth protection)        │
└────────────────┬────────────────────────┘
                 │ HTTPS + JWT
┌─────────────────▼────────────────────────┐
│      Supabase Cloud                      │
│  ├─ PostgreSQL Database (RLS enabled)   │
│  ├─ Auth Service                        │
│  ├─ Realtime Subscriptions (Phase 3)    │
│  └─ Storage (Phase 5 - Blob via Vercel) │
└──────────────────────────────────────────┘
```

## Environment Variables Reference

```env
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Required - Development Auth Redirect
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Phase 5+ - File Storage
NEXT_PUBLIC_VERCEL_BLOB_STORE_ID=blob_[id]

# Phase X - Analytics (if added)
NEXT_PUBLIC_POSTHOG_KEY=[key]
```

---

For implementation details, see:
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
