import { describe, expect, it } from 'vitest'
import type { PhotoItem } from '../types/photo'
import { createOrderCsv } from './export'
import { getMediaType, isSupportedMedia, normalizeLockedStarts } from './photos'
import { formatMediaDuration } from './media'
import {
  reorderUnlockedPhotos,
  setPhotoAsFirst,
  shuffleAllUnlocked,
  shuffleOneGroup,
} from './organizer'

function makePhotos(count: number): PhotoItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `photo-${index + 1}`,
    file: { name: `IMG_${String(index + 1).padStart(4, '0')}.JPG` } as File,
    previewUrl: `blob:photo-${index + 1}`,
    originalIndex: index,
    mediaType: 'image',
  }))
}

const deterministicRandom = () => 0

describe('first-photo locking and group shuffle', () => {
  it('supports 14 photos, moves #8 to first, and shuffles only the other 13', () => {
    const original = makePhotos(14)
    const selected = original[7]
    const locked = setPhotoAsFirst(original, [], selected.id)
    const shuffled = shuffleOneGroup(locked.photos, locked.lockedFirstIds, 0, deterministicRandom)

    expect(shuffled).toHaveLength(14)
    expect(shuffled[0].id).toBe(selected.id)
    expect(locked.lockedFirstIds[0]).toBe(selected.id)
    expect(shuffled.slice(1).map((photo) => photo.id)).not.toEqual(locked.photos.slice(1).map((photo) => photo.id))
    expect(new Set(shuffled.map((photo) => photo.id))).toEqual(new Set(original.map((photo) => photo.id)))
  })

  it('keeps the locked first photo fixed in a full 20-photo group', () => {
    const original = makePhotos(20)
    const locked = setPhotoAsFirst(original, [], original[12].id)
    const shuffled = shuffleOneGroup(locked.photos, locked.lockedFirstIds, 0, deterministicRandom)

    expect(shuffled[0].id).toBe(original[12].id)
    expect(shuffled.slice(1).map((photo) => photo.id)).not.toEqual(locked.photos.slice(1).map((photo) => photo.id))
  })

  it('replaces an old first-photo lock when a new first photo is chosen', () => {
    const photos = makePhotos(20)
    const first = setPhotoAsFirst(photos, [], photos[5].id)
    const replacement = setPhotoAsFirst(first.photos, first.lockedFirstIds, photos[11].id)

    expect(replacement.photos[0].id).toBe(photos[11].id)
    expect(replacement.lockedFirstIds[0]).toBe(photos[11].id)
    expect(replacement.photos.findIndex((photo) => photo.id === photos[5].id)).toBeGreaterThan(0)
  })
})

describe('global shuffle', () => {
  it.each([40, 60])('keeps every group lock at positions 1, 21, 41… for %i photos', (count) => {
    const original = makePhotos(count)
    let current = { photos: original, lockedFirstIds: [] as Array<string | undefined> }
    const chosenIds: string[] = []

    for (let group = 0; group < count / 20; group += 1) {
      const chosen = current.photos[group * 20 + 7]
      chosenIds.push(chosen.id)
      current = setPhotoAsFirst(current.photos, current.lockedFirstIds, chosen.id)
    }

    const shuffled = shuffleAllUnlocked(current.photos, current.lockedFirstIds, deterministicRandom)
    chosenIds.forEach((id, group) => expect(shuffled[group * 20].id).toBe(id))
    expect(new Set(shuffled.map((photo) => photo.id))).toEqual(new Set(original.map((photo) => photo.id)))

    const unlockedBefore = current.photos.filter((_, index) => index % 20 !== 0).map((photo) => photo.id)
    const unlockedAfter = shuffled.filter((_, index) => index % 20 !== 0).map((photo) => photo.id)
    expect(unlockedAfter).not.toEqual(unlockedBefore)
  })

  it('allows unlocked photos to cross group boundaries', () => {
    const photos = makePhotos(40)
    const withFirst = setPhotoAsFirst(photos, [], photos[4].id)
    const withSecond = setPhotoAsFirst(withFirst.photos, withFirst.lockedFirstIds, photos[25].id)
    const originalFirstGroupIds = new Set(withSecond.photos.slice(0, 20).map((photo) => photo.id))
    const shuffled = shuffleAllUnlocked(withSecond.photos, withSecond.lockedFirstIds, deterministicRandom)

    expect(shuffled.slice(1, 20).some((photo) => !originalFirstGroupIds.has(photo.id))).toBe(true)
  })
})

