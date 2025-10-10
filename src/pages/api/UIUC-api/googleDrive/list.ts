import { NextApiRequest, NextApiResponse } from 'next'

type DriveFile = {
  id: string
  name: string
  isFolder: boolean
  mimeType?: string
  modifiedTime?: string
  size?: string
  md5Checksum?: string
}

type ListResponse = {
  files?: DriveFile[]
  error?: string
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ListResponse>
) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // For now, use a test user - TODO: implement proper auth
    const testUserEmail = 'test@example.com'

    const { course_name, folder_id = 'root' } = req.query
    if (!course_name || typeof course_name !== 'string') {
      return res.status(400).json({ error: 'course_name is required' })
    }

    // Call backend
    const backendUrl = process.env.BACKEND_URL || 'https://backend.aganswers.ai'
    const params = new URLSearchParams({
      course_name,
      folder_id: folder_id as string,
    })
    
    const response = await fetch(`${backendUrl}/integrations/google/list?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': testUserEmail,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Backend error' })
    }

    return res.status(200).json(data)

  } catch (error) {
    console.error('Google Drive list error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
