import { NextApiRequest, NextApiResponse } from 'next'

type ConnectResponse = {
  success?: boolean
  account_email?: string
  error?: string
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ConnectResponse>
) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // For now, use a test user - TODO: implement proper auth
    const testUserEmail = 'test@example.com'

    const { course_name } = req.body
    if (!course_name) {
      return res.status(400).json({ error: 'course_name is required' })
    }

    // Call backend
    const backendUrl = process.env.BACKEND_URL || 'https://backend.aganswers.ai'
    const response = await fetch(`${backendUrl}/integrations/google/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': testUserEmail,
      },
      body: JSON.stringify({ course_name }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Backend error' })
    }

    return res.status(200).json(data)

  } catch (error) {
    console.error('Google Drive connect error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
