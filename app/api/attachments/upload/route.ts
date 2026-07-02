import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth'
import { createAttachment, validateFile } from '@/lib/attachments'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value
    const user = token ? await verifyToken(token) : null

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const orgId = formData.get('orgId') as string

    if (!file || !orgId) {
      return NextResponse.json({ error: 'Missing file or orgId' }, { status: 400 })
    }

    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const timestamp = Date.now()
    const filename = `${orgId}/${timestamp}-${file.name}`

    const blob = await put(filename, file, {
      access: 'private',
      addRandomSuffix: false,
    })

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
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
