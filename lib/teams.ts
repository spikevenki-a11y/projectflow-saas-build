import { createClient } from '@/lib/supabase/server'

export interface Team {
  id: string
  org_id: string
  name: string
  description: string | null
  color: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  org_id: string
  user_id: string
  role_id: string | null
  joined_at: string
}

// Get all teams for an organization
export async function getTeamsByOrg(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Team[]
}

// Get a single team with members and role information
export async function getTeamWithMembers(teamId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('teams')
    .select(
      `
      *,
      team_members (
        *,
        roles:role_id (*)
      )
    `
    )
    .eq('id', teamId)
    .single()

  if (error) throw error
  return data
}

// Create a new team
export async function createTeam(
  orgId: string,
  data: { name: string; description?: string; color?: string }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      org_id: orgId,
      name: data.name,
      description: data.description || null,
      color: data.color || '#8b5cf6',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return team as Team
}

// Update a team
export async function updateTeam(
  teamId: string,
  data: { name?: string; description?: string; color?: string }
) {
  const supabase = await createClient()
  const { data: team, error } = await supabase
    .from('teams')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teamId)
    .select()
    .single()

  if (error) throw error
  return team as Team
}

// Delete a team
export async function deleteTeam(teamId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('teams').delete().eq('id', teamId)

  if (error) throw error
}

// Add a member to a team
export async function addTeamMember(
  teamId: string,
  userId: string,
  orgId: string,
  roleId?: string
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      org_id: orgId,
      user_id: userId,
      role_id: roleId || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as TeamMember
}

// Remove a member from a team
export async function removeTeamMember(teamMemberId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', teamMemberId)

  if (error) throw error
}

// Update team member role
export async function updateTeamMemberRole(
  teamMemberId: string,
  roleId: string | null
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_members')
    .update({ role_id: roleId })
    .eq('id', teamMemberId)
    .select()
    .single()

  if (error) throw error
  return data as TeamMember
}

// Get team members count
export async function getTeamMembersCount(teamId: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId)

  if (error) throw error
  return count || 0
}
