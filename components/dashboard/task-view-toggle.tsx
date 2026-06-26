'use client'

import { List, Grid3x3, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ViewType } from '@/lib/view-preferences'

interface TaskViewToggleProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

export function TaskViewToggle({ activeView, onViewChange }: TaskViewToggleProps) {
  const views: Array<{ type: ViewType; label: string; icon: React.ReactNode }> = [
    { type: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
    { type: 'board', label: 'Board', icon: <Grid3x3 className="w-4 h-4" /> },
    { type: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  ]

  return (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
      {views.map((view) => (
        <Button
          key={view.type}
          variant={activeView === view.type ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange(view.type)}
          className="flex items-center gap-2"
          title={view.label}
        >
          {view.icon}
          <span className="hidden sm:inline">{view.label}</span>
        </Button>
      ))}
    </div>
  )
}
