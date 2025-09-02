/**
 * Hook for ADK-powered chat with real-time streaming
 */
import { useCallback, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { streamADKChat, StreamingMessage, ADKEvent } from '@/utils/adkStreaming'
import { type Conversation, type Message } from '@/types/chat'
import { notifications } from '@mantine/notifications'

interface UseADKChatProps {
  onConversationUpdate: (conversation: Conversation) => void
  onLoadingChange: (loading: boolean) => void
  onStreamingChange: (streaming: boolean) => void
}

export const useADKChat = ({
  onConversationUpdate,
  onLoadingChange,
  onStreamingChange,
}: UseADKChatProps) => {
  const [isStreaming, setIsStreaming] = useState(false)
  const stopConversationRef = useRef(false)
  const currentStreamingMessage = useRef<Message | null>(null)

  const sendMessage = useCallback(
    async (
      conversation: Conversation,
      message: Message,
      courseName: string,
      courseMetadata: any
    ) => {
      if (isStreaming) {
        console.warn('Already streaming, ignoring new message')
        return
      }

      // Reset stop flag
      stopConversationRef.current = false

      // Add user message to conversation
      const userMessage: Message = {
        ...message,
        id: uuidv4(),
      }

      const updatedConversation: Conversation = {
        ...conversation,
        messages: [...conversation.messages, userMessage],
      }

      onConversationUpdate(updatedConversation)
      onLoadingChange(true)
      setIsStreaming(true)
      onStreamingChange(true)

      // Initialize streaming assistant message
      const assistantMessageId = uuidv4()
      currentStreamingMessage.current = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        contexts: message.contexts,
        feedback: message.feedback,
      }

      // Prepare payload for backend
      const payload = {
        model: 'gemini-2.5-flash', // Default model, can be made configurable
        messages: updatedConversation.messages,
        temperature: 0.7,
        course_name: courseName,
        stream: true,
        api_key: '', // TODO: Add API key handling
        retrieval_only: false,
        conversation: {
          id: conversation.id,
          messages: updatedConversation.messages,
        },
      }

      try {
        await streamADKChat(
          payload,
          // onMessageUpdate
          (streamingMessage: StreamingMessage) => {
            if (stopConversationRef.current) {
              return
            }

            // Update the current streaming message
            if (currentStreamingMessage.current) {
              currentStreamingMessage.current.content = streamingMessage.content

              // Handle function calls display
              if (streamingMessage.functionCalls) {
                // Could extend Message type to include function calls
                // For now, append to content for visibility
                const functionCallsText = streamingMessage.functionCalls
                  .map(fc => `\n🔧 ${fc.name}(${JSON.stringify(fc.args, null, 2)}) - ${fc.status}`)
                  .join('')
                
                currentStreamingMessage.current.content += functionCallsText
              }

              // Handle artifacts
              if (streamingMessage.artifacts) {
                // Could extend Message type to include artifacts
                // For now, append info to content
                const artifactsText = streamingMessage.artifacts
                  .map(artifact => `\n📎 ${artifact.filename || 'Attachment'} (${artifact.type})`)
                  .join('')
                
                currentStreamingMessage.current.content += artifactsText
              }

              // Update conversation with streaming message
              const updatedMessages = [
                ...updatedConversation.messages,
                { ...currentStreamingMessage.current },
              ]

              const streamingConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              }

              onConversationUpdate(streamingConversation)
            }
          },
          // onComplete
          () => {
            console.log('ADK streaming completed')
            onLoadingChange(false)
            setIsStreaming(false)
            onStreamingChange(false)
            currentStreamingMessage.current = null
          },
          // onError
          (error: string) => {
            console.error('ADK streaming error:', error)
            
            notifications.show({
              title: 'Chat Error',
              message: error,
              color: 'red',
            })

            // Add error message to conversation
            if (currentStreamingMessage.current) {
              currentStreamingMessage.current.content = `Error: ${error}`
              
              const updatedMessages = [
                ...updatedConversation.messages,
                { ...currentStreamingMessage.current },
              ]

              const errorConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              }

              onConversationUpdate(errorConversation)
            }

            onLoadingChange(false)
            setIsStreaming(false)
            onStreamingChange(false)
            currentStreamingMessage.current = null
          }
        )
      } catch (error) {
        console.error('Failed to start ADK streaming:', error)
        
        notifications.show({
          title: 'Connection Error',
          message: 'Failed to connect to the chat service. Please try again.',
          color: 'red',
        })

        onLoadingChange(false)
        setIsStreaming(false)
        onStreamingChange(false)
        currentStreamingMessage.current = null
      }
    },
    [isStreaming, onConversationUpdate, onLoadingChange, onStreamingChange]
  )

  const stopStreaming = useCallback(() => {
    stopConversationRef.current = true
    setIsStreaming(false)
    onStreamingChange(false)
    onLoadingChange(false)
    currentStreamingMessage.current = null
  }, [onLoadingChange, onStreamingChange])

  return {
    sendMessage,
    stopStreaming,
    isStreaming,
  }
}
