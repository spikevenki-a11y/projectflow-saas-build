# Phase 4: Teams & Advanced RBAC

## Overview
Phase 4 implements comprehensive team management and role-based access control (RBAC) for the project management application. Organizations can now create teams, assign members with custom roles, and define granular permissions.

## Database Schema

### New Tables
- **roles**: Custom roles per organization with default Viewer, Contributor, and Manager roles automatically created
- **teams**: Team entity with name, description, color, and creator tracking
- **team_members**: Association table linking users to teams with optional custom roles
- **role_permissions**: Granular permission mapping (resource + action combinations)
- **project_teams**: Association table for team-project access management

### Key Features
- Automatic default role creation for new organizations
- RLS policies enforce organization-scoped access
- Admins only can manage teams, roles, and permissions
- Soft delete support through is_deleted tracking (can be added)

## Server Infrastructure

### Teams Utilities (`lib/teams.ts`)
- `getTeamsByOrg()`: List all teams in an organization
- `getTeamWithMembers()`: Fetch team with detailed member info
- `createTeam()`: Create a new team (admin only via RLS)
- `updateTeam()`: Modify team details
- `deleteTeam()`: Remove a team
- `addTeamMember()`: Add user to team with optional role
- `removeTeamMember()`: Remove user from team
- `updateTeamMemberRole()`: Change member's role
- `getTeamMembersCount()`: Get member count

### Roles Utilities (`lib/roles.ts`)
- `getRolesByOrg()`: List all roles in organization
- `getRoleWithPermissions()`: Fetch role with all permissions
- `createRole()`: Create custom role
- `updateRole()`: Modify role details
- `deleteRole()`: Remove role (non-default)
- `addPermission()`: Add permission to role
- `removePermission()`: Remove permission from role
- `getPermissions()`: List role permissions
- `userHasPermission()`: Check if user has specific permission

## API Routes

### Teams Management
- `GET /api/teams?orgId=<id>`: List teams
- `POST /api/teams`: Create team
- `PUT /api/teams`: Update team
- `DELETE /api/teams?teamId=<id>`: Delete team

### Team Members
- `POST /api/teams/members`: Add member
- `PUT /api/teams/members`: Update member role
- `DELETE /api/teams/members?id=<id>`: Remove member

### Roles Management
- `GET /api/roles?orgId=<id>`: List roles
- `GET /api/roles?roleId=<id>`: Get role with permissions
- `POST /api/roles`: Create role
- `PUT /api/roles`: Update role
- `DELETE /api/roles?roleId=<id>`: Delete role

### Permissions
- `GET /api/roles/permissions?roleId=<id>`: List permissions
- `POST /api/roles/permissions`: Add permission
- `DELETE /api/roles/permissions?id=<id>`: Remove permission

## UI Components

### `TeamsList` Component
- Displays all teams for an organization
- Shows team color, name, and description
- Delete and edit functionality
- Selectable for team details view

### `CreateTeamDialog` Component
- Dialog for creating new teams
- Color picker from predefined palette
- Team name and description inputs
- Creates team and refreshes list

## Security Model

### RLS Policies
- Teams: Members only see teams in their org; admins can manage
- Team Members: Visibility restricted to org members
- Roles: Only org admins can create/modify
- Permissions: Controlled access to permission definitions
- Project Teams: Only admins can assign teams to projects

### Permission System
Three default roles:
1. **Viewer**: Read-only access to projects, tasks, comments
2. **Contributor**: Can create/edit tasks, add comments
3. **Manager**: Full project management, task assignment, team settings

## Integration Points

### With Phase 3 (Collaboration)
- Comments can be filtered by team members
- Notifications can target teams
- Team members see each other's work

### With Phase 2 (Projects)
- Projects can be assigned to teams
- Team-based project access control
- Team workflows and automation

## Database Performance

### Indexes
- `idx_teams_org_id`: Fast org team lookup
- `idx_team_members_team_id`: Member enumeration
- `idx_team_members_user_id`: User team lookup
- `idx_roles_org_id`: Org roles retrieval
- `idx_project_teams_project_id`: Project team associations

## Next Steps (Phase 5)

Future enhancements:
- Custom permission matrix UI for role editing
- Team member invite system with email
- Activity logging for team changes
- Team settings page with advanced options
- Team-based project templates
