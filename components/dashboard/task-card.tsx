'use client'

import { Task } from '@/lib/tasks'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface TaskCardProps {
  task: Task
  projectId: string
  orgSlug: string
}

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

const statusColors: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800',
}

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}

export function TaskCard({ task, projectId, orgSlug }: TaskCardProps) {
  return (
    <Link href={`/org/${orgSlug}/projects/${projectId}/tasks/${task.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 flex-1 line-clamp-2">
            {task.title}
          </h3>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={statusColors[task.status] || statusColors.todo}>
            {statusLabels[task.status] || task.status}
          </Badge>
          <Badge className={priorityColors[task.priority] || priorityColors.medium}>
            {task.priority}
          </Badge>
        </div>

        {task.due_date && (
          <p className="text-xs text-gray-500 mt-3">
            Due: {new Date(task.due_date).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  )
}
