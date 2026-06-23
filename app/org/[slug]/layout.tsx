import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { slug: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verify user is a member of this organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', params.slug)
    .single()

  if (!org) {
    redirect('/dashboard')
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('id')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
