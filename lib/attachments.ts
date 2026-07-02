import pool from '@/lib/db'

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
  const attachment = await pool(
    `INSERT INTO attachments (org_id, uploaded_by, file_name, file_size, file_type, blob_url, blob_pathname)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [orgId, uploadedBy, fileName, fileSize, fileType, blobUrl, blobPathname]
  )

  if (!attachment) throw new Error('Failed to create attachment')
  return attachment as Attachment
}

// Attach file to task
export async function attachToTask(
  taskId: string,
  attachmentId: string,
  orgId: string
) {
  await pool(
    `INSERT INTO task_attachments (task_id, attachment_id, org_id)
     VALUES ($1, $2, $3)`,
    [taskId, attachmentId, orgId]
  )
}

// Attach file to comment
export async function attachToComment(
  commentId: string,
  attachmentId: string,
  orgId: string
) {
  await pool(
    `INSERT INTO comment_attachments (comment_id, attachment_id, org_id)
     VALUES ($1, $2, $3)`,
    [commentId, attachmentId, orgId]
  )
}

// Get task attachments
export async function getTaskAttachments(taskId: string) {
  const rows = await pool(
    `SELECT ta.*, a.* FROM task_attachments ta
     LEFT JOIN attachments a ON ta.attachment_id = a.id
     WHERE ta.task_id = $1
     ORDER BY ta.created_at DESC`,
    [taskId]
  )
  return rows as TaskAttachment[]
}

// Get comment attachments
export async function getCommentAttachments(commentId: string) {
  const rows = await pool(
    `SELECT ca.*, a.* FROM comment_attachments ca
     LEFT JOIN attachments a ON ca.attachment_id = a.id
     WHERE ca.comment_id = $1
     ORDER BY ca.created_at DESC`,
    [commentId]
  )
  return rows as CommentAttachment[]
}

// Delete attachment
export async function deleteAttachment(attachmentId: string) {
  const attachment = await pool(
    `SELECT blob_pathname FROM attachments WHERE id = $1`,
    [attachmentId]
  )

  if (!attachment) throw new Error('Attachment not found')

  await pool(`DELETE FROM attachments WHERE id = $1`, [attachmentId])

  return attachment?.blob_pathname
}

// Remove attachment from task
export async function removeTaskAttachment(taskAttachmentId: string) {
  await pool(
    `DELETE FROM task_attachments WHERE id = $1`,
    [taskAttachmentId]
  )
}

// Remove attachment from comment
export async function removeCommentAttachment(commentAttachmentId: string) {
  await pool(
    `DELETE FROM comment_attachments WHERE id = $1`,
    [commentAttachmentId]
  )
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
