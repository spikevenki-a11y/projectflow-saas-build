import { createClient } from '@/lib/supabase/server'

export type NotificationType = 'task_assigned' | 'task_commented' | 'task_status_changed' | 'task_mentioned'

export interface Notification {
  id: string
  org_id: string
  user_id: string
  actor_id?: string
  task_id?: string
  type: NotificationType
  message: string
  read_at?: string
  created_at: string
  actor?: {
    id: string
    first_name?: string
    last_name?: string
    avatar_url?: string
  }
}

export async function getUserNotifications(orgId: string): Promise<Notification[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id(id, first_name, last_name, avatar_url)
    `)
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export async function getUnreadNotificationCount(orgId: string): Promise<number> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .is('read_at', null)

  if (error) throw error
  return count || 0
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllNotificationsAsRead(orgId: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .is('read_at', null)

  if (error) throw error
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) throw error
}
