import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTask, getTasks } from '@/lib/tasks'
import { queryOne } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = request.nextUrl.searchParams.get('project_id')
    const orgId = request.nextUrl.searchParams.get('org_id')

    if (!projectId || !orgId) {
      return NextResponse.json(
        { error: 'project_id and org_id query parameters required' },
        { status: 400 }
      )
    }

    // Verify user is member of org
    const membership = await queryOne(
      `SELECT id FROM organization_members WHERE org_id = $1 AND user_id = $2`,
      [orgId, user.id]
    )

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      )
    }

    const tasks = await getTasks(projectId, orgId)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { project_id, org_id, title, description, priority, assigned_to, due_date } = body

    if (!project_id || !org_id || !title) {
      return NextResponse.json(
        { error: 'project_id, org_id, and title are required' },
        { status: 400 }
      )
    }

    // Verify user is member of org
    const membership = await queryOne(
      `SELECT id FROM organization_members WHERE org_id = $1 AND user_id = $2`,
      [org_id, user.id]
    )

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      )
    }

    const task = await createTask(project_id, org_id, {
      title,
      description,
      priority,
      assigned_to,
      due_date,
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
