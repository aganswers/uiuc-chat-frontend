// chatinput.tsx
import {
  IconArrowDown,
  IconPlayerStop,
  IconSend,
  IconPhoto,
  IconAlertCircle,
  IconX,
  IconRepeat,
} from '@tabler/icons-react'
import { Text } from '@mantine/core'
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useTranslation } from 'next-i18next'
import { Content, Message, MessageType } from '@/types/chat'
import { Plugin } from '@/types/plugin'
import { Prompt } from '@/types/prompt'

import HomeContext from '~/pages/api/home/home.context'

import { PluginSelect } from './PluginSelect'
import { PromptList } from './PromptList'
import { VariableModal } from './VariableModal'

import { notifications } from '@mantine/notifications'
import { useMantineTheme, Tooltip } from '@mantine/core'

import React from 'react'

import { CSSProperties } from 'react'

import { fetchPresignedUrl, uploadToS3 } from 'src/utils/apiUtils'
import { ImagePreview } from './ImagePreview'
import { montserrat_heading } from 'fonts'
import { useMediaQuery } from '@mantine/hooks'
import ChatUI, {
  WebllmModel,
  webLLMModels,
} from '~/utils/modelProviders/WebLLM'
import {
  selectBestModel,
  VisionCapableModels,
} from '~/utils/modelProviders/LLMProvider'
import { OpenAIModelID } from '~/utils/modelProviders/types/openai'
import { UserSettings } from '~/components/Chat/UserSettings'
import { IconChevronRight } from '@tabler/icons-react'
import { findDefaultModel } from '../UIUC-Components/api-inputs/LLMsApiKeyInputForm'
import { showConfirmationToast } from '../UIUC-Components/api-inputs/LLMsApiKeyInputForm'

import { montserrat_paragraph } from '../../../fonts'

const montserrat_med = montserrat_paragraph

interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void
  onScrollDownClick: () => void
  stopConversationRef: MutableRefObject<boolean>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
  showScrollDownButton: boolean
  inputContent: string
  setInputContent: (content: string) => void
  courseName: string
  chat_ui?: ChatUI
  onRegenerate?: () => void
}

interface ProcessedImage {
  resizedFile: File
  dataUrl: string
}

