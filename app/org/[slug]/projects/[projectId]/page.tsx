'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Project } from '@/lib/projects'
import { Task } from '@/lib/tasks'
import { TaskCard } from '@/components/dashboard/task-card'
import { CreateTaskDialog } from '@/components/dashboard/create-task-dialog'
import useSWR from 'swr'
import { ArrowLeft } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ProjectDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const projectId = params?.projectId as string
  const [orgId, setOrgId] = useState<string | null>(null)

  // Get org ID from slug
  useEffect(() => {
    const fetchOrgId = async () => {
      const res = await fetch(`/api/organizations/${slug}`)
      if (res.ok) {
        const data = await res.json()
        setOrgId(data.id)
      }
    }
    if (slug) fetchOrgId()
  }, [slug])

  // Fetch project and tasks
  const { data: project, isLoading: projectLoading } = useSWR<Project>(
    orgId && projectId ? `/api/projects/${projectId}?org_id=${orgId}` : null,
    fetcher
  )

  const { data: tasks, mutate: mutateTasks, isLoading: tasksLoading } = useSWR<Task[]>(
    orgId && projectId ? `/api/tasks?project_id=${projectId}&org_id=${orgId}` : null,
    fetcher
  )

  const groupedTasks = {
    todo: tasks?.filter((t) => t.status === 'todo') || [],
    in_progress: tasks?.filter((t) => t.status === 'in_progress') || [],
    in_review: tasks?.filter((t) => t.status === 'in_review') || [],
    done: tasks?.filter((t) => t.status === 'done') || [],
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">ProjectFlow</h1>

        <nav className="space-y-2 flex-1">
          <Link
            href={`/org/${slug}`}
            className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800"
          >
            Overview
          </Link>
          <Link
            href={`/org/${slug}/projects`}
            className="block px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            Projects
          </Link>
          <Link
            href={`/org/${slug}/settings`}
            className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800"
          >
            Settings
          </Link>
        </nav>

        <div className="border-t border-gray-800 pt-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/org/${slug}/projects`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={18} />
              Back to Projects
            </Link>

            <div className="flex items-start justify-between">
              <div>
                {project && (
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-lg"
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{project.name}</h2>
                      {project.description && (
                        <p className="text-gray-600 mt-1">{project.description}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {orgId && projectId && (
                <CreateTaskDialog
                  projectId={projectId}
                  orgId={orgId}
                  onSuccess={() => mutateTasks()}
                />
              )}
            </div>
          </div>

          {/* Kanban Board */}
          {tasksLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {['todo', 'in_progress', 'in_review', 'done'].map((status) => (
                <div key={status} className="flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                    {status === 'in_progress' && 'In Progress'}
                    {status === 'in_review' && 'In Review'}
                    {status === 'todo' && 'To Do'}
                    {status === 'done' && 'Done'}
                    <span className="text-gray-500 text-sm ml-2">
                      ({groupedTasks[status as keyof typeof groupedTasks]?.length || 0})
                    </span>
                  </h3>

                  <div className="flex-1 bg-gray-100 rounded-lg p-4 space-y-3 min-h-96">
                    {groupedTasks[status as keyof typeof groupedTasks]?.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No tasks</p>
                      </div>
                    ) : (
                      groupedTasks[status as keyof typeof groupedTasks]?.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          projectId={projectId}
                          orgSlug={slug}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
