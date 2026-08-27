import { useRef, useState } from 'react'
import { LockKeyhole, Upload } from 'lucide-react'
import type { UploadReport } from '../types/photo'

const QUICK_OPTIONS = ['Less than 20', '20 Photos', '40 Photos', '60 Photos', '80 Photos', 'Custom'] as const

interface UploadZoneProps {
  onFiles: (files: FileList | File[], mediaHint?: 'image' | 'video') => UploadReport
  onReport: (report: UploadReport) => void
}

export function UploadZone({ onFiles, onReport }: UploadZoneProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [quickOption, setQuickOption] = useState(() => localStorage.getItem('dumpTruck.quickOption') ?? 'Custom')

  const receiveFiles = (files: FileList | File[], mediaHint?: 'image' | 'video') => {
    onReport(onFiles(files, mediaHint))
    if (photoInputRef.current) photoInputRef.current.value = ''
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  const selectQuickOption = (option: string) => {
    setQuickOption(option)
    localStorage.setItem('dumpTruck.quickOption', option)
  }

  return (
    <main className="start-screen">
      <div className="start-logo-lockup">
        <img
          className="start-logo"
          src="/assets/logo.png"
          alt="Dump Truck Dumping Services"
        />
      </div>

      <div
        className={`upload-zone ${dragging ? 'is-dragging' : ''}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          receiveFiles(event.dataTransfer.files)
        }}
      >
        <div className="upload-seal"><Upload size={29} strokeWidth={1.6} /></div>
        <h2>Upload Photos &amp; Videos</h2>
        <p>Drag and drop your pictures and video clips here</p>
        <span className="upload-or">or</span>
        <div className="browse-media-actions">
          <button className="button primary browse-button" type="button" onClick={() => photoInputRef.current?.click()}>
            Choose Photos
          </button>
          <button className="button secondary browse-button" type="button" onClick={() => videoInputRef.current?.click()}>
            Choose Videos
          </button>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          hidden
          multiple
          accept="image/*"
          onChange={(event) => event.target.files && receiveFiles(event.target.files, 'image')}
        />
        <input
          ref={videoInputRef}
          type="file"
          hidden
          multiple
          accept="video/*"
          onChange={(event) => event.target.files && receiveFiles(event.target.files, 'video')}
        />
        <p className="upload-formats">JPG, PNG, WEBP, HEIC, MP4, MOV, M4V, WEBM, and browser-supported media</p>
      </div>

      <section className="quick-section" aria-labelledby="quick-heading">
        <div className="section-rule"><span /></div>
        <h2 id="quick-heading">Collection size</h2>
        <p>Choose an estimate if helpful. Your actual upload always determines the groups.</p>
        <div className="quick-options">
          {QUICK_OPTIONS.map((option) => (
            <button
              key={option}
              className={quickOption === option ? 'is-active' : ''}
              type="button"
              aria-pressed={quickOption === option}
              onClick={() => selectQuickOption(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <footer className="start-footer">
        <div className="privacy-note"><LockKeyhole size={15} /> Your photos and videos stay on this device.</div>
        <img className="start-footer-dogs" src="/assets/dogs-accent.png" alt="" />
      </footer>
    </main>
  )
}
