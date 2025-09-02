/**
 * Test component for ADK streaming integration
 * This can be used to verify the streaming works before integrating with the main Chat component
 */
import React, { useState, useCallback } from 'react'
import { Button, TextInput, Paper, Text, Stack, Group, Loader } from '@mantine/core'
import { v4 as uuidv4 } from 'uuid'
import { useADKChat } from '@/hooks/useADKChat'
import { type Conversation, type Message } from '@/types/chat'
import { GeminiModelID, GeminiModels } from '@/utils/modelProviders/types/gemini'
import { montserrat_paragraph } from 'fonts'

interface ADKChatTestProps {
  courseName: string
}

export const ADKChatTest: React.FC<ADKChatTestProps> = ({ courseName }) => {
  const [inputValue, setInputValue] = useState('')
  const [conversation, setConversation] = useState<Conversation>({
    id: uuidv4(),
    name: 'ADK Test Chat',
    messages: [],
    model: GeminiModels[GeminiModelID.Gemini_2_5_Flash],
    prompt: '',
    temperature: 0.7,
    folderId: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  const { sendMessage, stopStreaming } = useADKChat({
    onConversationUpdate: setConversation,
    onLoadingChange: setIsLoading,
    onStreamingChange: setIsStreaming,
  })

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return

    const message: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputValue.trim(),
    }

    sendMessage(conversation, message, courseName, {})
    setInputValue('')
  }, [inputValue, conversation, courseName, sendMessage, isStreaming])

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <Paper p="md" shadow="sm" className={montserrat_paragraph.className}>
      <Stack>
        <Text size="lg" fw={600}>
          ADK Streaming Test
        </Text>
        
        <Text size="sm" c="dimmed">
          Course: {courseName}
        </Text>

        {/* Messages Display */}
        <Paper p="sm" bg="gray.0" mih={200} style={{ maxHeight: 400, overflowY: 'auto' }}>
          <Stack>
            {conversation.messages.length === 0 ? (
              <Text c="dimmed" ta="center">
                No messages yet. Send a message to test ADK streaming.
              </Text>
            ) : (
              conversation.messages.map((message) => (
                <Paper
                  key={message.id}
                  p="xs"
                  bg={message.role === 'user' ? 'blue.0' : 'green.0'}
                  radius="sm"
                >
                  <Text size="xs" fw={500} c="dimmed" mb={4}>
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {typeof message.content === 'string' 
                      ? message.content 
                      : message.content.map(c => c.text).join('')
                    }
                  </Text>
                </Paper>
              ))
            )}
            
            {isLoading && (
              <Group>
                <Loader size="sm" />
                <Text size="sm" c="dimmed">
                  {isStreaming ? 'Streaming response...' : 'Processing...'}
                </Text>
              </Group>
            )}
          </Stack>
        </Paper>

        {/* Input Area */}
        <Group align="flex-end">
          <TextInput
            placeholder="Type your message..."
            value={inputValue}
            onChange={(event) => setInputValue(event.currentTarget.value)}
            onKeyDown={handleKeyPress}
            disabled={isStreaming}
          />
          
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || isStreaming}
            loading={isLoading}
          >
            Send
          </Button>
          
          {isStreaming && (
            <Button 
              color="red" 
              variant="outline"
              onClick={stopStreaming}
            >
              Stop
            </Button>
          )}
        </Group>

        {/* Debug Info */}
        <Paper p="xs" bg="gray.1">
          <Text size="xs" c="dimmed">
            Status: {isStreaming ? 'Streaming' : isLoading ? 'Loading' : 'Ready'} | 
            Messages: {conversation.messages.length} | 
            Conversation ID: {conversation.id.slice(0, 8)}...
          </Text>
        </Paper>
      </Stack>
    </Paper>
  )
}
