import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
} from '@/lib/teams'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, userId, orgId, roleId } = await request.json()

    if (!teamId || !userId || !orgId) {
      return NextResponse.json(
        { error: 'Team ID, user ID, and org ID are required' },
        { status: 400 }
      )
    }

    const member = await addTeamMember(teamId, userId, orgId, roleId)
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('[v0] Add team member error:', error)
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamMemberId, roleId } = await request.json()

    if (!teamMemberId) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }

    const member = await updateTeamMemberRole(teamMemberId, roleId || null)
    return NextResponse.json(member)
  } catch (error) {
    console.error('[v0] Update team member role error:', error)
    return NextResponse.json(
      { error: 'Failed to update team member role' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamMemberId = searchParams.get('id')

    if (!teamMemberId) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }

    await removeTeamMember(teamMemberId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Remove team member error:', error)
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    )
  }
}
