import pool from '@/lib/db'

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

export async function getTeamsByOrg(orgId: string) {
  const result = await pool.query(
    `SELECT * FROM teams WHERE org_id = $1 ORDER BY created_at DESC`,
    [orgId]
  )
  return result.rows as Team[]
}

export async function getTeamWithMembers(teamId: string) {
  const teamResult = await pool.query(
    `SELECT * FROM teams WHERE id = $1`,
    [teamId]
  )
  const team = teamResult.rows[0]
  if (!team) return null

  const membersResult = await pool.query(
    `SELECT tm.*, r.* FROM team_members tm
     LEFT JOIN roles r ON tm.role_id = r.id
     WHERE tm.team_id = $1`,
    [teamId]
  )

  return { ...team, team_members: membersResult.rows }
}

export async function createTeam(
  orgId: string,
  data: { name: string; description?: string; color?: string },
  userId: string
) {
  const result = await pool.query(
    `INSERT INTO teams (org_id, name, description, color, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [orgId, data.name, data.description || null, data.color || '#8b5cf6', userId]
  )

  if (!result.rows[0]) throw new Error('Failed to create team')
  return result.rows[0] as Team
}

export async function updateTeam(
  teamId: string,
  data: { name?: string; description?: string; color?: string }
) {
  const entries = Object.entries(data)
  if (entries.length === 0) {
    const result = await pool.query(`SELECT * FROM teams WHERE id = $1`, [teamId])
    return result.rows[0] as Team
  }

  const setClause = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ')
  const values = [...entries.map(([, v]) => v), teamId]

  const result = await pool.query(
    `UPDATE teams SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  )
  if (!result.rows[0]) throw new Error('Failed to update team')
  return result.rows[0] as Team
}

export async function deleteTeam(teamId: string) {
  await pool.query(`DELETE FROM teams WHERE id = $1`, [teamId])
}

export async function addTeamMember(
  teamId: string,
  userId: string,
  orgId: string,
  roleId?: string
) {
  const result = await pool.query(
    `INSERT INTO team_members (team_id, org_id, user_id, role_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [teamId, orgId, userId, roleId || null]
  )
  if (!result.rows[0]) throw new Error('Failed to add team member')
  return result.rows[0] as TeamMember
}

export async function removeTeamMember(teamMemberId: string) {
  await pool.query(`DELETE FROM team_members WHERE id = $1`, [teamMemberId])
}

export async function updateTeamMemberRole(
  teamMemberId: string,
  roleId: string | null
) {
  const result = await pool.query(
    `UPDATE team_members SET role_id = $1 WHERE id = $2 RETURNING *`,
    [roleId, teamMemberId]
  )
  if (!result.rows[0]) throw new Error('Failed to update team member role')
  return result.rows[0] as TeamMember
}

export async function getTeamMembersCount(teamId: string) {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM team_members WHERE team_id = $1`,
    [teamId]
  )
  return result.rows[0]?.count || 0
}
