import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, LockKeyhole, Unlock, X } from 'lucide-react'
import type { PhotoItem } from '../types/photo'
import { GROUP_SIZE } from '../utils/photos'
import { MediaThumbnail } from './MediaThumbnail'

interface PhotoLightboxProps {
  photos: PhotoItem[]
  photoId: string | null
  lockedFirstIds: Array<string | undefined>
  onClose: () => void
  onNavigate: (photoId: string) => void
  onSetFirst: (photoId: string) => void
  onUnlock: (groupIndex: number) => void
}

export function PhotoLightbox({
  photos,
  photoId,
  lockedFirstIds,
  onClose,
  onNavigate,
  onSetFirst,
  onUnlock,
}: PhotoLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const index = photos.findIndex((photo) => photo.id === photoId)
  const photo = photos[index]
  const groupIndex = Math.floor(index / GROUP_SIZE)
  const isLocked = index >= 0 && index === groupIndex * GROUP_SIZE && lockedFirstIds[groupIndex] === photoId

  useEffect(() => {
    if (!photo) return
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && index > 0) onNavigate(photos[index - 1].id)
      if (event.key === 'ArrowRight' && index < photos.length - 1) onNavigate(photos[index + 1].id)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, onClose, onNavigate, photo, photos])

  if (!photo) return null

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-labelledby="lightbox-title" onMouseDown={onClose}>
      <button ref={closeRef} className="lightbox-close" type="button" onClick={onClose} aria-label="Close preview"><X size={24} /></button>
      <button
        className="lightbox-arrow previous"
        type="button"
        disabled={index === 0}
        onClick={(event) => { event.stopPropagation(); onNavigate(photos[index - 1].id) }}
        aria-label="Previous photo"
      ><ChevronLeft size={28} /></button>

      <section className="lightbox-content" onMouseDown={(event) => event.stopPropagation()}>
        <div className="lightbox-image">
          <MediaThumbnail
            item={photo}
            alt={`Large preview of ${photo.file.name}`}
          />
        </div>
        <footer className="lightbox-footer">
          <div>
            <p className="eyebrow">#{String(index + 1).padStart(2, '0')} · Group {groupIndex + 1}</p>
            <h2 id="lightbox-title">{photo.file.name}</h2>
          </div>
          {isLocked ? (
            <button className="button secondary" type="button" onClick={() => onUnlock(groupIndex)}><Unlock size={16} /> Unlock First</button>
          ) : (
            <button className="button primary" type="button" onClick={() => onSetFirst(photo.id)}><LockKeyhole size={16} /> Set as First</button>
          )}
        </footer>
      </section>

      <button
        className="lightbox-arrow next"
        type="button"
        disabled={index === photos.length - 1}
        onClick={(event) => { event.stopPropagation(); onNavigate(photos[index + 1].id) }}
        aria-label="Next photo"
      ><ChevronRight size={28} /></button>
    </div>
  )
}
