import { useEffect, useState } from 'react'
import { ImageOff, Video } from 'lucide-react'
import type { PhotoItem } from '../types/photo'

interface MediaThumbnailProps {
  item: PhotoItem
  alt?: string
  className?: string
  onDuration?: (seconds: number) => void
}

export function MediaThumbnail({ item, alt = '', className, onDuration }: MediaThumbnailProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [item.previewUrl])

  if (failed) {
    return (
      <div className={`image-fallback ${className ?? ''}`}>
        {item.mediaType === 'video' ? <Video size={25} /> : <ImageOff size={25} />}
        <span>{item.mediaType === 'video' ? 'Video thumbnail unavailable' : 'Preview unavailable'}</span>
      </div>
    )
  }

  if (item.mediaType === 'video') {
    return (
      <video
        className={className}
        src={item.previewUrl}
        aria-label={alt || `Video preview of ${item.file.name}`}
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={(event) => {
          const duration = event.currentTarget.duration
          if (Number.isFinite(duration) && duration >= 0) {
            onDuration?.(duration)
          }
          if (Number.isFinite(duration) && duration > 0) {
            event.currentTarget.currentTime = Math.min(0.08, duration / 2)
          }
        }}
        onError={() => setFailed(true)}
      />
    )
  }

  return <img className={className} src={item.previewUrl} alt={alt} onError={() => setFailed(true)} draggable={false} />
}
