import { createClient } from '@/lib/supabase/server'

export interface Attachment {
  id: string
  org_id: string
  uploaded_by: string
  file_name: string
  file_size: number
  file_type: string
  blob_url: string
  blob_pathname: string
  created_at: string
  updated_at: string
}

export interface TaskAttachment {
  id: string
  task_id: string
  attachment_id: string
  org_id: string
  created_at: string
  attachment: Attachment
}

export interface CommentAttachment {
  id: string
  comment_id: string
  attachment_id: string
  org_id: string
  created_at: string
  attachment: Attachment
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not supported' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' }
  }

  return { valid: true }
}

// Create attachment record
export async function createAttachment(
  orgId: string,
  uploadedBy: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  blobUrl: string,
  blobPathname: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attachments')
    .insert({
      org_id: orgId,
      uploaded_by: uploadedBy,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      blob_url: blobUrl,
      blob_pathname: blobPathname,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create attachment: ${error.message}`)
  return data as Attachment
}

// Attach file to task
export async function attachToTask(
  taskId: string,
  attachmentId: string,
  orgId: string
) {
  const supabase = await createClient()

  const { error } = await supabase.from('task_attachments').insert({
    task_id: taskId,
    attachment_id: attachmentId,
    org_id: orgId,
  })

  if (error) throw new Error(`Failed to attach to task: ${error.message}`)
}

// Attach file to comment
export async function attachToComment(
  commentId: string,
  attachmentId: string,
  orgId: string
) {
  const supabase = await createClient()

  const { error } = await supabase.from('comment_attachments').insert({
    comment_id: commentId,
    attachment_id: attachmentId,
    org_id: orgId,
  })

  if (error) throw new Error(`Failed to attach to comment: ${error.message}`)
}

// Get task attachments
export async function getTaskAttachments(taskId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('task_attachments')
    .select('*, attachment:attachments(*)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch task attachments: ${error.message}`)
  return data as TaskAttachment[]
}

// Get comment attachments
export async function getCommentAttachments(commentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comment_attachments')
    .select('*, attachment:attachments(*)')
    .eq('comment_id', commentId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch comment attachments: ${error.message}`)
  return data as CommentAttachment[]
}

// Delete attachment
export async function deleteAttachment(attachmentId: string) {
  const supabase = await createClient()

  // First, get the attachment to get the blob pathname
  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('blob_pathname')
    .eq('id', attachmentId)
    .single()

  if (fetchError) throw new Error(`Failed to fetch attachment: ${fetchError.message}`)

  // Delete from database (cascade will remove task/comment associations)
  const { error: deleteError } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachmentId)

  if (deleteError) throw new Error(`Failed to delete attachment: ${deleteError.message}`)

  return attachment?.blob_pathname
}

// Remove attachment from task
export async function removeTaskAttachment(taskAttachmentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('task_attachments')
    .delete()
    .eq('id', taskAttachmentId)

  if (error) throw new Error(`Failed to remove task attachment: ${error.message}`)
}

// Remove attachment from comment
export async function removeCommentAttachment(commentAttachmentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('comment_attachments')
    .delete()
    .eq('id', commentAttachmentId)

  if (error) throw new Error(`Failed to remove comment attachment: ${error.message}`)
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
