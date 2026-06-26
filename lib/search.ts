import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()
  const limit = options?.limit || 10
  const offset = options?.offset || 0

  let queryBuilder = supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)

  // Full-text search
  if (query && query.length > 2) {
    queryBuilder = queryBuilder.textSearch('search_text', query, {
      type: 'websearch',
      config: 'english',
    })
  }

  // Apply filters
  if (options?.status) {
    queryBuilder = queryBuilder.eq('status', options.status)
  }

  if (options?.priority) {
    queryBuilder = queryBuilder.eq('priority', options.priority)
  }

  if (options?.assignedTo) {
    queryBuilder = queryBuilder.eq('assigned_to', options.assignedTo)
  }

  // Pagination
  queryBuilder = queryBuilder
    .range(offset, offset + limit - 1)
    .order('updated_at', { ascending: false })

  const { data, count, error } = await queryBuilder

  if (error) throw error

  return {
    tasks: (data || []) as Task[],
    total: count || 0,
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
  const supabase = createClient()

  if (!query || query.length < 2) {
    return []
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('org_id', orgId)
    .ilike('title', `%${query}%`)
    .limit(limit)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data || []
}

/**
 * Get popular search terms from audit logs
 */
export async function getPopularSearches(
  orgId: string,
  limit: number = 5
): Promise<string[]> {
  const supabase = createClient()

  // This is a simplified version - in production you might want to track search terms
  const { data, error } = await supabase
    .from('tasks')
    .select('title')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return data?.map((task) => task.title) || []
}
