import { supabase } from './supabase'

export const PHOTO_BUCKET = 'recipe-photos'
export const PHOTO_MAX_SIDE = 1600
export const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const PHOTO_MAX_INPUT_BYTES = 15 * 1024 * 1024

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function shrinkImage(file: File): Promise<Blob> {
  if (!PHOTO_ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Unsupported format. Use JPEG, PNG or WebP.')
  }
  if (file.size > PHOTO_MAX_INPUT_BYTES) {
    throw new Error('The image is too large (maximum 15 MB).')
  }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process the image.')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  let blob = await canvasToBlob(canvas, 'image/webp', 0.85)
  if (!blob || blob.type !== 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/jpeg', 0.85)
  }
  if (!blob) throw new Error('Could not process the image.')
  if (blob.size > 2 * 1024 * 1024) {
    throw new Error('The image is still over 2 MB after resizing.')
  }
  return blob
}

export async function uploadRecipePhoto(userId: string, file: File): Promise<string> {
  const blob = await shrinkImage(file)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return path
}

export async function removeRecipePhoto(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

export function recipePhotoUrl(path: string): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}
