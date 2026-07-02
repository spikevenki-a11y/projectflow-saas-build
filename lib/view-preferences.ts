import pool from '@/lib/db'

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

export async function getViewPreference(
  orgId: string,
  userId: string,
  projectId: string | null = null
): Promise<ViewPreference | null> {
  const result = await pool.query(
    `SELECT * FROM view_preferences
     WHERE org_id = $1 AND user_id = $2 AND project_id IS NOT DISTINCT FROM $3`,
    [orgId, userId, projectId]
  )
  return (result.rows[0] as ViewPreference) || null
}

export async function saveViewPreference(
  orgId: string,
  userId: string,
  preference: Partial<ViewPreference> & { project_id?: string | null }
): Promise<ViewPreference> {
  const result = await pool.query(
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
      userId,
      preference.project_id || null,
      preference.view_type || 'list',
      preference.sort_by || 'created_at',
      preference.sort_order || 'desc',
      JSON.stringify(preference.filters || {}),
    ]
  )

  if (!result.rows[0]) throw new Error('Failed to save view preference')
  return result.rows[0] as ViewPreference
}

export function getDefaultViewPreference(): Partial<ViewPreference> {
  return {
    view_type: 'list',
    sort_by: 'created_at',
    sort_order: 'desc',
    filters: {},
  }
}
