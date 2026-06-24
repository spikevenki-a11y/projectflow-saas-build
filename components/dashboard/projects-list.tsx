'use client'

import { Project } from '@/lib/projects'
import Link from 'next/link'
import { FolderOpen, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProjectsListProps {
  projects: Project[]
  orgSlug: string
  onCreateClick: () => void
}

export function ProjectsList({ projects, orgSlug, onCreateClick }: ProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-600 mb-6">Create your first project to get started</p>
        <Button onClick={onCreateClick} className="bg-blue-600 hover:bg-blue-700">
          Create Project
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/org/${orgSlug}/projects/${project.id}`}
          className="group"
        >
          <div
            className="rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: project.color,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                {project.name}
              </h3>
            </div>

            {project.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="flex items-center text-xs text-gray-500">
              <User size={14} className="mr-1" />
              <span>Created by project owner</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
