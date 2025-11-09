import { supabase } from '@/utils/supabaseClient'
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

interface ToolEvent {
  id?: string
  type?: string
  timestamp: number
  content?: any
}

/**
 * Saves raw tool events to the messages table in the tool_event_log JSONB field.
 * This allows us to store all tool execution data as it arrives during streaming.
 */
const saveToolEvents = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messageId, toolEvents, conversationId } = req.body as {
    messageId: string
    toolEvents: ToolEvent[]
    conversationId: string
  }

  if (!messageId || !toolEvents || !Array.isArray(toolEvents)) {
    return res.status(400).json({ error: 'Invalid request parameters' })
  }

  try {
    // First check if the message exists
    const { data: existingMessage, error: fetchError } = await supabase
      .from('messages')
      .select('tool_event_log')
      .eq('id', messageId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is ok
      console.error('Error fetching existing message:', fetchError)
      throw fetchError
    }

    // Merge with existing events if they exist
    const existingEvents = existingMessage?.tool_event_log || []
    const mergedEvents = [...existingEvents, ...toolEvents]

    // Update the message with new tool events
    const { data, error } = await supabase
      .from('messages')
      .update({
        tool_event_log: mergedEvents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)

    if (error) {
      console.error('Error saving tool events:', error)
      throw error
    }

    return res.status(200).json({ 
      success: true, 
      eventCount: mergedEvents.length 
    })
  } catch (error) {
    console.error('Error in saveToolEvents:', error)
    return res.status(500).json({ 
      error: 'Error saving tool events', 
      details: error?.toString() 
    })
  }
}

export default saveToolEvents

