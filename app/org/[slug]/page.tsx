'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
}

interface OrganizationMember {
  id: string
  user_id: string
  role: string
  profiles: {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  }
}

export default function OrgPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrgData = async () => {
      if (!slug) return

      try {
        const res = await fetch(`/api/organizations/${slug}`)
        if (!res.ok) return

        const data = await res.json()
        const { members: memberList, ...orgData } = data
        setOrg(orgData)
        setMembers(memberList ?? [])
      } catch (err) {
        console.error('Error fetching org data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrgData()
  }, [slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Organization not found</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">{org.name}</h1>

        <nav className="space-y-2 flex-1">
          <Link
            href={`/org/${org.slug}`}
            className="block px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            Overview
          </Link>
          <Link
            href={`/org/${org.slug}/projects`}
            className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800"
          >
            Projects
          </Link>
          <Link
            href={`/org/${org.slug}/settings`}
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{org.name}</h2>
            {org.description && <p className="text-gray-600">{org.description}</p>}
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm mb-2">Members</p>
              <p className="text-3xl font-bold text-gray-900">{members.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm mb-2">Projects</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500 mt-2">Coming in Phase 2</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-gray-600 text-sm mb-2">Tasks</p>
              <p className="text-3xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500 mt-2">Coming in Phase 2</p>
            </div>
          </div>

          {/* Members Section */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              </div>
              <Link href={`/org/${org.slug}/settings`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2" size={18} />
                  Add Member
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-gray-200">
              {members.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  <p>No members yet</p>
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="p-6 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {(member.profiles?.first_name?.[0] || 'U').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.profiles?.first_name} {member.profiles?.last_name}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Links to Phase 2 Features */}
          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Coming Soon</h3>
            <p className="text-gray-700 mb-4">
              Phase 2 will introduce Projects, Tasks, and real-time collaboration features.
            </p>
            <div className="flex gap-3">
              <Button variant="outline">Phase 2 Features</Button>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
