import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import { searchTasks, getTaskSuggestions } from '@/lib/search'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'search'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { rows } = await pool.query(
      `SELECT org_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
      [user.id]
    )

    if (!rows[0]) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const orgId = rows[0].org_id

    if (type === 'suggestions') {
      const suggestions = await getTaskSuggestions(orgId, query, limit)
      return NextResponse.json({ suggestions })
    }

    const result = await searchTasks(orgId, query, { limit, offset })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
