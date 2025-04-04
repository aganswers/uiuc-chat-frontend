// @utils/app/conversation
import { Conversation, ConversationPage } from '@/types/chat'
import posthog from 'posthog-js'
import { cleanConversationHistory } from './clean'

export async function fetchConversationHistory(
  user_email: string,
  searchTerm: string,
  courseName: string,
  pageParam: number,
): Promise<ConversationPage> {
  
  let finalResponse: ConversationPage = {
    conversations: [],
    nextCursor: null,
  }
  try {
    const response = await fetch(
      `/api/conversation?user_email=${user_email}&searchTerm=${searchTerm}&courseName=${courseName}&pageParam=${pageParam}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error('Error fetching conversation history')
    }

    const { conversations, nextCursor } = await response.json()

    // // Clean the conversations and ensure they're properly structured
    const cleanedConversations = conversations.map((conversation: any) => {
      // Ensure messages are properly ordered by creation time
      if (conversation.messages) {
        conversation.messages.sort((a: any, b: any) => {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
      }
      return conversation
    })

    finalResponse = cleanConversationHistory(cleanedConversations)
    finalResponse.nextCursor = nextCursor

    // Sync with local storage
    const selectedConversation = localStorage.getItem('selectedConversation')
    if (selectedConversation && finalResponse?.conversations?.length > 0) {
      const parsed = JSON.parse(selectedConversation)
      const serverConversation = finalResponse.conversations.find(
        (c) => c.id === parsed.id
      )
      if (serverConversation) {
        localStorage.setItem(
          'selectedConversation',
          JSON.stringify(serverConversation)
        )
      }
    }
  } catch (error) {
    console.error('utils/app/conversation.ts - Error fetching conversation history:', error)
  }
  return finalResponse
}

export const deleteConversationFromServer = async (id: string) => {
  try {
    const response = await fetch('/api/conversation', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      throw new Error('Error deleting conversation')
    }
  } catch (error) {
    console.error('Error deleting conversation:', error)
  }
}

export const deleteAllConversationsFromServer = async (
  user_email: string,
  course_name: string,
) => {
  try {
    const response = await fetch('/api/conversation', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_email, course_name }),
    })

    if (!response.ok) {
      throw new Error('Error deleting conversation')
    }
  } catch (error) {
    console.error('Error deleting conversation:', error)
  }
}

export const saveConversationToLocalStorage = (conversation: Conversation) => {
  /*
  Save convo to local storage. If storage is full, clear the oldest conversation and try again.
  */
  let successful = false
  while (!successful) {
    try {
      // Get existing conversation to preserve feedback
      const existingConversation = JSON.parse(
        localStorage.getItem('selectedConversation') || '{}'
      );

      // If it's the same conversation, preserve feedback
      if (existingConversation.id === conversation.id) {
        const messagesWithFeedback = conversation.messages.map(msg => {
          const existingMsg = existingConversation.messages?.find((m: typeof msg) => m.id === msg.id);
          return {
            ...msg,
            feedback: existingMsg?.feedback || msg.feedback
          };
        });

        const conversationWithFeedback = {
          ...conversation,
          messages: messagesWithFeedback
        };

        localStorage.setItem('selectedConversation', JSON.stringify(conversationWithFeedback))
      } else {
        localStorage.setItem('selectedConversation', JSON.stringify(conversation))
      }

      successful = true
    } catch (e) {
      console.debug(
        'Error saving conversation history. Clearing storage, then trying again. Error:',
        e,
      )
      posthog.capture('local_storage_full', {
        course_name:
          conversation.messages?.[0]?.contexts?.[0]?.course_name ||
          'Unknown Course',
        user_email: conversation.userEmail,
        inSaveConversation: true,
      })

      clearSingleOldestConversation() // Attempt to clear a bit of storage and try again
    }
  }
}

const clearSingleOldestConversation = () => {
  console.debug('CLEARING OLDEST CONVERSATIONS to free space in local storage.')

  const existingConversations = JSON.parse(
    localStorage.getItem('conversationHistory') || '[]',
  )

  // let existingConversations = JSON.parse(localStorage.getItem('conversationHistory') || '[]');
  while (existingConversations.length > 0) {
    existingConversations.shift() // Remove the oldest conversation
    try {
      localStorage.setItem(
        'conversationHistory',
        JSON.stringify(existingConversations),
      )
      break // Exit loop if setItem succeeds
    } catch (error) {
      continue // Try removing another conversation
    }
  }
}

export const saveConversations = (conversations: Conversation[]) => {
  /*
  Note: This function is a workaround for the issue where localStorage is full and cannot save new conversation history.
  TODO: show a modal/pop-up asking user to export them before it gets deleted?
  */

  try {
    localStorage.setItem('conversationHistory', JSON.stringify(conversations))
  } catch (e) {
    posthog.capture('local_storage_full', {
      course_name:
        conversations?.slice(-1)[0]?.messages?.[0]?.contexts?.[0]
          ?.course_name || 'Unknown Course',
      user_email: conversations?.slice(-1)[0]?.userEmail || 'Unknown Email',
      inSaveConversations: true,
    })

    const existingConversations = JSON.parse(
      localStorage.getItem('conversationHistory') || '[]',
    )
    while (
      existingConversations.length > 0 &&
      e instanceof DOMException &&
      e.code === 22
    ) {
      existingConversations.shift() // Remove the oldest conversation
      try {
        localStorage.setItem(
          'conversationHistory',
          JSON.stringify(existingConversations),
        )
        e = null // Clear the error since space has been freed
      } catch (error) {
        e = error // Update the error if it fails again
        continue // Try removing another conversation
      }
    }
    if (
      existingConversations.length === 0 &&
      e instanceof DOMException &&
      e.code === 22
    ) {
      console.error(
        'Failed to free enough space to save new conversation history.',
      )
    }
  }
}

// Old method without error handling
// export const saveConversations = (conversations: Conversation[]) => {
//   try {
//     localStorage.setItem('conversationHistory', JSON.stringify(conversations))
//   } catch (e) {
//     console.error(
//       'Error saving conversation history. Clearing storage, then setting convo. Error:',
//       e,
//     )
//     localStorage.setItem('conversationHistory', JSON.stringify(conversations))
//   }
// }

export async function saveConversationToServer(conversation: Conversation) {
  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      console.debug('Saving conversation to server:', conversation)
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || response.statusText;
        throw new Error(`Error saving conversation: ${errorMessage}`);
      }
      
      return response.json()
    } catch (error: any) {
      console.error(`Error saving conversation (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error)
      if (error.code === 'ECONNRESET' && retryCount < MAX_RETRIES - 1) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
