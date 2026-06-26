import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addPermission, removePermission, getPermissions } from '@/lib/roles'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    const permissions = await getPermissions(roleId)
    return NextResponse.json(permissions)
  } catch (error) {
    console.error('[v0] Get permissions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roleId, resource, action } = await request.json()

    if (!roleId || !resource || !action) {
      return NextResponse.json(
        { error: 'Role ID, resource, and action are required' },
        { status: 400 }
      )
    }

    const permission = await addPermission(roleId, resource, action)
    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    console.error('[v0] Add permission error:', error)
    return NextResponse.json(
      { error: 'Failed to add permission' },
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
    const permissionId = searchParams.get('id')

    if (!permissionId) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      )
    }

    await removePermission(permissionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Remove permission error:', error)
    return NextResponse.json(
      { error: 'Failed to remove permission' },
      { status: 500 }
    )
  }
}
