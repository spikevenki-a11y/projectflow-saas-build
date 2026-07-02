import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import pool from '@/lib/db'
import { signToken, AUTH_COOKIE, COOKIE_OPTIONS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const client = await pool.connect()
    let user
    try {
      const { rows } = await client.query(
        `SELECT id, email, password_hash FROM users WHERE email = $1`,
        [email.toLowerCase()]
      )
      user = rows[0]
    } finally {
      client.release()
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await signToken({ id: user.id, email: user.email })

    const response = NextResponse.json({ success: true })
    response.cookies.set(AUTH_COOKIE, token, COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error('[auth] Login error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
