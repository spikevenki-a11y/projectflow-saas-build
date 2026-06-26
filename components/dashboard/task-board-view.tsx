'use client'

import { Task } from '@/lib/tasks'
import { TaskCard } from './task-card'

interface TaskBoardViewProps {
  tasks: Task[]
  isLoading?: boolean
  onTaskClick?: (taskId: string) => void
}

export function TaskBoardView({
  tasks,
  isLoading,
  onTaskClick,
}: TaskBoardViewProps) {
  // Group tasks by status
  const columns = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    completed: tasks.filter((t) => t.status === 'completed'),
  }

  const columnConfigs = [
    { key: 'todo' as const, label: 'To Do', color: 'bg-gray-50' },
    {
      key: 'in_progress' as const,
      label: 'In Progress',
      color: 'bg-blue-50',
    },
    { key: 'completed' as const, label: 'Completed', color: 'bg-green-50' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 overflow-x-auto">
      {isLoading ? (
        <div className="md:col-span-3 flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        columnConfigs.map((column) => (
          <div
            key={column.key}
            className={`${column.color} rounded-lg p-4 min-h-96`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{column.label}</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                {columns[column.key].length}
              </span>
            </div>

            <div className="space-y-2">
              {columns[column.key].length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No tasks</p>
                </div>
              ) : (
                columns[column.key].map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task.id)}
                    className="cursor-pointer"
                  >
                    <TaskCard task={task} />
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
