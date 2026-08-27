import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, GripVertical, LockKeyhole, Trash2, Video } from 'lucide-react'
import type { PhotoItem } from '../types/photo'
import { formatMediaDuration } from '../utils/media'
import { MediaThumbnail } from './MediaThumbnail'

interface PhotoCardProps {
  photo: PhotoItem
  positionIndex: number
  isLocked: boolean
  isSelected: boolean
  animate: boolean
  onSelect: (id: string) => void
  onPreview: (id: string) => void
  onRemove: (id: string) => void
}

export function PhotoCard({
  photo,
  positionIndex,
  isLocked,
  isSelected,
  animate,
  onSelect,
  onPreview,
  onRemove,
}: PhotoCardProps) {
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: photo.id,
    disabled: { draggable: isLocked, droppable: false },
  })

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        'photo-card',
        isLocked ? 'is-locked' : '',
        isSelected ? 'is-selected' : '',
        isDragging ? 'is-dragging' : '',
        isOver ? (isLocked ? 'drop-blocked' : 'is-over') : '',
        animate && !isLocked ? 'shuffle-motion' : '',
      ].filter(Boolean).join(' ')}
      tabIndex={0}
      aria-label={`Photo ${positionIndex + 1}: ${photo.file.name}${isLocked ? ', first and locked' : ''}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(photo.id)}
      onDoubleClick={() => onPreview(photo.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(photo.id)
        }
      }}
    >
      <div className="thumbnail-frame">
        <MediaThumbnail item={photo} onDuration={setVideoDuration} />

        <span className="position-badge" aria-hidden="true">
          #{String(positionIndex + 1).padStart(2, '0')}
        </span>

        {photo.mediaType === 'video' && (
          <span className="video-badge">
            <Video size={12} /> {videoDuration === null ? 'Video' : formatMediaDuration(videoDuration)}
          </span>
        )}

        <div className="card-hover-actions">
          <button type="button" onClick={(event) => { event.stopPropagation(); onPreview(photo.id) }} aria-label={`Preview ${photo.file.name}`}>
            <Eye size={15} />
          </button>
          <button type="button" onClick={(event) => { event.stopPropagation(); onRemove(photo.id) }} aria-label={`Remove ${photo.file.name}`}>
            <Trash2 size={15} />
          </button>
        </div>

        <button
          className="drag-handle"
          type="button"
          disabled={isLocked}
          aria-label={isLocked ? 'Locked first photo cannot be dragged' : `Drag ${photo.file.name}`}
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          {isLocked ? <LockKeyhole size={14} /> : <GripVertical size={16} />}
        </button>
      </div>
    </article>
  )
}

export function DragPreviewCard({ photo, position }: { photo: PhotoItem; position: number }) {
  return (
    <div className="drag-preview" aria-hidden="true">
      <MediaThumbnail item={photo} />
      <div><strong>#{String(position).padStart(2, '0')}</strong><span>{photo.file.name}</span></div>
    </div>
  )
}
