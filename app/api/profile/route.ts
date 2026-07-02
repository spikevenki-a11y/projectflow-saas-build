import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  const client = await pool.connect()
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rows } = await client.query(
      `SELECT first_name, last_name, avatar_url FROM users WHERE id = $1`,
      [user.id]
    )

    return NextResponse.json(
      rows[0] ?? { first_name: null, last_name: null, avatar_url: null }
    )
  } catch (error) {
    console.error('[v0] Profile GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  } finally {
    client.release()
  }
}
