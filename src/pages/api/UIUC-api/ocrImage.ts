/**
 * OCR API route: Accepts an uploaded image reference, runs OCR via OpenRouter (Gemini 2.5 Flash),
 * uploads the resulting HTML to S3/R2, and enqueues the AgAnswers ingest workflow.
 *
 * POST body:
 * {
 *   courseName: string,                // required
 *   s3Key?: string,                    // e.g. "courses/<course>/<uuid>.jpg" (preferred)
 *   imageUrl?: string,                 // optional: any accessible URL to the image (presigned okay)
 *   imageBase64?: string,              // optional: raw base64 or data-url string
 *   originalFilename?: string,         // optional: original user-facing filename (used for "readable_filename")
 *   model?: string                     // optional: override OCR model (default: google/gemini-2.5-flash)
 * }
 *
 * Response (200):
 * {
 *   success: true,
 *   htmlS3Path: "courses/<course>/<uuid>.html",
 *   readableFilename: "DigiDocs - <original>.html",
 *   beamTaskId?: string
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const OCR_LOG_PATH =
  process.env.OCR_LOG_PATH ||
  '/home/ubuntu/dev/frontend/src/pages/api/UIUC-api/ocr-log.txt'
function logOCR(message: string, meta?: any) {
  const ts = new Date().toISOString()
  const metaStr = (() => {
    try {
      return meta ? ' ' + JSON.stringify(meta) : ''
    } catch {
      return ' [meta_unserializable]'
    }
  })()
  const line = `[${ts}] ${message}${metaStr}`
  try {
    const dir = path.dirname(OCR_LOG_PATH)
    try {
      fs.mkdirSync(dir, { recursive: true })
    } catch {}
    fs.appendFileSync(OCR_LOG_PATH, line + '\n', {
      encoding: 'utf-8',
      flag: 'a',
    })
  } catch (e) {
    console.error('OCR log write failed:', e, { path: OCR_LOG_PATH, line })
  }
}

function createSupabaseAdminClient() {
  const supaUrl =
    process.env.AGANSWERS_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const supaKey =
    process.env.AGANSWERS_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.AGANSWERS_SUPABASE_API_KEY ||
    process.env.SUPABASE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_API_KEY ||
    ''
  if (!supaUrl || !supaKey) {
    return null
  }
  return createClient(supaUrl, supaKey)
}

type OCRRequest = {
  courseName: string
  s3Key?: string
  imageUrl?: string
  imageBase64?: string
  originalFilename?: string
  model?: string
}

type OCRResponse =
  | {
      success: true
      htmlS3Path: string
      readableFilename: string
      beamTaskId?: string
      requestId?: string
    }
  | {
      success: false
      error: string
      details?: string
      requestId?: string
    }

const PROMPT = `Convert this image of a document into a polished, accurate, and faithful HTML representation of the document.

Return ONLY the HTML document. Do not include markdown code fences.`

function getEnvOrThrow(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return v
}

function guessImageMimeFromKey(key?: string): string {
  const lower = (key || '').toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.tif') || lower.endsWith('.tiff')) return 'image/tiff'
  return 'image/jpeg'
}

async function streamToBuffer(body: any): Promise<Buffer> {
  // AWS SDK v3 Node 18+ has transformToByteArray
  if (body?.transformToByteArray) {
    const bytes = await body.transformToByteArray()
    return Buffer.from(bytes)
  }
  // Fallback: manual stream read
  const chunks: Buffer[] = []
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

function stripCodeFencesIfPresent(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('```')) {
    // Remove leading fence and trailing fence lines
    const lines = trimmed.split('\n')
    // drop first and last fence
    if (lines.length >= 2) {
      const lastLine = lines[lines.length - 1] ?? ''
      const hasTrailingFence = lastLine.startsWith('```')
      return lines.slice(1, hasTrailingFence ? -1 : undefined).join('\n')
    }
  }
  return text
}

function toDataUrl(mime: string, b64: string): string {
  // If already a data URL, return as-is
  if (b64.startsWith('data:')) return b64
  return `data:${mime};base64,${b64}`
}

async function fetchImageBytesFromS3Key(
  s3Client: S3Client,
  bucket: string,
  key: string,
): Promise<Buffer> {
  const obj = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  )
  const body = (obj as any)?.Body
  if (!body) {
    throw new Error('S3 GetObject returned empty Body')
  }
  return streamToBuffer(body)
}

async function fetchImageBytesFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  const arr = await res.arrayBuffer()
  return Buffer.from(arr)
}

function slugifyFilename(base: string): string {
  const fallback = 'document'
  if (!base) return fallback
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return slug || fallback
}

async function uploadHtmlToS3(
  s3Client: S3Client,
  bucket: string,
  courseName: string,
  html: string,
  slugBase?: string,
): Promise<{ s3Path: string; key: string }> {
  const safeSuffix = slugBase ? `-${slugBase}` : ''
  const uniqueFileName = `${uuidv4()}${safeSuffix}.html`
  const key = `courses/${courseName}/${uniqueFileName}`
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(html, 'utf-8'),
      ContentType: 'text/html; charset=utf-8',
      CacheControl: 'no-cache',
    }),
  )
  return { s3Path: key, key }
}

async function enqueueIngest(
  s3Path: string,
  courseName: string,
  readableFilename: string,
  requestId?: string,
): Promise<{ task_id?: string }> {
  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'https://backend.aganswers.ai'

  logOCR('Submitting OCR output to backend ingest', {
    requestId,
    backendUrl,
    s3Path,
  })

  let supabase: ReturnType<typeof createSupabaseAdminClient> | null = null
  try {
    supabase = createSupabaseAdminClient()
    if (supabase) {
      await supabase.from('documents_in_progress').insert({
        s3_path: s3Path,
        course_name: courseName,
        readable_filename: readableFilename,
        beam_task_id: null,
      })
    }
  } catch (e) {
    console.error('Supabase insert to documents_in_progress failed:', e)
  }

  const response = await fetch(`${backendUrl}/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      course_name: courseName,
      readable_filename: readableFilename,
      s3_path: s3Path,
    }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok || body?.success === false) {
    const snippet = body?.error || response.statusText
    logOCR('Backend ingest failed', {
      requestId,
      status: response.status,
      error: snippet,
    })
    throw new Error(
      body?.error || `Backend ingest failed (${response.status} ${snippet})`,
    )
  }

  try {
    if (supabase) {
      await supabase
        .from('documents_in_progress')
        .delete()
        .eq('course_name', courseName)
        .eq('s3_path', s3Path)
    }
  } catch (e) {
    console.error('Supabase cleanup of documents_in_progress failed:', e)
  }

  return { task_id: body?.metadata?.vertex_document_id || null }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OCRResponse | string>,
) {
  if (req.method !== 'POST') {
    logOCR('Request rejected: method not allowed (expected POST)')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const requestId = uuidv4()
  logOCR('OCR request start', { requestId, method: req.method, url: req.url })

  try {
    const {
      courseName,
      s3Key,
      imageUrl,
      imageBase64,
      originalFilename,
      model: modelOverride,
    } = req.body as OCRRequest
    // requestId already initialized above
    logOCR(
      `Request body parsed: courseName="${courseName}", s3Key="${
        s3Key ? '[present]' : ''
      }", imageUrl="${imageUrl ? '[present]' : ''}", imageBase64="${
        imageBase64 ? '[present]' : ''
      }" [requestId=${requestId}]`,
    )
    logOCR('OCR request body parsed', {
      requestId,
      courseName,
      hasS3Key: !!s3Key,
      hasImageUrl: !!imageUrl,
      hasImageBase64: !!imageBase64,
      originalFilename,
      model: modelOverride,
    })

    if (!courseName) {
      logOCR('Bad request: missing courseName', { requestId })
      return res.status(400).json({
        success: false,
        error: 'Missing required field: courseName',
        requestId,
      })
    }

    // Validate env (prefer AgAnswers bucket name if provided to match Beam worker)
    const AGANSWERS_BUCKET = process.env.AGANSWERS_S3_BUCKET_NAME || ''
    const S3_BUCKET_FALLBACK = process.env.S3_BUCKET_NAME || ''
    const S3_BUCKET_NAME = AGANSWERS_BUCKET || S3_BUCKET_FALLBACK
    if (!S3_BUCKET_NAME) {
      throw new Error(
        'Missing required env var: AGANSWERS_S3_BUCKET_NAME or S3_BUCKET_NAME',
      )
    }
    const CLOUDFLARE_R2_ENDPOINT = getEnvOrThrow('CLOUDFLARE_R2_ENDPOINT')
    const AWS_KEY = getEnvOrThrow('AWS_KEY')
    const AWS_SECRET = getEnvOrThrow('AWS_SECRET')

    // 1) Try API key from request headers/body
    const authHeader = ((req.headers?.authorization as string) || '').trim()
    let headerBearerKey = ''
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      headerBearerKey = authHeader.slice(7).trim()
    }
    const headerDirectKey = ((req.headers['x-openrouter-key'] as string) ||
      (req.headers['openrouter-api-key'] as string) ||
      (req.headers['x-api-key'] as string) ||
      (req.headers['x-openai-key'] as string) ||
      '') as string
    const bodyKey =
      (req.body?.openrouterApiKey as string) ||
      (req.body?.apiKey as string) ||
      (req.body?.key as string) ||
      ''

    // 2) Fallback to environment variables (several possible names)
    const ENV_OPENROUTER_KEY_SOURCE = process.env.OPENROUTER_API_KEY
      ? 'OPENROUTER_API_KEY'
      : process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
      ? 'NEXT_PUBLIC_OPENROUTER_API_KEY'
      : process.env.OPENROUTER_KEY
      ? 'OPENROUTER_KEY'
      : process.env.OPENAI_API_KEY
      ? 'OPENAI_API_KEY'
      : null
    const envKey = ENV_OPENROUTER_KEY_SOURCE
      ? (process.env[ENV_OPENROUTER_KEY_SOURCE] as string)
      : ''

    // 3) Final selection + last-resort hardcoded backup at user request
    let OPENROUTER_API_KEY =
      headerBearerKey || headerDirectKey || bodyKey || envKey || ''
    let keySource = ''
    if (headerBearerKey) keySource = 'authorization-bearer'
    else if (headerDirectKey) keySource = 'header-direct'
    else if (bodyKey) keySource = 'body'
    else if (envKey) keySource = ENV_OPENROUTER_KEY_SOURCE || 'env'

    const fallbackEnvKey =
      (process.env.OPENROUTER_FALLBACK_API_KEY as string | undefined)?.trim() ||
      ''

    if (!OPENROUTER_API_KEY && fallbackEnvKey) {
      OPENROUTER_API_KEY = fallbackEnvKey
      keySource = 'fallback-env'
    }

    logOCR(
      `Env check: S3_BUCKET_NAME=${!!S3_BUCKET_NAME}, CLOUDFLARE_R2_ENDPOINT=${!!CLOUDFLARE_R2_ENDPOINT}, AWS_KEY=${!!AWS_KEY}, AWS_SECRET=${!!AWS_SECRET}, OPENROUTER_API_KEY=${!!OPENROUTER_API_KEY} (from ${keySource}), FALLBACK_KEY_PROVIDED=${!!fallbackEnvKey}, BACKEND_URL=${!!(process.env
        .BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL)}, SUPABASE_URL=${!!process
        .env.SUPABASE_URL}, SUPABASE_SECRET=${!!process.env.SUPABASE_SECRET}`,
    )
    logOCR('OCR env validated', {
      requestId,
      bucket: !!S3_BUCKET_NAME,
      r2Endpoint: !!CLOUDFLARE_R2_ENDPOINT,
    })

    const s3Client = new S3Client({
      region: 'auto',
      credentials: { accessKeyId: AWS_KEY, secretAccessKey: AWS_SECRET },
      endpoint: CLOUDFLARE_R2_ENDPOINT,
      forcePathStyle: true,
    })

    // 1) Load image bytes
    let imageBytes: Buffer | null = null
    let imageMime = guessImageMimeFromKey(s3Key || imageUrl || '')
    if (s3Key) {
      logOCR(`Image source: S3 key "${s3Key}"`)
      imageBytes = await fetchImageBytesFromS3Key(
        s3Client,
        S3_BUCKET_NAME,
        s3Key,
      )
      imageMime = guessImageMimeFromKey(s3Key)
    } else if (imageUrl) {
      logOCR(`Image source: URL "${imageUrl}"`)
      imageBytes = await fetchImageBytesFromUrl(imageUrl)
      imageMime = guessImageMimeFromKey(imageUrl)
    } else if (imageBase64) {
      logOCR(`Image source: base64 payload (${imageBase64.length} chars)`)
      const base64Str = imageBase64.startsWith('data:')
        ? imageBase64.split(',')[1] || ''
        : imageBase64
      imageBytes = Buffer.from(base64Str, 'base64')
      // keep default mime or guess from original filename
      imageMime = imageBase64.startsWith('data:')
        ? imageBase64.substring(
            imageBase64.indexOf(':') + 1,
            imageBase64.indexOf(';'),
          )
        : imageMime
    } else {
      logOCR('Bad request: no image source provided', { requestId })
      return res.status(400).json({
        success: false,
        error: 'Provide one of: s3Key, imageUrl, or imageBase64',
        requestId,
      })
    }

    if (!imageBytes || imageBytes.length === 0) {
      logOCR('Bad request: empty image bytes', { requestId })
      return res
        .status(400)
        .json({ success: false, error: 'Image bytes are empty', requestId })
    }

    // 2) Run OCR with OpenRouter (Gemini-2.5-Flash)
    logOCR('OCR image ready', {
      requestId,
      imageMime,
      imageBytesLength: imageBytes.length,
    })
    const client = new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    })

    const b64 = imageBytes.toString('base64')
    const dataUrl = toDataUrl(imageMime, b64)

    const model = modelOverride || 'google/gemini-2.5-flash'
    logOCR(
      `OCR model selected: "${model}"${modelOverride ? ' (override)' : ''}`,
    )
    const ocrResp = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } as any },
          ] as any,
        },
      ],
      temperature: 0.2,
    })

    const _choices = ocrResp?.choices?.length ?? 0
    logOCR('OCR model responded', { requestId, choices: _choices })
    let html = ocrResp.choices?.[0]?.message?.content || ''
    logOCR(
      `OpenRouter response received: contentLength=${html ? html.length : 0}`,
    )
    if (!html) {
      logOCR('Model returned empty content', { requestId })
      return res.status(502).json({
        success: false,
        error: 'OCR returned empty content',
        requestId,
      })
    }
    html = stripCodeFencesIfPresent(html).trim()

    const baseNameFromOriginal =
      (originalFilename || s3Key || 'document')
        .split('/')
        .pop()
        ?.split('.')
        .slice(0, -1)
        .join('.') || 'document'
    const htmlSlug = slugifyFilename(baseNameFromOriginal)

    // 3) Upload HTML to S3 (ensure bucket matches Beam worker expectations)
    const { s3Path } = await uploadHtmlToS3(
      s3Client,
      S3_BUCKET_NAME,
      courseName,
      html,
      htmlSlug,
    )
    logOCR('HTML uploaded to S3', {
      requestId,
      s3Path,
      slug: htmlSlug,
      originalFilename,
      bucketUsed: S3_BUCKET_NAME,
    })

    // 4) Enqueue ingest (Beam) with a readable filename
    const readableFilename = `DigiDocs - ${baseNameFromOriginal}.html`
    logOCR('Readable filename generated', {
      requestId,
      readableFilename,
    })

    const { task_id } = await enqueueIngest(
      s3Path,
      courseName,
      readableFilename,
    )

    logOCR('OCR request success', {
      requestId,
      htmlS3Path: s3Path,
      readableFilename,
      beamTaskId: task_id,
    })
    logOCR(`Beam ingest enqueued: task_id="${task_id ?? ''}"`)
    logOCR('OCR pipeline completed successfully')
    return res.status(200).json({
      success: true,
      htmlS3Path: s3Path,
      readableFilename,
      beamTaskId: task_id,
      requestId,
    })
  } catch (error: any) {
    const stack = error?.stack || String(error)
    logOCR('ERROR in OCR pipeline')
    logOCR(`Error message: ${error?.message || String(error)}`)
    logOCR(`Stack: ${stack}`)
    const errMsg = error?.message || String(error)
    const errStack = error?.stack || null
    logOCR('OCR pipeline error', { requestId, error: errMsg, stack: errStack })
    console.error('OCR pipeline error:', error)
    try {
      logOCR('Responding with 500: Internal server error during OCR pipeline')
      return res.status(500).json({
        success: false,
        error: 'Internal server error during OCR pipeline',
        details: errMsg,
        requestId,
      })
    } catch {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res
        .status(500)
        .send(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>OCR Error</title></head><body><h1>Internal server error during OCR pipeline</h1><p>${errMsg}</p><p><strong>requestId:</strong> ${requestId}</p></body></html>`,
        )
    }
  }
}
