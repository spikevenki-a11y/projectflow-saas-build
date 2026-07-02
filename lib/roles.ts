import pool from '@/lib/db'

export interface Role {
  id: string
  org_id: string
  name: string
  description: string | null
  is_default: boolean
  created_at: string
}

export interface Permission {
  id: string
  role_id: string
  resource: 'projects' | 'tasks' | 'comments' | 'team_settings' | 'team_members'
  action: 'create' | 'read' | 'update' | 'delete' | 'assign'
  created_at: string
}

// Get all roles for an organization
export async function getRolesByOrg(orgId: string) {
  const rows = await pool(
    `SELECT * FROM roles 
     WHERE org_id = $1 
     ORDER BY is_default DESC, created_at DESC`,
    [orgId]
  )
  return rows as Role[]
}

// Get a single role with its permissions
export async function getRoleWithPermissions(roleId: string) {
  const role = await pool(`SELECT * FROM roles WHERE id = $1`, [roleId])
  if (!role) return null

  const permissions = await pool(
    `SELECT * FROM role_permissions WHERE role_id = $1`,
    [roleId]
  )

  return { ...role, role_permissions: permissions }
}

// Create a new role
export async function createRole(
  orgId: string,
  data: { name: string; description?: string }
) {
  const role = await pool(
    `INSERT INTO roles (org_id, name, description, is_default)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [orgId, data.name, data.description || null, false]
  )
  if (!role) throw new Error('Failed to create role')
  return role as Role
}

// Update a role
export async function updateRole(
  roleId: string,
  data: { name?: string; description?: string }
) {
  const entries = Object.entries(data)
  if (entries.length === 0) return pool(`SELECT * FROM roles WHERE id = $1`, [roleId])

  const setClause = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ')
  const values = [...entries.map(([, v]) => v), roleId]

  const role = await pool(
    `UPDATE roles SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  )
  if (!role) throw new Error('Failed to update role')
  return role as Role
}

// Delete a role (non-default only)
export async function deleteRole(roleId: string) {
  await pool(`DELETE FROM roles WHERE id = $1 AND is_default = FALSE`, [roleId])
}

// Add a permission to a role
export async function addPermission(
  roleId: string,
  resource: Permission['resource'],
  action: Permission['action']
) {
  const perm = await pool(
    `INSERT INTO role_permissions (role_id, resource, action)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [roleId, resource, action]
  )
  if (!perm) throw new Error('Failed to add permission')
  return perm as Permission
}

// Remove a permission from a role
export async function removePermission(permissionId: string) {
  await pool(`DELETE FROM role_permissions WHERE id = $1`, [permissionId])
}

// Get permissions for a role
export async function getPermissions(roleId: string) {
  const rows = await pool(
    `SELECT * FROM role_permissions WHERE role_id = $1`,
    [roleId]
  )
  return rows as Permission[]
}

// Check if a user has a specific permission
export async function userHasPermission(
  userId: string,
  orgId: string,
  resource: Permission['resource'],
  action: Permission['action']
) {
  // Get org member role
  const orgMember = await pool(
    `SELECT role FROM organization_members 
     WHERE user_id = $1 AND org_id = $2`,
    [userId, orgId]
  )

  if (!orgMember) return false

  // Owner and admin have all permissions
  if (orgMember.role === 'owner' || orgMember.role === 'admin') return true

  // Check role permissions
  const perm = await pool(
    `SELECT * FROM role_permissions 
     WHERE resource = $1 AND action = $2`,
    [resource, action]
  )

  // For now, regular members get default permissions based on org role
  return perm ? true : false
}
