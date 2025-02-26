// LargeDropzone.tsx
import React, { useRef, useState, useEffect } from 'react'
import {
  createStyles,
  Group,
  rem,
  Text,
  Title,
  Paper,
  Progress,
  // useMantineTheme,
} from '@mantine/core'

import {
  IconAlertCircle,
  IconCheck,
  IconCloudUpload,
  IconDownload,
  IconFileUpload,
  IconX,
} from '@tabler/icons-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dropzone } from '@mantine/dropzone'
import { useRouter } from 'next/router'
import { type CourseMetadata } from '~/types/courseMetadata'
import SupportedFileUploadTypes from './SupportedFileUploadTypes'
import { useMediaQuery } from '@mantine/hooks'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { v4 as uuidv4 } from 'uuid'
import { FileUpload } from './UploadNotification'

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    // marginBottom: rem(10),
  },

  icon: {
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[3]
        : theme.colors.gray[4],
  },

  control: {
    position: 'absolute',
    width: rem(250),
    left: `calc(50% - ${rem(125)})`,
    bottom: rem(-20),
  },
  dropzone: {
    backgroundPosition: '0% 0%',
    '&:hover': {
      backgroundPosition: '100% 100%',
      background: 'linear-gradient(135deg, #2a2a40 0%, #1c1c2e 100%)',
    },
  },
}))

