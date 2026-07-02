import pool from '@/lib/db'

export interface Task {
  id: string
  project_id: string
  org_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  created_by: string
  due_date: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export async function getTasks(projectId: string, orgId: string) {
  const result = await pool.query(
    `SELECT * FROM tasks
     WHERE project_id = $1 AND org_id = $2
     ORDER BY order_index ASC`,
    [projectId, orgId]
  )
  return result.rows as Task[]
}

export async function getTask(taskId: string, orgId: string) {
  const result = await pool.query(
    `SELECT * FROM tasks WHERE id = $1 AND org_id = $2`,
    [taskId, orgId]
  )
  if (!result.rows[0]) throw new Error('Task not found')
  return result.rows[0] as Task
}

export async function createTask(
  projectId: string,
  orgId: string,
  data: {
    title: string
    description?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    assigned_to?: string
    due_date?: string
  },
  userId: string
) {
  const maxResult = await pool.query(
    `SELECT MAX(order_index) as max_index FROM tasks WHERE project_id = $1`,
    [projectId]
  )
  const orderIndex = (maxResult.rows[0]?.max_index || 0) + 1

  const result = await pool.query(
    `INSERT INTO tasks (project_id, org_id, title, description, priority, assigned_to, due_date, order_index, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      projectId,
      orgId,
      data.title,
      data.description || null,
      data.priority || 'medium',
      data.assigned_to || null,
      data.due_date || null,
      orderIndex,
      userId,
    ]
  )

  if (!result.rows[0]) throw new Error('Failed to create task')
  return result.rows[0] as Task
}

export async function updateTask(
  taskId: string,
  orgId: string,
  data: Partial<{
    title: string
    description: string
    status: 'todo' | 'in_progress' | 'in_review' | 'done'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    assigned_to: string | null
    due_date: string | null
    order_index: number
  }>
) {
  const entries = Object.entries(data)
  if (entries.length === 0) {
    return getTask(taskId, orgId)
  }

  const setClause = entries
    .map(([key], index) => `${key} = $${index + 1}`)
    .join(', ')

  const values = entries.map(([, value]) => value)
  values.push(taskId, orgId)

  const result = await pool.query(
    `UPDATE tasks
     SET ${setClause}, updated_at = NOW()
     WHERE id = $${values.length - 1} AND org_id = $${values.length}
     RETURNING *`,
    values
  )

  if (!result.rows[0]) throw new Error('Failed to update task')
  return result.rows[0] as Task
}

export async function deleteTask(taskId: string, orgId: string) {
  await pool.query(
    `DELETE FROM tasks WHERE id = $1 AND org_id = $2`,
    [taskId, orgId]
  )
}

export async function getTaskHistory(taskId: string, orgId: string) {
  const result = await pool.query(
    `SELECT * FROM audit_logs
     WHERE resource_id = $1 AND org_id = $2 AND resource_type = 'task'
     ORDER BY created_at DESC`,
    [taskId, orgId]
  )
  return result.rows
}
