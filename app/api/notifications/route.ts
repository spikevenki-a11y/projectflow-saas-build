import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/notifications'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('org_id')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    let where = `n.user_id = $1 AND n.org_id = $2`
    const params: unknown[] = [user.id, orgId]

    if (unreadOnly) {
      where += ` AND n.read_at IS NULL`
    }

    const result = await pool.query(
      `SELECT n.*, u.id as actor_id, u.first_name, u.last_name, u.avatar_url
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE ${where}
       ORDER BY n.created_at DESC
       LIMIT 50`,
      params
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('[v0] GET /api/notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notification_id, action } = body

    if (!notification_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'mark_read') {
      await markNotificationAsRead(notification_id)
      return NextResponse.json({ success: true })
    } else if (action === 'mark_all_read') {
      const orgId = body.org_id
      if (!orgId) {
        return NextResponse.json(
          { error: 'org_id is required for mark_all_read' },
          { status: 400 }
        )
      }
      await markAllNotificationsAsRead(orgId, user.id)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] PUT /api/notifications error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    await deleteNotification(notificationId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] DELETE /api/notifications error:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
