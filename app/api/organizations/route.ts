import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import { getUserOrganizations, createOrganization } from '@/lib/organizations'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgs = await getUserOrganizations()
    return NextResponse.json(orgs)
  } catch (error) {
    console.error('[v0] Organizations GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, slug, description } = await request.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'name and slug are required' },
        { status: 400 }
      )
    }

    const org = await createOrganization(name, slug, user.id, description)
    return NextResponse.json(org, { status: 201 })
  } catch (error) {
    console.error('[v0] Organizations POST error:', error)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
