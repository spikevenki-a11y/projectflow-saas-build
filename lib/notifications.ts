import { createClient } from '@/lib/supabase/server'
import { queryOne, queryRows } from '@/lib/db'

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

  const rows = await queryRows(
    `SELECT n.*, u.id as actor_id, u.first_name, u.last_name, u.avatar_url
     FROM notifications n
     LEFT JOIN auth.users u ON n.actor_id = u.id
     WHERE n.user_id = $1 AND n.org_id = $2
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [user.id, orgId]
  )
  return rows || []
}

export async function getUnreadNotificationCount(orgId: string): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const result = await queryOne(
    `SELECT COUNT(*) as count FROM notifications 
     WHERE user_id = $1 AND org_id = $2 AND read_at IS NULL`,
    [user.id, orgId]
  )
  return result?.count || 0
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await queryOne(
    `UPDATE notifications SET read_at = NOW() WHERE id = $1`,
    [notificationId]
  )
}

export async function markAllNotificationsAsRead(orgId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await queryOne(
    `UPDATE notifications SET read_at = NOW() 
     WHERE user_id = $1 AND org_id = $2 AND read_at IS NULL`,
    [user.id, orgId]
  )
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await queryOne(`DELETE FROM notifications WHERE id = $1`, [notificationId])
}
