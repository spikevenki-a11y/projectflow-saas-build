import { NextRequest, NextResponse } from 'next/server'
import { saveViewPreference, getViewPreference } from '@/lib/view-preferences'
import { createClient } from '@/lib/supabase/server'
import { queryOne } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    // Get user's organization
    const orgData = await queryOne(
      `SELECT org_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
      [user.id]
    )

    if (!orgData) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      )
    }

    const preference = await getViewPreference(orgData.org_id, projectId)

    return NextResponse.json(preference || {})
  } catch (error) {
    console.error('[v0] View preferences fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const orgData = await queryOne(
      `SELECT org_id FROM organization_members WHERE user_id = $1 LIMIT 1`,
      [user.id]
    )

    if (!orgData) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const preference = await saveViewPreference(orgData.org_id, body)

    return NextResponse.json(preference)
  } catch (error) {
    console.error('[v0] View preferences save error:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
