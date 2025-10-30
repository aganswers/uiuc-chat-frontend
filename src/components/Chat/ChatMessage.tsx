// ChatMessage.tsx
import React, {
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  createContext,
  useContext as useReactContext,
} from 'react'
import { Text, createStyles, Tooltip } from '@mantine/core'
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconRobot,
  IconThumbUp,
  IconThumbDown,
  IconThumbUpFilled,
  IconThumbDownFilled,
  IconX,
  IconChevronDown,
  IconBrain,
  IconRepeat,
} from '@tabler/icons-react'
import { Fragment } from 'react'
import { useTranslation } from 'next-i18next'
import { Content, ContextWithMetadata, Message } from '@/types/chat'
import HomeContext from '~/pages/api/home/home.context'
import { CodeBlock } from '../Markdown/CodeBlock'
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown'
import { ImagePreview } from './ImagePreview'
import { LoadingSpinner } from '../UIUC-Components/LoadingSpinner'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import { ToolExecutionDisplay } from './ToolExecutionDisplay'
import rehypeMathjax from 'rehype-mathjax'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { IntermediateStateAccordion } from '../UIUC-Components/IntermediateStateAccordion'
import { FeedbackModal } from './FeedbackModal'
import { saveConversationToServer } from '@/utils/app/conversation'
import SourcesSidebar from '../UIUC-Components/SourcesSidebar'
import { fetchToolHistory } from '@/utils/fetchToolHistory'
import { ToolExecution } from '@/types/chat'

const useStyles = createStyles((theme) => ({
  imageContainerStyle: {
    maxWidth: '25%',
    flex: '1 0 21%',
    padding: '0.5rem',
    borderRadius: '0.5rem',
  },
  imageStyle: {
    width: '100%',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '0.5rem',
    borderColor: theme.colors.gray[6],
    borderWidth: '1px',
    borderStyle: 'solid',
  },
}))

const Timer: React.FC<{ timerVisible: boolean }> = ({ timerVisible }) => {
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerVisible) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [timerVisible])

  return timer > 0 ? (
    <Text fz="sm" c="dimmed" mt="sm">
      {timer} s.
    </Text>
  ) : (
    <></>
  )
}

const SourcesSidebarContext = createContext<{
  activeSidebarMessageId: string | null
  setActiveSidebarMessageId: (id: string | null) => void
}>({
  activeSidebarMessageId: null,
  setActiveSidebarMessageId: () => {},
})

export const SourcesSidebarProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [activeSidebarMessageId, setActiveSidebarMessageId] = useState<
    string | null
  >(null)

  return (
    <SourcesSidebarContext.Provider
      value={{ activeSidebarMessageId, setActiveSidebarMessageId }}
    >
      {children}
    </SourcesSidebarContext.Provider>
  )
}

export interface Props {
  message: Message
  messageIndex: number
  onEdit?: (editedMessage: Message) => void
  onRegenerate?: (message: Message, messageIndex: number) => void
  onFeedback?: (
    message: Message,
    isPositive: boolean | null,
    category?: string,
    details?: string,
  ) => void
  context?: ContextWithMetadata[]
  contentRenderer?: (message: Message) => JSX.Element
  onImageUrlsUpdate?: (message: Message, messageIndex: number) => void
  courseName: string
}

function extractUsedCitationIndexes(content: string | Content[]): number[] {
  const text = Array.isArray(content)
    ? content
        .filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join(' ')
    : content

  const citationRegex = /\([^|]+\|\s*(\d+)\)/g
  const found: number[] = []

  let match
  while ((match = citationRegex.exec(text)) !== null) {
    const idx = parseInt(match[1] as string, 10)
    if (!Number.isNaN(idx)) {
      found.push(idx)
    }
  }

  return Array.from(new Set(found))
}

function getFileType(s3Path?: string, url?: string) {
  if (s3Path) {
    const lowerPath = s3Path.toLowerCase()
    if (lowerPath.endsWith('.pdf')) return 'pdf'
    if (lowerPath.endsWith('.md')) return 'md'
    if (lowerPath.endsWith('.rtf')) return 'rtf'
  }
  if (url) return 'web'
  return 'other'
}

