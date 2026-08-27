import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { PhotoItem } from '../types/photo'
import { MediaThumbnail } from './MediaThumbnail'

interface PhotoSlideshowProps {
  photos: PhotoItem[]
  dumpIndex: number
  onClose: () => void
}

export function PhotoSlideshow({ photos, dumpIndex, onClose }: PhotoSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)
  const photo = photos[currentIndex]

  const showPrevious = () => {
    setCurrentIndex((index) => (index - 1 + photos.length) % photos.length)
  }

  const showNext = () => {
    setCurrentIndex((index) => (index + 1) % photos.length)
  }

  useEffect(() => {
    setCurrentIndex(0)
  }, [dumpIndex])

  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft' && photos.length > 1) showPrevious()
      if (event.key === 'ArrowRight' && photos.length > 1) showNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, photos.length])

  if (!photo) return null

  return (
    <div className="slideshow" role="dialog" aria-modal="true" aria-labelledby="slideshow-title" onMouseDown={onClose}>
      <button ref={closeRef} className="slideshow-close" type="button" onClick={onClose} aria-label="Close slideshow">
        <X size={24} />
      </button>

      <section className="slideshow-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="slideshow-header">
          <div>
            <p className="eyebrow">Dump {dumpIndex + 1} slideshow</p>
            <h2 id="slideshow-title">#{String(currentIndex + 1).padStart(2, '0')} of {photos.length}</h2>
          </div>
          <span className="slideshow-swipe-hint">Swipe or use the arrows</span>
        </header>

        <div
          className="slideshow-stage"
          aria-live="polite"
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null
          }}
          onTouchEnd={(event) => {
            const startX = touchStartX.current
            const endX = event.changedTouches[0]?.clientX
            touchStartX.current = null
            if (startX === null || endX === undefined || photos.length < 2) return
            const distance = endX - startX
            if (Math.abs(distance) < 45) return
            if (distance > 0) showPrevious()
            else showNext()
          }}
          onTouchCancel={() => { touchStartX.current = null }}
        >
          <MediaThumbnail
            key={photo.id}
            item={photo}
            alt={`Dump ${dumpIndex + 1}, item ${currentIndex + 1}: ${photo.file.name}`}
          />
        </div>

        <footer className="slideshow-footer">
          <button className="slideshow-arrow" type="button" disabled={photos.length < 2} onClick={showPrevious} aria-label="Previous item">
            <ChevronLeft size={25} />
          </button>
          <span>{photo.file.name}</span>
          <button className="slideshow-arrow" type="button" disabled={photos.length < 2} onClick={showNext} aria-label="Next item">
            <ChevronRight size={25} />
          </button>
        </footer>
      </section>
    </div>
  )
}