export function LargeDropzone({
  courseName,
  current_user_email,
  redirect_to_gpt_4 = true,
  isDisabled = false,
  courseMetadata,
  is_new_course,
  setUploadFiles,
}: {
  courseName: string
  current_user_email: string
  redirect_to_gpt_4?: boolean
  isDisabled?: boolean
  courseMetadata: CourseMetadata
  is_new_course: boolean
  setUploadFiles: React.Dispatch<React.SetStateAction<FileUpload[]>>
}) {
  // upload-in-progress spinner control
  const [uploadInProgress, setUploadInProgress] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [successfulUploads, setSuccessfulUploads] = useState(0)
  const router = useRouter()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const { classes, theme } = useStyles()
  const openRef = useRef<() => void>(null)
  const [files, setFiles] = useState<File[]>([])

  const refreshOrRedirect = async (redirect_to_gpt_4: boolean) => {
    if (is_new_course) {
      // refresh current page
      await new Promise((resolve) => setTimeout(resolve, 200))
      await router.push(`/${courseName}/dashboard`)
      return
    }

    if (redirect_to_gpt_4) {
      await router.push(`/${courseName}/chat`)
    }
    // refresh current page
    await new Promise((resolve) => setTimeout(resolve, 200))
    await router.reload()
  }
  const uploadToS3 = async (file: File | null, uniqueFileName: string) => {
    if (!file) return

    const requestObject = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uniqueFileName: uniqueFileName,
        fileType: file.type,
        courseName: courseName,
      }),
    }

    try {
      interface PresignedPostResponse {
        post?: {
          url: string
          fields: { [key: string]: string }
        }
        url?: string
        method?: string
        filepath?: string
        message: string
      }

      // Then, update the lines where you fetch the response and parse the JSON
      console.log('Upload to S3 request:', requestObject)
      const response = await fetch('/api/UIUC-api/uploadToS3', requestObject)
      console.log('Upload to S3 response:', response)
      const data = (await response.json()) as PresignedPostResponse

      // Handle PUT method for Cloudflare R2
      if (data.method === 'PUT' && data.url) {
        console.log('Using PUT method for upload to:', data.url)
        const uploadResponse = await fetch(data.url, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        console.log('Upload successful with PUT method');
        return;
      }

      // Handle POST method for S3 and MinIO
      if (data.post && data.method === 'POST') {
        console.log('Using POST method for upload to:', data.post.url)
        const { url, fields } = data.post
        const formData = new FormData()

        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value)
        })

        formData.append('file', file)

        const uploadResponse = await fetch(url, {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        console.log('Upload successful with POST method');
        return;
      }

      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error;
    }
  }

  const ingestFiles = async (files: File[] | null, is_new_course: boolean) => {
    if (!files) return
    files = files.filter((file) => file !== null)

    setFiles(files)
    setSuccessfulUploads(0)
    setUploadInProgress(true)
    setUploadComplete(false)

    // Initialize file upload status
    const initialFileUploads = files.map((file) => {
      const extension = file.name.slice(file.name.lastIndexOf('.'))
      const nameWithoutExtension = file.name
        .slice(0, file.name.lastIndexOf('.'))
        .replace(/[^a-zA-Z0-9]/g, '-')
      const uniqueReadableFileName = `${nameWithoutExtension}${extension}`

      return {
        name: uniqueReadableFileName,
        status: 'uploading' as const,
        type: 'document' as const,
      }
    })
    setUploadFiles((prev) => [...prev, ...initialFileUploads])

    if (is_new_course) {
      await callSetCourseMetadata(
        courseName,
        courseMetadata || {
          course_owner: current_user_email,
          course_admins: undefined,
          approved_emails_list: undefined,
          is_private: undefined,
          banner_image_s3: undefined,
          course_intro_message: undefined,
        },
      )
    }

    // Process files in parallel
    const allSuccessOrFail = await Promise.all(
      files.map(async (file) => {
        const extension = file.name.slice(file.name.lastIndexOf('.'))
        const nameWithoutExtension = file.name
          .slice(0, file.name.lastIndexOf('.'))
          .replace(/[^a-zA-Z0-9]/g, '-')
        const uniqueFileName = `${uuidv4()}-${nameWithoutExtension}${extension}`
        const uniqueReadableFileName = `${nameWithoutExtension}${extension}`

        try {
          await uploadToS3(file, uniqueFileName)
          setSuccessfulUploads((prev) => prev + 1)

          const response = await fetch(`/api/UIUC-api/ingest`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uniqueFileName: uniqueFileName,
              courseName: courseName,
              readableFilename: uniqueReadableFileName,
            }),
          })
          const res = await response.json()
          console.debug('Ingest submitted...', res)
          return { ok: true, s3_path: file.name }
        } catch (error) {
          console.error('Error during file upload or ingest:', error)
          return { ok: false, s3_path: file.name }
        }
      }),
    )

    setSuccessfulUploads(files.length)
    setUploadComplete(true)

    // Process results
    const resultSummary = allSuccessOrFail.reduce(
      (acc: { success_ingest: any[]; failure_ingest: any[] }, curr) => {
        if (curr.ok) acc.success_ingest.push(curr)
        else acc.failure_ingest.push(curr)
        return acc
      },
      { success_ingest: [], failure_ingest: [] },
    )

    setUploadInProgress(false)

    if (is_new_course) {
      await refreshOrRedirect(redirect_to_gpt_4)
    }
  }

  useEffect(() => {
    let pollInterval = 3000 // Start with a slower interval
    const MIN_INTERVAL = 1000 // Fast polling when active
    const MAX_INTERVAL = 5000 // Slow polling when inactive
    let consecutiveEmptyPolls = 0

    const checkIngestStatus = async () => {
      const response = await fetch(
        `/api/materialsTable/docsInProgress?course_name=${courseName}`,
      )
      const data = await response.json()

      const docsResponse = await fetch(
        `/api/materialsTable/docs?course_name=${courseName}`,
      )
      const docsData = await docsResponse.json()
      // Adjust polling interval based on activity
      if (data.documents.length > 0) {
        pollInterval = MIN_INTERVAL
        consecutiveEmptyPolls = 0
      } else {
        consecutiveEmptyPolls++
        if (consecutiveEmptyPolls >= 3) {
          // After 3 empty polls, slow down
          pollInterval = Math.min(pollInterval * 1.5, MAX_INTERVAL)
        }
      }

      setUploadFiles((prev) => {
        return prev.map((file) => {
          if (file.type !== 'document') return file

          if (file.status === 'uploading') {
            const isIngesting = data?.documents?.some(
              (doc: { readable_filename: string }) =>
                doc.readable_filename === file.name,
            )
            if (isIngesting) {
              return { ...file, status: 'ingesting' as const }
            }
          } else if (file.status === 'ingesting') {
            const isStillIngesting = data?.documents?.some(
              (doc: { readable_filename: string }) =>
                doc.readable_filename === file.name,
            )

            if (!isStillIngesting) {
              const isInCompletedDocs = docsData?.documents?.some(
                (doc: { readable_filename: string }) =>
                  doc.readable_filename === file.name,
              )
              return {
                ...file,
                status: isInCompletedDocs
                  ? ('complete' as const)
                  : ('error' as const),
              }
            }
          }
          return file
        })
      })
    }

    const intervalId = setInterval(checkIngestStatus, pollInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [courseName])

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: is_new_course && !isSmallScreen ? 'row' : 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          className={classes.wrapper}
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            paddingTop: rem(24),
          }}
        >
          <Dropzone
            openRef={openRef}
            className="group relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{
              width: '100%',
              minHeight: rem(200),
              height: 'auto',
              backgroundColor: isDisabled ? '#3a374a' : '#1c1c2e',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              borderWidth: '2px',
              borderStyle: 'dashed',
              borderColor: 'rgba(147, 51, 234, 0.3)',
              borderRadius: rem(12),
              padding: '1rem',
              margin: '0 auto',
              maxWidth: '100%',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #1c1c2e 0%, #2a2a40 100%)',
              transition: 'all 0.3s ease, background-position 0.3s ease',
              backgroundSize: '200% 200%',
              // backgroundPosition: '0% 0%',
              // ':hover': {
              //   backgroundPosition: '100% 100%',
              //   background: 'linear-gradient(135deg, #2a2a40 0%, #1c1c2e 100%)',
              // },
            }}
            onDrop={async (files) => {
              ingestFiles(files, is_new_course).catch((error) => {
                console.error('Error during file upload:', error)
              })
            }}
            loading={uploadInProgress}
          >
            <div
              style={{ pointerEvents: 'none' }}
              className="flex flex-col items-center justify-center px-2 sm:px-4"
            >
              <Group position="center" pt={rem(12)} className="sm:pt-5">
                <Dropzone.Accept>
                  <IconDownload
                    size={isSmallScreen ? rem(30) : rem(50)}
                    color="#9333ea"
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    size={isSmallScreen ? rem(30) : rem(50)}
                    color="#ef4444"
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                {!isDisabled && (
                  <Dropzone.Idle>
                    <IconCloudUpload
                      size={isSmallScreen ? rem(30) : rem(50)}
                      color="#9333ea"
                      stroke={1.5}
                    />
                  </Dropzone.Idle>
                )}
              </Group>

              <Text
                ta="center"
                fw={700}
                fz={isSmallScreen ? 'md' : 'lg'}
                mt={isSmallScreen ? 'md' : 'xl'}
                className="text-gray-200"
              >
                <Dropzone.Accept>Drop files here</Dropzone.Accept>
                <Dropzone.Reject>
                  Upload rejected, not proper file type or too large.
                </Dropzone.Reject>
                <Dropzone.Idle>
                  {isDisabled
                    ? 'Enter an available project name above! 👀'
                    : 'Upload materials'}
                </Dropzone.Idle>
              </Text>

              {!isDisabled && (
                <Text
                  ta="center"
                  fz={isSmallScreen ? 'xs' : 'sm'}
                  mt="xs"
                  className="text-gray-400"
                >
                  Drag&apos;n&apos;drop files or a whole folder here
                </Text>
              )}

              <div className="mt-2 w-full overflow-x-hidden sm:mt-4">
                <SupportedFileUploadTypes />
              </div>
            </div>
          </Dropzone>
          {/* {uploadInProgress && (
            <div className="flex flex-col items-center justify-center px-4 text-center">
              <Title
                order={4}
                style={{
                  marginTop: 10,
                  color: '#B22222',
                  fontSize: isSmallScreen ? '0.9rem' : '1rem',
                  lineHeight: '1.4',
                }}
              >
                Remain on this page until upload is complete
                <br />
                or ingest will fail.
              </Title>
            </div>
          )} */}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            textAlign: 'center',
          }}
        ></div>
      </div>
    </>
  )
}

export default LargeDropzone
