import {
  Card,
  Title,
  SimpleGrid,
  Flex,
  Text,
  Textarea,
  Button,
  createStyles,
} from '@mantine/core'
import { type CourseMetadata } from '~/types/courseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { useMediaQuery } from '@mantine/hooks'
import SetExampleQuestions from './SetExampleQuestions'
import { callSetCourseMetadata, uploadToS3 } from '~/utils/apiUtils'
import { type CourseMetadataOptionalForUpsert } from '~/types/courseMetadata'
// import { Checkbox } from '@radix-ui/react-checkbox'
// import OneDriveIngestForm from './OneDriveIngestForm'
import LargeDropzone from './LargeDropzone'
import WebsiteIngestForm from './WebsiteIngestForm'
import GitHubIngestForm from './GitHubIngestForm'
import GoogleDriveIngestForm from './GoogleDriveIngestForm'
import CourseraIngestForm from './CourseraIngestForm'
import { memo, useState, useEffect } from 'react'
import { IconShare } from '@tabler/icons-react'
import ShareSettingsModal from './ShareSettingsModal'
import UploadNotification, { type FileUpload } from './UploadNotification'
import { useQueryClient } from '@tanstack/react-query'
import { LinkGeneratorModal } from '../Modals/LinkGeneratorModal'

const montserrat_light = montserrat_paragraph

const useStyles = createStyles((theme) => ({
  // For Accordion
  root: {
    padding: 0,
    borderRadius: theme.radius.xl,
    outline: 'none',
  },
  switch: {
    color: (theme.colors as any).aiPurple[0],
    backgroundColor: (theme.colors as any).aiPurple[0],
    input: {
      color: (theme.colors as any).aiPurple[0],
      backgroundColor: (theme.colors as any).aiPurple[0],
    },
    root: {
      color: (theme.colors as any).aiPurple[0],
      backgroundColor: (theme.colors as any).aiPurple[0],
    },
  },
  item: {
    backgroundColor: 'bg-transparent',
    border: `solid transparent`,
    borderRadius: theme.radius.xl,
    position: 'relative',
    zIndex: 0,
    transition: 'transform 150ms ease',
    outline: 'none',

    '&[data-active]': {
      transform: 'scale(1.03)',
      backgroundColor: 'bg-transparent',
      zIndex: 1,
    },
    '&:hover': {
      backgroundColor: 'bg-transparent',
    },
  },

  chevron: {
    '&[data-rotate]': {
      transform: 'rotate(90deg)',
    },
  },
}))

