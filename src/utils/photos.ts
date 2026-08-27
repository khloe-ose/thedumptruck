import type { PhotoItem } from '../types/photo'

export const GROUP_SIZE = 20

const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i
const VIDEO_EXTENSIONS = /\.(3g2|3gp|avi|m2ts|m4v|mkv|mov|mp4|mpeg|mpg|mts|ogv|qt|webm)$/i

export function getMediaType(file: File, hint?: 'image' | 'video'): 'image' | 'video' {
  if (hint) return hint
  const mime = file.type.toLowerCase()
  return mime.startsWith('video/') || mime.includes('quicktime') || VIDEO_EXTENSIONS.test(file.name) ? 'video' : 'image'
}

export function isSupportedMedia(file: File): boolean {
  return ACCEPTED_MIME_TYPES.has(file.type.toLowerCase()) ||
    ACCEPTED_EXTENSIONS.test(file.name) ||
    file.type.toLowerCase().startsWith('video/') ||
    file.type.toLowerCase().includes('quicktime') ||
    VIDEO_EXTENSIONS.test(file.name)
}

export function chunkPhotos<T>(items: readonly T[], size = GROUP_SIZE): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

export function groupIndexForPosition(index: number): number {
  return Math.floor(index / GROUP_SIZE)
}

export function groupStart(groupIndex: number): number {
  return groupIndex * GROUP_SIZE
}

export function isLockedAtIndex(
  photos: readonly PhotoItem[],
  lockedFirstIds: readonly (string | undefined)[],
  index: number,
): boolean {
  const groupIndex = groupIndexForPosition(index)
  return index === groupStart(groupIndex) && lockedFirstIds[groupIndex] === photos[index]?.id
}

export function normalizeLockedStarts(
  input: readonly PhotoItem[],
  lockedFirstIds: readonly (string | undefined)[],
): { photos: PhotoItem[]; lockedFirstIds: Array<string | undefined> } {
  const photos = [...input]
  const groupCount = Math.ceil(photos.length / GROUP_SIZE)
  const locks = lockedFirstIds.slice(0, groupCount)

  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const lockedId = locks[groupIndex]
    const targetIndex = groupStart(groupIndex)
    if (!lockedId) continue

    const currentIndex = photos.findIndex((photo) => photo.id === lockedId)
    if (currentIndex < 0 || targetIndex >= photos.length) {
      locks[groupIndex] = undefined
      continue
    }

    if (currentIndex !== targetIndex) {
      const [lockedPhoto] = photos.splice(currentIndex, 1)
      photos.splice(targetIndex, 0, lockedPhoto)
    }
  }

  return { photos, lockedFirstIds: locks }
}

export function createPhotoItems(
  files: readonly File[],
  startIndex: number,
  mediaHint?: 'image' | 'video',
): PhotoItem[] {
  return files.map((file, offset) => ({
    id: typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${startIndex + offset}-${Math.random().toString(16).slice(2)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    originalIndex: startIndex + offset,
    mediaType: getMediaType(file, mediaHint),
  }))
}
