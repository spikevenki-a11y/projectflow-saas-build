import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('org_id', orgId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Role[]
}

// Get a single role with its permissions
export async function getRoleWithPermissions(roleId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('roles')
    .select(
      `
      *,
      role_permissions (*)
    `
    )
    .eq('id', roleId)
    .single()

  if (error) throw error
  return data
}

// Create a new role
export async function createRole(
  orgId: string,
  data: { name: string; description?: string }
) {
  const supabase = await createClient()
  const { data: role, error } = await supabase
    .from('roles')
    .insert({
      org_id: orgId,
      name: data.name,
      description: data.description || null,
      is_default: false,
    })
    .select()
    .single()

  if (error) throw error
  return role as Role
}

// Update a role
export async function updateRole(
  roleId: string,
  data: { name?: string; description?: string }
) {
  const supabase = await createClient()
  const { data: role, error } = await supabase
    .from('roles')
    .update(data)
    .eq('id', roleId)
    .select()
    .single()

  if (error) throw error
  return role as Role
}

// Delete a role (non-default only)
export async function deleteRole(roleId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('roles').delete().eq('id', roleId)

  if (error) throw error
}

// Add a permission to a role
export async function addPermission(
  roleId: string,
  resource: Permission['resource'],
  action: Permission['action']
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('role_permissions')
    .insert({
      role_id: roleId,
      resource,
      action,
    })
    .select()
    .single()

  if (error) throw error
  return data as Permission
}

// Remove a permission from a role
export async function removePermission(permissionId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('role_permissions')
    .delete()
    .eq('id', permissionId)

  if (error) throw error
}

// Get permissions for a role
export async function getPermissions(roleId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role_id', roleId)

  if (error) throw error
  return data as Permission[]
}

// Check if a user has a specific permission
export async function userHasPermission(
  userId: string,
  orgId: string,
  resource: Permission['resource'],
  action: Permission['action']
) {
  const supabase = await createClient()

  // Get org member role
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single()

  if (orgError || !orgMember) return false

  // Owner and admin have all permissions
  if (orgMember.role === 'owner' || orgMember.role === 'admin') return true

  // Check role permissions
  const { data: permissions, error: permError } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('resource', resource)
    .eq('action', action)

  if (permError) return false

  // For now, regular members get default permissions based on org role
  return false
}
