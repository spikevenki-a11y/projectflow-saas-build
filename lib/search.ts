import { queryRows } from '@/lib/db'
import { Task } from '@/lib/tasks'

export interface SearchResult {
  tasks: Task[]
  total: number
}

/**
 * Search tasks using full-text search
 */
export async function searchTasks(
  orgId: string,
  query: string,
  options?: {
    limit?: number
    offset?: number
    status?: string
    priority?: string
    assignedTo?: string
  }
): Promise<SearchResult> {
  const limit = options?.limit || 10
  const offset = options?.offset || 0

  let whereClause = 'org_id = $1'
  const params: unknown[] = [orgId]
  let paramIndex = 2

  // Full-text search
  if (query && query.length > 2) {
    whereClause += ` AND search_text @@ plainto_tsquery($${paramIndex})`
    params.push(query)
    paramIndex++
  }

  // Apply filters
  if (options?.status) {
    whereClause += ` AND status = $${paramIndex}`
    params.push(options.status)
    paramIndex++
  }

  if (options?.priority) {
    whereClause += ` AND priority = $${paramIndex}`
    params.push(options.priority)
    paramIndex++
  }

  if (options?.assignedTo) {
    whereClause += ` AND assigned_to = $${paramIndex}`
    params.push(options.assignedTo)
    paramIndex++
  }

  const data = await queryRows(
    `SELECT * FROM tasks 
     WHERE ${whereClause}
     ORDER BY updated_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  )

  // Get total count
  const countResult = await queryRows(
    `SELECT COUNT(*) as total FROM tasks WHERE ${whereClause}`,
    params
  )

  return {
    tasks: (data || []) as Task[],
    total: countResult[0]?.total || 0,
  }
}

/**
 * Get task suggestions for autocomplete
 */
export async function getTaskSuggestions(
  orgId: string,
  query: string,
  limit: number = 5
): Promise<Array<{ id: string; title: string }>> {
  if (!query || query.length < 2) {
    return []
  }

  const data = await queryRows(
    `SELECT id, title FROM tasks 
     WHERE org_id = $1 AND title ILIKE $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [orgId, `%${query}%`, limit]
  )

  return data || []
}

/**
 * Get popular search terms from audit logs
 */
export async function getPopularSearches(
  orgId: string,
  limit: number = 5
): Promise<string[]> {
  const data = await queryRows(
    `SELECT title FROM tasks 
     WHERE org_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [orgId, limit]
  )

  return data?.map((task: any) => task.title) || []
}
