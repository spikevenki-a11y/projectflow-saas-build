import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'guest'
  invited_by: string | null
  joined_at: string
}

/**
 * Get all organizations for the current user (Server)
 */
export async function getUserOrganizations() {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return data as Organization[]
}

/**
 * Get organization by ID (Server)
 */
export async function getOrganizationById(orgId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  return data as Organization
}

/**
 * Create a new organization (Server)
 */
export async function createOrganization(
  name: string,
  slug: string,
  description?: string
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('organizations')
    .insert([
      {
        name,
        slug,
        description: description || null,
        owner_id: user.id,
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Organization
}

/**
 * Update organization (Server)
 */
export async function updateOrganization(
  orgId: string,
  updates: Partial<Organization>
) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('organizations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Organization
}

/**
 * Get organization members (Server)
 */
export async function getOrganizationMembers(orgId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('organization_members')
    .select('*, profiles:user_id(first_name, last_name, avatar_url)')
    .eq('org_id', orgId)
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Error fetching members:', error)
    return []
  }

  return data
}

/**
 * Add member to organization (Server)
 */
export async function addOrganizationMember(
  orgId: string,
  userId: string,
  role: 'admin' | 'member' | 'guest' = 'member'
) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('organization_members')
    .insert([
      {
        org_id: orgId,
        user_id: userId,
        role,
        invited_by: user.id,
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as OrganizationMember
}

/**
 * Update member role (Server)
 */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: 'admin' | 'member' | 'guest'
) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as OrganizationMember
}

/**
 * Remove member from organization (Server)
 */
export async function removeOrganizationMember(orgId: string, userId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Get user's current organization (Client-side for UI)
 */
export async function getCurrentUserOrg(orgId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  return data as Organization
}

/**
 * Check if user is org owner
 */
export function isOrgOwner(member: OrganizationMember): boolean {
  return member.role === 'owner'
}

/**
 * Check if user is org admin
 */
export function isOrgAdmin(member: OrganizationMember): boolean {
  return member.role === 'owner' || member.role === 'admin'
}

/**
 * Check if user can manage members
 */
export function canManageMembers(member: OrganizationMember): boolean {
  return isOrgAdmin(member)
}
