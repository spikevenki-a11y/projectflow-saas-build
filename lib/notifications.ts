import pool from '@/lib/db'

export type NotificationType =
  | 'task_assigned'
  | 'task_commented'
  | 'task_status_changed'
  | 'task_mentioned'

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

export async function getUserNotifications(
  orgId: string,
  userId: string
): Promise<Notification[]> {
  const result = await pool.query(
    `SELECT n.*, u.id as actor_id, u.first_name, u.last_name, u.avatar_url
     FROM notifications n
     LEFT JOIN users u ON n.actor_id = u.id
     WHERE n.user_id = $1 AND n.org_id = $2
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [userId, orgId]
  )
  return result.rows || []
}

export async function getUnreadNotificationCount(
  orgId: string,
  userId: string
): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM notifications
     WHERE user_id = $1 AND org_id = $2 AND read_at IS NULL`,
    [userId, orgId]
  )
  return result.rows[0]?.count || 0
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await pool.query(
    `UPDATE notifications SET read_at = NOW() WHERE id = $1`,
    [notificationId]
  )
}

export async function markAllNotificationsAsRead(
  orgId: string,
  userId: string
): Promise<void> {
  await pool.query(
    `UPDATE notifications SET read_at = NOW()
     WHERE user_id = $1 AND org_id = $2 AND read_at IS NULL`,
    [userId, orgId]
  )
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await pool.query(`DELETE FROM notifications WHERE id = $1`, [notificationId])
}
