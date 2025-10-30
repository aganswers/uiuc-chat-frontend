import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

const getMessageToolHistory = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messageId } = req.query

  if (!messageId || typeof messageId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid messageId' })
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('tool_event_log, tool_event_count')
      .eq('id', messageId)
      .single()

    if (error) {
      console.error('Error fetching tool history from Supabase:', error)
      throw error
    }

    return res.status(200).json({ 
      success: true, 
      toolEventLog: data.tool_event_log || [],
      toolEventCount: data.tool_event_count || 0
    })
  } catch (error) {
    console.error('Unhandled error in getMessageToolHistory:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default getMessageToolHistory
