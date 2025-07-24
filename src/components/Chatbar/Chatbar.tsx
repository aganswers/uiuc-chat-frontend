import { useState, useCallback, useContext, useEffect, Suspense } from 'react'
import { useTranslation } from 'next-i18next'
import { useCreateReducer } from '@/hooks/useCreateReducer'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import { exportData } from '@/utils/app/importExport'
import { Conversation } from '@/types/chat'
import { LatestExportFormat, SupportedExportFormats } from '@/types/export'
import { OpenAIModels } from '~/utils/modelProviders/types/openai'
import { PluginKey } from '@/types/plugin'

import HomeContext from '~/pages/api/home/home.context'
import { ChatFolders } from './components/ChatFolders'
import { ChatbarSettings } from './components/ChatbarSettings'
import { Conversations } from './components/Conversations'
import Sidebar from '../Sidebar'
import ChatbarContext from './Chatbar.context'
import { ChatbarInitialState, initialState } from './Chatbar.state'
import { v4 as uuidv4 } from 'uuid'
import router from 'next/router'
import { useQueryClient } from '@tanstack/react-query'
import {
  useDeleteAllConversations,
  useDeleteConversation,
  useFetchConversationHistory,
  useUpdateConversation,
} from '~/hooks/conversationQueries'
import { AnimatePresence, motion } from 'framer-motion'
import { LoadingSpinner } from '../UIUC-Components/LoadingSpinner'
import { useDebouncedState } from '@mantine/hooks'
import posthog from 'posthog-js'
import { saveConversationToServer } from '~/utils/app/conversation'
import { downloadConversationHistoryUser } from '~/pages/api/UIUC-api/downloadConvoHistoryUser'

