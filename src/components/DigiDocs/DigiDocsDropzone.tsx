import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dropzone } from '@mantine/dropzone'
import { v4 as uuidv4 } from 'uuid'
import {
  IconAlertCircle,
  IconCheck,
  IconCloudUpload,
  IconDownload,
  IconFileText,
  IconEye,
  IconLoader,
  IconRefresh,
  IconX,
} from '@tabler/icons-react'
import { clsx } from 'clsx'
import { Modal } from '@mantine/core'
import { fetchPresignedUrl } from '~/utils/apiUtils'

type UploadItemStatus =
  | 'queued'
  | 'uploading'
  | 'ocr'
  | 'ingesting'
  | 'complete'
  | 'error'

type UploadItem = {
  id: string
  file: File
  name: string
  status: UploadItemStatus
  error?: string
  s3Key?: string
  readableFilename?: string // Expected "DigiDocs - <name>.html"
  htmlS3Path?: string
}

type DigitizedDoc = {
  readable_filename: string | null
  s3_path?: string | null
  created_at?: string | null
  base_url?: string | null
  url?: string | null
}

const DIGIDOC_DISPLAY_LIMIT = 30

interface DigiDocsDropzoneProps {
  courseName: string
  disabled?: boolean
  className?: string
  onDone?: (results: {
    fileName: string
    htmlS3Path?: string
    error?: string
  }) => void
}

/**
 * DigiDocsDropzone
 * - Drag & drop images
 * - Upload original images to S3 (R2)
 * - Call OCR API to convert to HTML and enqueue ingest
 * - Poll ingest progress and update statuses
 */
