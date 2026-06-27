import { createClient } from '@/lib/supabase/server'
import { queryOne } from '@/lib/db'

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
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw userError

  const data = await queryOne(
    `SELECT * FROM view_preferences 
     WHERE org_id = $1 AND user_id = $2 AND project_id IS NOT DISTINCT FROM $3`,
    [orgId, user.id, projectId]
  )

  return data as ViewPreference | null
}

/**
 * Save or update view preferences
 */
export async function saveViewPreference(
  orgId: string,
  preference: Partial<ViewPreference> & { project_id?: string | null }
): Promise<ViewPreference> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw userError

  const data = await queryOne(
    `INSERT INTO view_preferences (org_id, user_id, project_id, view_type, sort_by, sort_order, filters, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT(org_id, user_id, project_id) DO UPDATE SET
       view_type = EXCLUDED.view_type,
       sort_by = EXCLUDED.sort_by,
       sort_order = EXCLUDED.sort_order,
       filters = EXCLUDED.filters,
       updated_at = NOW()
     RETURNING *`,
    [
      orgId,
      user.id,
      preference.project_id || null,
      preference.view_type || 'list',
      preference.sort_by || 'created_at',
      preference.sort_order || 'desc',
      JSON.stringify(preference.filters || {}),
    ]
  )

  if (!data) throw new Error('Failed to save view preference')

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
