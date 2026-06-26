'use client'

import { useState } from 'react'
import { FileText, Download, Trash2, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/attachments'
import useSWR from 'swr'

interface Attachment {
  id: string
  file_name: string
  file_size: number
  file_type: string
  blob_url: string
  created_at: string
}

interface AttachmentData {
  id: string
  attachment: Attachment
}

interface AttachmentsListProps {
  taskId?: string
  commentId?: string
  onDelete?: (attachmentId: string) => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function AttachmentsList({
  taskId,
  commentId,
  onDelete,
}: AttachmentsListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const queryParam = taskId ? `taskId=${taskId}` : `commentId=${commentId}`
  const { data: attachments, mutate } = useSWR<AttachmentData[]>(
    taskId || commentId ? `/api/attachments?${queryParam}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!attachments || attachments.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">No attachments yet</p>
      </div>
    )
  }

  const handleDelete = async (attachmentId: string) => {
    setDeleting(attachmentId)
    try {
      const response = await fetch('/api/attachments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachmentId }),
      })

      if (response.ok) {
        await mutate()
        onDelete?.(attachmentId)
      }
    } catch (error) {
      console.error('[v0] Error deleting attachment:', error)
    } finally {
      setDeleting(null)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-2">
      {attachments.map((item) => {
        const attachment = item.attachment
        return (
          <div
            key={attachment.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 text-gray-400">
                {getFileIcon(attachment.file_type)}
              </div>
              <div className="min-w-0 flex-1">
                <a
                  href={attachment.blob_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-medium text-blue-600 hover:underline"
                >
                  {attachment.file_name}
                </a>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={attachment.blob_url}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(attachment.id)}
                disabled={deleting === attachment.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
