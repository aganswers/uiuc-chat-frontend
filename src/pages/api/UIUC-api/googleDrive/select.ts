import { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'

type DriveItem = {
  id: string
  name: string
  isFolder: boolean
  mimeType?: string
}

type SelectResponse = {
  success?: boolean
  count?: number
  error?: string
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<SelectResponse>
) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get user from Clerk
    const { userId } = getAuth(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { course_name, items } = req.body
    if (!course_name) {
      return res.status(400).json({ error: 'course_name is required' })
    }
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required' })
    }

    // Call backend
    const backendUrl = process.env.BACKEND_URL || 'https://backend.aganswers.ai'
    const response = await fetch(`${backendUrl}/integrations/google/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userId,
      },
      body: JSON.stringify({ course_name, items }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Backend error' })
    }

    return res.status(200).json(data)

  } catch (error) {
    console.error('Google Drive select error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