export default function DigiDocsDropzone({
  courseName,
  disabled = false,
  className,
  onDone,
}: DigiDocsDropzoneProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [isBusy, setIsBusy] = useState(false)
  const [digitizedDocs, setDigitizedDocs] = useState<DigitizedDoc[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const prevHasActiveRef = useRef(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState<string>('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const hasActive = useMemo(
    () =>
      items.some(
        (i) =>
          i.status === 'uploading' ||
          i.status === 'ocr' ||
          i.status === 'ingesting',
      ),
    [items],
  )

  const docsForDisplay = useMemo(
    () => digitizedDocs.slice(0, DIGIDOC_DISPLAY_LIMIT),
    [digitizedDocs],
  )
  const hiddenDocsCount = Math.max(
    digitizedDocs.length - DIGIDOC_DISPLAY_LIMIT,
    0,
  )

  const refreshDigitizedDocs = useCallback(async () => {
    if (!courseName) return
    setDocsError(null)
    setDocsLoading(true)
    try {
      const res = await fetch(
        `/api/materialsTable/docs?course_name=${encodeURIComponent(
          courseName,
        )}`,
      )
      if (!res.ok) {
        throw new Error(`Failed to load documents (${res.status})`)
      }
      const json = await res.json()
      const docs = (json?.documents || []) as DigitizedDoc[]
      const filtered = docs
        .filter((doc) => {
          const readable = (doc.readable_filename || '').toLowerCase()
          return readable.startsWith('digidocs - ')
        })
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
          return bTime - aTime
        })
      setDigitizedDocs(filtered)
    } catch (err: any) {
      console.error('Failed to load digitized docs', err)
      setDocsError(err?.message || 'Failed to load digitized docs')
    } finally {
      setDocsLoading(false)
    }
  }, [courseName])

  useEffect(() => {
    // Start/stop polling depending on active items
    if (hasActive && !intervalRef.current) {
      intervalRef.current = setInterval(pollIngestStatus, 2000)
    }
    if (!hasActive && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActive, courseName])

  useEffect(() => {
    refreshDigitizedDocs()
  }, [refreshDigitizedDocs])

  useEffect(() => {
    if (prevHasActiveRef.current && !hasActive) {
      refreshDigitizedDocs()
    }
    prevHasActiveRef.current = hasActive
  }, [hasActive, refreshDigitizedDocs])

  async function pollIngestStatus() {
    try {
      // Poll both endpoints like LargeDropzone does
      const inProgRes = await fetch(
        `/api/materialsTable/docsInProgress?course_name=${encodeURIComponent(
          courseName,
        )}`,
      )
      const inProgData = await inProgRes.json()
      const docsRes = await fetch(
        `/api/materialsTable/docs?course_name=${encodeURIComponent(
          courseName,
        )}`,
      )
      const docsData = await docsRes.json()

      const inProgressNames = new Set<string>(
        (inProgData?.documents || []).map(
          (d: { readable_filename: string }) => d.readable_filename,
        ),
      )
      const completedNames = new Set<string>(
        (docsData?.documents || []).map(
          (d: { readable_filename: string }) => d.readable_filename,
        ),
      )
      let failedNames = new Set<string>()
      try {
        const failedRes = await fetch(
          `/api/materialsTable/fetchFailedDocuments?from=0&to=100&course_name=${encodeURIComponent(
            courseName,
          )}`,
        )
        const failedJson = await failedRes.json()
        failedNames = new Set<string>(
          (failedJson?.final_docs || []).map(
            (d: { readable_filename: string }) => d.readable_filename,
          ),
        )
      } catch (e) {
        console.debug('Failed-docs fetch issue:', e)
      }

      let needsLibraryRefresh = false
      setItems((prev) =>
        prev.map((item) => {
          if (!item.readableFilename) return item
          if (
            item.status === 'ingesting' ||
            item.status === 'ocr' ||
            item.status === 'uploading'
          ) {
            if (failedNames.has(item.readableFilename)) {
              // ingestion failed
              return { ...item, status: 'error' }
            }
            if (completedNames.has(item.readableFilename)) {
              // done!
              onDone?.({ fileName: item.name, htmlS3Path: item.htmlS3Path })
              needsLibraryRefresh = true
              return { ...item, status: 'complete' }
            }
            if (inProgressNames.has(item.readableFilename)) {
              // still ingesting
              return { ...item, status: 'ingesting' }
            }
            // If the in-progress row has disappeared but the documents table
            // hasn't reflected yet, mark as complete to avoid infinite loading.
            needsLibraryRefresh = true
            return { ...item, status: 'complete' }
          }
          return item
        }),
      )
      if (needsLibraryRefresh) {
        await refreshDigitizedDocs()
      }
    } catch (e) {
      // It's fine to fail silently; we just won't update statuses this tick.
      console.debug(
        'Polling error (safe to ignore while ingest progresses):',
        e,
      )
    }
  }

  async function handleDrop(files: File[]) {
    if (disabled) return
    if (!files.length) return
    setIsBusy(true)

    // Queue items
    const newItems: UploadItem[] = files.map((file) => ({
      id: uuidv4(),
      file,
      name: file.name,
      status: 'queued',
    }))
    setItems((prev) => [...prev, ...newItems])

    // Process sequentially or in parallel; we'll do parallel with Promise.all
    await Promise.all(
      newItems.map(async (item) => {
        try {
          // Upload image
          updateItem(item.id, { status: 'uploading' })
          const s3Key = await uploadImageToS3(
            fileWithExt(item.file),
            courseName,
          )
          if (!s3Key) {
            throw new Error('Upload failed: no S3 key returned')
          }
          updateItem(item.id, { s3Key })

          // Call OCR
          updateItem(item.id, { status: 'ocr' })
          const ocrResult = await ocrImage(courseName, s3Key, item.file.name)
          if (!ocrResult?.htmlS3Path || !ocrResult.readableFilename) {
            throw new Error('OCR failed: no HTML path returned')
          }

          // Store result and mark ingesting; Poller will flip to complete
          updateItem(item.id, {
            status: 'ingesting',
            htmlS3Path: ocrResult.htmlS3Path,
            readableFilename: ocrResult.readableFilename,
          })
          // Fallback timeout: if still ingesting after 90s, mark as complete
          setTimeout(() => {
            let markedComplete = false
            setItems((prev) =>
              prev.map((it) => {
                if (it.id === item.id && it.status === 'ingesting') {
                  markedComplete = true
                  return { ...it, status: 'complete' }
                }
                return it
              }),
            )
            if (markedComplete) {
              refreshDigitizedDocs()
            }
          }, 90_000)
        } catch (err: any) {
          console.error('DigiDocs pipeline error for', item.name, err)
          updateItem(item.id, {
            status: 'error',
            error: err?.message || String(err),
          })
          onDone?.({ fileName: item.name, error: err?.message || String(err) })
        }
      }),
    )

    setIsBusy(false)
  }

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    )
  }

  function fileWithExt(file: File): File {
    // Ensure file has proper type and extension (browser usually sets it correctly)
    return file
  }

  async function uploadImageToS3(
    file: File,
    courseName: string,
  ): Promise<string | undefined> {
    // Build a unique filename for S3 path
    const ext = file.name.includes('.')
      ? file.name.slice(file.name.lastIndexOf('.'))
      : '.jpg'
    const uniqueFileName = `${uuidv4()}${ext}`

    const requestObject = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uniqueFileName,
        fileType: file.type || 'image/jpeg',
        courseName,
      }),
    }

    interface PresignedPostResponse {
      post?: {
        url: string
        fields: { [key: string]: string }
      }
      url?: string
      method?: string
      filepath?: string
      message?: string
    }

    // Request signed upload info
    const res = await fetch('/api/UIUC-api/uploadToS3', requestObject)
    if (!res.ok) throw new Error(`UploadToS3 init failed (${res.status})`)
    const data = (await res.json()) as PresignedPostResponse

    // PUT (Cloudflare R2)
    if (data.method === 'PUT' && data.url && data.filepath) {
      const putRes = await fetch(data.url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!putRes.ok) throw new Error(`PUT upload failed (${putRes.status})`)
      return data.filepath
    }

    // POST (S3/MinIO)
    if (data.method === 'POST' && data.post) {
      const formData = new FormData()
      Object.entries(data.post.fields).forEach(([key, value]) =>
        formData.append(key, value),
      )
      formData.append('file', file)

      const postRes = await fetch(data.post.url, {
        method: 'POST',
        body: formData,
      })
      if (!postRes.ok) throw new Error(`POST upload failed (${postRes.status})`)
      // In POST flow, S3 key is inside the returned fields.key
      const s3Key = data.post.fields['key']
      return s3Key
    }

    throw new Error('Invalid uploadToS3 response format')
  }

  async function ocrImage(
    courseName: string,
    s3Key: string,
    originalFilename: string,
  ): Promise<{
    htmlS3Path: string
    readableFilename: string
    beamTaskId?: string
  } | null> {
    const res = await fetch('/api/UIUC-api/ocrImage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseName,
        s3Key,
        originalFilename,
      }),
    })

    const contentType = res.headers.get('content-type') || ''
    let json: any = null
    let rawText: string | null = null

    if (contentType.includes('application/json')) {
      try {
        json = await res.json()
      } catch (e) {
        // Malformed JSON response; fallback to text body
        try {
          rawText = await res.text()
        } catch {
          rawText = null
        }
      }
    } else {
      // Not JSON content-type; attempt JSON first, then fallback to text
      try {
        json = await res.json()
      } catch {
        try {
          rawText = await res.text()
        } catch {
          rawText = null
        }
      }
    }

    // Non-OK HTTP status
    if (!res.ok) {
      if (json) {
        const rid = json.requestId ? ` (requestId: ${json.requestId})` : ''
        throw new Error((json.error || 'OCR API failed') + rid)
      }
      const snippet = rawText ? rawText.slice(0, 180) : '(no body)'
      throw new Error(
        `OCR API failed with non-JSON response (status ${res.status}). Body: ${snippet}`,
      )
    }

    // OK status but unsuccessful payload
    if (!json || json.success !== true) {
      const rid = json?.requestId ? ` (requestId: ${json.requestId})` : ''
      const msg = json?.error || 'OCR API returned unsuccessful response'
      throw new Error(msg + rid)
    }

    // Validate expected fields
    if (!json.htmlS3Path || !json.readableFilename) {
      const rid = json.requestId ? ` (requestId: ${json.requestId})` : ''
      throw new Error(`OCR API response missing fields${rid}`)
    }

    return {
      htmlS3Path: json.htmlS3Path as string,
      readableFilename: json.readableFilename as string,
      beamTaskId: json.beamTaskId as string | undefined,
    }
  }

  async function openPreviewModal(
    s3Path?: string | null,
    title?: string | null,
  ) {
    if (!s3Path) {
      console.error('Missing S3 path for preview')
      return
    }
    setPreviewTitle(title || 'Digitized document')
    setPreviewOpen(true)
    setPreviewUrl(null)
    setPreviewError(null)
    setPreviewLoading(true)
    try {
      const url = await fetchPresignedUrl(s3Path, courseName)
      if (!url) {
        throw new Error('Failed to resolve presigned URL for preview')
      }
      setPreviewUrl(url)
    } catch (e: any) {
      console.error('Failed to open preview:', e)
      setPreviewError(e?.message || 'Unable to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  function closePreviewModal() {
    setPreviewOpen(false)
    setPreviewUrl(null)
    setPreviewError(null)
    setPreviewTitle('')
  }

  function renderStatusIcon(status: UploadItemStatus) {
    switch (status) {
      case 'uploading':
        return <IconCloudUpload size={16} className="text-orange-600" />
      case 'ocr':
        return <IconFileText size={16} className="text-blue-600" />
      case 'ingesting':
        return <IconLoader size={16} className="animate-spin text-indigo-600" />
      case 'complete':
        return <IconCheck size={16} className="text-green-600" />
      case 'error':
        return <IconAlertCircle size={16} className="text-red-600" />
      default:
        return <IconCloudUpload size={16} className="text-gray-400" />
    }
  }

  function renderStatusText(status: UploadItemStatus) {
    switch (status) {
      case 'queued':
        return 'Queued'
      case 'uploading':
        return 'Uploading image…'
      case 'ocr':
        return 'Running OCR…'
      case 'ingesting':
        return 'Indexing for search…'
      case 'complete':
        return 'Done'
      case 'error':
        return 'Error'
      default:
        return ''
    }
  }

  return (
    <div className={clsx('flex w-full flex-col gap-4', className)}>
      <Dropzone
        multiple
        accept={{
          'image/*': [
            '.png',
            '.jpg',
            '.jpeg',
            '.tif',
            '.tiff',
            '.webp',
            'image/png',
            'image/jpeg',
            'image/webp',
            'image/tiff',
          ],
        }}
        onDrop={handleDrop}
        disabled={disabled || isBusy}
        className={clsx(
          'group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-orange-300 bg-gradient-to-br from-white to-orange-50 transition-all duration-300 hover:scale-[1.01]',
          disabled ? 'opacity-60' : '',
        )}
        style={{ minHeight: 180 }}
      >
        <div className="pointer-events-none flex h-full flex-col items-center justify-center px-3 py-6">
          <div className="mb-2 flex items-center justify-center">
            <Dropzone.Accept>
              <IconDownload size={40} className="text-orange-600" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={40} className="text-red-500" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload size={40} className="text-orange-500" />
            </Dropzone.Idle>
          </div>

          <div className="text-center">
            <div className="text-base font-semibold text-gray-800">
              {disabled
                ? 'DigiDocs is disabled'
                : 'Upload farm documents (images)'}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Drag and drop images or click here. We’ll extract text, make it
              searchable, and usable in chat.
            </div>
            <div className="mt-1 text-[11px] text-gray-400">
              Supported: JPG, PNG, TIFF, WEBP. Each file becomes an HTML
              document after OCR.
            </div>
          </div>
        </div>
      </Dropzone>

      {/* Preview opens in a new tab now */}
      {items.length > 0 && (
        <div className="divide-y rounded-lg border border-gray-200">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                {renderStatusIcon(it.status)}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-800">
                    {it.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {renderStatusText(it.status)}
                  </div>
                  {it.error && (
                    <div className="text-xs text-red-600">{it.error}</div>
                  )}
                  {it.readableFilename && (
                    <div className="text-[11px] text-gray-400">
                      Output: {it.readableFilename}
                      {it.htmlS3Path && (
                        <button
                          type="button"
                          onClick={() =>
                            openPreviewModal(
                              it.htmlS3Path,
                              it.readableFilename || it.name,
                            )
                          }
                          className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-orange-600 transition hover:text-orange-700 focus:outline-none"
                          title="Open digitized preview"
                        >
                          <IconEye size={12} />
                          Preview
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                {it.status === 'complete' && (
                  <div className="text-xs font-medium text-green-700">
                    Ready to use
                  </div>
                )}
                {it.status === 'ingesting' && (
                  <div className="flex items-center gap-1 text-xs text-indigo-700">
                    <IconLoader size={14} className="animate-spin" />
                    Indexing…
                  </div>
                )}
                {it.status === 'ocr' && (
                  <div className="flex items-center gap-1 text-xs text-blue-700">
                    <IconLoader size={14} className="animate-spin" />
                    OCR…
                  </div>
                )}
                {it.status === 'uploading' && (
                  <div className="flex items-center gap-1 text-xs text-orange-700">
                    <IconLoader size={14} className="animate-spin" />
                    Uploading…
                  </div>
                )}
                {it.status === 'error' && (
                  <div className="flex items-center gap-1 text-xs text-red-700">
                    <IconAlertCircle size={14} />
                    Error
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Digitized HTML documents
            </h3>
            <p className="text-xs text-gray-500">
              Ready for search &amp; chat ({digitizedDocs.length})
            </p>
          </div>
          <button
            type="button"
            onClick={() => refreshDigitizedDocs()}
            disabled={docsLoading}
            className={clsx(
              'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none',
              docsLoading
                ? 'cursor-progress border-gray-200 text-gray-400'
                : 'border-orange-200 text-orange-700 hover:border-orange-300 hover:bg-orange-50',
            )}
          >
            <IconRefresh
              size={14}
              className={clsx(docsLoading ? 'animate-spin' : '', 'text-current')}
            />
            Refresh
          </button>
        </div>
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {docsLoading && (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-orange-200 bg-orange-50/50 px-3 py-2 text-sm text-orange-700">
              <IconLoader size={16} className="animate-spin" />
              Loading digitized documents…
            </div>
          )}

          {!docsLoading && docsError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {docsError}
            </div>
          )}

          {!docsLoading && !docsError && digitizedDocs.length === 0 && (
            <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
              No DigiDocs have been ingested yet. Upload images above to see the
              digitized HTML versions here.
            </div>
          )}

          {!docsLoading && !docsError && digitizedDocs.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {docsForDisplay.map((doc, idx) => {
                const relative = formatRelativeTime(doc.created_at)
                const absolute = formatAbsoluteDate(doc.created_at)
                return (
                  <li
                    key={`${doc.s3_path || doc.readable_filename || idx}`}
                    className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {doc.readable_filename ||
                          doc.s3_path ||
                          'Digitized document'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {relative || 'Ready'}
                        {absolute && (
                          <span className="ml-1 text-[11px] text-gray-400">
                            ({absolute})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={!doc.s3_path}
                        onClick={() =>
                          openPreviewModal(
                            doc.s3_path,
                            doc.readable_filename || undefined,
                          )
                        }
                        className={clsx(
                          'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none',
                          doc.s3_path
                            ? 'border-indigo-200 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50'
                            : 'cursor-not-allowed border-gray-200 text-gray-400',
                        )}
                      >
                        <IconEye size={14} />
                        Preview HTML
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {hiddenDocsCount > 0 && (
            <div className="pt-2 text-right text-[11px] text-gray-400">
              +{hiddenDocsCount} more DigiDocs available (searchable in the
              Search pane)
            </div>
          )}
        </div>
      </section>

      <Modal
        opened={previewOpen}
        onClose={closePreviewModal}
        title={previewTitle || 'Digitized preview'}
        size="xl"
        centered
        overlayProps={{ opacity: 0.3, blur: 2 }}
        radius="lg"
      >
        {previewLoading && (
          <div className="flex h-[60vh] items-center justify-center">
            <IconLoader
              size={24}
              className="animate-spin text-orange-600"
              stroke={1.5}
            />
          </div>
        )}

        {!previewLoading && previewError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {previewError}
          </div>
        )}

        {!previewLoading && !previewError && previewUrl && (
          <iframe
            src={previewUrl}
            sandbox=""
            className="h-[70vh] w-full rounded-lg border border-gray-200"
            title={previewTitle || 'Digitized preview'}
          />
        )}
      </Modal>
    </div>
  )
}

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diffMs < minute) return 'just now'
  if (diffMs < hour) return `${Math.round(diffMs / minute)}m ago`
  if (diffMs < day) return `${Math.round(diffMs / hour)}h ago`
  return `${Math.round(diffMs / day)}d ago`
}

function formatAbsoluteDate(dateString?: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}
