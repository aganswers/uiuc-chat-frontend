import { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'

type IngestionRecord = {
  drive_item_id: string
  readable_filename: string
  status: 'queued' | 'succeeded' | 'failed'
  error_message?: string
  created_at: string
  ingested_at?: string
}

type IngestionStatusResponse = {
  success?: boolean
  ingestions?: IngestionRecord[]
  error?: string
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<IngestionStatusResponse>
) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get user from Clerk
    const { userId } = getAuth(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { course_name } = req.query
    if (!course_name || typeof course_name !== 'string') {
      return res.status(400).json({ error: 'course_name is required' })
    }

    // Call backend
    const backendUrl = process.env.BACKEND_URL || 'https://backend.aganswers.ai'
    const params = new URLSearchParams({
      course_name,
    })
    
    const response = await fetch(`${backendUrl}/integrations/google/ingestion-status?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userId,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Backend error' })
    }

    return res.status(200).json(data)

  } catch (error) {
    console.error('Google Drive ingestion status error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
