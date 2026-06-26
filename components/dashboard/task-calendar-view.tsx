'use client'

import { Task } from '@/lib/tasks'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaskCalendarViewProps {
  tasks: Task[]
  isLoading?: boolean
  onTaskClick?: (taskId: string) => void
}

export function TaskCalendarView({
  tasks,
  isLoading,
  onTaskClick,
}: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.due_date) return false
      const taskDate = new Date(task.due_date)
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      )
    })
  }

  const monthName = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  const days = []
  const totalCells = firstDayOfMonth(currentDate) + daysInMonth(currentDate)

  for (let i = 0; i < totalCells; i++) {
    if (i < firstDayOfMonth(currentDate)) {
      days.push(null)
    } else {
      const day = i - firstDayOfMonth(currentDate) + 1
      days.push(day)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
              )
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
              )
            }
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={idx} className="aspect-square bg-gray-50" />
              }

              const cellDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day
              )
              const cellTasks = getTasksForDate(cellDate)
              const isToday =
                cellDate.toDateString() === new Date().toDateString()

              return (
                <div
                  key={idx}
                  className={`aspect-square p-2 border border-gray-200 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-16">
                    {cellTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onTaskClick?.(task.id)}
                        className="w-full text-left text-xs p-1 rounded bg-blue-100 text-blue-900 hover:bg-blue-200 truncate"
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
