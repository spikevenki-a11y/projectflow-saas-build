'use client'

import { useState, useEffect } from 'react'
import { Notification } from '@/lib/notifications'
import { Bell, X } from 'lucide-react'
import useSWR from 'swr'
import { formatDistanceToNow } from 'date-fns'

interface NotificationBellProps {
  orgId: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function NotificationBell({ orgId }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: notifications = [], mutate } = useSWR<Notification[]>(
    mounted && orgId ? `/api/notifications?org_id=${orgId}` : null,
    fetcher,
    { refreshInterval: 5000 }
  )

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_id: notificationId,
          action: 'mark_read'
        })
      })
      mutate()
    } catch (error) {
      console.error('[v0] Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          action: 'mark_all_read'
        })
      })
      mutate()
    } catch (error) {
      console.error('[v0] Failed to mark all notifications as read:', error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE'
      })
      mutate()
    } catch (error) {
      console.error('[v0] Failed to delete notification:', error)
    }
  }

  if (!mounted) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-500 text-sm">No notifications</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${!notification.read_at ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                    {!notification.read_at && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
