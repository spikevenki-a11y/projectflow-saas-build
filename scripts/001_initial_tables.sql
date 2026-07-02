create table public.attachments (
  id uuid not null default gen_random_uuid (),
  org_id uuid not null,
  uploaded_by uuid not null,
  file_name text not null,
  file_size integer not null,
  file_type text not null,
  blob_url text not null,
  blob_pathname text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint attachments_pkey primary key (id),
  constraint attachments_blob_pathname_key unique (blob_pathname),
  constraint attachments_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint attachments_uploaded_by_fkey foreign KEY (uploaded_by) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_attachments_org_id on public.attachments using btree (org_id) TABLESPACE pg_default;

create index IF not exists idx_attachments_uploaded_by on public.attachments using btree (uploaded_by) TABLESPACE pg_default;

create index IF not exists idx_attachments_created_at on public.attachments using btree (created_at desc) TABLESPACE pg_default;



create table public.audit_logs (
  id uuid not null default gen_random_uuid (),
  org_id uuid not null,
  user_id uuid null,
  resource_type text not null,
  resource_id uuid not null,
  action text not null,
  changes jsonb null,
  ip_address text null,
  user_agent text null,
  created_at timestamp with time zone null default now(),
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint audit_logs_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint audit_logs_action_check check (
    (
      action = any (
        array[
          'create'::text,
          'update'::text,
          'delete'::text,
          'read'::text
        ]
      )
    )
  ),
  constraint audit_logs_resource_type_check check (
    (
      resource_type = any (
        array[
          'task'::text,
          'project'::text,
          'team'::text,
          'comment'::text,
          'attachment'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_org_id on public.audit_logs using btree (org_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_user_id on public.audit_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_resource_id on public.audit_logs using btree (resource_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_created_at on public.audit_logs using btree (created_at desc) TABLESPACE pg_default;

create table public.comment_attachments (
  id uuid not null default gen_random_uuid (),
  comment_id uuid not null,
  attachment_id uuid not null,
  org_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint comment_attachments_pkey primary key (id),
  constraint comment_attachments_comment_id_attachment_id_key unique (comment_id, attachment_id),
  constraint comment_attachments_attachment_id_fkey foreign KEY (attachment_id) references attachments (id) on delete CASCADE,
  constraint comment_attachments_comment_id_fkey foreign KEY (comment_id) references comments (id) on delete CASCADE,
  constraint comment_attachments_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_comment_attachments_comment_id on public.comment_attachments using btree (comment_id) TABLESPACE pg_default;

create index IF not exists idx_comment_attachments_org_id on public.comment_attachments using btree (org_id) TABLESPACE pg_default;

create table public.comments (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  org_id uuid not null,
  author_id uuid not null,
  content text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  constraint comments_pkey primary key (id),
  constraint comments_author_id_fkey foreign KEY (author_id) references auth.users (id) on delete set null,
  constraint comments_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint comments_task_id_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_comments_task_id on public.comments using btree (task_id) TABLESPACE pg_default;

create index IF not exists idx_comments_org_id on public.comments using btree (org_id) TABLESPACE pg_default;

create index IF not exists idx_comments_author_id on public.comments using btree (author_id) TABLESPACE pg_default;

create index IF not exists idx_comments_created_at on public.comments using btree (created_at desc) TABLESPACE pg_default;

create trigger on_comment_audit
after INSERT
or DELETE
or
update on comments for EACH row
execute FUNCTION audit_comment_changes ();

create trigger on_comment_created
after INSERT on comments for EACH row
execute FUNCTION notify_comment_created ();

create table public.notifications (
  id uuid not null default gen_random_uuid (),
  org_id uuid not null,
  user_id uuid not null,
  actor_id uuid null,
  task_id uuid null,
  type text not null,
  message text not null,
  read_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_org_id_user_id_task_id_type_created_at_key unique (org_id, user_id, task_id, type, created_at),
  constraint notifications_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint notifications_actor_id_fkey foreign KEY (actor_id) references auth.users (id) on delete set null,
  constraint notifications_task_id_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE,
  constraint notifications_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint notifications_type_check check (
    (
      type = any (
        array[
          'task_assigned'::text,
          'task_commented'::text,
          'task_status_changed'::text,
          'task_mentioned'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user_id on public.notifications using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_notifications_org_id on public.notifications using btree (org_id) TABLESPACE pg_default;

create index IF not exists idx_notifications_task_id on public.notifications using btree (task_id) TABLESPACE pg_default;

create index IF not exists idx_notifications_read_at on public.notifications using btree (read_at) TABLESPACE pg_default;

create index IF not exists idx_notifications_created_at on public.notifications using btree (created_at desc) TABLESPACE pg_default;


create table public.organization_members (
  id uuid not null default gen_random_uuid (),
  org_id uuid not null,
  user_id uuid not null,
  role text not null default 'member'::text,
  invited_by uuid null,
  joined_at timestamp with time zone null default now(),
  constraint organization_members_pkey primary key (id),
  constraint organization_members_org_id_user_id_key unique (org_id, user_id),
  constraint organization_members_invited_by_fkey foreign KEY (invited_by) references auth.users (id) on delete set null,
  constraint organization_members_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint organization_members_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint organization_members_role_check check (
    (
      role = any (
        array[
          'owner'::text,
          'admin'::text,
          'member'::text,
          'guest'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_organization_members_org_id on public.organization_members using btree (org_id) TABLESPACE pg_default;

create index IF not exists idx_organization_members_user_id on public.organization_members using btree (user_id) TABLESPACE pg_default;


create table public.organizations (
  id uuid not null default gen_random_uuid (),
  name text not null,
  slug text not null,
  description text null,
  avatar_url text null,
  owner_id uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint organizations_pkey primary key (id),
  constraint organizations_slug_key unique (slug),
  constraint organizations_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE,
  constraint organizations_name_check check ((name ~ '^\S.*$'::text))
) TABLESPACE pg_default;

create index IF not exists idx_organizations_owner_id on public.organizations using btree (owner_id) TABLESPACE pg_default;

create index IF not exists idx_organizations_slug on public.organizations using btree (slug) TABLESPACE pg_default;

create trigger on_organization_created
after INSERT on organizations for EACH row
execute FUNCTION handle_org_created ();

create trigger on_organization_created_roles
after INSERT on organizations for EACH row
execute FUNCTION create_default_roles_for_org ();


create table public.profiles (
  id uuid not null,
  first_name text null,
  last_name text null,
  avatar_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


create table public.project_teams (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  team_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint project_teams_pkey primary key (id),
  constraint project_teams_project_id_team_id_key unique (project_id, team_id),
  constraint project_teams_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_teams_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_project_teams_project_id on public.project_teams using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_project_teams_team_id on public.project_teams using btree (team_id) TABLESPACE pg_default;


create table public.projects (
  id uuid not null default gen_random_uuid (),
  org_id uuid not null,
  name text not null,
  description text null,
  color text null default '#3b82f6'::text,
  status text null default 'active'::text,
  created_by uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint projects_pkey primary key (id),
  constraint projects_org_id_name_key unique (org_id, name),
  constraint projects_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint projects_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint projects_status_check check (
    (
      status = any (array['active'::text, 'archived'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_projects_org_id on public.projects using btree (org_id) TABLESPACE pg_default;

create index IF not exists idx_projects_created_by on public.projects using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_projects_status on public.projects using btree (status) TABLESPACE pg_default;


create table public.role_permissions (
  id uuid not null default gen_random_uuid (),
  role_id uuid not null,
  resource text not null,
  action text not null,
  created_at timestamp with time zone null default now(),
  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_role_id_resource_action_key unique (role_id, resource, action),
  constraint role_permissions_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE,
  constraint role_permissions_action_check check (
    (
      action = any (
        array[
          'create'::text,
          'read'::text,
          'update'::text,
          'delete'::text,
          'assign'::text
        ]
      )
    )
  ),
  constraint role_permissions_resource_check check (
    (
      resource = any (
        array[
          'projects'::text,
          'tasks'::text,
          'comments'::text,
          'team_settings'::text,
          'team_members'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_role_id on public.role_permissions using btree (role_id) TABLESPACE pg_default;


create table public.roles (
  id uuid not null default gen_random_uuid (),
  org_id uuid not null,
  name text not null,
  description text null,
  is_default boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint roles_pkey primary key (id),
  constraint roles_org_id_name_key unique (org_id, name),
  constraint roles_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_roles_org_id on public.roles using btree (org_id) TABLESPACE pg_default;


create table public.task_attachments (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  attachment_id uuid not null,
  org_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint task_attachments_pkey primary key (id),
  constraint task_attachments_task_id_attachment_id_key unique (task_id, attachment_id),
  constraint task_attachments_attachment_id_fkey foreign KEY (attachment_id) references attachments (id) on delete CASCADE,
  constraint task_attachments_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint task_attachments_task_id_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_task_attachments_task_id on public.task_attachments using btree (task_id) TABLESPACE pg_default;

create index IF not exists idx_task_attachments_org_id on public.task_attachments using btree (org_id) TABLESPACE pg_default;


create table public.task_history (
  id uuid not null default gen_random_uuid (),
  task_id uuid not null,
  org_id uuid not null,
  changed_by uuid not null,
  action text not null,
  field_name text null,
  old_value text null,
  new_value text null,
  created_at timestamp with time zone null default now(),
  constraint task_history_pkey primary key (id),
  constraint task_history_changed_by_fkey foreign KEY (changed_by) references auth.users (id) on delete set null,
  constraint task_history_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint task_history_task_id_fkey foreign KEY (task_id) references tasks (id) on delete CASCADE,
  constraint task_history_action_check check (
    (
      action = any (
        array[
          'created'::text,
          'updated'::text,
          'status_changed'::text,
          'assigned'::text,
          'commented'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_task_history_task_id on public.task_history using btree (task_id) TABLESPACE pg_default;

create index IF not exists idx_task_history_org_id on public.task_history using btree (org_id) TABLESPACE pg_default;


create table public.tasks (
  id uuid not null default gen_random_uuid (),
  project_id uuid not null,
  org_id uuid not null,
  title text not null,
  description text null,
  status text null default 'todo'::text,
  priority text null default 'medium'::text,
  assigned_to uuid null,
  created_by uuid not null,
  due_date date null,
  order_index integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  search_text tsvector GENERATED ALWAYS as (
    (
      setweight(
        to_tsvector('english'::regconfig, COALESCE(title, ''::text)),
        'A'::"char"
      ) || setweight(
        to_tsvector(
          'english'::regconfig,
          COALESCE(description, ''::text)
        ),
        'B'::"char"
      )
    )
  ) STORED null,
  constraint tasks_pkey primary key (id),
  constraint tasks_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint tasks_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint tasks_assigned_to_fkey foreign KEY (assigned_to) references auth.users (id) on delete set null,
  constraint tasks_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint tasks_priority_check check (
    (
      priority = any (
        array[
          'low'::text,
          'medium'::text,
          'high'::text,
          'urgent'::text
        ]
      )
    )
  ),
  constraint tasks_status_check check (
    (
      status = any (
        array[
          'todo'::text,
          'in_progress'::text,
          'in_review'::text,
          'done'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_tasks_project_id on public.tasks using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_tasks_org_id on public.tasks using btree (org_id) TABLESPACE pg_default;

create index IF not exists idx_tasks_assigned_to on public.tasks using btree (assigned_to) TABLESPACE pg_default;

create index IF not exists idx_tasks_created_by on public.tasks using btree (created_by) TABLESPACE pg_default;

create index IF not exists idx_tasks_status on public.tasks using btree (status) TABLESPACE pg_default;

create index IF not exists idx_tasks_priority on public.tasks using btree (priority) TABLESPACE pg_default;

create index IF not exists idx_tasks_search_text on public.tasks using gin (search_text) TABLESPACE pg_default;

create trigger on_task_assigned
after
update on tasks for EACH row
execute FUNCTION notify_task_assigned ();

create trigger on_task_audit
after INSERT
or DELETE
or
update on tasks for EACH row
execute FUNCTION audit_task_changes ();

create trigger on_task_status_changed
after
update on tasks for EACH row
execute FUNCTION notify_task_status_changed ();


create table public.team_members (
  id uuid not null default gen_random_uuid (),
  team_id uuid not null,
  org_id uuid not null,
  user_id uuid not null,
  role_id uuid null,
  joined_at timestamp with time zone null default now(),
  constraint team_members_pkey primary key (id),
  constraint team_members_team_id_user_id_key unique (team_id, user_id),
  constraint team_members_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE,
  constraint team_members_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null,
  constraint team_members_team_id_fkey foreign KEY (team_id) references teams (id) on delete CASCADE,
  constraint team_members_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_team_members_team_id on public.team_members using btree (team_id) TABLESPACE pg_default;

create index IF not exists idx_team_members_org_id on public.team_members using btree (org_id) TABLESPACE pg_default;

create index IF not exists idx_team_members_user_id on public.team_members using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_team_members_role_id on public.team_members using btree (role_id) TABLESPACE pg_default;


create table public.teams (
  id uuid not null default gen_random_uuid (),
  org_id uuid not null,
  name text not null,
  description text null,
  color text null default '#8b5cf6'::text,
  created_by uuid not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint teams_pkey primary key (id),
  constraint teams_org_id_name_key unique (org_id, name),
  constraint teams_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint teams_org_id_fkey foreign KEY (org_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_teams_org_id on public.teams using btree (org_id) TABLESPACE pg_default;

create index IF not exists idx_teams_created_by on public.teams using btree (created_by) TABLESPACE pg_default;


