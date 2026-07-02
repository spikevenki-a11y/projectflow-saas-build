import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import { saveViewPreference, getViewPreference } from '@/lib/view-preferences'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    const { rows } = await pool.query(
      `SELECT org_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
      [user.id]
    )

    if (!rows[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const preference = await getViewPreference(rows[0].org_id, user.id, projectId)
    return NextResponse.json(preference || {})
  } catch (error) {
    console.error('[v0] View preferences fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rows } = await pool.query(
      `SELECT org_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
      [user.id]
    )

    if (!rows[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const body = await request.json()
    const preference = await saveViewPreference(rows[0].org_id, user.id, body)
    return NextResponse.json(preference)
  } catch (error) {
    console.error('[v0] View preferences save error:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
