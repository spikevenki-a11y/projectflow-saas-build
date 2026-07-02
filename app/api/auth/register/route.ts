import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import pool from '@/lib/db'
import { signToken, AUTH_COOKIE, COOKIE_OPTIONS } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    try {
      const { rows: existing } = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [email.toLowerCase()]
      )

      if (existing.length > 0) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }

      const passwordHash = await hash(password, 12)

      const { rows } = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email`,
        [email.toLowerCase(), passwordHash, firstName || null, lastName || null]
      )

      const newUser = rows[0]
      const token = await signToken({ id: newUser.id, email: newUser.email })

      const response = NextResponse.json({ success: true }, { status: 201 })
      response.cookies.set(AUTH_COOKIE, token, COOKIE_OPTIONS)
      return response
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[auth] Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
