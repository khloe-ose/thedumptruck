import { useEffect, useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { ShieldCheck } from 'lucide-react'
import { ActionBar } from './components/ActionBar'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ExportDialog } from './components/ExportDialog'
import { Header } from './components/Header'
import { DragPreviewCard } from './components/PhotoCard'
import { PhotoGroup } from './components/PhotoGroup'
import { PhotoLightbox } from './components/PhotoLightbox'
import { PhotoSlideshow } from './components/PhotoSlideshow'
import { UploadZone } from './components/UploadZone'
import { usePhotoOrganizer } from './hooks/usePhotoOrganizer'
import type { UploadReport } from './types/photo'
import { chunkPhotos } from './utils/photos'

type Confirmation =
  | { kind: 'reset' }
  | { kind: 'remove'; photoId: string; filename: string }
  | null

function App() {
  const organizer = usePhotoOrganizer()
  const [hasEntered, setHasEntered] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  const [slideshowGroupIndex, setSlideshowGroupIndex] = useState<number | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const groups = useMemo(() => chunkPhotos(organizer.photos), [organizer.photos])
  const selectedContext = selectedId ? organizer.getPhotoContext(selectedId) : undefined
  const activeContext = activeId ? organizer.getPhotoContext(activeId) : undefined
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (selectedId && !organizer.photos.some((photo) => photo.id === selectedId)) setSelectedId(null)
    if (lightboxId && !organizer.photos.some((photo) => photo.id === lightboxId)) setLightboxId(null)
  }, [lightboxId, organizer.photos, selectedId])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(null), 4_500)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const handleReport = (report: UploadReport) => {
    const details: string[] = []
    if (report.added) details.push(`${report.added} ${report.added === 1 ? 'item' : 'items'} added`)
    if (report.rejected.length) details.push(`${report.rejected.length} unsupported ${report.rejected.length === 1 ? 'file' : 'files'} skipped`)
    if (report.duplicateNames.length) details.push(`${report.duplicateNames.length} duplicate ${report.duplicateNames.length === 1 ? 'name' : 'names'} kept safely`)
    setNotice(details.join(' · ') || 'No supported photos were found.')
  }

  const requestRemove = (photoId: string) => {
    const context = organizer.getPhotoContext(photoId)
    if (!context) return
    if (context.isLocked) {
      setConfirmation({ kind: 'remove', photoId, filename: context.photo.file.name })
    } else {
      organizer.removePhoto(photoId)
      if (selectedId === photoId) setSelectedId(null)
      if (lightboxId === photoId) setLightboxId(null)
      setNotice('Item removed. Undo is available.')
    }
  }

  const confirmAction = () => {
    if (confirmation?.kind === 'reset') {
      organizer.resetOrder()
      setSelectedId(null)
      setNotice('Original upload order restored. First-photo locks were cleared.')
    }
    if (confirmation?.kind === 'remove') {
      organizer.removePhoto(confirmation.photoId)
      if (selectedId === confirmation.photoId) setSelectedId(null)
      if (lightboxId === confirmation.photoId) setLightboxId(null)
      setNotice('Locked first item removed. The group is ready for a new first item.')
    }
    setConfirmation(null)
  }

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id))
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const moved = organizer.reorder(String(active.id), String(over.id))
    if (!moved) setNotice('That first position is locked. Unlock it before dropping a photo there.')
  }

  if (organizer.photos.length === 0 && !hasEntered) {
    return (
      <main className="splash-screen">
        <img className="splash-logo" src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="Dump Truck Dumping Services" />
        <button className="button primary splash-button" type="button" onClick={() => setHasEntered(true)}>
          wna take a dump? 💩
        </button>
      </main>
    )
  }

  if (organizer.photos.length === 0) {
    return (
      <div className="empty-app-shell">
        <UploadZone onFiles={organizer.addFiles} onReport={handleReport} />
        {notice && <div className="toast" role="status">{notice}</div>}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Header
          photoCount={organizer.photos.length}
        groupCount={groups.length}
        lockedCount={organizer.lockedCount}
        shuffleCount={organizer.shuffleCount}
        canUndo={organizer.canUndo}
        onFiles={organizer.addFiles}
        onReport={handleReport}
        onUndo={() => {
          organizer.undo()
          setSelectedId(null)
          setNotice('Previous arrangement restored.')
        }}
        onReset={() => setConfirmation({ kind: 'reset' })}
        onShuffleAll={() => {
          organizer.shuffleAll()
          setNotice(`Shuffle #${organizer.shuffleCount + 1}: unlocked photos mixed across every group.`)
        }}
        onExport={() => setExportOpen(true)}
      />

      <main className="workspace">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="groups-rail" aria-label={`${groups.length} photo groups`}>
            {groups.map((group, groupIndex) => (
              <PhotoGroup
                key={groupIndex}
                photos={group}
                groupIndex={groupIndex}
                lockedFirstId={organizer.lockedFirstIds[groupIndex]}
                shuffleCount={organizer.groupShuffleCounts[groupIndex] ?? 0}
                selectedId={selectedId}
                animate={organizer.motion.scope === 'all' || organizer.motion.scope === groupIndex}
                motionNonce={organizer.motion.nonce}
                onSelect={setSelectedId}
                onPreview={setLightboxId}
                onRemove={requestRemove}
                onUnlock={organizer.unlockFirst}
                onPlay={setSlideshowGroupIndex}
                onShuffle={(index) => {
                  organizer.shuffleGroup(index)
                  setNotice(`Group ${index + 1} shuffled. Other groups were left unchanged.`)
                }}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 220, easing: 'ease-out' }}>
            {activeContext ? <DragPreviewCard photo={activeContext.photo} position={(activeContext.index % 20) + 1} /> : null}
          </DragOverlay>
        </DndContext>

        <footer className="session-footer">
          <div className="session-footer-copy">
            <span><ShieldCheck size={16} /> Your photos and videos stay on this device and are never uploaded.</span>
            <span>Closing or refreshing this tab clears the photo session.</span>
          </div>
          <div className="session-footer-accent" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}assets/small-accents.png`} alt="" />
          </div>
        </footer>
      </main>

      {selectedContext && (
        <ActionBar
          photo={selectedContext.photo}
          positionIndex={selectedContext.index % 20}
          groupIndex={selectedContext.groupIndex}
          isLocked={selectedContext.isLocked}
          onSetFirst={() => {
            organizer.setAsFirst(selectedContext.photo.id)
            setNotice(`Set as the locked first photo for Group ${selectedContext.groupIndex + 1}.`)
          }}
          onUnlock={() => organizer.unlockFirst(selectedContext.groupIndex)}
          onPreview={() => setLightboxId(selectedContext.photo.id)}
          onRemove={() => requestRemove(selectedContext.photo.id)}
          onClose={() => setSelectedId(null)}
        />
      )}

      <PhotoLightbox
        photos={organizer.photos}
        photoId={lightboxId}
        lockedFirstIds={organizer.lockedFirstIds}
        onClose={() => setLightboxId(null)}
        onNavigate={setLightboxId}
        onSetFirst={(photoId) => {
          organizer.setAsFirst(photoId)
          setSelectedId(photoId)
          const context = organizer.getPhotoContext(photoId)
          if (context) setNotice(`Set as the locked first photo for Group ${context.groupIndex + 1}.`)
        }}
        onUnlock={organizer.unlockFirst}
      />

      {slideshowGroupIndex !== null && (
        <PhotoSlideshow
          photos={groups[slideshowGroupIndex] ?? []}
          dumpIndex={slideshowGroupIndex}
          onClose={() => setSlideshowGroupIndex(null)}
        />
      )}

      <ExportDialog open={exportOpen} photos={organizer.photos} onClose={() => setExportOpen(false)} />
      <ConfirmDialog
        open={confirmation !== null}
        title={confirmation?.kind === 'reset' ? 'Reset to original order?' : 'Remove the locked first item?'}
        message={confirmation?.kind === 'reset'
          ? 'This restores the upload sequence and clears all first-photo locks. You can undo the reset afterward.'
          : `“${confirmation?.kind === 'remove' ? confirmation.filename : ''}” is the locked first photo for its group. Removing it will leave that group unlocked.`}
        confirmLabel={confirmation?.kind === 'reset' ? 'Reset Order' : 'Remove Item'}
        danger={confirmation?.kind === 'remove'}
        onConfirm={confirmAction}
        onCancel={() => setConfirmation(null)}
      />

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

export default App
