'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
}

interface OrganizationMember {
  id: string
  user_id: string
  role: string
  profiles: {
    first_name: string | null
    last_name: string | null
  }
}

export default function SettingsPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'guest'>('member')
  const [inviting, setInviting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return

      try {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single()

        if (orgData) {
          setOrg(orgData)

          const { data: membersData } = await supabase
            .from('organization_members')
            .select('*, profiles:user_id(first_name, last_name)')
            .eq('org_id', orgData.id)
            .order('joined_at', { ascending: false })

          if (membersData) {
            setMembers(membersData)
          }
        }
      } catch (err) {
        setError('Failed to load organization data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!org || !email) return

    setInviting(true)
    setError(null)

    try {
      // For now, we'll just show a message since this requires backend integration
      // In a real app, you'd send an invite email
      alert(`Invite sent to ${email} with role: ${role}`)
      setEmail('')
    } catch (err) {
      setError('Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (deleteError) throw deleteError

      setMembers(members.filter((m) => m.id !== memberId))
    } catch (err) {
      setError('Failed to remove member')
    }
  }

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
            className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800"
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
            className="block px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700"
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
        <div className="p-8 max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Organization Settings</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Organization Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Organization Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <Input value={org.name} disabled className="bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <Input value={org.slug} disabled className="bg-gray-50" />
              </div>

              {org.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={org.description}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    rows={3}
                  />
                </div>
              )}

              <p className="text-xs text-gray-500 mt-4">
                Note: Organization details are managed from the main dashboard.
              </p>
            </div>
          </div>

          {/* Invite Member */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Invite Member</h3>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    disabled={inviting}
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'member' | 'guest')}
                    disabled={inviting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="guest">Guest</option>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={inviting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {inviting ? (
                  <>
                    <Loader2 className="mr-2" size={18} />
                    Sending invite...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2" size={18} />
                    Send Invite
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Members List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Team Members ({members.length})</h3>
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

                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
