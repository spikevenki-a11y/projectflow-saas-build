'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Project } from '@/lib/projects'
import { ProjectsList } from '@/components/dashboard/projects-list'
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ProjectsPage() {
  const params = useParams()
  const slug = params?.slug as string
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

  // Fetch projects
  const { data: projects, mutate, isLoading } = useSWR<Project[]>(
    orgId ? `/api/projects?org_id=${orgId}` : null,
    fetcher
  )

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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
              <p className="text-gray-600 mt-2">Manage your organization&apos;s projects</p>
            </div>
            {orgId && <CreateProjectDialog orgId={orgId} onSuccess={() => mutate()} />}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading projects...</p>
            </div>
          ) : (
            projects && (
              <ProjectsList
                projects={projects}
                orgSlug={slug}
                onCreateClick={() => {}}
              />
            )
          )}
        </div>
      </main>
    </div>
  )
}
