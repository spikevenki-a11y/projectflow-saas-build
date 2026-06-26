'use client'

import { Task } from '@/lib/tasks'
import { TaskCard } from './task-card'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface TaskListViewProps {
  tasks: Task[]
  isLoading?: boolean
  onTaskClick?: (taskId: string) => void
}

export function TaskListView({
  tasks,
  isLoading,
  onTaskClick,
}: TaskListViewProps) {
  const [expandedGrouping, setExpandedGrouping] = useState<string | null>(null)

  // Group tasks by status
  const groupedTasks = tasks.reduce(
    (acc, task) => {
      const status = task.status || 'todo'
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push(task)
      return acc
    },
    {} as Record<string, Task[]>
  )

  const statusOrder = ['todo', 'in_progress', 'completed']

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No tasks found</p>
        </div>
      ) : (
        statusOrder.map((status) => {
          const groupTasks = groupedTasks[status] || []
          if (groupTasks.length === 0) return null

          const isExpanded = expandedGrouping === status
          const statusLabel = status
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')

          return (
            <div key={status} className="space-y-2">
              <button
                onClick={() =>
                  setExpandedGrouping(isExpanded ? null : status)
                }
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                  <span className="font-medium text-gray-900">
                    {statusLabel}
                  </span>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {groupTasks.length}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-2 pl-4">
                  {groupTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick?.(task.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
