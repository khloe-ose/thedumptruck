import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { LockKeyhole, Shuffle, Unlock } from 'lucide-react'
import type { PhotoItem } from '../types/photo'
import { PhotoCard } from './PhotoCard'

interface PhotoGroupProps {
  photos: PhotoItem[]
  groupIndex: number
  globalStart: number
  lockedFirstId?: string
  shuffleCount: number
  selectedId: string | null
  animate: boolean
  motionNonce: number
  onSelect: (id: string) => void
  onPreview: (id: string) => void
  onRemove: (id: string) => void
  onUnlock: (groupIndex: number) => void
  onShuffle: (groupIndex: number) => void
}

export function PhotoGroup({
  photos,
  groupIndex,
  globalStart,
  lockedFirstId,
  shuffleCount,
  selectedId,
  animate,
  motionNonce,
  onSelect,
  onPreview,
  onRemove,
  onUnlock,
  onShuffle,
}: PhotoGroupProps) {
  const lockedPhoto = lockedFirstId && photos[0]?.id === lockedFirstId ? photos[0] : undefined

  return (
    <section className="photo-group" aria-labelledby={`group-${groupIndex}-title`}>
      <div className="group-inner-rule">
        <header className="group-header">
          <div>
            <p className="eyebrow">Contact sheet</p>
            <h2 id={`group-${groupIndex}-title`}>Group {String(groupIndex + 1).padStart(2, '0')}</h2>
          </div>
          <div className="group-count"><strong>{photos.length}</strong><span>Items</span></div>
        </header>

        <div className={`first-photo-strip ${lockedPhoto ? 'has-lock' : ''}`}>
          {lockedPhoto ? (
            <>
              <LockKeyhole size={16} />
              <span><b>First item</b><em title={lockedPhoto.file.name}>{lockedPhoto.file.name}</em></span>
              <button type="button" onClick={() => onUnlock(groupIndex)} aria-label={`Unlock first picture in group ${groupIndex + 1}`}>
                <Unlock size={15} /> Unlock
              </button>
            </>
          ) : (
            <>
              <span className="first-empty-number">01</span>
              <span><b>First item not chosen</b><em>Select a card, then choose “Set as First.”</em></span>
            </>
          )}
        </div>

        <SortableContext items={photos.map((photo) => photo.id)} strategy={rectSortingStrategy}>
          <div className="photo-grid">
            {photos.map((photo, localIndex) => {
              const isLocked = Boolean(lockedPhoto && localIndex === 0 && lockedPhoto.id === photo.id)
              return (
                <PhotoCard
                  key={`${photo.id}-${animate && !isLocked ? motionNonce : 0}`}
                  photo={photo}
                  globalIndex={globalStart + localIndex}
                  groupPosition={localIndex + 1}
                  groupCount={photos.length}
                  isLocked={isLocked}
                  isSelected={selectedId === photo.id}
                  animate={animate}
                  onSelect={onSelect}
                  onPreview={onPreview}
                  onRemove={onRemove}
                />
              )
            })}
          </div>
        </SortableContext>

        <footer className="group-footer">
          <button className="group-shuffle" type="button" onClick={() => onShuffle(groupIndex)}>
            <Shuffle size={17} /> Shuffle This Group
          </button>
          <span>{shuffleCount > 0 ? `Group shuffle #${shuffleCount}` : 'Only this sheet will change'}</span>
        </footer>
      </div>
    </section>
  )
}
