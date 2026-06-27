import { createClient } from '@/lib/supabase/server'
import { queryOne, queryRows } from '@/lib/db'

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
  const rows = await queryRows(
    `SELECT c.*, 
            u.id as author_id, u.first_name, u.last_name, u.avatar_url
     FROM comments c
     LEFT JOIN auth.users u ON c.author_id = u.id
     WHERE c.task_id = $1 AND c.deleted_at IS NULL
     ORDER BY c.created_at ASC`,
    [taskId]
  )
  return rows || []
}

export async function createComment(
  taskId: string,
  orgId: string,
  content: string
): Promise<Comment> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const row = await queryOne(
    `INSERT INTO comments (task_id, org_id, author_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [taskId, orgId, user.id, content]
  )

  if (!row) throw new Error('Failed to create comment')
  return row
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<Comment> {
  const row = await queryOne(
    `UPDATE comments 
     SET content = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [content, commentId]
  )

  if (!row) throw new Error('Failed to update comment')
  return row
}

export async function deleteComment(commentId: string): Promise<void> {
  await queryOne(
    `UPDATE comments 
     SET deleted_at = NOW()
     WHERE id = $1`,
    [commentId]
  )
}