export const ChatInput = ({
  onSend,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
  inputContent,
  setInputContent,
  courseName,
  chat_ui,
  onRegenerate,
}: Props) => {
  const { t } = useTranslation('chat')

  const {
    state: {
      selectedConversation,
      messageIsStreaming,
      prompts,
      showModelSettings,
      llmProviders,
    },

    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const [content, setContent] = useState<string>(() => inputContent)
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [showPromptList, setShowPromptList] = useState(false)
  const [activePromptIndex, setActivePromptIndex] = useState(0)
  const [promptInputValue, setPromptInputValue] = useState('')
  const [variables, setVariables] = useState<string[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [showPluginSelect, setShowPluginSelect] = useState(false)
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const imageUploadRef = useRef<HTMLInputElement | null>(null)
  const promptListRef = useRef<HTMLUListElement | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const chatInputContainerRef = useRef<HTMLDivElement>(null)
  const chatInputParentContainerRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const modelSelectContainerRef = useRef<HTMLDivElement | null>(null)

  const handleFocus = () => {
    setIsFocused(true)
    if (chatInputParentContainerRef.current) {
      chatInputParentContainerRef.current.style.boxShadow = `0 0 2px rgba(234, 88, 12, 1)`
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (chatInputParentContainerRef.current) {
      chatInputParentContainerRef.current.style.boxShadow = 'none'
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    )

    if (files.length > 0) {
      handleImageUpload(files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleTextClick = () => {
    console.log('handleTextClick')
    homeDispatch({
      field: 'showModelSettings',
      value: !showModelSettings,
    })
  }

  const removeButtonStyle: CSSProperties = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#6B7280', // Changed to gray-500
    color: 'white', // White icon color
    border: '2px solid white', // White border
    cursor: 'pointer',
    zIndex: 2,
  }

  const removeButtonHoverStyle: CSSProperties = {
    backgroundColor: '#4B5563', // gray-600 for hover state
  }

  // Dynamically set the padding based on image previews presence
  const chatInputContainerStyle: CSSProperties = {
    paddingTop: imagePreviewUrls.length > 0 ? '10px' : '0',
    paddingRight: imagePreviewUrls.length > 0 ? '10px' : '0',
    paddingBottom: '0',
    paddingLeft: '10px',
  }

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // TODO: Update this to use tokens, instead of characters
    const value = e.target.value
    const maxLength = selectedConversation?.model?.tokenLimit

    if (maxLength && value.length > maxLength) {
      alert(
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      )
      return
    }

    setContent(value)
    updatePromptListVisibility(value)
  }
  // Assuming Message, Role, and Plugin types are already defined in your codebase

  type Role = 'user' | 'system' // Add other roles as needed

  const handleSend = async () => {
    if (messageIsStreaming) {
      return
    }

    const textContent = content
    let imageContent: Content[] = [] // Explicitly declare the type for imageContent

    if (imageFiles.length > 0 && !uploadingImage) {
      setUploadingImage(true)
      try {
        // If imageUrls is empty, upload all images and get their URLs
        const imageUrlsToUse =
          imageUrls.length > 0
            ? imageUrls
            : await Promise.all(
                imageFiles.map((file) =>
                  uploadImageAndGetUrl(file, courseName),
                ),
              )

        // Construct image content for the message
        imageContent = imageUrlsToUse
          .filter((url): url is string => url !== '') // Type-guard to filter out empty strings
          .map((url) => ({
            type: 'image_url',
            image_url: { url },
          }))

        // console.log("Final imageUrls: ", imageContent)

        // Clear the files after uploading
        setImageFiles([])
        setImagePreviewUrls([])
        setImageUrls([])
      } catch (error) {
        console.error('Error uploading files:', error)
        setImageError('Error uploading files')
      } finally {
        setUploadingImage(false)
      }
    }

    if (!textContent && imageContent.length === 0) {
      alert(t('Please enter a message or upload an image'))
      return
    }

    // Construct the content array
    const contentArray: Content[] = [
      ...(textContent
        ? [{ type: 'text' as MessageType, text: textContent }]
        : []),
      ...imageContent,
    ]

    // Create a structured message for GPT-4 Vision
    const messageForGPT4Vision: Message = {
      id: uuidv4(),
      role: 'user',
      content: contentArray,
    }

    // Use the onSend prop to send the structured message
    onSend(messageForGPT4Vision, plugin) // Cast to unknown then to Message if needed

    // Reset states
    setContent('')
    setPlugin(null)
    setImagePreviews([])
    setImageUrls([])
    setImageFiles([])
    setImagePreviewUrls([])

    if (imageUploadRef.current) {
      imageUploadRef.current.value = ''
    }
  }

  const handleStopConversation = () => {
    stopConversationRef.current = true
    setTimeout(() => {
      stopConversationRef.current = false
    }, 1000)
  }

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i
    return mobileRegex.test(userAgent)
  }

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex]
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        )
        return newContent
      })
      handlePromptSelect(selectedPrompt)
    }
    setShowPromptList(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        )
      } else if (e.key === 'Tab') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleInitModal()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowPromptList(false)
      } else {
        setActivePromptIndex(0)
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault()
      setShowPluginSelect(!showPluginSelect)
    }
  }

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g
    const foundVariables = []
    let match

    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1])
    }

    return foundVariables
  }

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/)

    if (match) {
      setShowPromptList(true)
      setPromptInputValue(match[0].slice(1))
    } else {
      setShowPromptList(false)
      setPromptInputValue('')
    }
  }, [])

  const handlePromptSelect = useCallback(
    (prompt: Prompt) => {
      const parsedVariables = parseVariables(prompt.content)
      const filteredVariables = parsedVariables.filter(
        (variable) => variable !== undefined,
      ) as string[]
      setVariables(filteredVariables)

      if (filteredVariables.length > 0) {
        setIsModalVisible(true)
      } else {
        setContent((prevContent) => {
          const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content)
          return updatedContent
        })
        updatePromptListVisibility(prompt.content)
      }
    },
    [parseVariables, setContent, updatePromptListVisibility],
  )

  const handleSubmit = async () => {
    if (messageIsStreaming) {
      return
    }

    try {
      // ... existing image handling code ...

      const response = await fetch('/api/chat-api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: selectedConversation,
          // key: apiKey,
          course_name: courseName,
          // courseMetadata: courseMetadata,
          stream: true,
          // llmProviders: llmProviders,
        }),
      })

      if (!response.ok) {
        const errorResponse = await response.json()
        const errorMessage =
          errorResponse.error ||
          'An error occurred while processing your request'
        notifications.show({
          message: errorMessage,
          color: 'red',
        })
        return
      }

      // ... rest of success handling ...
    } catch (error) {
      console.error('Error in chat submission:', error)
      notifications.show({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send message. Please try again.',
        color: 'red',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  // https://platform.openai.com/docs/guides/vision/what-type-of-files-can-i-upload
  const validImageTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

  const isImageValid = (fileName: string): boolean => {
    const ext = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase()
    return validImageTypes.includes(`.${ext}`)
  }

  const showToastOnInvalidImage = useCallback(() => {
    notifications.show({
      id: 'error-notification',
      withCloseButton: true,
      onClose: () => console.log('error unmounted'),
      onOpen: () => console.log('error mounted'),
      autoClose: 8000,
      title: 'Invalid Image Type',
      message: 'Unsupported file type. Please upload .jpg or .png images.',
      color: 'red',
      radius: 'lg',
      icon: <IconAlertCircle />,
      className: 'my-notification-class',
      style: { backgroundColor: '#ffffff' },
      withBorder: true,
      loading: false,
    })
  }, [])

  const handleImageUpload = useCallback(
    async (files: File[]) => {
      // TODO: FIX IMAGE UPLOADS ASAP
      // showConfirmationToast({
      //   title: `😢 We can't handle all these images...`,
      //   message: `Image uploads are temporarily disabled. I'm really sorry, I'm working on getting them back. Email me if you want to complain: kvday2@illinois.edu`,
      //   isError: true,
      //   autoClose: 10000,
      // })

      // Clear any selected files
      if (imageUploadRef.current) {
        imageUploadRef.current.value = ''
      }
      // return // Exit early to prevent processing

      const validFiles = files.filter((file) => isImageValid(file.name))
      const invalidFilesCount = files.length - validFiles.length

      if (invalidFilesCount > 0) {
        setImageError(
          `${invalidFilesCount} invalid file type(s). Please upload .jpg or .png images.`,
        )
        showToastOnInvalidImage()
      }

      const imageProcessingPromises = validFiles.map((file) =>
        processAndUploadImage(file),
      )

      try {
        const processedImages = await Promise.all(imageProcessingPromises)
        const newImageFiles = processedImages.map((img) => img.resizedFile)
        const newImagePreviewUrls = processedImages.map((img) => img.dataUrl)
        const newImageUrls = processedImages.map((img) => img.uploadedUrl)

        setImageFiles((prev) => [...prev, ...newImageFiles])
        setImagePreviewUrls((prev) => [...prev, ...newImagePreviewUrls])
        setImageUrls((prev) => [...prev, ...newImageUrls.filter(Boolean)])
      } catch (error) {
        console.error('Error processing files:', error)
      }
    },
    [
      setImageError,
      setImageFiles,
      setImagePreviewUrls,
      setImageUrls,
      showToastOnInvalidImage,
      courseName,
    ],
  )

  async function processAndUploadImage(
    file: File,
  ): Promise<ProcessedImage & { uploadedUrl: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onloadend = async () => {
        const result = reader.result
        if (typeof result === 'string') {
          const img = new Image()
          img.src = result

          img.onload = async () => {
            const { newWidth, newHeight } = calculateDimensions(img)
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (ctx) {
              canvas.width = newWidth
              canvas.height = newHeight
              ctx.drawImage(img, 0, 0, newWidth, newHeight)

              canvas.toBlob(
                async (blob) => {
                  if (blob) {
                    const resizedFile = new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    })

                    const uploadedUrl = await uploadImageAndGetUrl(
                      resizedFile,
                      courseName,
                    )
                    resolve({
                      resizedFile,
                      dataUrl: canvas.toDataURL('image/jpeg'),
                      uploadedUrl,
                    })
                  } else {
                    reject(new Error('Canvas toBlob failed'))
                  }
                },
                'image/jpeg',
                0.9,
              )
            } else {
              reject(new Error('Canvas Context is null'))
            }
          }
        } else {
          reject(new Error('FileReader did not return a string result'))
        }
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function calculateDimensions(img: HTMLImageElement): {
    newWidth: number
    newHeight: number
  } {
    const MAX_WIDTH = 2048
    const MAX_HEIGHT = 2048
    const MIN_SIDE = 768

    let newWidth, newHeight
    if (img.width > img.height) {
      newHeight = MIN_SIDE
      newWidth = (img.width / img.height) * newHeight
      if (newWidth > MAX_WIDTH) {
        newWidth = MAX_WIDTH
        newHeight = (img.height / img.width) * newWidth
      }
    } else {
      newWidth = MIN_SIDE
      newHeight = (img.height / img.width) * newWidth
      if (newHeight > MAX_HEIGHT) {
        newHeight = MAX_HEIGHT
        newWidth = (img.width / img.height) * newHeight
      }
    }
    return { newWidth, newHeight }
  }

  // Function to open the modal with the selected image
  const openModal = (imageSrc: string) => {
    setSelectedImage(imageSrc)
    setIsModalOpen(true)
  }

  const theme = useMantineTheme()

  useEffect(() => {
    if (
      !VisionCapableModels.has(selectedConversation?.model?.id as OpenAIModelID)
    ) {
      return // Exit early if the model is not GPT-4 Vision
    }

    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
    }

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (
        e.dataTransfer &&
        e.dataTransfer.items &&
        e.dataTransfer.items.length > 0
      ) {
        const files = Array.from(e.dataTransfer.items)
          .filter((item) => item.kind === 'file')
          .map((item) => item.getAsFile())
          .filter((file) => file !== null) as File[]
        if (files.length > 0) {
          handleImageUpload(files)
        }
      }
    }

    const handleDocumentDragLeave = (e: DragEvent) => {
      setIsDragging(false)
    }

    document.addEventListener('dragover', handleDocumentDragOver)
    document.addEventListener('drop', handleDocumentDrop)
    document.addEventListener('dragleave', handleDocumentDragLeave)

    return () => {
      // Clean up the event listeners when the component is unmounted
      document.removeEventListener('dragover', handleDocumentDragOver)
      document.removeEventListener('drop', handleDocumentDrop)
      document.removeEventListener('dragleave', handleDocumentDragLeave)
    }
  }, [handleImageUpload, selectedConversation?.model?.id])

  useEffect(() => {
    if (imageError) {
      showToastOnInvalidImage()
      setImageError(null)
    }
  }, [imageError, showToastOnInvalidImage])

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30
    }
  }, [activePromptIndex])

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit'
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`
      textareaRef.current.style.overflow = `${
        textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
      }`
    }
  }, [content])

  useEffect(() => {
    const handleFocus = () => {
      if (chatInputParentContainerRef.current) {
        chatInputParentContainerRef.current.style.boxShadow = `0 0 2px rgba(234, 88, 12, 1)`
      }
    }

    const handleBlur = () => {
      if (chatInputParentContainerRef.current) {
        chatInputParentContainerRef.current.style.boxShadow = 'none'
      }
    }

    const textArea = textareaRef.current
    textArea?.addEventListener('focus', handleFocus)
    textArea?.addEventListener('blur', handleBlur)

    return () => {
      textArea?.removeEventListener('focus', handleFocus)
      textArea?.removeEventListener('blur', handleBlur)
    }
  }, [textareaRef, chatInputParentContainerRef, isFocused])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false)
      }
    }

    window.addEventListener('click', handleOutsideClick)

    return () => {
      window.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  useEffect(() => {
    // This will focus the div as soon as the component mounts
    if (chatInputContainerRef.current) {
      chatInputContainerRef.current.focus()
    }
  }, [])

  useEffect(() => {
    setContent(inputContent)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [inputContent, textareaRef])

  // This is where we upload images and generate their presigned url
  async function uploadImageAndGetUrl(
    file: File,
    courseName: string,
  ): Promise<string> {
    try {
      const uploadedImageUrl = await uploadToS3(file, courseName)
      const presignedUrl = await fetchPresignedUrl(
        uploadedImageUrl as string,
        courseName,
      )
      return presignedUrl as string
    } catch (error) {
      console.error('Upload failed for file', file.name, error)
      setImageError(`Upload failed for file: ${file.name}`)
      return ''
    }
  }

  // // Toggle to enable Fancy retrieval method: Multi-Query Retrieval
  // const [useMQRetrieval, setUseMQRetrieval] = useState(localStorage.getItem('UseMQRetrieval') === 'true');
  // // Update localStorage whenever useMQRetrieval changes
  // useEffect(() => {
  //   localStorage.setItem('UseMQRetrieval', useMQRetrieval ? 'true' : 'false');
  // }, [useMQRetrieval]);

  // Debounce the resize handler to avoid too frequent updates
  const handleResize = useCallback(() => {
    if (textareaRef.current) {
      // Reset height to auto to recalculate
      textareaRef.current.style.height = 'auto'
      // Set new height based on scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      // Update overflow if needed
      textareaRef.current.style.overflow =
        textareaRef.current.scrollHeight > 400 ? 'auto' : 'hidden'
    }
  }, [])

  // Add resize observer effect
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Create resize observer
    const resizeObserver = new ResizeObserver(handleResize)

    // Observe both the textarea and window resize events
    resizeObserver.observe(textarea)
    window.addEventListener('resize', handleResize)

    // Initial size adjustment
    handleResize()

    // Cleanup
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  return (
    <div className="relative mx-2 flex w-full flex-grow flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Image Previews */}
      {imagePreviewUrls.length > 0 && (
        <div className="flex gap-2 p-3 pb-0">
          {imagePreviewUrls.map((url, index) => (
            <div key={index} className="relative">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="h-16 w-16 cursor-pointer rounded object-cover"
                onClick={() => {
                  setSelectedImage(url)
                  setIsModalOpen(true)
                }}
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-500 text-white hover:bg-gray-600"
              >
                <IconX size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end p-3">
        {/* Image Upload Button */}
        {VisionCapableModels.has(
          selectedConversation?.model?.id as OpenAIModelID,
        ) && (
          <div className="mr-2">
            <input
              ref={imageUploadRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files
                if (files) {
                  handleImageUpload(Array.from(files))
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => imageUploadRef.current?.click()}
              disabled={uploadingImage}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
              {uploadingImage ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
              ) : (
                <IconPhoto size={18} />
              )}
            </button>
          </div>
        )}

        {/* Main Input Area */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            className="chat-input w-full resize-none bg-transparent px-3 py-2 text-gray-900 placeholder-gray-500 outline-none focus:ring-0"
            style={{
              resize: 'none',
              minHeight: '24px',
              height: 'auto',
              maxHeight: '400px',
              overflow: 'hidden',
            }}
            placeholder="Message AgAnswers.ai"
            value={content}
            rows={1}
            onCompositionStart={() => setIsTyping(true)}
            onCompositionEnd={() => setIsTyping(false)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          />
        </div>

        {/* Send Button */}
        <div className="ml-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500"
            onClick={handleSend}
            disabled={!content.trim() || messageIsStreaming}
          >
            {messageIsStreaming ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <IconSend size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Scroll Down Button */}
      {showScrollDownButton && (
        <div className="absolute -top-14 right-4">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md"
            onClick={onScrollDownClick}
          >
            <IconArrowDown size={16} />
          </button>
        </div>
      )}

      {/* Regenerate Button */}
      {selectedConversation?.messages && selectedConversation.messages.length > 0 && (
        <div className="absolute -top-14 right-16">
          <button
            onClick={() => onRegenerate?.()}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md"
          >
            <IconRepeat size={16} />
          </button>
        </div>
      )}

      {/* Error Display */}
      {imageError && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
          <IconAlertCircle size={16} />
          {imageError}
        </div>
      )}

      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-orange-500 bg-orange-50">
          <div className="text-center">
            <IconPhoto
              size={32}
              className="mx-auto mb-2 text-orange-500"
            />
            <p className="text-sm font-medium text-orange-600">
              Drop images here to upload
            </p>
          </div>
        </div>
      )}

      {/* Plugin Select */}
      {showPluginSelect && (
        <div className="absolute bottom-full left-0 mb-2 rounded-lg border border-gray-200 bg-white shadow-lg">
          <PluginSelect
            plugin={plugin}
            onKeyDown={(e: any) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                setShowPluginSelect(false)
                textareaRef.current?.focus()
              }
            }}
            onPluginChange={(plugin: Plugin) => {
              setPlugin(plugin)
              setShowPluginSelect(false)
              if (textareaRef && textareaRef.current) {
                textareaRef.current.focus()
              }
            }}
          />
        </div>
      )}

      {/* Prompt List */}
      {showPromptList && filteredPrompts.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-full">
          <PromptList
            activePromptIndex={activePromptIndex}
            prompts={filteredPrompts}
            onSelect={handleInitModal}
            onMouseOver={setActivePromptIndex}
            promptListRef={promptListRef}
          />
        </div>
      )}

      {/* Variable Modal */}
      {isModalVisible && filteredPrompts[activePromptIndex] && (
        <VariableModal
          prompt={filteredPrompts[activePromptIndex]}
          variables={variables}
          onSubmit={handleSubmit}
          onClose={() => setIsModalVisible(false)}
        />
      )}

      {/* Image Preview Modal */}
      {isModalOpen && selectedImage && (
        <ImagePreview
          src={selectedImage}
        />
      )}
    </div>
  )
}
