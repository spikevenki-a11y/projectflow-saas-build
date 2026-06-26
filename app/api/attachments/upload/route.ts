import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'
import { createAttachment, validateFile } from '@/lib/attachments'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const orgId = formData.get('orgId') as string

    if (!file || !orgId) {
      return NextResponse.json(
        { error: 'Missing file or orgId' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Upload to Blob
    const timestamp = Date.now()
    const filename = `${orgId}/${timestamp}-${file.name}`

    const blob = await put(filename, file, {
      access: 'private',
      addRandomSuffix: false,
    })

    // Create attachment record
    const attachment = await createAttachment(
      orgId,
      user.id,
      file.name,
      file.size,
      file.type,
      blob.url,
      blob.pathname
    )

    return NextResponse.json(attachment)
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
