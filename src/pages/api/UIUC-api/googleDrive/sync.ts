import { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'

type SyncResponse = {
  success?: boolean
  error?: string
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<SyncResponse>
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

    const { course_name } = req.body
    if (!course_name) {
      return res.status(400).json({ error: 'course_name is required' })
    }

    // Call backend
    const backendUrl = process.env.BACKEND_URL || 'https://backend.aganswers.ai'
    const response = await fetch(`${backendUrl}/integrations/google/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': userId,
      },
      body: JSON.stringify({ course_name }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Backend error' })
    }

    return res.status(200).json(data)

  } catch (error) {
    console.error('Google Drive sync error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
