import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import { createProject, getProjects } from '@/lib/projects'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
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

    const projects = await getProjects(orgId)
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
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
    const { org_id, name, description, color } = body

    if (!org_id || !name) {
      return NextResponse.json(
        { error: 'org_id and name are required' },
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

    const project = await createProject(org_id, { name, description, color }, user.id)
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
