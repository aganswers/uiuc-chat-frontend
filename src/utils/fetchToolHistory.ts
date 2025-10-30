import { ToolExecution } from '@/types/chat'

interface ToolHistoryResponse {
  success: boolean
  toolEventLog: any[]
  toolEventCount: number
  error?: string
}

/**
 * Fetches tool history from Supabase for a specific message
 */
export const fetchToolHistory = async (messageId: string): Promise<ToolExecution[]> => {
  try {
    const response = await fetch(`/api/UIUC-api/getMessageToolHistory?messageId=${messageId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tool history: ${response.statusText}`)
    }
    
    const data: ToolHistoryResponse = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch tool history')
    }
    
    // Convert raw tool events to ToolExecution format
    return convertToolEventsToExecutions(data.toolEventLog)
  } catch (error) {
    console.error('Error fetching tool history:', error)
    return []
  }
}

/**
 * Converts raw tool events from the database into ToolExecution format
 */
function convertToolEventsToExecutions(toolEvents: any[]): ToolExecution[] {
  if (!Array.isArray(toolEvents) || toolEvents.length === 0) {
    return []
  }

  const toolMap = new Map<string, ToolExecution>()
  const responseMap = new Map<string, any>()

  // First pass: collect all function responses
  toolEvents.forEach((event: any) => {
    if (event?.content?.parts) {
      event.content.parts.forEach((part: any) => {
        if (part.functionResponse) {
          responseMap.set(part.functionResponse.id, part.functionResponse.response)
        }
      })
    }
  })

  // Second pass: build tool executions from function calls
  toolEvents.forEach((event: any) => {
    if (event?.content?.parts) {
      event.content.parts.forEach((part: any) => {
        if (part.functionCall) {
          const call = part.functionCall
          const response = responseMap.get(call.id)
          
          toolMap.set(call.id, {
            id: call.id,
            name: call.name,
            args: call.args || {},
            status: response ? 'completed' : 'running',
            result: response?.output || response?.result,
            timestamp: event.timestamp || Date.now(),
          })
        }
      })
    }
  })

  return Array.from(toolMap.values())
}
