import { Building2, ArrowRight } from 'lucide-react'

interface OrganizationCardProps {
  org: {
    id: string
    name: string
    slug: string
    description: string | null
    avatar_url: string | null
  }
  onClick: () => void
}

export function OrganizationCard({ org, onClick }: OrganizationCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow text-left"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          {org.avatar_url ? (
            <img src={org.avatar_url} alt={org.name} className="w-8 h-8" />
          ) : (
            <Building2 className="text-blue-600" size={24} />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{org.name}</h3>
          {org.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{org.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">@{org.slug}</p>
        </div>
        <ArrowRight className="text-gray-400 flex-shrink-0" size={20} />
      </div>
    </button>
  )
}
