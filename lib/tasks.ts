import { createClient } from '@/lib/supabase/server'

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
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .eq('org_id', orgId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data as Task[]
}

export async function getTask(taskId: string, orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('org_id', orgId)
    .single()

  if (error) throw error
  return data as Task
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
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Get the max order_index for the project
  const { data: lastTask } = await supabase
    .from('tasks')
    .select('order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const orderIndex = (lastTask?.order_index || 0) + 1

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      org_id: orgId,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      assigned_to: data.assigned_to,
      due_date: data.due_date,
      order_index: orderIndex,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return task as Task
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
  const supabase = await createClient()
  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) throw error

  // Log change to history if status changed
  if (data.status) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('task_history').insert({
        task_id: taskId,
        org_id: orgId,
        changed_by: user.id,
        action: 'status_changed',
        field_name: 'status',
        new_value: data.status,
      })
    }
  }

  return task as Task
}

export async function deleteTask(taskId: string, orgId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('org_id', orgId)

  if (error) throw error
}

export async function getTaskHistory(taskId: string, orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_history')
    .select('*')
    .eq('task_id', taskId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
