import { createClient } from '@/lib/supabase/server'
import { queryOne, queryRows, query } from '@/lib/db'

export interface Team {
  id: string
  org_id: string
  name: string
  description: string | null
  color: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  org_id: string
  user_id: string
  role_id: string | null
  joined_at: string
}

// Get all teams for an organization
export async function getTeamsByOrg(orgId: string) {
  const rows = await queryRows(
    `SELECT * FROM teams WHERE org_id = $1 ORDER BY created_at DESC`,
    [orgId]
  )
  return rows as Team[]
}

// Get a single team with members and role information
export async function getTeamWithMembers(teamId: string) {
  const team = await queryOne(
    `SELECT * FROM teams WHERE id = $1`,
    [teamId]
  )
  if (!team) return null

  const members = await queryRows(
    `SELECT tm.*, r.* FROM team_members tm
     LEFT JOIN roles r ON tm.role_id = r.id
     WHERE tm.team_id = $1`,
    [teamId]
  )
  
  return { ...team, team_members: members }
}

// Create a new team
export async function createTeam(
  orgId: string,
  data: { name: string; description?: string; color?: string }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const team = await queryOne(
    `INSERT INTO teams (org_id, name, description, color, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [orgId, data.name, data.description || null, data.color || '#8b5cf6', user.id]
  )

  if (!team) throw new Error('Failed to create team')
  return team as Team
}

// Update a team
export async function updateTeam(
  teamId: string,
  data: { name?: string; description?: string; color?: string }
) {
  const entries = Object.entries(data)
  if (entries.length === 0) return queryOne(`SELECT * FROM teams WHERE id = $1`, [teamId])

  const setClause = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ')
  const values = [...entries.map(([, v]) => v), teamId]

  const team = await queryOne(
    `UPDATE teams SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  )
  if (!team) throw new Error('Failed to update team')
  return team as Team
}

// Delete a team
export async function deleteTeam(teamId: string) {
  await queryOne(`DELETE FROM teams WHERE id = $1`, [teamId])
}

// Add a member to a team
export async function addTeamMember(
  teamId: string,
  userId: string,
  orgId: string,
  roleId?: string
) {
  const member = await queryOne(
    `INSERT INTO team_members (team_id, org_id, user_id, role_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [teamId, orgId, userId, roleId || null]
  )
  if (!member) throw new Error('Failed to add team member')
  return member as TeamMember
}

// Remove a member from a team
export async function removeTeamMember(teamMemberId: string) {
  await queryOne(`DELETE FROM team_members WHERE id = $1`, [teamMemberId])
}

// Update team member role
export async function updateTeamMemberRole(
  teamMemberId: string,
  roleId: string | null
) {
  const member = await queryOne(
    `UPDATE team_members SET role_id = $1 WHERE id = $2 RETURNING *`,
    [roleId, teamMemberId]
  )
  if (!member) throw new Error('Failed to update team member role')
  return member as TeamMember
}

// Get team members count
export async function getTeamMembersCount(teamId: string) {
  const result = await queryOne(
    `SELECT COUNT(*) as count FROM team_members WHERE team_id = $1`,
    [teamId]
  )
  return result?.count || 0
}