export const Chatbar = ({
  current_email,
  courseName,
}: {
  current_email: string | undefined
  courseName: string | undefined
}) => {
  const { t } = useTranslation('sidebar')
  const chatBarContextValue = useCreateReducer<ChatbarInitialState>({
    initialState,
  })
  const [isExporting, setIsExporting] = useState<boolean>(false)

  const {
    state: { conversations, showSidebar, folders },
    // Remove defaultModelId as it no longer exists
    handleUpdateConversation,
    handleDeleteFolder,
    handleCreateFolder,
    handleNewConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const {
    state: { searchTerm, filteredConversations },
    dispatch: chatDispatch,
  } = useContext(ChatbarContext)

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebouncedState(
    searchTerm,
    100,
  )

  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    if (
      searchTerm &&
      current_email &&
      courseName &&
      debouncedSearchTerm &&
      searchTerm.length >= 2
    ) {
      const fetchData = async () => {
        const conversations = await fetchConversationHistory(
          current_email,
          debouncedSearchTerm,
          courseName,
          1,
        )
        console.log('conversations: ', conversations)

        chatDispatch({
          field: 'filteredConversations',
          value: conversations,
        })
      }

      fetchData()
    } else {
      chatDispatch({
        field: 'filteredConversations',
        value: [],
      })
    }
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm, current_email, courseName])

  const allowDrop = (e: any) => {
    e.preventDefault()
  }

  const handleDrop = (e: any) => {
    if (e.dataTransfer) {
      const conversation = JSON.parse(e.dataTransfer.getData('conversation'))
      handleUpdateConversation(conversation, { key: 'folderId', value: 0 })
      chatDispatch({ field: 'searchTerm', value: '' })
      e.target.style.background = 'none'
    }
  }

  const handleDragOver = (e: any) => {
    e.preventDefault()
    if (e.target.className === 'folder') {
      e.target.style.background = '#343541'
    }
  }

  const handleDragLeave = (e: any) => {
    e.preventDefault()
    e.target.style.background = 'none'
  }

  const handleNewFolder = () => {
    const name = prompt(`${t('Enter folder name')}`)
    if (name) {
      const newFolder = {
        id: uuidv4(),
        name,
        type: 'chat' as FolderType,
      }

      const updatedFolders = [...folders, newFolder]

      chatDispatch({ field: 'searchTerm', value: '' })
      // saveLocalStorage('folders', updatedFolders)
      handleCreateFolder(newFolder.name, newFolder.type)
    }
  }

  const handleDeleteConversation = (conversation: Conversation) => {
    const updatedConversations = conversations.filter(
      (c) => c.id !== conversation.id,
    )

    chatDispatch({ field: 'searchTerm', value: '' })
    // saveLocalStorage('conversations', updatedConversations)

    if (updatedConversations.length > 0) {
      homeDispatch({
        field: 'selectedConversation',
        value: updatedConversations[updatedConversations.length - 1],
      })

      // Remove defaultModelId logic as it no longer exists
      // if (defaultModelId &&
      //   updatedConversations[updatedConversations.length - 1].messages
      //     .length === 0) {
      //   homeDispatch({
      //     field: 'selectedConversation',
      //     value: {
      //       ...updatedConversations[updatedConversations.length - 1],
      //       model: OpenAIModels[defaultModelId],
      //     },
      //   })
      // }

      // saveLocalStorage('selectedConversation', updatedConversations[updatedConversations.length - 1])
    } else {
      // homeDispatch({
      //   field: 'selectedConversation',
      //   value: {
      //     id: uuidv4(),
      //     name: 'New conversation',
      //     messages: [],
      //     model: OpenAIModels[defaultModelId],
      //     prompt: DEFAULT_SYSTEM_PROMPT,
      //     temperature: DEFAULT_TEMPERATURE,
      //     folderId: null,
      //   },
      // })
      // localStorage.removeItem('selectedConversation')
    }

    homeDispatch({ field: 'conversations', value: updatedConversations })
    // saveLocalStorage('conversations', updatedConversations)
  }

  const handleToggleChatbar = () => {
    homeDispatch({ field: 'showSidebar', value: !showSidebar })
    localStorage.setItem('showSidebar', JSON.stringify(!showSidebar))
  }

  const handleDragStart = (e: any, conversation: Conversation) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('conversation', JSON.stringify(conversation))
    }
  }

  const handleClearConversations = () => {
    // defaultModelId &&
    homeDispatch({
      field: 'selectedConversation',
      value: {
        id: uuidv4(),
        name: 'New conversation',
        messages: [],
        // model: OpenAIModels[defaultModelId], // Remove defaultModelId reference
        model: null, // Will be set when user selects a model
        prompt: DEFAULT_SYSTEM_PROMPT,
        temperature: DEFAULT_TEMPERATURE,
        folderId: null,
      },
    })

    homeDispatch({ field: 'conversations', value: [] })

    localStorage.removeItem('conversationHistory')
    localStorage.removeItem('selectedConversation')

    const updatedFolders = folders.filter((f) => f.type !== 'chat')

    chatDispatch({ field: 'searchTerm', value: '' })
    homeDispatch({ field: 'folders', value: updatedFolders })
    // saveLocalStorage('folders', updatedFolders)
  }

  const doCreateNewConversation = () => {
    handleNewConversation()
    chatDispatch({ field: 'searchTerm', value: '' })
  }

  useEffect(() => {
    if (searchTerm) {
      chatDispatch({
        field: 'filteredConversations',
        value: conversations.filter((conversation) => {
          const searchable =
            conversation.name.toLocaleLowerCase() +
            ' ' +
            conversation.messages.map((message) => message.content).join(' ')
          return searchable.toLowerCase().includes(searchTerm.toLowerCase())
        }),
      })
    } else {
      chatDispatch({
        field: 'filteredConversations',
        value: conversations,
      })
    }
  }, [searchTerm, conversations])

  return (
    <ChatbarContext.Provider
      value={{
        ...chatbarContextValue,
        handleDeleteConversation,
        handleClearConversations,
        handleNewFolder,
        handleDragStart,
      }}
    >
      <Sidebar<Conversation>
        side={'left'}
        isOpen={showSidebar}
        addItemButtonTitle={t('New chat')}
        itemComponent={<Conversation conversation={conversations[0]} />}
        folderComponent={<Folder searchTerm={searchTerm} />}
        items={filteredConversations}
        searchTerm={searchTerm}
        handleSearchTerm={(searchTerm: string) =>
          chatDispatch({ field: 'searchTerm', value: searchTerm })
        }
        toggleOpen={handleToggleChatbar}
        handleCreateItem={doCreateNewConversation}
        handleCreateFolder={() => handleNewFolder()}
        handleDrop={handleDrop}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        allowDrop={allowDrop}
        footerComponent={<ChatbarSettings />}
      />
    </ChatbarContext.Provider>
  )
}