export const UploadCard = memo(function UploadCard({
  projectName,
  current_user_email,
  metadata: initialMetadata,
}: {
  projectName: string
  current_user_email: string
  metadata: CourseMetadata
}) {
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [projectDescription, setProjectDescription] = useState(
    initialMetadata?.project_description || '',
  )
  const queryClient = useQueryClient()
  const [introMessage, setIntroMessage] = useState(
    initialMetadata?.course_intro_message || '',
  )
  const [showNotification, setShowNotification] = useState(false)
  const [isIntroMessageUpdated, setIsIntroMessageUpdated] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<FileUpload[]>([])
  const [metadata, setMetadata] = useState(initialMetadata)

  useEffect(() => {
    // Set initial query data
    queryClient.setQueryData(['courseMetadata', projectName], initialMetadata)
  }, [])

  // Update local state when query data changes
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const latestData = queryClient.getQueryData([
        'courseMetadata',
        projectName,
      ])
      if (latestData) {
        setMetadata(latestData as CourseMetadata)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [projectName, queryClient])

  const handleCloseNotification = () => {
    setShowNotification(false)
    setUploadFiles([])
  }
  const handleSetUploadFiles = (
    updateFn: React.SetStateAction<FileUpload[]>,
  ) => {
    setUploadFiles(updateFn)
  }
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 items-start justify-between sm:flex-row sm:items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <span className="text-gray-400">/</span>
            <h2 className="text-xl font-semibold text-orange-500">
              {projectName}
            </h2>
          </div>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center space-x-2 rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600"
          >
            <span>Share</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-gray-600">
          Upload documents and configure your AI assistant
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Document Upload */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Upload Documents
            </h3>
            <LargeDropzone
              courseName={projectName}
              current_user_email={current_user_email as string}
              redirect_to_gpt_4={false}
              isDisabled={false}
              courseMetadata={metadata as CourseMetadata}
              is_new_course={false}
              setUploadFiles={handleSetUploadFiles}
            />
          </div>

          {/* Data Sources */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Connect Data Sources
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* <OneDriveIngestForm
                project_name={projectName}
                setUploadFiles={handleSetUploadFiles}
                queryClient={queryClient}
              /> */}
              <WebsiteIngestForm
                project_name={projectName}
                setUploadFiles={handleSetUploadFiles}
                queryClient={queryClient}
              />
              <GitHubIngestForm
                project_name={projectName}
                setUploadFiles={handleSetUploadFiles}
                queryClient={queryClient}
              />
              {/* <GoogleDriveIngestForm /> */}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Description */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Project Description
            </h3>
            <textarea
              placeholder="Describe your project, goals, expected impact etc..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={async () => {
                if (metadata) {
                  metadata.project_description = projectDescription
                  const resp = await callSetCourseMetadata(
                    projectName,
                    metadata,
                  )
                  if (!resp) {
                    console.log(
                      'Error upserting course metadata for course: ',
                      projectName,
                    )
                  }
                }
              }}
              className="mt-3 rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600"
            >
              Update
            </button>
          </div>

          {/* Branding */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Branding
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Greeting Message
                </label>
                <p className="mb-2 text-sm text-gray-500">
                  Shown before users send their first chat
                </p>
                <textarea
                  placeholder="Welcome to our AI assistant! How can I help you today?"
                  value={introMessage}
                  onChange={(e) => {
                    setIntroMessage(e.target.value)
                    setIsIntroMessageUpdated(true)
                  }}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={async () => {
                  if (metadata) {
                    metadata.course_intro_message = introMessage
                    const resp = await callSetCourseMetadata(
                      projectName,
                      metadata,
                    )
                    if (!resp) {
                      console.log(
                        'Error updating greeting for course: ',
                        projectName,
                      )
                    }
                  }
                }}
                className="w-full px-4 py-2 rounded-lg bg-orange-500 font-medium text-white transition-colors hover:bg-orange-600"
              >
                Update Greeting
              </button>
            </div>

            <div className="space-y-6">
              <Title
                className={`${montserrat_heading.variable} font-montserratHeading`}
                variant="gradient"
                gradient={{ from: 'orange', to: 'yellow', deg: 170 }}
                order={3}
              >
                Branding
              </Title>

              <div className="form-control relative">
                <label
                  className={`label ${montserrat_heading.variable} font-montserratHeading`}
                >
                  <span className="label-text text-lg text-gray-700">
                    Set a greeting
                  </span>
                </label>
                <Text
                  className={`label ${montserrat_light.className} pt-0`}
                  size={'sm'}
                >
                  Shown before users send their first chat.
                </Text>
                <Textarea
                  autosize
                  minRows={2}
                  maxRows={4}
                  placeholder="Enter a greeting to help users get started with your bot"
                  className={`w-full ${montserrat_paragraph.variable} font-montserratParagraph`}
                  value={introMessage}
                  onChange={(e) => {
                    setIntroMessage(e.target.value)
                    setIsIntroMessageUpdated(true)
                  }}
                />
                {isIntroMessageUpdated && (
                  <>
                    <Button
                      className="relative m-1 w-[30%] self-end bg-orange-500 text-white hover:bg-orange-600"
                      type="submit"
                      onClick={async () => {
                        setIsIntroMessageUpdated(false)
                        if (metadata) {
                          metadata.course_intro_message = introMessage
                          // Update the courseMetadata object

                          const resp = await callSetCourseMetadata(
                            projectName,
                            metadata,
                          )
                          if (!resp) {
                            console.log(
                              'Error upserting course metadata for course: ',
                              projectName,
                            )
                          }
                        }
                      }}
                    >
                      Submit
                    </Button>
                  </>
                )}
              </div>
              <label
                className={`label ${montserrat_heading.variable} font-montserratHeading`}
              >
                <span className="label-text text-lg text-gray-700">
                  Set example questions
                </span>
              </label>
              <Text
                className={`label ${montserrat_light.className} pb-0 pt-0`}
                mb={-3}
                size={'sm'}
              >
                Users will likely try these first to get a feel for your bot.
              </Text>
              <SetExampleQuestions
                course_name={projectName}
                course_metadata={metadata as CourseMetadataOptionalForUpsert}
              />
              <div className="form-control">
                <label
                  className={`label ${montserrat_heading.variable} font-montserratHeading`}
                >
                  <span className="label-text text-lg text-gray-700">
                    Upload your logo
                  </span>
                </label>
                <Text
                  size={'sm'}
                  className={`label ${montserrat_light.className} pb-2`}
                >
                  This logo will appear in the header of the chat page.
                </Text>
                <input
                  type="file"
                  className={`cursor-pointer ${montserrat_paragraph.variable} font-montserratParagraph w-full px-4 py-2 rounded-lg bg-orange-500 font-medium text-white transition-colors hover:bg-orange-600`}
                  onChange={async (e) => {
                    // Assuming the file is converted to a URL somewhere else
                    if (e.target.files?.length) {
                      console.log('Uploading to s3')
                      const banner_s3_image = await uploadToS3(
                        e.target.files?.[0] ?? null,
                        projectName,
                      )
                      if (banner_s3_image && metadata) {
                        metadata.banner_image_s3 = banner_s3_image
                        await callSetCourseMetadata(projectName, metadata)
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <UploadNotification
        files={uploadFiles}
        onClose={handleCloseNotification}
        projectName={projectName}
      />

      <LinkGeneratorModal
        course_name={projectName}
        opened={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentSettings={{
          guidedLearning: false,
          documentsOnly: false,
          systemPromptOnly: false,
        }}
      />
    </div>
  )
})
