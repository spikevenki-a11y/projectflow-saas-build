import pool from '@/lib/db'

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

export async function getUserOrganizations() {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `SELECT * FROM organizations ORDER BY created_at DESC`
    )
    return rows as Organization[]
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return []
  } finally {
    client.release()
  }
}

export async function getOrganizationById(orgId: string) {
  try {
    const client = await pool.connect()
    try {
      const { rows } = await client.query(
        `SELECT * FROM organizations WHERE id = $1`,
        [orgId]
      )
      return (rows[0] as Organization) || null
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching organization:', error)
    return null
  }
}

export async function createOrganization(
  name: string,
  slug: string,
  userId: string,
  description?: string
) {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `INSERT INTO organizations (name, slug, description, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug, description || null, userId]
    )

    if (rows.length === 0) throw new Error('Failed to create organization')
    return rows[0] as Organization
  } finally {
    client.release()
  }
}

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

  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `UPDATE organizations
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING *`,
      values
    )

    if (rows.length === 0) throw new Error('Failed to update organization')
    return rows[0] as Organization
  } finally {
    client.release()
  }
}

export async function getOrganizationMembers(orgId: string) {
  try {
    const client = await pool.connect()
    try {
      const { rows } = await client.query(
        `SELECT om.*,
                u.first_name, u.last_name, u.avatar_url
         FROM organization_members om
         LEFT JOIN users u ON om.user_id = u.id
         WHERE om.org_id = $1
         ORDER BY om.joined_at DESC`,
        [orgId]
      )
      return rows
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching members:', error)
    return []
  }
}

export async function addOrganizationMember(
  orgId: string,
  userId: string,
  role: 'admin' | 'member' | 'guest' = 'member',
  invitedBy: string
) {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `INSERT INTO organization_members (org_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [orgId, userId, role, invitedBy]
    )

    if (rows.length === 0) throw new Error('Failed to add member')
    return rows[0] as OrganizationMember
  } finally {
    client.release()
  }
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: 'admin' | 'member' | 'guest'
) {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `UPDATE organization_members
       SET role = $1
       WHERE org_id = $2 AND user_id = $3
       RETURNING *`,
      [role, orgId, userId]
    )

    if (rows.length === 0) throw new Error('Failed to update member role')
    return rows[0] as OrganizationMember
  } finally {
    client.release()
  }
}

export async function removeOrganizationMember(orgId: string, userId: string) {
  const client = await pool.connect()
  try {
    await client.query(
      `DELETE FROM organization_members WHERE org_id = $1 AND user_id = $2`,
      [orgId, userId]
    )
  } finally {
    client.release()
  }
}

export async function getCurrentUserOrg(orgId: string) {
  try {
    const client = await pool.connect()
    try {
      const { rows } = await client.query(
        `SELECT * FROM organizations WHERE id = $1`,
        [orgId]
      )
      return (rows[0] as Organization) || null
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error fetching organization:', error)
    return null
  }
}

export function isOrgOwner(member: OrganizationMember): boolean {
  return member.role === 'owner'
}

export function isOrgAdmin(member: OrganizationMember): boolean {
  return member.role === 'owner' || member.role === 'admin'
}

export function canManageMembers(member: OrganizationMember): boolean {
  return isOrgAdmin(member)
}
