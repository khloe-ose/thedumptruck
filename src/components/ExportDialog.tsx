import { useEffect, useRef, useState } from 'react'
import { Check, ClipboardCopy, FileArchive, FileDown, X } from 'lucide-react'
import type { PhotoItem } from '../types/photo'
import { copyOrderText, downloadOrderCsv, downloadRenamedZip } from '../utils/export'

interface ExportDialogProps {
  open: boolean
  photos: PhotoItem[]
  onClose: () => void
}

export function ExportDialog({ open, photos, onClose }: ExportDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [copied, setCopied] = useState(false)
  const [zipProgress, setZipProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    setCopied(false)
    setError(null)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && zipProgress === null) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open, zipProgress])

  if (!open) return null

  const makeZip = async () => {
    try {
      setError(null)
      setZipProgress(0)
      await downloadRenamedZip(photos, setZipProgress)
    } catch {
      setError('The ZIP could not be created. Your original files were not changed.')
    } finally {
      setZipProgress(null)
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={zipProgress === null ? onClose : undefined}>
      <section className="dialog-panel export-panel" role="dialog" aria-modal="true" aria-labelledby="export-title" onMouseDown={(event) => event.stopPropagation()}>
        <button ref={closeRef} className="icon-button dialog-close" type="button" disabled={zipProgress !== null} onClick={onClose} aria-label="Close export dialog"><X size={19} /></button>
        <p className="eyebrow">Final order</p>
        <h2 id="export-title">Preserve your sequence</h2>
        <p className="dialog-copy">Exporting uses the exact order currently shown. Your original files are never renamed or changed.</p>

        <div className="export-options">
          <button type="button" onClick={() => downloadOrderCsv(photos)}>
            <span className="export-icon"><FileDown size={22} /></span>
            <span><b>Download Order List</b><em>CSV with position, group, and filename</em></span>
          </button>
          <button type="button" onClick={async () => {
            try {
              await copyOrderText(photos)
              setCopied(true)
              setError(null)
            } catch {
              setError('Clipboard access was unavailable. Try downloading the CSV instead.')
            }
          }}>
            <span className="export-icon">{copied ? <Check size={22} /> : <ClipboardCopy size={22} />}</span>
            <span><b>{copied ? 'Order Copied' : 'Copy Order'}</b><em>Filenames, one per line</em></span>
          </button>
          <button type="button" disabled={zipProgress !== null} onClick={makeZip}>
            <span className="export-icon"><FileArchive size={22} /></span>
            <span><b>{zipProgress === null ? 'Download Renamed Media' : `Preparing ZIP · ${zipProgress}%`}</b><em>ZIP named 001_filename, 002_filename…</em></span>
          </button>
        </div>
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <p className="zip-note">Large collections may take a moment and use additional browser memory.</p>
      </section>
    </div>
  )
}
