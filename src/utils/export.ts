import JSZip from 'jszip'
import type { ExportRow, PhotoItem } from '../types/photo'
import { GROUP_SIZE } from './photos'

export function buildExportRows(photos: readonly PhotoItem[]): ExportRow[] {
  return photos.map((photo, index) => ({
    position: index + 1,
    group: Math.floor(index / GROUP_SIZE) + 1,
    filename: photo.file.name,
  }))
}

function csvCell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function createOrderCsv(photos: readonly PhotoItem[]): string {
  const lines = ['Position,Group,Filename']
  for (const row of buildExportRows(photos)) {
    lines.push([row.position, row.group, row.filename].map(csvCell).join(','))
  }
  return lines.join('\n')
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function downloadOrderCsv(photos: readonly PhotoItem[]): void {
  downloadBlob(new Blob([createOrderCsv(photos)], { type: 'text/csv;charset=utf-8' }), 'dump-truck-order.csv')
}

export function copyOrderText(photos: readonly PhotoItem[]): Promise<void> {
  return navigator.clipboard.writeText(photos.map((photo) => photo.file.name).join('\n'))
}

function safeFilename(filename: string): string {
  return filename.replace(/[\\/:*?"<>|]/g, '_')
}

export async function downloadRenamedZip(
  photos: readonly PhotoItem[],
  onProgress?: (percent: number) => void,
): Promise<void> {
  const zip = new JSZip()
  const width = Math.max(3, String(photos.length).length)

  photos.forEach((photo, index) => {
    const prefix = String(index + 1).padStart(width, '0')
    zip.file(`${prefix}_${safeFilename(photo.file.name)}`, photo.file)
  })

  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'STORE' },
    (metadata) => onProgress?.(Math.round(metadata.percent)),
  )
  downloadBlob(blob, 'dump-truck-renamed.zip')
}
