'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Team } from '@/lib/teams'
import { Users, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TeamsListProps {
  orgId: string
  onTeamSelect?: (team: Team) => void
}

export function TeamsList({ orgId, onTeamSelect }: TeamsListProps) {
  const { data: teams, isLoading, mutate } = useSWR(
    `/api/teams?orgId=${orgId}`,
    (url) => fetch(url).then((res) => res.json()),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const handleDelete = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return

    try {
      const response = await fetch(`/api/teams?teamId=${teamId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error('[v0] Delete team error:', error)
    }
  }

  if (isLoading) {
    return <div className="text-gray-500">Loading teams...</div>
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users size={32} className="mx-auto mb-2 opacity-50" />
        <p>No teams yet. Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {teams.map((team: Team) => (
        <div
          key={team.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => onTeamSelect?.(team)}
          >
            <div
              className="w-8 h-8 rounded-full flex-shrink-0"
              style={{ backgroundColor: team.color }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 truncate">{team.name}</h3>
              {team.description && (
                <p className="text-sm text-gray-600 truncate">
                  {team.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onTeamSelect?.(team)}
            >
              <Edit2 size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(team.id)}
            >
              <Trash2 size={16} className="text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
