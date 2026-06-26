import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:author_id(id, first_name, last_name, avatar_url)
    `)
    .eq('task_id', taskId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createComment(
  taskId: string,
  orgId: string,
  content: string
): Promise<Comment> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('comments')
    .insert({
      task_id: taskId,
      org_id: orgId,
      author_id: user.id,
      content
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<Comment> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) throw error
}
