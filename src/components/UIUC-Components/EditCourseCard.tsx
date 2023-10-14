import React, { useEffect, useState } from 'react'
import {
  Card,
  Text,
  Textarea,
  Flex,
  Group,
  Checkbox,
  Title,
  type CheckboxProps,
  Paper,
  Input,
  Button,
  Divider,
  Accordion,
  createStyles,
  rem,
  em,
  Tooltip,
  TextInput,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowUpRight,
  IconCircleCheck,
  IconEdit,
  IconExternalLink,
  IconKey,
  IconLock,
  IconTrash,
  IconX,
  // IconQuestionMark,
} from '@tabler/icons-react'

import {
  CourseMetadataOptionalForUpsert,
  type CourseMetadata,
} from '~/types/courseMetadata'
import LargeDropzone from './LargeDropzone'
import EmailChipsComponent from './EmailChipsComponent'
import { useMediaQuery } from '@mantine/hooks'
import { Montserrat } from 'next/font/google'
// import { GetCurrentPageName } from './CanViewOnlyCourse'
import { useRouter } from 'next/router'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
// import axios from 'axios'
import { WebScrape } from '~/components/UIUC-Components/WebScrape'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { notifications } from '@mantine/notifications'
import SetExampleQuestions from './SetExampleQuestions'

const montserrat_light = Montserrat({
  weight: '400',
  subsets: ['latin'],
})

