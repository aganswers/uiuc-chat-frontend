import { NextApiRequest, NextApiResponse } from 'next'

type AuthUrlResponse = {
  url?: string
  error?: string
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AuthUrlResponse>
) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // For now, use a test user - TODO: implement proper auth
    const testUserEmail = 'test@example.com'

    // Call backend
    const backendUrl = process.env.BACKEND_URL || 'https://backend.aganswers.ai'
    const response = await fetch(`${backendUrl}/integrations/google/auth-url`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': testUserEmail,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Backend error:', response.status, errorData)
      return res.status(response.status).json({ error: errorData.error || 'Backend error' })
    }

    const data = await response.json()
    return res.status(200).json(data)

  } catch (error) {
    console.error('Google Drive auth URL error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
