import type { PhotoItem } from '../types/photo'
import { fisherYates, type RandomSource } from './shuffle'
import {
  GROUP_SIZE,
  groupIndexForPosition,
  groupStart,
  isLockedAtIndex,
  normalizeLockedStarts,
} from './photos'

export function setPhotoAsFirst(
  photos: readonly PhotoItem[],
  lockedFirstIds: readonly (string | undefined)[],
  photoId: string,
): { photos: PhotoItem[]; lockedFirstIds: Array<string | undefined> } {
  const currentIndex = photos.findIndex((photo) => photo.id === photoId)
  if (currentIndex < 0) return { photos: [...photos], lockedFirstIds: [...lockedFirstIds] }

  const groupIndex = groupIndexForPosition(currentIndex)
  const targetIndex = groupStart(groupIndex)
  const nextPhotos = [...photos]
  const [selected] = nextPhotos.splice(currentIndex, 1)
  nextPhotos.splice(targetIndex, 0, selected)

  const nextLocks = [...lockedFirstIds]
  nextLocks[groupIndex] = photoId
  return { photos: nextPhotos, lockedFirstIds: nextLocks }
}

export function shuffleOneGroup(
  input: readonly PhotoItem[],
  lockedFirstIds: readonly (string | undefined)[],
  groupIndex: number,
  random: RandomSource = Math.random,
): PhotoItem[] {
  const photos = [...input]
  const start = groupStart(groupIndex)
  const end = Math.min(start + GROUP_SIZE, photos.length)
  if (start >= photos.length) return photos

  const group = photos.slice(start, end)
  const hasLockedFirst = lockedFirstIds[groupIndex] === group[0]?.id
  const preserved = hasLockedFirst ? group.slice(0, 1) : []
  const randomized = fisherYates(hasLockedFirst ? group.slice(1) : group, random)
  photos.splice(start, group.length, ...preserved, ...randomized)
  return photos
}

export function shuffleAllUnlocked(
  input: readonly PhotoItem[],
  lockedFirstIds: readonly (string | undefined)[],
  random: RandomSource = Math.random,
): PhotoItem[] {
  const normalized = normalizeLockedStarts(input, lockedFirstIds)
  const lockedPositions = new Map<number, PhotoItem>()
  const unlocked: PhotoItem[] = []

  normalized.photos.forEach((photo, index) => {
    if (isLockedAtIndex(normalized.photos, normalized.lockedFirstIds, index)) {
      lockedPositions.set(index, photo)
    } else {
      unlocked.push(photo)
    }
  })

  const randomized = fisherYates(unlocked, random)
  let unlockedIndex = 0
  return normalized.photos.map((_, index) => {
    const locked = lockedPositions.get(index)
    if (locked) return locked
    const next = randomized[unlockedIndex]
    unlockedIndex += 1
    return next
  })
}

/** Reorders only the logical list of unlocked slots, so fixed first slots cannot shift. */
export function reorderUnlockedPhotos(
  photos: readonly PhotoItem[],
  lockedFirstIds: readonly (string | undefined)[],
  activeId: string,
  overId: string,
): PhotoItem[] {
  if (activeId === overId) return [...photos]
  const activeIndex = photos.findIndex((photo) => photo.id === activeId)
  const overIndex = photos.findIndex((photo) => photo.id === overId)
  if (activeIndex < 0 || overIndex < 0) return [...photos]
  if (
    isLockedAtIndex(photos, lockedFirstIds, activeIndex) ||
    isLockedAtIndex(photos, lockedFirstIds, overIndex)
  ) {
    return [...photos]
  }

  const unlockedPositions: number[] = []
  const unlockedPhotos: PhotoItem[] = []
  photos.forEach((photo, index) => {
    if (!isLockedAtIndex(photos, lockedFirstIds, index)) {
      unlockedPositions.push(index)
      unlockedPhotos.push(photo)
    }
  })

  const from = unlockedPhotos.findIndex((photo) => photo.id === activeId)
  const to = unlockedPhotos.findIndex((photo) => photo.id === overId)
  if (from < 0 || to < 0) return [...photos]

  const reordered = [...unlockedPhotos]
  const [moved] = reordered.splice(from, 1)
  reordered.splice(to, 0, moved)

  const result = [...photos]
  unlockedPositions.forEach((position, index) => {
    result[position] = reordered[index]
  })
  return result
}
