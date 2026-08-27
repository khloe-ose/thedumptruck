export interface PhotoItem {
  id: string
  file: File
  previewUrl: string
  originalIndex: number
  mediaType: 'image' | 'video'
}

export interface OrganizerState {
  photos: PhotoItem[]
  lockedFirstIds: Array<string | undefined>
  shuffleCount: number
  groupShuffleCounts: number[]
}

export interface UploadReport {
  added: number
  rejected: string[]
  duplicateNames: string[]
}

export interface ExportRow {
  position: number
  group: number
  filename: string
}
