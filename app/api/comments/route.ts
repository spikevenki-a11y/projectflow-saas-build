import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('task_id')

    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 }
      )
    }

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

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] GET /api/comments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
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
    const { task_id, org_id, content } = body

    if (!task_id || !org_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user is member of org
    const { data: member } = await supabase
      .from('organization_members')
      .select('id')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      )
    }

    // Create comment
    const { data, error } = await supabase
      .from('comments')
      .insert({
        task_id,
        org_id,
        author_id: user.id,
        content
      })
      .select(`
        *,
        author:author_id(id, first_name, last_name, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] POST /api/comments error:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