describe('group-only shuffle and drag reordering', () => {
  it('changes only group 2 in a 60-photo collection', () => {
    const photos = makePhotos(60)
    const shuffled = shuffleOneGroup(photos, [], 1, deterministicRandom)

    expect(shuffled.slice(0, 20)).toEqual(photos.slice(0, 20))
    expect(shuffled.slice(20, 40)).not.toEqual(photos.slice(20, 40))
    expect(shuffled.slice(40)).toEqual(photos.slice(40))
  })

  it('moves an unlocked photo across groups while preserving locked slots', () => {
    const photos = makePhotos(40)
    const first = setPhotoAsFirst(photos, [], photos[3].id)
    const second = setPhotoAsFirst(first.photos, first.lockedFirstIds, photos[24].id)
    const activeId = second.photos[34].id
    const overId = second.photos[7].id
    const reordered = reorderUnlockedPhotos(second.photos, second.lockedFirstIds, activeId, overId)

    expect(reordered[0].id).toBe(second.lockedFirstIds[0])
    expect(reordered[20].id).toBe(second.lockedFirstIds[1])
    expect(reordered[7].id).toBe(activeId)
    expect(reordered).toHaveLength(40)
  })

  it('rejects a drop onto a locked first position', () => {
    const photos = makePhotos(20)
    const locked = setPhotoAsFirst(photos, [], photos[4].id)
    const reordered = reorderUnlockedPhotos(locked.photos, locked.lockedFirstIds, locked.photos[8].id, locked.photos[0].id)
    expect(reordered).toEqual(locked.photos)
  })

  it('re-anchors later locks after a photo is removed before them', () => {
    const photos = makePhotos(40)
    const lockId = photos[25].id
    const locked = setPhotoAsFirst(photos, [], lockId)
    locked.lockedFirstIds[1] = lockId
    const remaining = locked.photos.filter((photo) => photo.id !== photos[2].id)
    const normalized = normalizeLockedStarts(remaining, locked.lockedFirstIds)
    expect(normalized.photos[20].id).toBe(lockId)
  })
})

describe('export order', () => {
  it('matches visible global positions and escapes filenames safely', () => {
    const photos = makePhotos(21)
    photos[1] = { ...photos[1], file: { name: 'Family, Summer.jpg' } as File }
    const lines = createOrderCsv(photos).split('\n')

    expect(lines[0]).toBe('Position,Group,Filename')
    expect(lines[1]).toBe('1,1,IMG_0001.JPG')
    expect(lines[2]).toBe('2,1,"Family, Summer.jpg"')
    expect(lines[21]).toBe('21,2,IMG_0021.JPG')
  })
})

describe('mixed media support', () => {
  it('accepts common image and video formats and identifies videos', () => {
    const image = { name: 'portrait.jpg', type: 'image/jpeg' } as File
    const video = { name: 'clip.MOV', type: 'video/quicktime' } as File
    const unsupported = { name: 'notes.pdf', type: 'application/pdf' } as File

    expect(isSupportedMedia(image)).toBe(true)
    expect(isSupportedMedia(video)).toBe(true)
    expect(getMediaType(video)).toBe('video')
    expect(isSupportedMedia(unsupported)).toBe(false)
    expect(getMediaType(unsupported, 'video')).toBe('video')
  })

  it('formats short and long video durations', () => {
    expect(formatMediaDuration(9.9)).toBe('0:09')
    expect(formatMediaDuration(125)).toBe('2:05')
    expect(formatMediaDuration(3_725)).toBe('1:02:05')
  })
})
