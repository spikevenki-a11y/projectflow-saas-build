import { createClient } from '@/lib/supabase/server'
import { queryOne, queryRows } from '@/lib/db'

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
  const rows = await queryRows(
    `SELECT * FROM projects 
     WHERE org_id = $1 AND status = 'active'
     ORDER BY name ASC`,
    [orgId]
  )
  return rows as Project[]
}

export async function getProject(projectId: string, orgId: string) {
  const row = await queryOne(
    `SELECT * FROM projects WHERE id = $1 AND org_id = $2`,
    [projectId, orgId]
  )
  if (!row) throw new Error('Project not found')
  return row as Project
}

export async function createProject(
  orgId: string,
  data: {
    name: string
    description?: string
    color?: string
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const row = await queryOne(
    `INSERT INTO projects (org_id, name, description, color, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [orgId, data.name, data.description || null, data.color || '#3b82f6', user.id]
  )

  if (!row) throw new Error('Failed to create project')
  return row as Project
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

  const row = await queryOne(
    `UPDATE projects 
     SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length - 1} AND org_id = $${values.length}
     RETURNING *`,
    values
  )

  if (!row) throw new Error('Failed to update project')
  return row as Project
}

export async function deleteProject(projectId: string, orgId: string) {
  await queryOne(
    `DELETE FROM projects WHERE id = $1 AND org_id = $2`,
    [projectId, orgId]
  )
}
