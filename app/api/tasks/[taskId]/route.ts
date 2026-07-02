import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import { getTask, updateTask, deleteTask } from '@/lib/tasks'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = request.nextUrl.searchParams.get('org_id')
    if (!orgId) {
      return NextResponse.json(
        { error: 'org_id query parameter required' },
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

    const task = await getTask(params.taskId, orgId)
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { org_id, ...updateData } = body

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
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

    const task = await updateTask(params.taskId, org_id, updateData)
    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = request.nextUrl.searchParams.get('org_id')
    if (!orgId) {
      return NextResponse.json(
        { error: 'org_id query parameter required' },
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

    await deleteTask(params.taskId, orgId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
