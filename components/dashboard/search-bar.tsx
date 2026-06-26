'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import useSWR from 'swr'

interface Suggestion {
  id: string
  title: string
}

interface SearchBarProps {
  onSearch?: (query: string) => void
  onTaskSelect?: (taskId: string) => void
  className?: string
}

export function SearchBar({
  onSearch,
  onTaskSelect,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: suggestions, isLoading } = useSWR(
    debouncedQuery && debouncedQuery.length > 1
      ? `/api/search?q=${encodeURIComponent(debouncedQuery)}&type=suggestions`
      : null,
    (url) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  )

  const handleSelect = (taskId: string) => {
    setQuery('')
    setIsOpen(false)
    onTaskSelect?.(taskId)
  }

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            }
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute right-3 w-4 h-4 text-gray-400" />
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Searching...</span>
            </div>
          ) : suggestions?.suggestions && suggestions.suggestions.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {suggestions.suggestions.map((suggestion: Suggestion) => (
                <li key={suggestion.id}>
                  <button
                    onClick={() => handleSelect(suggestion.id)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.title}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-gray-600">
              No tasks found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