const useStyles = createStyles((theme) => ({
  // For Accordion
  root: {
    padding: 0,
    borderRadius: theme.radius.xl,
    outline: 'none',
  },
  item: {
    backgroundColor: 'bg-transparent',
    // border: `${rem(1)} solid transparent`,
    border: `solid transparent`,
    borderRadius: theme.radius.xl,
    position: 'relative',
    zIndex: 0,
    transition: 'transform 150ms ease',
    outline: 'none',

    '&[data-active]': {
      transform: 'scale(1.03)',
      backgroundColor: 'bg-transparent',
      // boxShadow: theme.shadows.xl,
      // borderRadius: theme.radius.lg,
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

const EditCourseCard = ({
  course_name,
  current_user_email,
  is_new_course = false,
  courseMetadata,
}: {
  course_name: string
  current_user_email: string
  is_new_course?: boolean
  courseMetadata?: CourseMetadata
}) => {
  const [introMessage, setIntroMessage] = useState('')
  const [courseName, setCourseName] = useState(course_name || '')
  const [isCourseAvailable, setIsCourseAvailable] = useState<
    boolean | undefined
  >(undefined)
  const [allExistingCourseNames, setAllExistingCourseNames] = useState<
    string[]
  >([])
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [courseBannerUrl, setCourseBannerUrl] = useState('')
  const [isIntroMessageUpdated, setIsIntroMessageUpdated] = useState(false)
  const [loadinSpinner, setLoadinSpinner] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [apiKey, setApiKey] = useState<string | undefined>(
    courseMetadata?.openai_api_key as string,
  )
  const [isKeyUpdated, setIsKeyUpdated] = useState(false)

  const checkCourseAvailability = () => {
    const courseExists =
      courseName != '' &&
      allExistingCourseNames &&
      allExistingCourseNames.includes(courseName)
    setIsCourseAvailable(!courseExists)
  }

  const router = useRouter()
  const checkIfNewCoursePage = () => {
    // `/new` --> `new`
    // `/new?course_name=mycourse` --> `new`
    return router.asPath.split('/')[1]?.split('?')[0] as string
  }

  useEffect(() => {
    // only run when creating new courses.. otherwise VERY wasteful on DB.
    if (checkIfNewCoursePage() == 'new') {
      async function fetchGetAllCourseNames() {
        const response = await fetch(`/api/UIUC-api/getAllCourseNames`)

        if (response.ok) {
          const data = await response.json()
          return data.all_course_names
        } else {
          console.error(`Error fetching course metadata: ${response.status}`)
          return null
        }
      }

      fetchGetAllCourseNames()
        .then((result) => {
          setAllExistingCourseNames(result)
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }, [])

  useEffect(() => {
    checkCourseAvailability()
  }, [courseName])

  useEffect(() => {
    setIntroMessage(courseMetadata?.course_intro_message || '')
    setApiKey(courseMetadata?.openai_api_key as string)
  }, [courseMetadata])

  const validateKey = async (key: string) => {
    const response = await fetch('/api/validateKey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: key }),
    })

    return response
  }

  const uploadToS3 = async (file: File | null) => {
    if (!file) return

    const requestObject = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        courseName: course_name,
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

      console.log(file.name + 'uploaded to S3 successfully!!')
      return data.post.fields.key
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const handleKeyUpdate = async (inputValue: string) => {
    if (inputValue === '' && courseMetadata?.openai_api_key === '') {
      console.log('Key already empty')
      notifications.show({
        id: 'info-notification',
        title: 'No Changes',
        message: 'The key is already empty.',
        color: 'blue',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
      return
    }

    if (inputValue === '' && courseMetadata?.openai_api_key !== '') {
      ;(courseMetadata as CourseMetadata).openai_api_key = inputValue
      console.log('Removing api key')
      setApiKey(inputValue)
      await callSetCourseMetadata(course_name, courseMetadata as CourseMetadata)
      notifications.show({
        id: 'success-notification',
        title: 'Update Successful',
        message: 'Key removed.',
        color: 'green',
        radius: 'lg',
        icon: <IconTrash />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
      return
    }

    if (!inputValue.startsWith('sk-')) {
      console.log('Invalid OpenAI API Key')
      notifications.show({
        id: 'error-notification',
        title: 'Invalid OpenAI API Key',
        message:
          'The OpenAI API Key usually looks like "sk-***". Did you paste something else you copied? 😉',
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
      return
    }

    const validationResponse = await validateKey(inputValue)
    if (!validationResponse.ok) {
      const response = await validationResponse.json()
      console.log('New key validated')
      notifications.show({
        id: 'error-notification',
        title: response.name,
        message: response.message,
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
      return
    }

    if (courseMetadata) {
      console.log('Key updated for course')
      courseMetadata.openai_api_key = inputValue
      setApiKey(inputValue)
      await callSetCourseMetadata(course_name, courseMetadata)
      notifications.show({
        id: 'success-notification',
        title: 'Update Successful',
        message: 'Course Wide api key set successfully.',
        color: 'green',
        radius: 'lg',
        icon: <IconCircleCheck />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
    }
  }

  const { classes } = useStyles() // for Accordion

  return (
    <Card
      shadow="xs"
      padding="none"
      radius="xl"
      style={{ maxWidth: '85%', width: '100%', marginTop: '4%' }}
    >
      <Flex direction={isSmallScreen ? 'column' : 'row'}>
        <div
          style={{
            flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
            border: 'None',
            color: 'white',
          }}
          className="min-h-full bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
        >
          <Group
            // spacing="lg"
            m="3rem"
            align="center"
            style={{ justifyContent: 'center' }}
          >
            <Title
              order={2}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              className={`${montserrat_heading.variable} font-montserratHeading`}
            >
              {!is_new_course ? `${courseName}` : 'Chat with your documents'}
            </Title>
            {is_new_course && (
              <>
                <input
                  type="text"
                  placeholder="Project name"
                  value={courseName}
                  onChange={(e) =>
                    setCourseName(e.target.value.replaceAll(' ', '-'))
                  }
                  autoFocus
                  disabled={!is_new_course}
                  className={`input-bordered input w-[70%] rounded-lg border-2 border-solid bg-gray-800 lg:w-[50%] 
                                ${
                                  isCourseAvailable && courseName != ''
                                    ? 'border-2 border-green-500 text-green-500 focus:border-green-500'
                                    : 'border-red-800 text-red-600 focus:border-red-800'
                                } ${
                    montserrat_paragraph.variable
                  } font-montserratParagraph`}
                />
                <Title
                  order={4}
                  className={`w-full text-center ${montserrat_paragraph.variable} mt-4 font-montserratParagraph`}
                >
                  Just one step: upload any and all materials. More is better,
                  it&apos;s fine if they&apos;re messy.
                </Title>
              </>
            )}
            <Flex direction={'column'} align={'center'} w={'100%'}>
              <div className={'flex flex-row items-center'}>
                {loadinSpinner && (
                  <>
                    <LoadingSpinner size={'sm'} />
                    <Title order={4}>
                      Please wait while the course is ingested...
                    </Title>
                  </>
                )}
              </div>
              <LargeDropzone
                courseName={courseName}
                current_user_email={current_user_email}
                redirect_to_gpt_4={false}
                isDisabled={
                  is_new_course && (!isCourseAvailable || courseName === '')
                }
                courseMetadata={courseMetadata as CourseMetadata}
                is_new_course={is_new_course}
              />
              <WebScrape
                is_new_course={is_new_course}
                courseName={courseName}
                isDisabled={
                  is_new_course && (!isCourseAvailable || courseName === '')
                }
                current_user_email={current_user_email}
              />
            </Flex>
          </Group>
        </div>
        {!is_new_course && (
          <div
            style={{
              flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
              padding: '1rem',
              backgroundColor: '#15162c',
              color: 'white',
            }}
          >
            <div className="card flex h-full flex-col justify-center">
              <div className="card-body">
                <div className="form-control relative">
                  {/* <Title
                    className={montserrat.className}
                    variant="gradient"
                    gradient={{ from: 'gold', to: 'white', deg: 50 }}
                    order={2}
                    p="xs"
                    style={{ alignSelf: 'center' }}
                  >
                    Customization{' '}
                  </Title> */}

                  <Title
                    // className={`label ${montserrat.className}`}
                    className={`label ${montserrat_heading.variable} font-montserratHeading`}
                    variant="gradient"
                    gradient={{ from: 'gold', to: 'white', deg: 170 }}
                    order={3}
                  >
                    Course-wide OpenAI key{' '}
                  </Title>

                  <Accordion
                    pl={27}
                    pr={27}
                    pt={40}
                    pb={40}
                    m={-40}
                    // style={{ borderRadius: 'theme.radius.xl', width: '112%', maxWidth: 'min(50rem, )', marginLeft: 'max(-1rem, -10%)' }}
                    style={{ borderRadius: 'theme.radius.xl' }}
                    classNames={classes}
                    className={classes.root}
                  >
                    {/* ... Accordion items */}
                    <Accordion.Item value="openai-key-details">
                      <Accordion.Control>
                        <Text
                          className={`label ${montserrat_light.className} inline-block p-0 text-neutral-200`}
                          size={'md'}
                        >
                          If you provide an API key then all users of this
                          course, and only this course, will bill to the below
                          key while chatting with your documents.{' '}
                          <span className={'text-purple-600'}>Read more</span>{' '}
                          👇
                        </Text>
                        {/* <a
                          className={'text-purple-600'}
                          // href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'underline' }}
                        >
                          read more...
                        </a> */}
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Text
                          className={`label ${montserrat_light.className} p-0 text-neutral-200`}
                          size={'sm'}
                        >
                          Only set this key if you&apos;re comfortable with
                          paying the OpenAI bill for users to chat with your
                          documents. Without this, each user must bring their
                          own key and enter it before using the app. Providing a
                          key makes your page free and much simpler for your
                          users. You can use the visibility controls below to
                          limit access. Advanced rate-limit features are a work
                          in progress.
                        </Text>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>

                  {apiKey && !isEditing ? (
                    <>
                      <Input
                        icon={<IconKey />}
                        className="mt-4 w-full min-w-[20rem]"
                        placeholder="sk-**********"
                        type="password"
                        radius={'xl'}
                        size={'md'}
                        variant={'default'}
                        id="openai-api-key-input"
                        disabled={!isKeyUpdated}
                        rightSection={
                          <Button
                            onClick={() => {
                              setIsEditing(true)
                              setIsKeyUpdated(false)
                            }}
                            size="sm"
                            radius={'xl'}
                            className="min-w-[5rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
                            w={'auto'}
                          >
                            <IconEdit />
                          </Button>
                        }
                        rightSectionWidth={'auto'}
                      />
                    </>
                  ) : (
                    <Input
                      icon={<IconKey />}
                      className="mt-4 w-full min-w-[20rem]"
                      placeholder="OpenAI API key"
                      type="password"
                      radius={'xl'}
                      size={'md'}
                      variant={'default'}
                      id="openai-api-key-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const inputValue = (e.target as HTMLInputElement)
                            .value
                          handleKeyUpdate(inputValue)
                        }
                      }}
                      rightSection={
                        <Button
                          onClick={(e) => {
                            e.preventDefault()
                            const apiKeyInput = document.getElementById(
                              'openai-api-key-input',
                            ) as HTMLInputElement
                            if (apiKeyInput) {
                              const inputValue = apiKeyInput.value
                              handleKeyUpdate(inputValue)
                            }
                          }}
                          size="sm"
                          radius={'xl'}
                          className="min-w-[5rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
                          w={'auto'}
                        >
                          Submit
                        </Button>
                      }
                      rightSectionWidth={'auto'}
                    />
                  )}
                  <Input.Description className="p-2 text-right">
                    <a
                      href="https://platform.openai.com/account/api-keys"
                      target="_blank"
                      className="hover:underline"
                    >
                      Get your own api key here
                      <IconArrowUpRight size={12} className={'mb-2 inline'} />
                    </a>
                  </Input.Description>
                </div>

                <PrivateOrPublicCourse
                  course_name={course_name}
                  current_user_email={current_user_email}
                  courseMetadata={courseMetadata as CourseMetadata}
                  // course_intro_message={
                  //   courseMetadata?.course_intro_message || ''
                  // }
                  // is_private={courseMetadata?.is_private || false}
                  // banner_image_s3={courseBannerUrl}
                />

                <Title
                  className={`label ${montserrat_heading.variable} p-0 pl-1 pt-2 font-montserratHeading`}
                  variant="gradient"
                  gradient={{ from: 'gold', to: 'white', deg: 170 }}
                  order={3}
                >
                  Branding{' '}
                </Title>
                <div className="form-control relative">
                  <label
                    className={`label ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    <span className="label-text text-lg text-neutral-200">
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
                        className="relative m-1 w-[30%] self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600"
                        type="submit"
                        onClick={async () => {
                          setIsIntroMessageUpdated(false)
                          if (courseMetadata) {
                            courseMetadata.course_intro_message = introMessage
                            // Update the courseMetadata object

                            const resp = await callSetCourseMetadata(
                              course_name,
                              courseMetadata,
                            )
                            if (!resp) {
                              console.log(
                                'Error upserting course metadata for course: ',
                                course_name,
                              )
                            }
                          }
                        }}
                      >
                        Submit
                      </Button>
                      {/* <button
                        className="btn-outline btn absolute bottom-0 right-0 m-1 h-[2%] rounded-3xl border-violet-800 py-1 text-violet-800  hover:bg-violet-800 hover:text-white"
                        onClick={async () => {
                          setIsIntroMessageUpdated(false)
                          if (courseMetadata) {
                            courseMetadata.course_intro_message = introMessage
                            // Update the courseMetadata object

                            const resp = await callSetCourseMetadata(
                              course_name,
                              courseMetadata,
                            )
                            if (!resp) {
                              console.log(
                                'Error upserting course metadata for course: ',
                                course_name,
                              )
                            }
                          }
                        }}
                      >
                        Submit
                      </button> */}
                    </>
                  )}
                </div>
                <label
                  className={`label ${montserrat_heading.variable} font-montserratHeading`}
                >
                  <span className="label-text text-lg text-neutral-200">
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
                  course_name={course_name}
                  course_metadata={
                    courseMetadata as CourseMetadataOptionalForUpsert
                  }
                />
                <div className="form-control">
                  <label
                    className={`label ${montserrat_heading.variable} font-montserratHeading`}
                  >
                    <span className="label-text text-lg text-neutral-200">
                      Upload your logo
                    </span>
                  </label>
                  <Text
                    size={'sm'}
                    className={`label ${montserrat_light.className}`}
                  >
                    This logo will appear in the header of the chat page.
                  </Text>
                  <input
                    type="file"
                    className={`file-input-bordered file-input w-full border-violet-800 bg-violet-800 text-white  shadow-inner hover:border-violet-600 hover:bg-violet-800 ${montserrat_paragraph.variable} font-montserratParagraph`}
                    onChange={async (e) => {
                      // Assuming the file is converted to a URL somewhere else
                      setCourseBannerUrl(e.target.value)
                      if (e.target.files?.length) {
                        console.log('Uploading to s3')
                        const banner_s3_image = await uploadToS3(
                          e.target.files?.[0] ?? null,
                        )
                        if (banner_s3_image && courseMetadata) {
                          courseMetadata.banner_image_s3 = banner_s3_image
                          const response = await callSetCourseMetadata(
                            course_name,
                            courseMetadata,
                          )
                          if (response) {
                            setCourseBannerUrl(banner_s3_image)
                          } else {
                            console.log(
                              'Error upserting course metadata for course: ',
                              course_name,
                            )
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Flex>
    </Card>
  )
}

const PrivateOrPublicCourse = ({
  course_name,
  current_user_email,
  courseMetadata,
}: {
  course_name: string
  current_user_email: string
  courseMetadata: CourseMetadata
}) => {
  const [isPrivate, setIsPrivate] = useState(courseMetadata.is_private)
  const { classes } = useStyles() // for Accordion
  // const { user, isSignedIn, isLoaded } = useUser()
  // const user_emails = extractEmailsFromClerk(user)
  // console.log("in MakeNewCoursePage.tsx user email list: ", user_emails )

  const CheckboxIcon: CheckboxProps['icon'] = ({ indeterminate, className }) =>
    indeterminate ? (
      <IconLock className={className} />
    ) : (
      <IconLock className={className} />
    )

  const handleCheckboxChange = () => {
    const callSetCoursePublicOrPrivate = async (
      course_name: string,
      is_private: boolean,
    ) => {
      try {
        const url = new URL(
          '/api/UIUC-api/setCoursePublicOrPrivate',
          window.location.origin,
        )
        url.searchParams.append('course_name', course_name)
        url.searchParams.append('is_private', String(is_private))

        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await response.json()
        return data.success
      } catch (error) {
        console.error(
          'Error changing course from public to private (or vice versa):',
          error,
        )
        return false
      }
    }

    setIsPrivate(!isPrivate) // react gui
    callSetCoursePublicOrPrivate(course_name, !isPrivate) // db
  }

  const handleEmailAddressesChange = async (
    new_course_metadata: CourseMetadata,
    course_name: string,
  ) => {
    console.log('Fresh course metadata:', new_course_metadata)
    const response = await callSetCourseMetadata(
      course_name,
      new_course_metadata,
    )
    if (response) {
      console.log('Course metadata updated successfully')
    } else {
      console.error('Error updating course metadata')
    }
  }

  return (
    <>
      <Divider />
      <Title
        className={`${montserrat_heading.variable} font-montserratHeading`}
        variant="gradient"
        gradient={{ from: 'gold', to: 'white', deg: 170 }}
        order={3}
        // p="md"
        pl={'md'}
        pr={'md'}
        pt={'sm'}
        pb={0}
        style={{ alignSelf: 'left', marginLeft: '-11px' }}
      >
        Visibility{' '}
      </Title>
      <Accordion
        pl={27}
        pr={27}
        pt={40}
        pb={40}
        m={-40}
        // style={{ borderRadius: 'theme.radius.xl', width: '112%', maxWidth: 'min(50rem, )', marginLeft: 'max(-1rem, -10%)' }}
        style={{ borderRadius: 'theme.radius.xl' }}
        classNames={classes}
        className={classes.root}
      >
        {/* ... Accordion items */}
        <Accordion.Item value="openai-key-details">
          <Accordion.Control>
            <Text
              className={`label ${montserrat_light.className} inline-block p-0 text-neutral-200`}
              size={'md'}
            >
              Only these email address are able to access the content.
              {/* <span className={'text-purple-600'}>Read more</span>{' '}
              👇 */}
            </Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text
              className={`label ${montserrat_light.className} inline-block p-0 text-neutral-200`}
              size={'sm'}
            >
              Read our{' '}
              <a
                className={'text-purple-600'}
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                // style={{ textDecoration: 'underline' }}
              >
                strict security policy
              </a>{' '}
              on protecting your data. To add Admin users with full edit
              permission, ideal for TA&apos;s and collaborators, please just
              shoot me an email kvday2@illinois.edu.
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Group className="p-3">
        <Checkbox
          label={`Course is ${
            isPrivate ? 'private' : 'public'
          }. Click to change.`}
          wrapperProps={{}}
          // description="Course is private by default."
          aria-label="Checkbox to toggle Course being public or private. Private requires a list of allowed email addresses."
          className={`${montserrat_heading.variable} font-montserratHeading font-bold`}
          // style={{ marginTop: '4rem' }}
          size="lg"
          // bg='#020307'
          color="grape"
          icon={CheckboxIcon}
          defaultChecked={isPrivate}
          onChange={handleCheckboxChange}
        />
      </Group>

      {/* <Text
        className={`label p-0 ${montserrat_light.className} inline-block`}
        size={'sm'}
      >
        Only these email address are able to access the content.
        Read our{' '}
        <a
          className={'text-purple-600'}
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
        // style={{ textDecoration: 'underline' }}
        >
          strict security policy{' '}
        </a>
        <IconExternalLink
          size={'1.1em'}
          className="mr-2 inline-block text-purple-600"
          style={{ position: 'relative', top: '-3px' }}
        />
      </Text> */}
      {/* <Tooltip
        multiline
        width={220}
        withArrow
        transitionProps={{ duration: 200 }}
        label=""
      >
        <span>For admin users...</span>
      </Tooltip> */}
      {/* <Text className={`label p-0 ${montserrat_light.className}`} size={'sm'}>
        To add Admin users, who will have full edit access on this page, please
        just shoot me an email kvday2@illinois.edu.
      </Text> */}
      {/* <a href="/privacy">strict security policy</a>. Useful when setting a Course Wide OpenAI Key to limit usage. */}
      {isPrivate && (
        <EmailChipsComponent
          course_owner={current_user_email}
          course_admins={[]} // TODO: add admin functionality
          course_name={course_name}
          is_private={isPrivate}
          onEmailAddressesChange={handleEmailAddressesChange}
          course_intro_message={courseMetadata.course_intro_message || ''}
          banner_image_s3={courseMetadata.banner_image_s3 || ''}
          openai_api_key={courseMetadata.openai_api_key as string}
        />
      )}
      <Divider />
    </>
  )
}

export default EditCourseCard
