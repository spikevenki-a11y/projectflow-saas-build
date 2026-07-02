import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import { createTask, getTasks } from '@/lib/tasks'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

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

    const { rows } = await pool.query(
      `SELECT id FROM organization_members WHERE org_id = $1 AND user_id = $2`,
      [orgId, user.id]
    )

    if (!rows[0]) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      )
    }

    const tasks = await getTasks(projectId, orgId)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

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

    const { rows } = await pool.query(
      `SELECT id FROM organization_members WHERE org_id = $1 AND user_id = $2`,
      [org_id, user.id]
    )

    if (!rows[0]) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      )
    }

    const task = await createTask(
      project_id,
      org_id,
      { title, description, priority, assigned_to, due_date },
      user.id
    )

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
