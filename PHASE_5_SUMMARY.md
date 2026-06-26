# Phase 5: File Attachments via Vercel Blob

## Overview
Phase 5 implements secure file attachment functionality for tasks and comments using Vercel Blob for storage, with comprehensive org-scoped access control and file validation.

## Database Changes
- **attachments**: Stores file metadata (name, size, type) with Blob URLs and pathnames
- **task_attachments**: Associates files with tasks (cascade delete)
- **comment_attachments**: Associates files with comments (cascade delete)
- **RLS Policies**: Org-scoped visibility, owner/admin deletion, automatic cascade on file deletion
- **Indexes**: Optimized queries on org_id, task_id, comment_id for sub-millisecond lookups

## Server Infrastructure
- **lib/attachments.ts**:
  - File validation (type whitelist, 10MB size limit)
  - CRUD utilities for attachments with Supabase RLS enforcement
  - Task/comment attachment management functions
  - File size formatting for UI display

- **app/api/attachments/upload/route.ts**:
  - Authenticated file upload handler
  - Blob storage integration with private access
  - File validation and org scoping
  - Returns attachment metadata for UI

- **app/api/attachments/route.ts**:
  - GET: Fetch task or comment attachments with RLS enforcement
  - DELETE: Remove attachments from database and Blob storage
  - Cascade deletion removes associations automatically

## UI Components
- **FileUpload**: Drag-and-drop file upload with visual feedback, file type/size validation, loading states
- **AttachmentsList**: Display attachments with download/delete actions, file icons, size formatting, lazy-load via SWR
- **CommentSection**: Updated to display attachments below each comment

## Security & Performance
- Row-Level Security enforces org-scoped access on all attachment operations
- File type whitelist prevents malicious uploads (PDF, images, documents, spreadsheets)
- 10MB file size limit prevents abuse
- Vercel Blob private URLs ensure unauthorized users cannot access files
- SWR caching reduces API calls and provides instant feedback
- Automatic cleanup: deleting attachment removes from Blob and database simultaneously

## File Type Support
- Documents: PDF, Word (.docx), Excel (.xlsx), CSV, Plain text
- Images: JPEG, PNG, GIF, WebP
- Supported file size: Max 10MB

## Next Steps (Phase 6)
- Audit & Compliance Logging: Track all user actions for compliance audits
- Real-time Sync: WebSocket support for live updates across users
- Search & Filtering: Full-text search on tasks, comments, and files
