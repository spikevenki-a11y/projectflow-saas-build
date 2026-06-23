'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FolderOpen, Settings, LogOut, Menu, X } from 'lucide-react'

export function Sidebar() {
  const [open, setOpen] = useState(true)
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Extract org slug from pathname if available
    const match = pathname.match(/\/org\/([^/]+)/)
    if (match) {
      setOrgSlug(match[1])
    }
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    ...(orgSlug
      ? [
          {
            label: 'Projects',
            href: `/org/${orgSlug}/projects`,
            icon: FolderOpen,
            active: pathname.includes('/projects'),
          },
          {
            label: 'Settings',
            href: `/org/${orgSlug}/settings`,
            icon: Settings,
            active: pathname.includes('/settings'),
          },
        ]
      : []),
  ]

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 hover:bg-gray-100 rounded-lg"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-gray-900 text-white transition-all duration-300 flex flex-col',
          open ? 'w-64' : 'w-0 lg:w-64',
          'fixed lg:static h-screen overflow-y-auto z-30'
        )}
      >
        <div className="p-6">
          <Link href="/dashboard" className="text-2xl font-bold">
            ProjectFlow
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  link.active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                )}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
