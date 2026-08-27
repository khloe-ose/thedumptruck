import { useRef } from 'react'
import { Download, ImagePlus, RotateCcw, Shuffle, Undo2 } from 'lucide-react'
import type { UploadReport } from '../types/photo'

interface HeaderProps {
  photoCount: number
  groupCount: number
  lockedCount: number
  shuffleCount: number
  canUndo: boolean
  onFiles: (files: FileList | File[], mediaHint?: 'image' | 'video') => UploadReport
  onReport: (report: UploadReport) => void
  onUndo: () => void
  onReset: () => void
  onShuffleAll: () => void
  onExport: () => void
}

export function Header({
  photoCount,
  groupCount,
  lockedCount,
  shuffleCount,
  canUndo,
  onFiles,
  onReport,
  onUndo,
  onReset,
  onShuffleAll,
  onExport,
}: HeaderProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="app-header">
      <div className="brand-block" aria-label="Dump Truck by bababkwerpans">
        <img className="header-logo" src="/assets/dump-truck-logo-square.png" alt="Dump Truck Dumping Services" />
        <span className="header-credit">Made by <b>bababkwerpans</b></span>
      </div>

      <div className="header-main">
        <div className="status-line" aria-live="polite">
          <strong>{photoCount} <span>Media Items</span></strong>
          <i />
          <strong>{groupCount} <span>{groupCount === 1 ? 'Group' : 'Groups'}</span></strong>
          <i />
          <strong>{lockedCount} <span>First Locked</span></strong>
          <i />
          <strong>Shuffle <span>#{shuffleCount}</span></strong>
        </div>

        <div className="header-actions">
          <button className="button secondary" type="button" onClick={() => photoInputRef.current?.click()}>
            <ImagePlus size={16} /> Add Photos
          </button>
          <input
            ref={photoInputRef}
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={(event) => {
              if (event.target.files) onReport(onFiles(event.target.files, 'image'))
              event.target.value = ''
            }}
          />
          <button className="button secondary" type="button" onClick={() => videoInputRef.current?.click()}>
            <ImagePlus size={16} /> Add Videos
          </button>
          <input
            ref={videoInputRef}
            type="file"
            hidden
            multiple
            accept="video/*"
            onChange={(event) => {
              if (event.target.files) onReport(onFiles(event.target.files, 'video'))
              event.target.value = ''
            }}
          />
          <button className="button quiet" type="button" onClick={onReset}><RotateCcw size={16} /> Reset</button>
          <button className="button quiet" type="button" disabled={!canUndo} onClick={onUndo}><Undo2 size={16} /> Undo</button>
          <button className="button secondary" type="button" onClick={onExport}><Download size={16} /> Export Order</button>
          <div className="shuffle-all-wrap">
            <button className="button primary shuffle-all" type="button" onClick={onShuffleAll}>
              <Shuffle size={18} /> Shuffle All
            </button>
            <span>Locked first photos stay in place.</span>
          </div>
        </div>
      </div>
    </header>
  )
}
