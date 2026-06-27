import { createClient as createServerClient } from '@/lib/supabase/server'
import { queryOne, queryRows } from '@/lib/db'

export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'guest'
  invited_by: string | null
  joined_at: string
}

/**
 * Get all organizations for the current user (Server)
 */
export async function getUserOrganizations() {
  try {
    const rows = await queryRows(
      `SELECT * FROM organizations ORDER BY created_at DESC`
    )
    return rows as Organization[]
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return []
  }
}

/**
 * Get organization by ID (Server)
 */
export async function getOrganizationById(orgId: string) {
  try {
    const row = await queryOne(
      `SELECT * FROM organizations WHERE id = $1`,
      [orgId]
    )
    return row as Organization | null
  } catch (error) {
    console.error('Error fetching organization:', error)
    return null
  }
}

/**
 * Create a new organization (Server)
 */
export async function createOrganization(
  name: string,
  slug: string,
  description?: string
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const row = await queryOne(
    `INSERT INTO organizations (name, slug, description, owner_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, slug, description || null, user.id]
  )

  if (!row) {
    throw new Error('Failed to create organization')
  }

  return row as Organization
}

/**
 * Update organization (Server)
 */
export async function updateOrganization(
  orgId: string,
  updates: Partial<Organization>
) {
  const { id, ...updateFields } = updates
  const updateEntries = Object.entries(updateFields)

  if (updateEntries.length === 0) {
    return getOrganizationById(orgId)
  }

  const setClause = updateEntries
    .map(([key], index) => `${key} = $${index + 1}`)
    .join(', ')

  const values = updateEntries.map(([, value]) => value)
  values.push(orgId)

  const row = await queryOne(
    `UPDATE organizations 
     SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  )

  if (!row) {
    throw new Error('Failed to update organization')
  }

  return row as Organization
}

/**
 * Get organization members (Server)
 */
export async function getOrganizationMembers(orgId: string) {
  try {
    const rows = await queryRows(
      `SELECT om.*, 
              p.first_name, p.last_name, p.avatar_url
       FROM organization_members om
       LEFT JOIN auth.users p ON om.user_id = p.id
       WHERE om.org_id = $1
       ORDER BY om.joined_at DESC`,
      [orgId]
    )
    return rows
  } catch (error) {
    console.error('Error fetching members:', error)
    return []
  }
}

/**
 * Add member to organization (Server)
 */
export async function addOrganizationMember(
  orgId: string,
  userId: string,
  role: 'admin' | 'member' | 'guest' = 'member'
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const row = await queryOne(
    `INSERT INTO organization_members (org_id, user_id, role, invited_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [orgId, userId, role, user.id]
  )

  if (!row) {
    throw new Error('Failed to add member')
  }

  return row as OrganizationMember
}

/**
 * Update member role (Server)
 */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: 'admin' | 'member' | 'guest'
) {
  const row = await queryOne(
    `UPDATE organization_members 
     SET role = $1
     WHERE org_id = $2 AND user_id = $3
     RETURNING *`,
    [role, orgId, userId]
  )

  if (!row) {
    throw new Error('Failed to update member role')
  }

  return row as OrganizationMember
}

/**
 * Remove member from organization (Server)
 */
export async function removeOrganizationMember(orgId: string, userId: string) {
  await queryOne(
    `DELETE FROM organization_members 
     WHERE org_id = $1 AND user_id = $2`,
    [orgId, userId]
  )
}

/**
 * Get user's current organization (Client-side for UI)
 * Note: Still uses Supabase client for now for browser clients
 */
export async function getCurrentUserOrg(orgId: string) {
  try {
    const row = await queryOne(
      `SELECT * FROM organizations WHERE id = $1`,
      [orgId]
    )
    return row as Organization | null
  } catch (error) {
    console.error('Error fetching organization:', error)
    return null
  }
}

/**
 * Check if user is org owner
 */
export function isOrgOwner(member: OrganizationMember): boolean {
  return member.role === 'owner'
}

/**
 * Check if user is org admin
 */
export function isOrgAdmin(member: OrganizationMember): boolean {
  return member.role === 'owner' || member.role === 'admin'
}

/**
 * Check if user can manage members
 */
export function canManageMembers(member: OrganizationMember): boolean {
  return isOrgAdmin(member)
}
