'use client'

import { useState } from 'react'
import { Comment } from '@/lib/comments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AttachmentsList } from './attachments-list'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Trash2, Loader2 } from 'lucide-react'

interface CommentSectionProps {
  taskId: string
  orgId: string
  comments: Comment[]
  onCommentAdded?: () => void
}

export function CommentSection({
  taskId,
  orgId,
  comments,
  onCommentAdded
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          org_id: orgId,
          content: newComment
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      setNewComment('')
      onCommentAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Comment */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle size={18} />
          Add a comment
        </h3>

        <Textarea
          placeholder="Write your comment here..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-3"
          rows={3}
        />

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <Button
          onClick={handleAddComment}
          disabled={!newComment.trim() || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Adding...' : 'Add Comment'}
        </Button>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle size={18} />
          Comments ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {comment.author?.first_name || 'Unknown'} {comment.author?.last_name || 'User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>

                <p className="text-gray-700 whitespace-pre-wrap mb-3">{comment.content}</p>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <AttachmentsList commentId={comment.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
