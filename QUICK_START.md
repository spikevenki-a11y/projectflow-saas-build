# ProjectFlow Quick Start Guide

## Development Environment

### Prerequisites
- Node.js 18+ and pnpm installed
- Supabase account (free tier works)
- Git (for version control)

### Installation

1. **Clone or Download the Project**
```bash
cd projectflow-v0
```

2. **Install Dependencies**
```bash
pnpm install
```

3. **Set Up Environment Variables**

Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

Get these values from your Supabase project settings:
- Go to Settings → API
- Copy the project URL and anon (public) key

4. **Start Development Server**
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## First-Time Setup

### 1. Create a Test User
- Navigate to `http://localhost:3000/auth/sign-up`
- Create an account with your email
- Confirm your email (development mode auto-confirms)

### 2. Create Your First Organization
- After login, you'll see the Dashboard
- Click "New Organization"
- Enter organization name, slug, and description
- You'll be automatically added as owner

### 3. Explore the App
- Visit organization overview to see member list
- Go to settings to invite other users
- Check the projects page to see Phase 2 roadmap

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16 with React 19
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React

### Core Concepts

#### Multi-Tenancy
- Each organization is a separate tenant
- Data isolation via PostgreSQL RLS
- Users can be members of multiple organizations

#### Authentication
- Email/password registration
- Email confirmation required
- Session-based authentication

#### Authorization
- Role-based access control (RBAC)
- Roles: owner, admin, member, guest
- Permissions enforced at database level

## File Structure Quick Reference

### Pages
```
/                              # Landing page
/auth/login                    # Login
/auth/sign-up                  # Register
/dashboard                     # Organizations list
/org/[slug]                    # Organization view
/org/[slug]/settings           # Organization settings
/org/[slug]/projects           # Projects (Phase 2)
```

### Key Components
```
components/dashboard/
  ├── sidebar.tsx              # Navigation
  ├── header.tsx               # User info
  ├── organization-card.tsx     # Org card
  └── create-org-dialog.tsx     # Create org modal
```

### Utilities
```
lib/
  ├── supabase/                # Supabase clients
  ├── organizations.ts         # Org functions
  └── utils.ts                 # Helpers
```

## Common Tasks

### View Database
1. Go to Supabase Dashboard
2. SQL Editor → select your table
3. View/edit data directly

### Test Authentication
```bash
# Sign up
curl -X POST http://localhost:3000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Build for Production
```bash
pnpm build
pnpm start
```

### Lint & Format
```bash
pnpm lint
pnpm format
```

## Troubleshooting

### "Module not found" errors
- Run `pnpm install` to ensure all dependencies are installed
- Clear `.next` folder: `rm -rf .next`
- Restart dev server

### "Authentication not working"
- Check env variables in `.env.local`
- Verify Supabase project is active
- Check Supabase auth settings allow email/password

### "Database permission denied"
- Ensure RLS policies are created (automatic on first migration)
- Check user is confirmed in Supabase auth
- Verify user is a member of the organization

### "Page not found" after login
- Check if `auth/callback` route exists
- Verify redirect URLs in Supabase auth settings
- Check browser console for errors

## Deployment

### Deploy to Vercel
1. Push code to GitHub
2. Go to vercel.com and connect repository
3. Add environment variables in project settings
4. Vercel auto-deploys on push

### Deploy to Other Platforms
```bash
# Build
pnpm build

# Output ready in .next/
# Deploy .next/ and package.json
```

## Next Steps

### Phase 2 Features (Coming Soon)
- Project management
- Task creation and tracking
- Task assignment to team members
- Status and priority tracking
- Due dates and deadlines

### Explore Further
- Read `PHASE_1_SUMMARY.md` for technical details
- Check `v0_plans/pragmatic-route.md` for roadmap
- Review database schema in Supabase console

## Support

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Guide](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### Getting Help
- Check console for JavaScript errors
- Review Supabase logs for database errors
- Enable debug mode in browser DevTools
- Check Next.js server logs in terminal

---

**Happy Building!** 🚀
