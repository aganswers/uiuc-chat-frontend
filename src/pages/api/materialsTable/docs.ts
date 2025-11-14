// src/pages/api/materialsTable/docs.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { getAuth } from '@clerk/nextjs/server'
import fs from 'fs'
import path from 'path'

const OCR_LOG_PATH =
  process.env.OCR_LOG_PATH ||
  '/home/ubuntu/dev/frontend/src/pages/api/UIUC-api/ocr-log.txt'
const DOCUMENTS_TABLE =
  process.env.REFACTORED_MATERIALS_SUPABASE_TABLE || 'documents'

function logIndexingEvent(message: string, meta?: any) {
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
    fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(OCR_LOG_PATH, line + '\n', {
      encoding: 'utf-8',
      flag: 'a',
    })
  } catch (error) {
    console.error('Indexing log write failed:', error)
  }
}

type DocsInProgressResponse = {
  documents?: {
    readable_filename: string
    base_url?: string | null
    url?: string | null
    s3_path?: string | null
    created_at?: string | null
  }[]
  apiKey?: null
  error?: string
}

export default async function docsInProgress(
  req: NextApiRequest,
  res: NextApiResponse<DocsInProgressResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const course_name = req.query.course_name as string
  logIndexingEvent('Docs fetch start', { course_name, table: DOCUMENTS_TABLE })

  const auth = getAuth(req)
  const currUserId = auth.userId
  if (!currUserId) {
    return res.status(401).json({ error: 'User ID is required' })
  }
  try {
    const { data, error } = await supabase
      .from(DOCUMENTS_TABLE)
      .select('readable_filename, base_url, url, s3_path, created_at')
      .eq('course_name', course_name)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    logIndexingEvent('Docs fetch success', {
      course_name,
      documents: data?.length || 0,
      table: DOCUMENTS_TABLE,
    })
    if (!data || data.length === 0) {
      return res.status(200).json({ documents: [] })
    }

    if (data && data.length > 0) {
      return res.status(200).json({ documents: data })
    }
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    logIndexingEvent('Docs fetch error', {
      course_name,
      error: (error as Error)?.message || String(error),
      table: DOCUMENTS_TABLE,
    })
    return res.status(500).json({
      error: (error as Error).message,
    })
  }
}
