import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/notifications'
import { queryRows } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('org_id')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'org_id is required' },
        { status: 400 }
      )
    }

    let where = `user_id = $1 AND org_id = $2`
    const params: unknown[] = [user.id, orgId]

    if (unreadOnly) {
      where += ` AND read_at IS NULL`
    }

    const data = await queryRows(
      `SELECT n.*, u.id as actor_id, u.first_name, u.last_name, u.avatar_url
       FROM notifications n
       LEFT JOIN auth.users u ON n.actor_id = u.id
       WHERE ${where}
       ORDER BY n.created_at DESC
       LIMIT 50`,
      params
    )

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] GET /api/notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { notification_id, action } = body

    if (!notification_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
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

      await markAllNotificationsAsRead(orgId)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[v0] PUT /api/notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    await deleteNotification(notificationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] DELETE /api/notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
