import { DocumentGroup, Action, Conversation, Message, UIUCTool } from '@/types/chat'
import { ErrorMessage } from '@/types/error'
import { FolderInterface, FolderWithConversation } from '@/types/folder'
import { OpenAIModel, OpenAIModelID } from '@/types/openai'
import { PluginKey } from '@/types/plugin'
import { Prompt } from '@/types/prompt'
import {
  AnySupportedModel,
  AllLLMProviders,
} from '~/utils/modelProviders/LLMProvider'

export interface HomeInitialState {
  apiKey: string
  loading: boolean
  lightMode: 'dark' | 'light'
  messageIsStreaming: boolean
  modelError: ErrorMessage | null
  models: OpenAIModel[]
  folders: FolderInterface[]
  conversations: Conversation[]
  selectedConversation: Conversation | undefined
  currentMessage: Message | undefined
  prompts: Prompt[]
  temperature: number
  showSidebar: boolean
  showModelSettings: boolean
  currentFolder: FolderInterface | undefined
  messages: Message[]
  selectedModels: { readonly [key: string]: OpenAIModel | null }
  serverSideApiKeyIsSet: boolean
  serverSidePluginKeysSet: boolean
  availableModels: readonly OpenAIModel[]
  selectedProjectFrom: readonly OpenAIModel[]
  selectedProjectFromLength: number
  hasParsingError: boolean
  foldersInitialized: boolean
  // isImg2TextLoading: boolean
  // isRouting: boolean | undefined
  // isRunningTool: boolean | undefined
  // isRetrievalLoading: boolean | undefined
  // isQueryRewriting: boolean | undefined
  // wasQueryRewritten: boolean | undefined
  // queryRewriteText: string | undefined
  builtInSystemPrompts: Prompt[]
  selectedSystemPrompt: Prompt | null
  isConfiguringCourse: boolean
  modelOptions: OpenAIModel[]
  documentGroups: DocumentGroup[]
  documentsReady: boolean
  tools: UIUCTool[]
  webLLMModelIdLoading: {
    id: string | undefined
    isLoading: boolean | undefined
  }
  llmProviders: AllLLMProviders
}

export const initialState: HomeInitialState = {
  apiKey: '',
  loading: false,
  lightMode: 'dark',
  messageIsStreaming: false,
  modelError: null,
  models: [],
  folders: [],
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  prompts: [],
  temperature: 1,
  showSidebar: true,
  showModelSettings: false,
  currentFolder: undefined,
  messages: [],
  selectedModels: {},
  serverSideApiKeyIsSet: false,
  serverSidePluginKeysSet: false,
  availableModels: [],
  selectedProjectFrom: [],
  selectedProjectFromLength: 0,
  hasParsingError: false,
  foldersInitialized: false,
  // isRouting: undefined,
  // isRunningTool: undefined,
  // isRetrievalLoading: undefined,
  // isQueryRewriting: undefined,
  // wasQueryRewritten: undefined,
  // queryRewriteText: undefined,
  // isImg2TextLoading: false,
  builtInSystemPrompts: [],
  selectedSystemPrompt: null,
  isConfiguringCourse: false,
  modelOptions: [],
  documentGroups: [],
  documentsReady: false,
  tools: [],
  webLLMModelIdLoading: { id: undefined, isLoading: undefined },
  llmProviders: {
    openai: {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1'
    },
    anthropic: {
      apiKey: '',
      baseUrl: 'https://api.anthropic.com/v1'
    },
    azure: {
      apiKey: '',
      instanceName: '',
      deploymentName: '',
      apiVersion: '2024-08-01-preview'
    },
    google_gemini: {
      apiKey: ''
    },
    fireworks: {
      apiKey: '',
      baseUrl: 'https://api.fireworks.ai/inference/v1'
    },
    together: {
      apiKey: '',
      baseUrl: 'https://api.together.xyz/v1'
    },
    ollama: {
      baseUrl: 'http://localhost:11434/v1'
    },
    custom: {
      apiKey: '',
      baseUrl: ''
    }
  }
}
