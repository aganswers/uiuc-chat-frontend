// src/pages/api/chat-api/chat.ts  — proxy to backend /Chat

import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Streams or returns a non-streaming reply from the new Flask backend.
 * All request/response shapes remain identical to the previous implementation.
 */
export default async function chatProxy(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const backendURL =
    process.env.BACKEND_BASE_URL?.replace(/\/$/, '') ||
    'https://backend.aganswers.ai'

  // Forward the payload exactly as-is
  let upstream: Response
  try {
    upstream = await fetch(`${backendURL}/Chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Encoding': 'identity',
      },
      body: JSON.stringify(req.body),
    })
  } catch (error) {
    console.error('Backend connection error:', error)
    res.status(502).json({ error: 'Backend connection failed' })
    return
  }

  // Set SSE streaming headers
  res.status(upstream.status)
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Copy other non-problematic headers
  upstream.headers.forEach((v, k) => {
    const skipHeaders = [
      'content-encoding',
      'content-length',
      'transfer-encoding',
      'content-type',
    ]
    if (!skipHeaders.includes(k.toLowerCase())) {
      res.setHeader(k, v)
    }
  })

  // Stream bytes directly back to the caller
  if (upstream.body) {
    try {
      const reader = upstream.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        res.write(chunk)

        // Force flush to ensure immediate streaming
        if ((res as any).flush) {
          ;(res as any).flush()
        }
      }
      res.end()
    } catch (error) {
      console.error('Proxy streaming error:', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error' })
      } else {
        res.end()
      }
    }
  } else {
    // Fallback for non-streaming responses
    try {
      const text = await upstream.text()
      res.send(text)
    } catch (error) {
      console.error('Error reading response text:', error)
      res.status(500).json({ error: 'Response read error' })
    }
  }
}
