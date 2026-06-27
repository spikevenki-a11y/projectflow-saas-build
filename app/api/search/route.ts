import { NextRequest, NextResponse } from 'next/server'
import { searchTasks, getTaskSuggestions } from '@/lib/search'
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
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'search'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const projectId = searchParams.get('projectId') || undefined

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

    const orgId = orgData.org_id

    if (type === 'suggestions') {
      const suggestions = await getTaskSuggestions(orgId, query, limit)
      return NextResponse.json({ suggestions })
    }

    const result = await searchTasks(orgId, query, {
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
