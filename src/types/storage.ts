import { Conversation } from './chat'
import { FolderInterface } from './folder'
import { PluginKey } from './plugin'
import { Prompt } from './prompt'

// keep track of local storage schema
export interface LocalStorage {
  apiKey: string
  conversationHistory: Conversation[]
  folders: FolderInterface[]
  prompts: Prompt[]
  selectedConversation: Conversation
  showSidebar: boolean
}
