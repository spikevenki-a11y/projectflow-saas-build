import { createClient } from '@/lib/supabase/server'

export interface Project {
  id: string
  org_id: string
  name: string
  description: string | null
  color: string
  status: 'active' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
}

export async function getProjects(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) throw error
  return data as Project[]
}

export async function getProject(projectId: string, orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('org_id', orgId)
    .single()

  if (error) throw error
  return data as Project
}

export async function createProject(
  orgId: string,
  data: {
    name: string
    description?: string
    color?: string
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      org_id: orgId,
      name: data.name,
      description: data.description,
      color: data.color || '#3b82f6',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return project as Project
}

export async function updateProject(
  projectId: string,
  orgId: string,
  data: Partial<{
    name: string
    description: string
    color: string
    status: 'active' | 'archived'
  }>
) {
  const supabase = await createClient()
  const { data: project, error } = await supabase
    .from('projects')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) throw error
  return project as Project
}

export async function deleteProject(projectId: string, orgId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('org_id', orgId)

  if (error) throw error
}
