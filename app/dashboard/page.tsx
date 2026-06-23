'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Settings } from 'lucide-react'
import { OrganizationCard } from '@/components/dashboard/organization-card'
import { CreateOrgDialog } from '@/components/dashboard/create-org-dialog'

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  owner_id: string
  created_at: string
}

export default function DashboardPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrgs(data || [])
    } catch (err) {
      console.error('Error fetching organizations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const handleOrgCreated = () => {
    setShowCreateDialog(false)
    fetchOrganizations()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Organizations</h1>
            <p className="text-gray-600 mt-2">Manage your workspaces and teams</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2" size={20} />
            New Organization
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      ) : orgs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Settings className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No organizations yet</h2>
          <p className="text-gray-600 mb-6">Create your first organization to get started</p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2" size={20} />
            Create Organization
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgs.map((org) => (
            <OrganizationCard
              key={org.id}
              org={org}
              onClick={() => router.push(`/org/${org.slug}`)}
            />
          ))}
        </div>
      )}

      <CreateOrgDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleOrgCreated}
      />
    </div>
  )
}
