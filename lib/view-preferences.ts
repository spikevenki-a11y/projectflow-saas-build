import { createClient } from '@/lib/supabase/client'

export type ViewType = 'list' | 'board' | 'calendar'
export type SortBy = 'created_at' | 'due_date' | 'priority' | 'status'
export type SortOrder = 'asc' | 'desc'

export interface ViewPreference {
  id: string
  org_id: string
  user_id: string
  project_id: string | null
  view_type: ViewType
  sort_by: SortBy
  sort_order: SortOrder
  filters: Record<string, any>
  updated_at: string
}

/**
 * Get view preferences for a project
 */
export async function getViewPreference(
  orgId: string,
  projectId: string | null = null
): Promise<ViewPreference | null> {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw userError

  const { data, error } = await supabase
    .from('view_preferences')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .single()

  // Not found is okay - return null
  if (error?.code === 'PGRST116') {
    return null
  }

  if (error) throw error

  return data as ViewPreference
}

/**
 * Save or update view preferences
 */
export async function saveViewPreference(
  orgId: string,
  preference: Partial<ViewPreference> & { project_id?: string | null }
): Promise<ViewPreference> {
  const supabase = createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw userError

  const { data, error } = await supabase
    .from('view_preferences')
    .upsert(
      {
        org_id: orgId,
        user_id: user.id,
        project_id: preference.project_id || null,
        view_type: preference.view_type || 'list',
        sort_by: preference.sort_by || 'created_at',
        sort_order: preference.sort_order || 'desc',
        filters: preference.filters || {},
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'org_id,user_id,project_id',
      }
    )
    .select()
    .single()

  if (error) throw error

  return data as ViewPreference
}

/**
 * Get default view preferences
 */
export function getDefaultViewPreference(): Partial<ViewPreference> {
  return {
    view_type: 'list',
    sort_by: 'created_at',
    sort_order: 'desc',
    filters: {},
  }
}
