import { env } from './env'
import { requireSupabase } from './supabase'
import { MAX_UPLOAD_BYTES, validateImageFile } from './validation'

export const MEDIA_BUCKET = 'media'

/** Public URL of a file in the media bucket. Pure string building, no network call. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path || !env.supabaseUrl) return null
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return `${env.supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${encoded}`
}

export interface PreparedImage {
  blob: Blob
  contentType: string
  extension: string
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

/**
 * Resizes large photos (longest side 1600px) and re-encodes them as WebP in the browser
 * before upload, so catalogue pages stay fast. Falls back to the original file when the
 * browser cannot decode or encode it.
 */
export async function prepareImage(file: File, maxDimension = 1600): Promise<PreparedImage> {
  const problem = validateImageFile(file)
  if (problem) throw new Error(problem)

  const original: PreparedImage = {
    blob: file,
    contentType: file.type,
    extension: EXTENSIONS[file.type] ?? 'jpg',
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas')
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
    if (blob && blob.type === 'image/webp' && (scale < 1 || blob.size < file.size)) {
      if (blob.size > MAX_UPLOAD_BYTES) throw new Error(`"${file.name}" is still over 5 MB after resizing.`)
      return { blob, contentType: 'image/webp', extension: 'webp' }
    }
  } catch (error) {
    if (error instanceof Error && /over 5 MB/.test(error.message)) throw error
    // Decoding/encoding not supported here: use the original if it fits the bucket limit.
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`"${file.name}" is over 5 MB and could not be resized in this browser.`)
  }
  return original
}

/** Uploads one image and returns its storage path. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const supabase = requireSupabase()
  const prepared = await prepareImage(file)
  const path = `${folder}/${crypto.randomUUID()}.${prepared.extension}`
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, prepared.blob, {
    contentType: prepared.contentType,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function removeFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const supabase = requireSupabase()
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(paths)
  if (error) throw error
}
