import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    let query = supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id(id, first_name, last_name, avatar_url)
      `)
      .eq('user_id', user.id)
      .eq('org_id', orgId)

    if (unreadOnly) {
      query = query.is('read_at', null)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

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
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notification_id)
        .eq('user_id', user.id)

      if (error) throw error

      return NextResponse.json({ success: true })
    } else if (action === 'mark_all_read') {
      const orgId = body.org_id
      if (!orgId) {
        return NextResponse.json(
          { error: 'org_id is required for mark_all_read' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .is('read_at', null)

      if (error) throw error

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

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] DELETE /api/notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
