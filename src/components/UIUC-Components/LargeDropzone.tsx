// LargeDropzone.tsx
import React, { useRef, useState } from 'react'
import {
  createStyles,
  Group,
  rem,
  Text,
  Title,
  // useMantineTheme,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCheck,
  IconCloudUpload,
  IconDownload,
  IconFileUpload,
  IconProgress,
  IconX,
} from '@tabler/icons-react'
import { Dropzone } from '@mantine/dropzone'
import { useRouter } from 'next/router'
import { type CourseMetadata } from '~/types/courseMetadata'
import SupportedFileUploadTypes from './SupportedFileUploadTypes'
import { useMediaQuery } from '@mantine/hooks'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { notifications } from '@mantine/notifications'
import { v4 as uuidv4 } from 'uuid'

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    // marginBottom: rem(10),
  },

  dropzone: {
    borderWidth: rem(1.5),
    // paddingBottom: rem(20),
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
}))

export function LargeDropzone({
  courseName,
  current_user_email,
  redirect_to_gpt_4 = true,
  isDisabled = false,
  courseMetadata,
  is_new_course,
}: {
  courseName: string
  current_user_email: string
  redirect_to_gpt_4?: boolean
  isDisabled?: boolean
  courseMetadata: CourseMetadata
  is_new_course: boolean
}) {
  // upload-in-progress spinner control
  const [uploadInProgress, setUploadInProgress] = useState(false)
  const router = useRouter()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const { classes, theme } = useStyles()
  const openRef = useRef<() => void>(null)

  const refreshOrRedirect = async (redirect_to_gpt_4: boolean) => {
    if (is_new_course) {
      // refresh current page
      await new Promise((resolve) => setTimeout(resolve, 200))
      await router.push(`/${courseName}/materials`)
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
        post: {
          url: string
          fields: { [key: string]: string }
        }
      }

      // Then, update the lines where you fetch the response and parse the JSON
      const response = await fetch('/api/UIUC-api/uploadToS3', requestObject)
      const data = (await response.json()) as PresignedPostResponse

      const { url, fields } = data.post as {
        url: string
        fields: { [key: string]: string }
      }
      const formData = new FormData()

      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value)
      })

      formData.append('file', file)

      await fetch(url, {
        method: 'POST',
        body: formData,
      })

      console.log((uniqueFileName as string) + ' uploaded to S3 successfully!!')
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const ingestFiles = async (files: File[] | null, is_new_course: boolean) => {
    if (!files) return
    files = files.filter((file) => file !== null)

    setUploadInProgress(true)

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

    // this does parallel (use for loop for sequential)
    const allSuccessOrFail = await Promise.all(
      files.map(async (file, index) => {
        console.log('Index: ' + index)
        const uniqueFileName = (uuidv4() as string) + '-' + file.name

        // return { ok: Math.random() < 0.5, s3_path: file.name }; // For testing
        try {
          await uploadToS3(file, uniqueFileName)

          await fetch(
            `/api/UIUC-api/ingest?uniqueFileName=${uniqueFileName}&courseName=${courseName}&readableFilename=${file.name}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )
          const res = { ok: true, s3_path: file.name }
          console.debug('res:', res)
          return res
        } catch (error) {
          console.error('Error during file upload or ingest:', error)
          return { ok: false, s3_path: file.name }
        }
      }),
    )

    interface IngestResult {
      ok: boolean
      s3_path: string
    }

    interface ResultSummary {
      success_ingest: IngestResult[]
      failure_ingest: IngestResult[]
    }

    const resultSummary = allSuccessOrFail.reduce(
      (acc: ResultSummary, curr: IngestResult) => {
        if (curr.ok) {
          acc.success_ingest.push(curr)
        } else {
          acc.failure_ingest.push(curr)
        }
        return acc
      },
      { success_ingest: [], failure_ingest: [] },
    )

    console.log('Ingestion Summary:', resultSummary)

    setUploadInProgress(false)

    // showSuccessToast(resultSummary.success_ingest.length)
    showIngestInProgressToast(resultSummary.success_ingest.length)

    // TODO: better to refresh just the table, not the entire page... makes it hard to persist toast... need full UI element for failures.
    // NOTE: Were just getting "SUBMISSION to task queue" status, not the success of the ingest job itself!!
    // if (resultSummary.failure_ingest.length > 0) {
    //   // some failures
    //   showFailedIngestToast(
    //     resultSummary.failure_ingest.map(
    //       (ingestResult) => ingestResult.s3_path,
    //     ),
    //   )
    //   showSuccessToast(resultSummary.success_ingest.length)
    // } else {
    //   // 100% success
    //   await refreshOrRedirect(redirect_to_gpt_4)
    //   // showSuccessToast(resultSummary.failure_ingest.map((ingestResult) => ingestResult.s3_path));
    // }
  }

  return (
    <>
      {/* START LEFT COLUMN */}
      <div
        style={{
          display: 'flex',
          flexDirection: is_new_course && !isSmallScreen ? 'row' : 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* <div className={classes.wrapper} style={{ maxWidth: '320px' }}> */}
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
            style={{
              width: rem(330),
              height: rem(225),
              ...(isDisabled
                ? { backgroundColor: '#3a374a' }
                : { backgroundColor: '#25262b' }),
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
            loading={uploadInProgress}
            onDrop={async (files) => {
              ingestFiles(files, is_new_course).catch((error) => {
                console.error('Error during file upload:', error)
              })
            }}
            className={classes.dropzone}
            radius="md"
            bg="#25262b"
            disabled={isDisabled}
          >
            <div
              style={{ pointerEvents: 'none', opacity: isDisabled ? 0.6 : 1 }}
            >
              <Group position="center" pt={'md'}>
                <Dropzone.Accept>
                  <IconDownload
                    size={rem(50)}
                    color={theme.primaryColor[6]}
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    size={rem(50)}
                    color={theme.colors.red[6]}
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                {!isDisabled && (
                  <Dropzone.Idle>
                    <IconCloudUpload
                      size={rem(50)}
                      color={
                        theme.colorScheme === 'dark'
                          ? theme.colors.dark[0]
                          : theme.black
                      }
                      stroke={1.5}
                    />
                  </Dropzone.Idle>
                )}
              </Group>
              {isDisabled ? (
                <>
                  <br></br>
                  <Text ta="center" fw={700} fz="lg" mt="xl">
                    Enter an available project name above! 👀
                  </Text>
                </>
              ) : (
                <Text ta="center" fw={700} fz="lg" mt="xl">
                  <Dropzone.Accept>Drop files here</Dropzone.Accept>
                  <Dropzone.Reject>
                    Upload rejected, not proper file type or too large.
                  </Dropzone.Reject>
                  <Dropzone.Idle>Upload materials</Dropzone.Idle>
                </Text>
              )}
              {isDisabled ? (
                ''
              ) : (
                <Text ta="center" fz="sm" mt="xs" c="dimmed">
                  Drag&apos;n&apos;drop files or a whole folder here
                </Text>
              )}
            </div>
          </Dropzone>
          {uploadInProgress && (
            <div className="flex flex-col items-center justify-center ">
              <Title
                order={4}
                style={{
                  marginTop: 10,
                  alignItems: 'center',
                  color: '#B22222',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                Do not navigate away until loading is complete <br></br> or
                ingest will fail.
              </Title>
              <Title
                order={4}
                style={{
                  marginTop: 5,
                  alignItems: 'center',
                  color: '#B22222',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                The page will refresh when your AI Assistant is ready.
              </Title>
            </div>
          )}
        </div>
        {/* END LEFT COLUMN */}

        {/* START RIGHT COLUMN */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            textAlign: 'center',
          }}
        >
          <SupportedFileUploadTypes />
        </div>
        {/* END RIGHT COLUMN */}
      </div>
    </>
  )
}

export default LargeDropzone

const showFailedIngestToast = (error_files: string[]) => {
  // docs: https://mantine.dev/others/notifications/

  error_files.forEach((file, index) => {
    notifications.show({
      id: `failed-ingest-toast-${index}`,
      withCloseButton: true,
      // onClose: () => console.log('unmounted'),
      // onOpen: () => console.log('mounted'),
      autoClose: 30000,
      title: `Failed to ingest file ${file}`,
      message: `Please shoot me an email: kvday2@illinois.edu.`,
      color: 'red',
      radius: 'lg',
      icon: <IconAlertCircle />,
      className: 'my-notification-class',
      style: { backgroundColor: '#15162c' },
      loading: false,
    })
  })
}

const showSuccessToast = (num_success_files: number) => {
  // success_files.forEach((file, index) => {
  notifications.show({
    id: `success-ingest-toast-${num_success_files}`,
    withCloseButton: true,
    // onClose: () => console.log('unmounted'),
    // onOpen: () => console.log('mounted'),
    autoClose: 30000,
    title: `Successfully ingested ${num_success_files} files.`,
    message: `Refresh page to see changes.`,
    color: 'green',
    radius: 'lg',
    icon: <IconCheck />,
    className: 'my-notification-class',
    style: { backgroundColor: '#15162c' },
    loading: false,
    // })
  })
}

const showIngestInProgressToast = (num_success_files: number) => {
  // success_files.forEach((file, index) => {
  notifications.show({
    id: `ingest-in-progress-toast-${num_success_files}`,
    withCloseButton: true,
    // onClose: () => console.log('unmounted'),
    // onOpen: () => console.log('mounted'),
    autoClose: 30000,
    title: `Ingest in progress for ${num_success_files} file${num_success_files > 1 ? 's' : ''}.`,
    message: `This is a background task. Refresh the page to see your files as they're processed. (A better upload experience is in the works for April 2024 🚀)`,
    color: 'green',
    radius: 'lg',
    icon: <IconFileUpload />,
    className: 'my-notification-class',
    style: { backgroundColor: '#15162c' },
    loading: false,
    // })
  })
}
