export function getPublicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return `${supabaseUrl}/storage/v1/object/public/event-photos/${path}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 
  'video/mp4', 'video/quicktime', 'video/x-m4v'
]

export function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only Images (JPEG, PNG, WebP, HEIC) and Videos (MP4, MOV) are accepted'
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Max size is ${formatFileSize(MAX_FILE_SIZE)}`
  }
  return null
}