const ThinkTagDropdown: React.FC<{
  content: string
  isStreaming?: boolean
}> = ({ content, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => (
      <Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </Fragment>
    ))
  }

  const handleClick = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      className="think-tag-dropdown"
      role="region"
      aria-expanded={isExpanded}
    >
      <div
        className="think-tag-header"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        aria-expanded={isExpanded}
        aria-controls="think-tag-content"
      >
        <div className="flex items-center gap-2">
          <IconBrain size={20} className="think-tag-brain-icon" />
          <span
            className={`text-base font-medium ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            AI&apos;s Thought Process
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && <LoadingSpinner size="xs" />}
          <IconChevronDown
            size={20}
            className={`think-tag-icon ${isExpanded ? 'expanded' : ''}`}
          />
        </div>
      </div>
      <div
        id="think-tag-content"
        className={`think-tag-content ${isExpanded ? 'expanded' : ''}`}
        onClick={isExpanded ? handleClick : undefined}
        role={isExpanded ? 'button' : undefined}
        tabIndex={isExpanded ? 0 : -1}
        onKeyDown={
          isExpanded
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClick()
                }
              }
            : undefined
        }
      >
        <div
          className={`whitespace-pre-line text-base ${montserrat_paragraph.variable} font-montserratParagraph`}
        >
          {formatContent(content)}
        </div>
      </div>
    </div>
  )
}

function extractThinkTagContent(content: string): {
  thoughts: string | null
  remainingContent: string
} {
  if (content.startsWith('<think>')) {
    const endTagIndex = content.indexOf('</think>')
    if (endTagIndex !== -1) {
      const thoughts = content.slice(7, endTagIndex).trim()
      const remainingContent = content.slice(endTagIndex + 8).trim()
      return { thoughts, remainingContent }
    } else {
      const thoughts = content.slice(7).trim()
      return { thoughts, remainingContent: '' }
    }
  }
  return { thoughts: null, remainingContent: content }
}

function decodeHtmlEntities(str: string | undefined): string {
  if (!str) return ''
  const doc = new DOMParser().parseFromString(str, 'text/html')
  return doc.body.textContent || str
}

export const ChatMessage: React.FC<Props> = memo(
  ({
    message,
    messageIndex,
    onEdit,
    onRegenerate,
    onFeedback,
    onImageUrlsUpdate,
    courseName,
  }) => {
    const { t } = useTranslation('chat')
    const { activeSidebarMessageId, setActiveSidebarMessageId } =
      useReactContext(SourcesSidebarContext)

    const {
      state: {
        selectedConversation,
        conversations,
        messageIsStreaming,
        isImg2TextLoading,
        isRouting,
        isRunningTool,
        isRetrievalLoading,
        isQueryRewriting,
        loading,
        showChatbar,
      },
      dispatch: homeDispatch,
    } = useContext(HomeContext)

    const [isEditing, setIsEditing] = useState<boolean>(false)
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const [messageContent, setMessageContent] = useState<string>('')
    const [localContent, setLocalContent] = useState<string | Content[]>(
      message.content,
    )
    const [imageUrls, setImageUrls] = useState<Set<string>>(new Set())

    const [messagedCopied, setMessageCopied] = useState(false)
    const [isRightSideVisible, setIsRightSideVisible] = useState(false)
    const [sourceThumbnails, setSourceThumbnails] = useState<string[]>([])
    const [isThumbsUp, setIsThumbsUp] = useState<boolean>(false)
    const [isThumbsDown, setIsThumbsDown] = useState<boolean>(false)
    const [isPositiveFeedback, setIsPositiveFeedback] = useState<boolean>(false)
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] =
      useState<boolean>(false)
    const [loadedToolExecutions, setLoadedToolExecutions] = useState<ToolExecution[]>([])
    const [isLoadingToolHistory, setIsLoadingToolHistory] = useState<boolean>(false)

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [timerVisible, setTimerVisible] = useState(false)
    const { classes } = useStyles()

    const isSourcesSidebarOpen = activeSidebarMessageId === message.id

    useEffect(() => {
      if (isRightSideVisible) {
        setActiveSidebarMessageId(null)
      }
    }, [isRightSideVisible, setActiveSidebarMessageId])

    const handleSourcesSidebarToggle = (open: boolean) => {
      if (open) {
        setActiveSidebarMessageId(message.id)
      } else if (isSourcesSidebarOpen) {
        setActiveSidebarMessageId(null)
      }
      setIsRightSideVisible(false)
    }

    const handleSourcesSidebarClose = () => {
      if (isSourcesSidebarOpen) {
        setActiveSidebarMessageId(null)
      }
    }

    const isAnySidebarOpen = () => {
      return activeSidebarMessageId !== null
    }

    useEffect(() => {
      return () => {
        setIsFeedbackModalOpen(false)
      }
    }, [message.id])

    useEffect(() => {
      if (message.role === 'assistant') {
        if (
          messageIsStreaming &&
          messageIndex == (selectedConversation?.messages.length ?? 0) - 1
        ) {
          setTimerVisible(true)
        } else {
          setTimerVisible(false)
        }
      }
    }, [message.role, messageIsStreaming, messageIndex, selectedConversation])

    function deepEqual(a: any, b: any) {
      if (a === b) {
        return true
      }

      if (
        typeof a !== 'object' ||
        a === null ||
        typeof b !== 'object' ||
        b === null
      ) {
        return false
      }

      const keysA = Object.keys(a),
        keysB = Object.keys(b)

      if (keysA.length !== keysB.length) {
        return false
      }

      for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
          return false
        }
      }

      return true
    }

    useEffect(() => {
      const fetchUrl = async () => {
        let isValid = false
        if (Array.isArray(message.content)) {
          const updatedContent = await Promise.all(
            message.content.map(async (content) => {
              if (content.type === 'image_url' && content.image_url) {
                isValid = await checkIfUrlIsValid(content.image_url.url)
                if (isValid) {
                  setImageUrls(
                    (prevUrls) =>
                      new Set([...prevUrls, content.image_url?.url as string]),
                  )
                  return content
                } else {
                  const path = extractPathFromUrl(content.image_url.url)
                  console.log(
                    'Image url was invalid, fetching presigned url for: ',
                    path,
                  )
                  const presignedUrl = await getPresignedUrl(path, courseName)
                  setImageUrls(
                    (prevUrls) => new Set([...prevUrls, presignedUrl]),
                  )
                  return { ...content, image_url: { url: presignedUrl } }
                }
              }
              return content
            }),
          )
          if (
            !isValid &&
            onImageUrlsUpdate &&
            !deepEqual(updatedContent, message.content)
          ) {
            console.log(
              'Updated content: ',
              updatedContent,
              'Previous content: ',
              message.content,
            )
            onImageUrlsUpdate(
              { ...message, content: updatedContent },
              messageIndex,
            )
          }
        }
      }
      if (message.role === 'user') {
        fetchUrl()
      }
    }, [message.content, messageIndex, isRunningTool])

    const toggleEditing = () => {
      if (!isEditing) {
        // Set the initial content when starting to edit
        if (Array.isArray(message.content)) {
          const textContent = message.content
            .filter((content) => content.type === 'text')
            .map((content) => content.text)
            .join(' ')
          setMessageContent(textContent)
        } else {
          setMessageContent(message.content as string)
        }
      }
      setIsEditing(!isEditing)
      // Focus the textarea after the state update and component re-render
      setTimeout(() => {
        if (!isEditing && textareaRef.current) {
          textareaRef.current.focus()
          // Place cursor at the end of the text
          const length = textareaRef.current.value.length
          textareaRef.current.setSelectionRange(length, length)
        }
      }, 0)
    }

    const handleInputChange = (
      event: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
      setMessageContent(event.target.value)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }

    const handleEditMessage = () => {
      const trimmedContent = messageContent.trim()
      if (trimmedContent.length === 0) return

      if (message.content !== trimmedContent) {
        if (selectedConversation && onEdit) {
          const editedMessage = { ...message, content: trimmedContent }
          onEdit(editedMessage)

          // Save to server
          const updatedConversation = {
            ...selectedConversation,
            messages: selectedConversation.messages.map((msg) =>
              msg.id === message.id ? editedMessage : msg,
            ),
          }
          saveConversationToServer(updatedConversation).catch(
            (error: Error) => {
              console.error('Error saving edited message to server:', error)
            },
          )
        }
      }
      setIsEditing(false)
    }

    const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
        e.preventDefault()
        const trimmedContent = messageContent.trim()
        if (trimmedContent.length > 0) {
          handleEditMessage()
        }
      }
    }

    const copyOnClick = () => {
      if (!navigator.clipboard) return

      navigator.clipboard.writeText(message.content as string).then(() => {
        setMessageCopied(true)
        setTimeout(() => {
          setMessageCopied(false)
        }, 2000)
      })
    }

    useEffect(() => {
      if (
        message.feedback &&
        message.feedback.isPositive !== undefined &&
        message.feedback.isPositive !== null
      ) {
        setIsThumbsUp(message.feedback.isPositive)
        setIsThumbsDown(!message.feedback.isPositive)
      } else {
        setIsThumbsUp(false)
        setIsThumbsDown(false)
      }
    }, [message])

    const handleThumbsUp = useCallback(() => {
      if (isThumbsUp) {
        // Unlike action
        setIsThumbsUp(false)
        setIsThumbsDown(false)

        if (onFeedback) {
          onFeedback(message, null) // Pass null to indicate removal of feedback
        }
        return
      }

      // Regular like action
      setIsThumbsUp(true)
      setIsThumbsDown(false)
      setIsPositiveFeedback(true)

      if (onFeedback) {
        onFeedback(message, true)
      }
    }, [isThumbsUp, onFeedback, message])

    const handleThumbsDown = useCallback(() => {
      if (isThumbsDown) {
        // Remove negative feedback
        setIsThumbsUp(false)
        setIsThumbsDown(false)

        if (onFeedback) {
          onFeedback(message, null)
        }
        return
      }

      // Regular thumbs down action
      setIsThumbsUp(false)
      setIsThumbsDown(false) // Don't set to true until feedback is submitted
      setIsPositiveFeedback(false)
      setIsFeedbackModalOpen(true)
    }, [isThumbsDown, onFeedback, message])

    const handleFeedbackSubmit = useCallback(
      (feedback: string, category?: string) => {
        // Create a deep copy of just the message
        const messageCopy = JSON.parse(JSON.stringify(message))

        setIsThumbsUp(isPositiveFeedback)
        setIsThumbsDown(!isPositiveFeedback)

        if (onFeedback) {
          onFeedback(messageCopy, isPositiveFeedback, category, feedback)
        }
        setIsFeedbackModalOpen(false)
      },
      [isPositiveFeedback],
    )

    useEffect(() => {
      if (Array.isArray(message.content)) {
        const textContent = message.content
          .filter((content) => content.type === 'text')
          .map((content) => content.text)
          .join(' ')
        setMessageContent(textContent)
      }
    }, [message.content])

    useEffect(() => {
      setImageUrls(new Set())
    }, [message])

    // Check for tool history mismatch and fetch from Supabase if needed
    useEffect(() => {
      const checkAndLoadToolHistory = async () => {
        // Only check for assistant messages that don't have tool executions displayed
        if (message.role !== 'assistant' || !message.id) return
        
        // If we already have tool executions or are currently loading, skip
        if ((message.toolExecutions && message.toolExecutions.length > 0) || isLoadingToolHistory) return
        
        // If this is a streaming message, skip
        if (messageIsStreaming && messageIndex === (selectedConversation?.messages.length ?? 0) - 1) return
        
        try {
          setIsLoadingToolHistory(true)
          const toolHistory = await fetchToolHistory(message.id)
          
          if (toolHistory.length > 0) {
            setLoadedToolExecutions(toolHistory)
          }
        } catch (error) {
          console.error('Error loading tool history:', error)
        } finally {
          setIsLoadingToolHistory(false)
        }
      }

      checkAndLoadToolHistory()
    }, [message.id, message.role, message.toolExecutions, messageIsStreaming, messageIndex, selectedConversation?.messages.length, isLoadingToolHistory])

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, [isEditing])

    async function getPresignedUrl(
      uploadedImageUrl: string,
      courseName: string,
    ): Promise<string> {
      try {
        const presignedUrl = await fetchPresignedUrl(
          uploadedImageUrl,
          courseName,
        )
        return presignedUrl as string
      } catch (error) {
        console.error(
          'Failed to fetch presigned URL for',
          uploadedImageUrl,
          error,
        )
        return ''
      }
    }

    async function checkIfUrlIsValid(url: string): Promise<boolean> {
      try {
        const urlObject = new URL(url)
        const isS3Presigned = urlObject.searchParams.has('X-Amz-Signature')

        if (isS3Presigned) {
          dayjs.extend(utc)
          let creationDateString = urlObject.searchParams.get(
            'X-Amz-Date',
          ) as string

          creationDateString = creationDateString.replace(
            /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
            '$1-$2-$3T$4:$5:$6Z',
          )

          const creationDate = dayjs.utc(
            creationDateString,
            'YYYYMMDDTHHmmss[Z]',
          )

          const expiresInSecs = Number(
            urlObject.searchParams.get('X-Amz-Expires') as string,
          )
          const expiryDate = creationDate.add(expiresInSecs, 'second')
          const isExpired = expiryDate.toDate() < new Date()

          if (isExpired) {
            console.log('URL is expired')
            return false
          } else {
            return true
          }
        } else {
          const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
          return response.type === 'opaque'
        }
      } catch (error) {
        console.error('Failed to validate URL', url, error)
        return false
      }
    }

    function extractPathFromUrl(url: string): string {
      const urlObject = new URL(url)
      let path = urlObject.pathname
      if (path.startsWith('/')) {
        path = path.substring(1)
      }
      return path
    }

    useEffect(() => {
      const processTools = async () => {
        if (message.tools && message.tools.length > 0) {
          for (const tool of message.tools) {
            if (tool.output && tool.output.s3Paths) {
              const imageUrls = await Promise.all(
                tool.output.s3Paths.map(async (s3Path) => {
                  return getPresignedUrl(s3Path, courseName)
                }),
              )
              tool.output.imageUrls = tool.output.imageUrls
                ? [...tool.output.imageUrls, ...imageUrls]
                : imageUrls
            }
            if (
              tool.aiGeneratedArgumentValues &&
              tool.aiGeneratedArgumentValues?.image_urls
            ) {
              const validUrls = await Promise.all(
                JSON.parse(tool.aiGeneratedArgumentValues.image_urls).map(
                  async (imageUrl: string) => {
                    const isValid = await checkIfUrlIsValid(imageUrl)
                    if (!isValid) {
                      console.log('Image URL is expired')
                      const s3_path = extractPathFromUrl(imageUrl)
                      return getPresignedUrl(s3_path, courseName)
                    }
                    return imageUrl
                  },
                ),
              )
              tool.aiGeneratedArgumentValues.image_urls =
                JSON.stringify(validUrls)
            }
            if (tool.output && tool.output.imageUrls) {
              const validUrls = await Promise.all(
                tool.output.imageUrls.map(async (imageUrl) => {
                  const isValid = await checkIfUrlIsValid(imageUrl)
                  if (!isValid) {
                    console.log('Image URL is expired')
                    const s3_path = extractPathFromUrl(imageUrl)
                    return getPresignedUrl(s3_path, courseName)
                  }
                  return imageUrl
                }),
              )
              tool.output.imageUrls = validUrls
            }
          }
        }
      }

      processTools()
    }, [message.tools])

    useEffect(() => {
      let isMounted = true

      const loadThumbnails = async () => {
        if (!Array.isArray(message.contexts) || message.contexts.length === 0)
          return

        const seenSources = new Set<string>()
        const uniqueContexts = message.contexts.filter((context) => {
          const sourceKey = context.s3_path || context.url
          if (!sourceKey || seenSources.has(sourceKey)) return false
          seenSources.add(sourceKey)
          return true
        })

        const thumbnails = await Promise.all(
          uniqueContexts.slice(0, 5).map(async (context) => {
            const fileType = getFileType(context.s3_path, context.url)

            if (fileType === 'pdf' && courseName) {
              const thumbnailPath = context.s3_path!.replace(
                '.pdf',
                '-pg1-thumb.png',
              )
              try {
                const presignedUrl = await fetchPresignedUrl(
                  thumbnailPath,
                  courseName,
                )
                return presignedUrl as string
              } catch (e) {
                console.error('Failed to fetch thumbnail:', e)
                return null
              }
            } else if (fileType === 'web' && context.url) {
              try {
                const urlObj = new URL(context.url)
                return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
              } catch (e) {
                console.error('Failed to get favicon:', e)
                return null
              }
            }
            return null
          }),
        )

        if (isMounted) {
          setSourceThumbnails(
            thumbnails.filter((url): url is string => url !== null),
          )
        }
      }

      loadThumbnails()

      return () => {
        isMounted = false
      }
    }, [message.contexts, courseName])

    async function replaceExpiredLinksInText(
      text: string | undefined,
    ): Promise<string> {
      if (!text) return ''

      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
      let match
      let finalText = text

      while ((match = linkRegex.exec(text)) !== null) {
        try {
          const fullMatch = match[0]
          const citationText = match[1] || ''
          let linkUrl = match[2]

          linkUrl = decodeHtmlEntities(linkUrl)

          if (!citationText.includes('|')) {
            continue
          }

          if (!linkUrl) {
            continue
          }

          const url = new URL(linkUrl)

          if (
            !url.hostname.includes('s3') &&
            !url.hostname.includes('amazonaws')
          ) {
            continue
          }

          const pageNumber = url.hash || ''
          url.hash = ''

          const refreshed = await refreshS3LinkIfExpired(
            url.toString(),
            courseName,
          )

          if (refreshed !== url.toString()) {
            const newUrl = pageNumber ? `${refreshed}${pageNumber}` : refreshed
            const escapedFullMatch = fullMatch.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&',
            )
            finalText = finalText.replace(
              new RegExp(escapedFullMatch, 'g'),
              `[${citationText}](${newUrl})`,
            )
          }
        } catch (error) {
          console.error('Error processing link:', error)
          continue
        }
      }

      return finalText
    }

    async function refreshS3LinkIfExpired(
      originalLink: string,
      courseName: string,
    ): Promise<string> {
      try {
        const urlObject = new URL(originalLink)

        const isS3Presigned = urlObject.searchParams.has('X-Amz-Signature')
        if (!isS3Presigned) {
          return originalLink
        }

        dayjs.extend(utc)
        let creationDateString = urlObject.searchParams.get(
          'X-Amz-Date',
        ) as string

        if (!creationDateString) {
          return await getNewPresignedUrl(originalLink, courseName)
        }

        creationDateString = creationDateString.replace(
          /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
          '$1-$2-$3T$4:$5:$6Z',
        )

        const creationDate = dayjs.utc(
          creationDateString,
          'YYYY-MM-DDTHH:mm:ss[Z]',
        )
        const expiresInSecs = Number(
          urlObject.searchParams.get('X-Amz-Expires') || '0',
        )
        const expiryDate = creationDate.add(expiresInSecs, 'second')
        const now = dayjs()

        if (expiryDate.isBefore(now)) {
          return await getNewPresignedUrl(originalLink, courseName)
        }

        return originalLink
      } catch (error) {
        console.error('Failed to refresh S3 link:', error)
        return originalLink
      }
    }

    async function getNewPresignedUrl(
      originalLink: string,
      courseName: string,
    ): Promise<string> {
      const s3path = extractPathFromUrl(originalLink)
      return (await fetchPresignedUrl(s3path, courseName)) as string
    }

    useEffect(() => {
      async function refreshS3LinksInContent() {
        const contentToProcess = message.content

        if (Array.isArray(contentToProcess)) {
          const updatedContent = await Promise.all(
            contentToProcess.map(async (contentObj) => {
              if (contentObj.type === 'text') {
                const newText = messageIsStreaming
                  ? contentObj.text
                  : await replaceExpiredLinksInText(contentObj.text)
                return { ...contentObj, text: newText }
              }
              return contentObj
            }),
          )
          setLocalContent(updatedContent)
        } else if (typeof contentToProcess === 'string') {
          const { thoughts, remainingContent } =
            extractThinkTagContent(contentToProcess)
          if (thoughts) {
            const processedThoughts = messageIsStreaming
              ? thoughts
              : await replaceExpiredLinksInText(thoughts)
            const processedContent = messageIsStreaming
              ? remainingContent
              : await replaceExpiredLinksInText(remainingContent)
            setLocalContent(
              `<think>${processedThoughts}</think>${processedContent}`,
            )
          } else {
            const newText = messageIsStreaming
              ? contentToProcess
              : await replaceExpiredLinksInText(contentToProcess)
            setLocalContent(newText)
          }
        }
      }
      refreshS3LinksInContent()
    }, [message.content, messageIsStreaming])

    const renderContent = () => {
      let contentToRender = ''
      let thoughtsContent = null

      if (typeof localContent === 'string') {
        const { thoughts, remainingContent } =
          extractThinkTagContent(localContent)
        thoughtsContent = thoughts
        contentToRender = remainingContent
      } else if (Array.isArray(localContent)) {
        contentToRender = localContent
          .filter((content) => content.type === 'text')
          .map((content) => content.text)
          .join(' ')
        const { thoughts, remainingContent } =
          extractThinkTagContent(contentToRender)
        thoughtsContent = thoughts
        contentToRender = remainingContent
      }

      return (
        <>
          {thoughtsContent && (
            <ThinkTagDropdown
              content={
                messageIsStreaming &&
                messageIndex ===
                  (selectedConversation?.messages.length ?? 0) - 1
                  ? `${thoughtsContent} ▍`
                  : thoughtsContent
              }
              isStreaming={
                messageIsStreaming &&
                messageIndex ===
                  (selectedConversation?.messages.length ?? 0) - 1 &&
                !contentToRender
              }
            />
          )}
          {contentToRender && (
            <MemoizedReactMarkdown
              className="linkMarkDown supMarkDown codeBlock prose mb-2 flex-1 flex-col items-start space-y-2 text-gray-800"
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeMathjax]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const text = String(children)

                  const linkRegex = /\[[^\]]+\]\([^)]+\)/

                  if (linkRegex.test(text)) {
                    return (
                      <MemoizedReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeMathjax]}
                      >
                        {text}
                      </MemoizedReactMarkdown>
                    )
                  }

                  if (children.length) {
                    if (children[0] == '▍') {
                      return (
                        <span className="mt-1 animate-pulse cursor-default">
                          ▍
                        </span>
                      )
                    }

                    children[0] = (children[0] as string).replace('`▍`', '▍')
                  }

                  const match = /language-(\w+)/.exec(className || '')

                  return !inline ? (
                    <CodeBlock
                      key={Math.random()}
                      language={(match && match[1]) || ''}
                      value={String(children).replace(/\n$/, '')}
                      style={{
                        maxWidth: '100%',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                      }}
                      {...props}
                    />
                  ) : (
                    <code
                      className={'codeBlock'}
                      {...props}
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {children}
                    </code>
                  )
                },
                p({ node, children }) {
                  return (
                    <p
                      className={`self-start text-base font-normal ${montserrat_paragraph.variable} pb-2 font-montserratParagraph`}
                    >
                      {children}
                    </p>
                  )
                },
                ul({ children }) {
                  return (
                    <ul
                      className={`text-base font-normal ${montserrat_paragraph.variable} font-montserratParagraph`}
                    >
                      {children}
                    </ul>
                  )
                },
                ol({ children }) {
                  return (
                    <ol
                      className={`text-base font-normal ${montserrat_paragraph.variable} ml-4 font-montserratParagraph lg:ml-6`}
                    >
                      {children}
                    </ol>
                  )
                },
                li({ children }) {
                  return (
                    <li
                      className={`text-base font-normal ${montserrat_paragraph.variable} break-words font-montserratParagraph`}
                    >
                      {children}
                    </li>
                  )
                },
                table({ children }) {
                  return (
                    <table className="border-collapse border border-gray-300 px-3 py-1">
                      {children}
                    </table>
                  )
                },
                th({ children }) {
                  return (
                    <th className="break-words border border-gray-300 bg-gray-500 px-3 py-1 text-white">
                      {children}
                    </th>
                  )
                },
                td({ children }) {
                  return (
                    <td className="break-words border border-gray-300 px-3 py-1">
                      {children}
                    </td>
                  )
                },
                h1({ node, children }) {
                  return (
                    <h1
                      className={`text-4xl font-bold ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      {children}
                    </h1>
                  )
                },
                h2({ node, children }) {
                  return (
                    <h2
                      className={`text-3xl font-bold ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      {children}
                    </h2>
                  )
                },
                h3({ node, children }) {
                  return (
                    <h3
                      className={`text-2xl font-bold ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      {children}
                    </h3>
                  )
                },
                h4({ node, children }) {
                  return (
                    <h4
                      className={`text-lg font-bold ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      {children}
                    </h4>
                  )
                },
                h5({ node, children }) {
                  return (
                    <h5
                      className={`text-base font-bold ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      {children}
                    </h5>
                  )
                },
                h6({ node, children }) {
                  return (
                    <h6
                      className={`text-base font-bold ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      {children}
                    </h6>
                  )
                },
                a({ node, className, children, ...props }) {
                  return <MarkdownLink {...props}>{children}</MarkdownLink>
                },
              }}
            >
              {messageIsStreaming &&
              messageIndex === (selectedConversation?.messages.length ?? 0) - 1
                ? `${contentToRender} ▍`
                : contentToRender}
            </MemoizedReactMarkdown>
          )}

          {message.role === 'assistant' && message.isThinking && (
            <div className="mt-2 flex items-center gap-2 text-orange-500">
              <IconBrain size={16} className="animate-pulse" />
              <span className={`text-sm ${montserrat_paragraph.variable} font-montserratParagraph`}>
                Thinking...
              </span>
            </div>
          )}
        </>
      )
    }

    const MarkdownLink: React.FC<{
      href?: string
      title?: string
      children: React.ReactNode
    }> = ({ href, title, children }) => {
      const firstChild =
        children && Array.isArray(children) ? children[0] : null
      const isValidCitation =
        typeof firstChild === 'string' &&
        (firstChild.includes('Source') ||
          (message.contexts?.some(
            (ctx) =>
              ctx.readable_filename &&
              firstChild.includes(ctx.readable_filename),
          ) ??
            false))

      const handleClick = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation()
          e.preventDefault()
          if (href) {
            window.open(href, '_blank')?.focus()
          }
        },
        [href],
      )

      const commonProps = {
        id: 'styledLink',
        href,
        target: '_blank',
        rel: 'noopener noreferrer',
        title,
        onMouseUp: handleClick,
        onClick: (e: React.MouseEvent) => e.preventDefault(),
        style: { pointerEvents: 'all' as const },
      }

      if (isValidCitation) {
        return (
          <a {...commonProps} className={'supMarkdown'}>
            {children}
          </a>
        )
      } else {
        return (
          <a {...commonProps} className={'linkMarkDown'}>
            {children}
          </a>
        )
      }
    }

    const [isRegenerating, setIsRegenerating] = useState(false)

    const handleRegenerate = () => {
      if (onRegenerate) {
        setIsRegenerating(true)
        onRegenerate(message, messageIndex)
        setTimeout(() => setIsRegenerating(false), 1000)
      }
    }

    return (
      <>
        <div
          className={`group ${
            message.role === 'assistant'
              ? 'bg-white'
              : 'bg-white'
          } max-w-[100%]`}
          style={{ overflowWrap: 'anywhere' }}
        >
          <div className={`relative flex gap-3 text-base px-4 py-6 md:px-6 ${
            message.role === 'assistant' 
              ? 'w-full md:mx-auto md:max-w-4xl'
              : 'w-full md:mx-auto md:max-w-4xl'
          }`}>
            {/* User Avatar */}
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">U</span>
              </div>
            )}

            {/* Assistant Avatar */}
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <IconRobot size={18} className="text-blue-600" />
              </div>
            )}

            <div className={`flex-1 min-w-0`}>
              {message.role === 'user' ? (
                <div className="flex w-full flex-col">
                  {isEditing ? (
                    <div className="flex w-full flex-col">
                      <textarea
                        ref={textareaRef}
                        className="w-full resize-none whitespace-pre-wrap rounded-md border border-gray-300 bg-white p-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        value={messageContent}
                        onChange={handleInputChange}
                        onKeyDown={handlePressEnter}
                        onCompositionStart={() => setIsTyping(true)}
                        onCompositionEnd={() => setIsTyping(false)}
                        style={{
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          lineHeight: 'inherit',
                          minHeight: '100px',
                        }}
                      />
                      <div className="mt-4 flex justify-end space-x-3">
                        <button
                          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                          onClick={() => {
                            setMessageContent(messageContent)
                            setIsEditing(false)
                          }}
                        >
                          <IconX size={16} />
                          {t('Cancel')}
                        </button>
                        <button
                          className="flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={handleEditMessage}
                          disabled={messageContent.trim().length <= 0}
                        >
                          <IconCheck size={16} />
                          {t('Save & Submit')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-full flex-1">
                        {Array.isArray(message.content) ? (
                          <>
                            <div className="mb-2 flex w-full flex-col items-start space-y-2">
                              {/* User message text for all messages */}
                              {message.content.map((content, index) => {
                                if (content.type === 'text') {
                                  if (
                                    !(content.text as string)
                                      .trim()
                                      .startsWith('Image description:')
                                  ) {
                                    return (
                                      <p
                                        key={index}
                                        className={`text-base font-normal ${montserrat_paragraph.variable} font-montserratParagraph text-gray-800 leading-relaxed`}
                                      >
                                        {content.text}
                                      </p>
                                    )
                                  }
                                }
                              })}
                              {/* Image previews for all messages */}
                              <div className="-m-1 flex w-full flex-wrap justify-start">
                                {message.content
                                  .filter((item) => item.type === 'image_url')
                                  .map((content, index) => (
                                    <div
                                      key={index}
                                      className={classes.imageContainerStyle}
                                    >
                                      <div className="overflow-hidden rounded-lg shadow-lg">
                                        <ImagePreview
                                          src={
                                            Array.from(imageUrls)[
                                              index
                                            ] as string
                                          }
                                          alt="Chat message"
                                          className={classes.imageStyle}
                                        />
                                      </div>
                                    </div>
                                  ))}
                              </div>

                              {/* Image description loading state for last message */}
                              {isImg2TextLoading &&
                                (messageIndex ===
                                  (selectedConversation?.messages.length ?? 0) -
                                    1 ||
                                  messageIndex ===
                                    (selectedConversation?.messages.length ??
                                      0) -
                                      2) && (
                                  <IntermediateStateAccordion
                                    accordionKey="imageDescription"
                                    title="Image Description"
                                    isLoading={isImg2TextLoading}
                                    error={false}
                                    content={
                                      message.content.find(
                                        (content) =>
                                          content.type === 'text' &&
                                          content.text
                                            ?.trim()
                                            .startsWith('Image description:'),
                                      )?.text ?? 'No image description found'
                                    }
                                  />
                                )}

                              {/* Image description for all messages */}
                              {message.content.some(
                                (content) =>
                                  content.type === 'text' &&
                                  content.text
                                    ?.trim()
                                    .startsWith('Image description:'),
                              ) && (
                                <IntermediateStateAccordion
                                  accordionKey="imageDescription"
                                  title="Image Description"
                                  isLoading={false}
                                  error={false}
                                  content={
                                    message.content.find(
                                      (content) =>
                                        content.type === 'text' &&
                                        content.text
                                          ?.trim()
                                          .startsWith('Image description:'),
                                    )?.text ?? 'No image description found'
                                  }
                                />
                              )}
                            </div>
                          </>
                        ) : (
                          <span className={`text-base font-normal ${montserrat_paragraph.variable} font-montserratParagraph text-gray-800 leading-relaxed`}>{message.content}</span>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="mt-2 flex items-center justify-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip
                            label="Edit Message"
                            position="bottom"
                            withArrow
                            arrowSize={6}
                            transitionProps={{
                              transition: 'fade',
                              duration: 200,
                            }}
                            classNames={{
                              tooltip:
                                'bg-gray-700 text-white text-sm py-1 px-2',
                              arrow: 'border-gray-700',
                            }}
                          >
                            <button
                              className={`text-gray-400 hover:text-gray-600 transition-colors ${Array.isArray(message.content) && message.content.some((content) => content.type === 'image_url') ? 'hidden' : ''}`}
                              onClick={toggleEditing}
                            >
                              <IconEdit size={18} />
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex w-full flex-col">
                  {/* Tool executions at the top */}
                  {!(messageIsStreaming && messageIndex === (selectedConversation?.messages.length ?? 0) - 1) && (
                    <ToolExecutionDisplay 
                      toolExecutions={(message.toolExecutions && message.toolExecutions.length > 0) ? message.toolExecutions : loadedToolExecutions}
                      isThinking={message.isThinking}
                      isRunningTool={false}
                    />
                  )}

                  {/* AI response text */}
                  <div className="w-full max-w-full flex-1 overflow-hidden leading-relaxed">
                    {renderContent()}
                    {messageIsStreaming && messageIndex === (selectedConversation?.messages.length ?? 0) - 1 && (
                      <span className="inline-block w-0.5 h-4 bg-blue-500 ml-1 animate-pulse align-middle" />
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {message.contexts &&
                      message.contexts.length > 0 &&
                      !(
                        messageIsStreaming &&
                        messageIndex ===
                          (selectedConversation?.messages.length ?? 0) - 1
                      ) &&
                      !(
                        loading &&
                        messageIndex ===
                          (selectedConversation?.messages.length ?? 0) - 1
                      ) && (
                        <div className="relative z-0 mb-1 flex justify-start">
                          <button
                            className="group/button relative flex items-center gap-0 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/50 hover:text-gray-900"
                            onClick={() => handleSourcesSidebarToggle(true)}
                          >
                            <span className="whitespace-nowrap">
                              Sources
                              <span className="ml-0.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 group-hover/button:bg-orange-100 group-hover/button:text-orange-600">
                                {message.contexts.length}
                              </span>
                            </span>

                            {sourceThumbnails.length > 0 && (
                              <div className="flex items-center">
                                <div className="ml-0.5 mr-1 h-4 border-l border-gray-300"></div>
                                <div className="relative flex">
                                  {sourceThumbnails.map((thumbnail, index) => (
                                    <div
                                      key={index}
                                      className="relative h-7 w-7 overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-sm transition-transform duration-200 group-hover/button:shadow"
                                      style={{
                                        marginLeft:
                                          index > 0 ? '-0.75rem' : '0',
                                        zIndex: index,
                                        transform: `rotate(${index % 2 === 0 ? '-1deg' : '1deg'})`,
                                      }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover/button:opacity-100"></div>
                                      <img
                                        src={thumbnail}
                                        alt={`Source ${index + 1}`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none'
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </button>
                        </div>
                      )}

                    {!(
                      messageIsStreaming &&
                      messageIndex ===
                        (selectedConversation?.messages.length ?? 0) - 1
                    ) &&
                      !(
                        loading &&
                        messageIndex ===
                          (selectedConversation?.messages.length ?? 0) - 1
                      ) && (
                        <div className="flex items-center justify-start gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip
                            label={messagedCopied ? 'Copied!' : 'Copy'}
                            position="bottom"
                            withArrow
                            arrowSize={6}
                            transitionProps={{
                              transition: 'fade',
                              duration: 200,
                            }}
                            classNames={{
                              tooltip:
                                'bg-gray-700 text-white text-sm py-1 px-2',
                              arrow: 'border-gray-700',
                            }}
                          >
                            <button
                              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                              onClick={copyOnClick}
                            >
                              {messagedCopied ? (
                                <IconCheck
                                  size={16}
                                  className="text-green-500"
                                />
                              ) : (
                                <IconCopy size={16} />
                              )}
                            </button>
                          </Tooltip>
                          <Tooltip
                            label={
                              isThumbsUp
                                ? 'Remove Good Response'
                                : 'Good Response'
                            }
                            position="bottom"
                            withArrow
                            arrowSize={6}
                            transitionProps={{
                              transition: 'fade',
                              duration: 200,
                            }}
                            classNames={{
                              tooltip:
                                'bg-gray-700 text-white text-sm py-1 px-2',
                              arrow: 'border-gray-700',
                            }}
                          >
                            <button
                              className={`transition-colors p-1 rounded ${
                                isThumbsUp ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
                              }`}
                              onClick={handleThumbsUp}
                            >
                              {isThumbsUp ? (
                                <IconThumbUpFilled size={16} />
                              ) : (
                                <IconThumbUp size={16} />
                              )}
                            </button>
                          </Tooltip>
                          <Tooltip
                            label={
                              isThumbsDown
                                ? 'Remove Bad Response'
                                : 'Bad Response'
                            }
                            position="bottom"
                            withArrow
                            arrowSize={6}
                            transitionProps={{
                              transition: 'fade',
                              duration: 200,
                            }}
                            classNames={{
                              tooltip:
                                'bg-gray-700 text-white text-sm py-1 px-2',
                              arrow: 'border-gray-700',
                            }}
                          >
                            <button
                              className={`transition-colors p-1 rounded ${
                                isThumbsDown ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
                              }`}
                              onClick={handleThumbsDown}
                            >
                              {isThumbsDown ? (
                                <IconThumbDownFilled size={16} />
                              ) : (
                                <IconThumbDown size={16} />
                              )}
                            </button>
                          </Tooltip>
                          <Tooltip
                            label="Regenerate Response"
                            position="bottom"
                            withArrow
                            arrowSize={6}
                            transitionProps={{
                              transition: 'fade',
                              duration: 200,
                            }}
                            classNames={{
                              tooltip:
                                'bg-gray-700 text-white text-sm py-1 px-2',
                              arrow: 'border-gray-700',
                            }}
                          >
                            <button
                              className={`text-gray-400 hover:text-gray-600 transition-colors p-1 rounded ${isRegenerating ? 'animate-spin' : ''}`}
                              onClick={handleRegenerate}
                              disabled={isRegenerating}
                            >
                              <IconRepeat size={16} />
                            </button>
                          </Tooltip>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isSourcesSidebarOpen && (
          <SourcesSidebar
            isOpen={isSourcesSidebarOpen}
            contexts={message.contexts || []}
            onClose={handleSourcesSidebarClose}
            hideRightSidebarIcon={isAnySidebarOpen}
            courseName={courseName}
            citedSourceIndices={
              message.role === 'assistant' && message.content
                ? extractUsedCitationIndexes(message.content)
                : undefined
            }
          />
        )}

        {isFeedbackModalOpen && (
          <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            onSubmit={handleFeedbackSubmit}
          />
        )}
      </>
    )
  },
)
ChatMessage.displayName = 'ChatMessage'