import React, { useState, useCallback, useRef, useContext, useEffect } from 'react'
import { 
  IconSearch, 
  IconFileText, 
  IconCloud, 
  IconSeeding, 
  IconSend,
  IconPhoto,
  IconAlertCircle,
  IconX
} from '@tabler/icons-react'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { v4 as uuidv4 } from 'uuid'
import { useTranslation } from 'next-i18next'
import { Content, Message, MessageType } from '@/types/chat'
import { Plugin } from '@/types/plugin'
import HomeContext from '~/pages/api/home/home.context'
import { notifications } from '@mantine/notifications'
import { fetchPresignedUrl, uploadToS3 } from 'src/utils/apiUtils'

interface Agent {
  id: string
  name: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  color: string
}

interface SampleQuestion {
  text: string
  agent: string
}

interface AgentChatbarProps {
  inputContent: string
  setInputContent: (content: string) => void
  onSend: (message: Message, plugin: Plugin | null) => void
  hasMessages: boolean
  exampleQuestions?: string[]
  courseName: string
  stopConversationRef: React.MutableRefObject<boolean>
  showScrollDownButton?: boolean
  onScrollDownClick?: () => void
}

interface ProcessedImage {
  resizedFile: File
  dataUrl: string
}

export const AgentChatbar: React.FC<AgentChatbarProps> = ({
  inputContent,
  setInputContent,
  onSend,
  hasMessages,
  exampleQuestions = [],
  courseName,
  stopConversationRef,
  showScrollDownButton = false,
  onScrollDownClick,
}) => {
  const { t } = useTranslation('chat')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [content, setContent] = useState<string>(inputContent)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  
  const imageUploadRef = useRef<HTMLInputElement | null>(null)
  
  const {
    state: {
      selectedConversation,
      messageIsStreaming,
    },
  } = useContext(HomeContext)


  const agents: Agent[] = [
    {
      id: 'file',
      name: 'FileAgent',
      icon: IconFileText,
      label: 'Files',
      color: 'text-orange-500',
    },
    {
      id: 'search',
      name: 'SearchAgent',
      icon: IconSearch,
      label: 'Search',
      color: 'text-blue-500',
    },
    {
      id: 'agriculture',
      name: 'AgricultureAgent',
      icon: IconSeeding,
      label: 'Agriculture',
      color: 'text-green-500',
    },
    {
      id: 'weather',
      name: 'WeatherAgent',
      icon: IconCloud,
      label: 'Weather',
      color: 'text-sky-500',
    },
  ]

  const defaultSampleQuestions: SampleQuestion[] = [
    { text: 'What was my fertilizer spend last quarter?', agent: 'file' },
    { text: 'Show me yield data for Field 7', agent: 'file' },
    { text: 'What are best practices for corn planting?', agent: 'agriculture' },
    { text: 'Will it rain this week?', agent: 'weather' },
    { text: 'Find my soil test results', agent: 'search' },
    { text: 'Compare crop prices in my area', agent: 'agriculture' },
  ]

  // Use provided example questions or defaults
  const sampleQuestions: SampleQuestion[] =
    exampleQuestions.length > 0
      ? exampleQuestions.map((text, index) => ({
          text,
          agent: agents[index % agents.length]?.id || 'file',
        }))
      : defaultSampleQuestions

  // Image handling functions from ChatInput
  const isImageValid = (fileName: string): boolean => {
    const validImageTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const ext = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase()
    return validImageTypes.includes(`.${ext}`)
  }

  const uploadImageAndGetUrl = async (file: File, courseName: string): Promise<string> => {
    try {
      const uploadedImageUrl = await uploadToS3(file, courseName)
      const presignedUrl = await fetchPresignedUrl(uploadedImageUrl as string, courseName)
      return presignedUrl as string
    } catch (error) {
      console.error('Upload failed for file', file.name, error)
      setImageError(`Upload failed for file: ${file.name}`)
      return ''
    }
  }

  const calculateDimensions = (img: HTMLImageElement): { newWidth: number; newHeight: number } => {
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

  const processAndUploadImage = async (file: File): Promise<ProcessedImage & { uploadedUrl: string }> => {
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

                    const uploadedUrl = await uploadImageAndGetUrl(resizedFile, courseName)
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

  const handleImageUpload = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter((file) => isImageValid(file.name))
      const invalidFilesCount = files.length - validFiles.length

      if (invalidFilesCount > 0) {
        setImageError(
          `${invalidFilesCount} invalid file type(s). Please upload .jpg or .png images.`,
        )
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
    [courseName],
  )

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSampleClick = (question: string, agentId: string): void => {
    const agent = agents.find((a) => a.id === agentId)
    const agentPrefix = agent ? `@${agent.name} ` : ''
    setContent(agentPrefix + question)
    setSelectedAgent(agentId)
  }

  const handleAgentClick = (agentId: string): void => {
    const agent = agents.find((a) => a.id === agentId)
    if (!agent) return

    if (selectedAgent === agentId) {
      setSelectedAgent(null)
      setContent(content.replace(`@${agent.name} `, ''))
    } else {
      const cleanInput = content.replace(/@\w+\s/, '')
      setContent(`@${agent.name} ${cleanInput}`)
      setSelectedAgent(agentId)
    }
  }

  const handleSend = async () => {
    if (messageIsStreaming) {
      return
    }

    const textContent = content
    let imageContent: Content[] = []

    if (imageFiles.length > 0 && !uploadingImage) {
      setUploadingImage(true)
      try {
        const imageUrlsToUse =
          imageUrls.length > 0
            ? imageUrls
            : await Promise.all(
                imageFiles.map((file) =>
                  uploadImageAndGetUrl(file, courseName),
                ),
              )

        imageContent = imageUrlsToUse
          .filter((url): url is string => url !== '')
          .map((url) => ({
            type: 'image_url',
            image_url: { url },
          }))

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

    const contentArray: Content[] = [
      ...(textContent
        ? [{ type: 'text' as MessageType, text: textContent }]
        : []),
      ...imageContent,
    ]

    const messageForGPT4Vision: Message = {
      id: uuidv4(),
      role: 'user',
      content: contentArray,
    }

    onSend(messageForGPT4Vision, plugin)

    // Reset states
    setContent('')
    setPlugin(null)
    setImageFiles([])
    setImagePreviewUrls([])
    setImageUrls([])
    setIsSubmitted(true)

    if (imageUploadRef.current) {
      imageUploadRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    )

    if (files.length > 0) {
      handleImageUpload(files)
    }
  }

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i
    return mobileRegex.test(userAgent)
  }

  // Sync content with inputContent prop
  useEffect(() => {
    setContent(inputContent)
  }, [inputContent])

  // Auto-resize textarea functionality
  useEffect(() => {
    const textarea = document.querySelector('textarea')
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
      textarea.style.overflow = textarea.scrollHeight > 400 ? 'auto' : 'hidden'
    }
  }, [content, hasMessages])

  // Render different layouts based on whether messages exist
  if (hasMessages) {
    // Bottom chat input layout
    return (
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="mx-auto max-w-4xl">
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

              {/* Main Input Area */}
              <div className="flex-1">
                <textarea
                  className={`w-full resize-none bg-transparent px-3 py-2 text-gray-900 placeholder-gray-500 outline-none focus:ring-0 ${montserrat_paragraph.variable} font-montserratParagraph`}
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
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isMobile()) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
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
            {showScrollDownButton && onScrollDownClick && (
              <div className="absolute -top-14 right-4">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md"
                  onClick={onScrollDownClick}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                  </svg>
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
          </div>
        </div>
      </div>
    )
  }

  // Initial center layout when no messages
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="w-full max-w-3xl space-y-8 px-6">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-3 text-center duration-700">
          <h1
            className={`text-4xl font-bold text-gray-900 ${montserrat_heading.variable} font-montserratHeading`}
          >
            AgAnswers
          </h1>
          <p
            className={`text-gray-600 ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            Ask anything about your farm
          </p>
        </div>

        {/* Agents */}
        <div className="animate-in fade-in slide-in-from-bottom-4 delay-100 flex items-center justify-center gap-3 duration-700">
          {agents.map((agent) => {
            const Icon = agent.icon
            const isSelected = selectedAgent === agent.id
            return (
              <button
                key={agent.id}
                onClick={() => handleAgentClick(agent.id)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 ${montserrat_paragraph.variable} font-montserratParagraph ${
                  isSelected
                    ? 'scale-105 border-transparent bg-orange-500 text-white'
                    : 'border-gray-200 bg-white hover:border-orange-500'
                }`}
              >
                <Icon
                  size={16}
                  className={isSelected ? 'text-white' : agent.color}
                />
                <span className={isSelected ? 'text-white' : 'text-gray-900'}>
                  {agent.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Image Previews */}
        {imagePreviewUrls.length > 0 && (
          <div className="flex gap-2 justify-center">
            {imagePreviewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="h-16 w-16 rounded object-cover"
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

        {/* Main Chat Input */}
        <div className="relative">
          <div className="relative group">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isMobile()) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              placeholder="Ask a question or search your files..."
              className={`w-full px-6 py-4 pr-20 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200 ${montserrat_paragraph.variable} font-montserratParagraph shadow-sm`}
            />
            
            {/* Image Upload Button */}
            <button
            onClick={() => imageUploadRef.current?.click()}
            disabled={uploadingImage}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            >
                {uploadingImage ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
                ) : (
                  <IconPhoto size={18} />
                )}
            </button>
            
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
              onClick={handleSend}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!content.trim() || messageIsStreaming}
            >
              {messageIsStreaming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <IconSend size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {imageError && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 text-sm text-red-700">
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

        {/* Sample Questions */}
        <div className="animate-in fade-in slide-in-from-bottom-4 delay-200 space-y-3 duration-700">
          <p
            className={`text-center text-sm text-gray-600 ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            Try asking:
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {sampleQuestions.map((question, idx) => {
              const agent = agents.find((a) => a.id === question.agent)
              const Icon = agent?.icon
              return (
                <button
                  key={idx}
                  onClick={() => handleSampleClick(question.text, question.agent)}
                  className={`group flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all duration-200 hover:border-orange-500 hover:shadow-md ${montserrat_paragraph.variable} font-montserratParagraph`}
                >
                  {Icon && (
                    <Icon
                      size={14}
                      className={`opacity-70 transition-opacity group-hover:opacity-100 ${agent?.color}`}
                    />
                  )}
                  {question.text}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

