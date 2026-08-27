import { Eye, LockKeyhole, Trash2, Unlock, X } from 'lucide-react'
import type { PhotoItem } from '../types/photo'
import { MediaThumbnail } from './MediaThumbnail'

interface ActionBarProps {
  photo: PhotoItem
  positionIndex: number
  groupIndex: number
  isLocked: boolean
  onSetFirst: () => void
  onUnlock: () => void
  onPreview: () => void
  onRemove: () => void
  onClose: () => void
}

export function ActionBar({
  photo,
  positionIndex,
  groupIndex,
  isLocked,
  onSetFirst,
  onUnlock,
  onPreview,
  onRemove,
  onClose,
}: ActionBarProps) {
  return (
    <aside className="selected-action-bar" aria-label="Selected photo actions">
      <div className="selected-summary">
        <MediaThumbnail item={photo} />
        <span><b>#{String(positionIndex + 1).padStart(2, '0')} · Dump {groupIndex + 1}</b><em>{photo.file.name}</em></span>
      </div>
      <div className="selected-actions">
        {isLocked ? (
          <button className="button primary" type="button" onClick={onUnlock}><Unlock size={16} /> Unlock First</button>
        ) : (
          <button className="button primary" type="button" onClick={onSetFirst}><LockKeyhole size={16} /> Set as First</button>
        )}
        <button className="button secondary" type="button" onClick={onPreview}><Eye size={16} /> Preview</button>
        <button className="button quiet remove-action" type="button" onClick={onRemove}><Trash2 size={16} /> Remove</button>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Clear photo selection"><X size={18} /></button>
      </div>
    </aside>
  )
}
