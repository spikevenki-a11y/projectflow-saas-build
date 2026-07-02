import { NextRequest, NextResponse } from 'next/server'
import { getTaskAttachments, getCommentAttachments, deleteAttachment } from '@/lib/attachments'
import { del } from '@vercel/blob'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const taskId = searchParams.get('taskId')
    const commentId = searchParams.get('commentId')

    if (!taskId && !commentId) {
      return NextResponse.json({ error: 'Missing taskId or commentId' }, { status: 400 })
    }

    if (taskId) {
      const attachments = await getTaskAttachments(taskId)
      return NextResponse.json(attachments)
    }

    if (commentId) {
      const attachments = await getCommentAttachments(commentId)
      return NextResponse.json(attachments)
    }
  } catch (error) {
    console.error('[v0] Fetch attachments error:', error)
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { attachmentId } = await req.json()

    if (!attachmentId) {
      return NextResponse.json({ error: 'Missing attachmentId' }, { status: 400 })
    }

    const blobPathname = await deleteAttachment(attachmentId)

    if (blobPathname) {
      await del(blobPathname)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete attachment error:', error)
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
  }
}
