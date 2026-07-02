import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import { getTaskComments, createComment } from '@/lib/comments'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('task_id')

    if (!taskId) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    const comments = await getTaskComments(taskId)
    return NextResponse.json(comments)
  } catch (error) {
    console.error('[v0] GET /api/comments error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { task_id, org_id, content } = body

    if (!task_id || !org_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    const comment = await createComment(task_id, org_id, content, user.id)
    return NextResponse.json(comment)
  } catch (error) {
    console.error('[v0] POST /api/comments error:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
