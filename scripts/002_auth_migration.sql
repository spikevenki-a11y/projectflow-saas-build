-- Migration: Replace Supabase auth.users with custom public.users table
-- Run this against your PostgreSQL database to switch to manual authentication.
--
-- IMPORTANT: This migration drops all foreign key constraints that reference
-- auth.users and recreates them pointing to public.users. Run this on a
-- fresh database or after exporting/deleting existing Supabase-auth data.

-- ============================================================
-- 1. Create the users table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  email         text        NOT NULL,
  password_hash text        NOT NULL,
  first_name    text,
  last_name     text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- ============================================================
-- 2. Drop all foreign keys that reference auth.users
-- ============================================================
ALTER TABLE public.attachments         DROP CONSTRAINT IF EXISTS attachments_uploaded_by_fkey;
ALTER TABLE public.audit_logs          DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE public.comments            DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
ALTER TABLE public.notifications       DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;
ALTER TABLE public.notifications       DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_invited_by_fkey;
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_user_id_fkey;
ALTER TABLE public.organizations       DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey;
ALTER TABLE public.projects            DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE public.task_history        DROP CONSTRAINT IF EXISTS task_history_changed_by_fkey;
ALTER TABLE public.tasks               DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
ALTER TABLE public.tasks               DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
ALTER TABLE public.team_members        DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;
ALTER TABLE public.teams               DROP CONSTRAINT IF EXISTS teams_created_by_fkey;

-- ============================================================
-- 3. Drop the profiles table (data now lives in public.users)
-- ============================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
DROP TABLE IF EXISTS public.profiles;

-- ============================================================
-- 4. Recreate foreign keys pointing to public.users
-- ============================================================
ALTER TABLE public.attachments
  ADD CONSTRAINT attachments_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.task_history
  ADD CONSTRAINT task_history_changed_by_fkey
  FOREIGN KEY (changed_by) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;

ALTER TABLE public.teams
  ADD CONSTRAINT teams_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users (id) ON DELETE SET NULL;
