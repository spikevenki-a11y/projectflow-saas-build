import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgResult = await pool.query(
      `SELECT * FROM organizations WHERE slug = $1`,
      [params.slug]
    )
    const org = orgResult.rows[0]

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const membersResult = await pool.query(
      `SELECT om.id, om.user_id, om.role, om.org_id,
              u.first_name, u.last_name, u.avatar_url
       FROM organization_members om
       LEFT JOIN users u ON om.user_id = u.id
       WHERE om.org_id = $1
       ORDER BY om.joined_at DESC`,
      [org.id]
    )

    const members = membersResult.rows.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      profiles: {
        first_name: m.first_name ?? null,
        last_name: m.last_name ?? null,
        avatar_url: m.avatar_url ?? null,
      },
    }))

    return NextResponse.json({ ...org, members })
  } catch (error) {
    console.error('[v0] Organization by slug GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }
}
