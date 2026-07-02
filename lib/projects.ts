import pool from '@/lib/db'

export interface Project {
  id: string
  org_id: string
  name: string
  description: string | null
  color: string
  status: 'active' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
}

export async function getProjects(orgId: string) {
  const rows = await pool.query(
    `SELECT * FROM projects
     WHERE org_id = $1 AND status = 'active'
     ORDER BY name ASC`,
    [orgId]
  )
  return rows.rows as Project[]
}

export async function getProject(projectId: string, orgId: string) {
  const result = await pool.query(
    `SELECT * FROM projects WHERE id = $1 AND org_id = $2`,
    [projectId, orgId]
  )
  if (!result.rows[0]) throw new Error('Project not found')
  return result.rows[0] as Project
}

export async function createProject(
  orgId: string,
  data: {
    name: string
    description?: string
    color?: string
  },
  userId: string
) {
  const result = await pool.query(
    `INSERT INTO projects (org_id, name, description, color, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [orgId, data.name, data.description || null, data.color || '#3b82f6', userId]
  )

  if (!result.rows[0]) throw new Error('Failed to create project')
  return result.rows[0] as Project
}

export async function updateProject(
  projectId: string,
  orgId: string,
  data: Partial<{
    name: string
    description: string
    color: string
    status: 'active' | 'archived'
  }>
) {
  const entries = Object.entries(data)
  if (entries.length === 0) {
    return getProject(projectId, orgId)
  }

  const setClause = entries
    .map(([key], index) => `${key} = $${index + 1}`)
    .join(', ')

  const values = entries.map(([, value]) => value)
  values.push(projectId, orgId)

  const result = await pool.query(
    `UPDATE projects
     SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length - 1} AND org_id = $${values.length}
     RETURNING *`,
    values
  )

  if (!result.rows[0]) throw new Error('Failed to update project')
  return result.rows[0] as Project
}

export async function deleteProject(projectId: string, orgId: string) {
  await pool.query(
    `DELETE FROM projects WHERE id = $1 AND org_id = $2`,
    [projectId, orgId]
  )
}
