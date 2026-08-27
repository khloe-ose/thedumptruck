import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { OrganizerState, PhotoItem, UploadReport } from '../types/photo'
import { reorderUnlockedPhotos, setPhotoAsFirst, shuffleAllUnlocked, shuffleOneGroup } from '../utils/organizer'
import { createPhotoItems, groupIndexForPosition, isSupportedMedia, normalizeLockedStarts } from '../utils/photos'
import { useUndoHistory } from './useUndoHistory'

const INITIAL_STATE: OrganizerState = {
  photos: [],
  lockedFirstIds: [],
  shuffleCount: 0,
  groupShuffleCounts: [],
}

export function usePhotoOrganizer() {
  const [state, setState] = useState<OrganizerState>(INITIAL_STATE)
  const [motion, setMotion] = useState<{ nonce: number; scope: 'all' | number | null }>({ nonce: 0, scope: null })
  const nextOriginalIndex = useRef(0)
  const allObjectUrls = useRef(new Set<string>())
  const history = useUndoHistory<OrganizerState>(30)

  useEffect(() => () => {
    allObjectUrls.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const commit = useCallback((next: OrganizerState) => {
    history.push(state)
    setState(next)
  }, [history, state])

  const addFiles = useCallback((
    incoming: FileList | File[],
    mediaHint?: 'image' | 'video',
  ): UploadReport => {
    const files = Array.from(incoming)
    // A dedicated native picker is a stronger signal than inconsistent iPadOS MIME metadata.
    const accepted = mediaHint ? files : files.filter(isSupportedMedia)
    const rejected = mediaHint ? [] : files.filter((file) => !isSupportedMedia(file)).map((file) => file.name)
    const knownNames = new Set(state.photos.map((photo) => photo.file.name.toLocaleLowerCase()))
    const seenNames = new Set<string>()
    const duplicateNames = accepted
      .filter((file) => {
        const name = file.name.toLocaleLowerCase()
        const isDuplicate = knownNames.has(name) || seenNames.has(name)
        seenNames.add(name)
        return isDuplicate
      })
      .map((file) => file.name)

    if (accepted.length > 0) {
      const items = createPhotoItems(accepted, nextOriginalIndex.current, mediaHint)
      nextOriginalIndex.current += items.length
      items.forEach((photo) => allObjectUrls.current.add(photo.previewUrl))
      commit({ ...state, photos: [...state.photos, ...items] })
    }

    return { added: accepted.length, rejected, duplicateNames }
  }, [commit, state])

  const setAsFirst = useCallback((photoId: string) => {
    const next = setPhotoAsFirst(state.photos, state.lockedFirstIds, photoId)
    if (next.photos.every((photo, index) => photo.id === state.photos[index]?.id) &&
      next.lockedFirstIds.join('|') === state.lockedFirstIds.join('|')) return
    commit({ ...state, ...next })
  }, [commit, state])

  const unlockFirst = useCallback((groupIndex: number) => {
    if (!state.lockedFirstIds[groupIndex]) return
    const lockedFirstIds = [...state.lockedFirstIds]
    lockedFirstIds[groupIndex] = undefined
    commit({ ...state, lockedFirstIds })
  }, [commit, state])

  const shuffleGroup = useCallback((groupIndex: number) => {
    const photos = shuffleOneGroup(state.photos, state.lockedFirstIds, groupIndex)
    const groupShuffleCounts = [...state.groupShuffleCounts]
    groupShuffleCounts[groupIndex] = (groupShuffleCounts[groupIndex] ?? 0) + 1
    commit({
      ...state,
      photos,
      shuffleCount: state.shuffleCount + 1,
      groupShuffleCounts,
    })
    setMotion((current) => ({ nonce: current.nonce + 1, scope: groupIndex }))
  }, [commit, state])

  const shuffleAll = useCallback(() => {
    const photos = shuffleAllUnlocked(state.photos, state.lockedFirstIds)
    commit({ ...state, photos, shuffleCount: state.shuffleCount + 1 })
    setMotion((current) => ({ nonce: current.nonce + 1, scope: 'all' }))
  }, [commit, state])

  const reorder = useCallback((activeId: string, overId: string) => {
    const photos = reorderUnlockedPhotos(state.photos, state.lockedFirstIds, activeId, overId)
    if (photos.every((photo, index) => photo.id === state.photos[index]?.id)) return false
    commit({ ...state, photos })
    return true
  }, [commit, state])

  const removePhoto = useCallback((photoId: string) => {
    const remaining = state.photos.filter((photo) => photo.id !== photoId)
    const locks = state.lockedFirstIds.map((id) => id === photoId ? undefined : id)
    const normalized = normalizeLockedStarts(remaining, locks)
    commit({
      ...state,
      ...normalized,
      groupShuffleCounts: state.groupShuffleCounts.slice(0, Math.ceil(remaining.length / 20)),
    })
  }, [commit, state])

  const resetOrder = useCallback(() => {
    commit({
      photos: [...state.photos].sort((a, b) => a.originalIndex - b.originalIndex),
      lockedFirstIds: [],
      shuffleCount: 0,
      groupShuffleCounts: [],
    })
  }, [commit, state])

  const undo = useCallback(() => {
    const previous = history.undo()
    if (previous) setState(previous)
  }, [history])

  const clearAll = useCallback(() => {
    if (state.photos.length === 0) return
    commit({ ...INITIAL_STATE })
  }, [commit, state.photos.length])

  const lockedCount = useMemo(() => state.lockedFirstIds.filter((id, groupIndex) => {
    return Boolean(id && state.photos[groupIndex * 20]?.id === id)
  }).length, [state.lockedFirstIds, state.photos])

  const getPhotoContext = useCallback((photoId: string) => {
    const index = state.photos.findIndex((photo) => photo.id === photoId)
    if (index < 0) return undefined
    const groupIndex = groupIndexForPosition(index)
    return {
      photo: state.photos[index] as PhotoItem,
      index,
      groupIndex,
      isLocked: state.lockedFirstIds[groupIndex] === photoId && index === groupIndex * 20,
    }
  }, [state.lockedFirstIds, state.photos])

  return {
    ...state,
    motion,
    lockedCount,
    canUndo: history.canUndo,
    addFiles,
    setAsFirst,
    unlockFirst,
    shuffleGroup,
    shuffleAll,
    reorder,
    removePhoto,
    resetOrder,
    undo,
    clearAll,
    getPhotoContext,
  }
}
