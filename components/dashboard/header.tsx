'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './notification-bell'
import { User } from 'lucide-react'

interface Profile {
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export function Header() {
  const params = useParams()
  const slug = params?.slug as string
  const [orgId, setOrgId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      }

      // Get org ID from slug
      if (slug) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', slug)
          .single()

        if (orgData) {
          setOrgId(orgData.id)
        }
      }
    }

    fetchData()
  }, [slug])

  const displayName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
    : 'User'

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-4">
          {orgId && <NotificationBell orgId={orgId} />}
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-600">Account</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
