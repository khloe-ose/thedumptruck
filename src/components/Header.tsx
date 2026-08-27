import { useRef } from 'react'
import { Download, ImagePlus, LockKeyhole, RotateCcw, Shuffle, Undo2 } from 'lucide-react'
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
    <>
      <header className="app-header">
        <div className="brand-block" aria-label="Dump Truck">
          <img className="header-logo" src="/assets/logo.png" alt="Dump Truck Dumping Services" />
        </div>

        <div className="header-main header-instructions">
          <strong>Choose the first item for each group, lock it, then shuffle the rest.</strong>
          <span>Select any photo or video for its actions. Drag unlocked cards freely across the full collection.</span>
          <div className="header-instructions-lock"><LockKeyhole size={16} /> Locked positions cannot be displaced</div>
        </div>
      </header>

      <div className="header-controls-wrap">
        <section className="guidance-strip" aria-label="Organizer controls">
          <div className="guidance-mark">
            <img src="/assets/dogs-accent.png" alt="" />
          </div>

          <div className="guidance-controls">
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
        </section>
      </div>
    </>
  )
}
