'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, FolderOpen } from 'lucide-react'

export default function ProjectsPage() {
  const params = useParams()
  const slug = params?.slug as string

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
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled>
              <Plus className="mr-2" size={20} />
              New Project (Phase 2)
            </Button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FolderOpen className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">
              Projects and task management coming in Phase 2 of ProjectFlow.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline">View Roadmap</Button>
              <Link href={`/org/${slug}`}>
                <Button variant="outline">Back to Overview</Button>
              </Link>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">Phase 2 Features</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Create and manage projects</li>
                <li>✓ Create tasks within projects</li>
                <li>✓ Assign tasks to team members</li>
                <li>✓ Set priorities and due dates</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">Phase 3 Features</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Comments on tasks</li>
                <li>✓ Activity timeline</li>
                <li>✓ Real-time updates</li>
                <li>✓ Notifications</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-2">Future Features</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ File uploads</li>
                <li>✓ Custom roles</li>
                <li>✓ Advanced search</li>
                <li>✓ Webhooks & API</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
