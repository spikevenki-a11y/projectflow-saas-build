import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import pool from '@/lib/db'

export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { slug: string }
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  const user = token ? await verifyToken(token) : null

  if (!user) {
    redirect('/auth/login')
  }

  const client = await pool.connect()
  try {
    console.log('Checking organization membership for user:', user.id, 'and slug:', params.slug)
    const { rows: orgRows } = await client.query(
      `SELECT id FROM organizations WHERE slug = $1`,
      [params.slug]
    )
    const org = orgRows[0]

    if (!org) {
      redirect('/dashboard')
    }

    const { rows: memberRows } = await client.query(
      `SELECT id FROM organization_members WHERE org_id = $1 AND user_id = $2`,
      [org.id, user.id]
    )

    if (!memberRows[0]) {
      redirect('/dashboard')
    }
  } finally {
    client.release()
  }

  return <>{children}</>
}
