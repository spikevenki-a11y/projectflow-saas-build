import pool from '@/lib/db'

export interface Comment {
  id: string
  task_id: string
  org_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  author?: {
    id: string
    first_name?: string
    last_name?: string
    avatar_url?: string
  }
}

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  const result = await pool.query(
    `SELECT c.*,
            u.id as author_id, u.first_name, u.last_name, u.avatar_url
     FROM comments c
     LEFT JOIN users u ON c.author_id = u.id
     WHERE c.task_id = $1 AND c.deleted_at IS NULL
     ORDER BY c.created_at ASC`,
    [taskId]
  )
  return result.rows || []
}

export async function createComment(
  taskId: string,
  orgId: string,
  content: string,
  userId: string
): Promise<Comment> {
  const result = await pool.query(
    `INSERT INTO comments (task_id, org_id, author_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [taskId, orgId, userId, content]
  )

  if (!result.rows[0]) throw new Error('Failed to create comment')
  return result.rows[0]
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<Comment> {
  const result = await pool.query(
    `UPDATE comments
     SET content = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [content, commentId]
  )

  if (!result.rows[0]) throw new Error('Failed to update comment')
  return result.rows[0]
}

export async function deleteComment(commentId: string): Promise<void> {
  await pool.query(
    `UPDATE comments SET deleted_at = NOW() WHERE id = $1`,
    [commentId]
  )
}
