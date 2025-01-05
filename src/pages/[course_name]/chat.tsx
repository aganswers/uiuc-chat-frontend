// export { default } from '~/pages/api/home'

import { useUser } from '@clerk/nextjs'
import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Home from '../api/home/home'
import { useRouter } from 'next/router'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { CourseMetadata } from '~/types/courseMetadata'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { montserrat_heading } from 'fonts'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import Head from 'next/head'
import { GUIDED_LEARNING_PROMPT } from '~/utils/app/const'

const ChatPage: NextPage = () => {
  const clerk_user_outer = useUser()
  const { user, isLoaded, isSignedIn } = clerk_user_outer
  const router = useRouter()
  const curr_route_path = router.asPath as string
  const getCurrentPageName = () => {
    return router.query.course_name as string
  }
  const courseName = getCurrentPageName() as string
  const [currentEmail, setCurrentEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [isCourseMetadataLoading, setIsCourseMetadataLoading] = useState(true)
  const [urlGuidedLearning, setUrlGuidedLearning] = useState(false)
  const [documentCount, setDocumentCount] = useState<number | null>(null)

  // UseEffect to check URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const guidedLearningParam = urlParams.get('guided_learning')
    setUrlGuidedLearning(guidedLearningParam === 'true')
  }, [router.query])

  // UseEffect to fetch course metadata
  useEffect(() => {
    if (!courseName && curr_route_path != '/gpt4') return
    const courseMetadata = async () => {
      setIsLoading(true)

      // Handle /gpt4 page (special non-course page)
      let curr_course_name = courseName
      if (courseName == '/gpt4') {
        curr_course_name = 'gpt4'
      }

      // Fetch course metadata and document count in parallel
      const [metadataResponse, documentsResponse] = await Promise.all([
        fetch(`/api/UIUC-api/getCourseMetadata?course_name=${curr_course_name}`),
        fetch(`/api/materialsTable/fetchProjectMaterials?from=0&to=0&course_name=${curr_course_name}`)
      ])

      const [metadataData, documentsData] = await Promise.all([
        metadataResponse.json(),
        documentsResponse.json()
      ])
      
      // If URL guided learning is enabled and course-wide guided learning is not,
      // append the GUIDED_LEARNING_PROMPT to the system prompt if it's not already there
      if (metadataData.course_metadata && !metadataData.course_metadata.guidedLearning) {
        const urlParams = new URLSearchParams(window.location.search)
        const guidedLearningParam = urlParams.get('guided_learning')
        if (guidedLearningParam === 'true' && 
            metadataData.course_metadata.system_prompt && 
            !metadataData.course_metadata.system_prompt.includes(GUIDED_LEARNING_PROMPT)) {
          metadataData.course_metadata.system_prompt = metadataData.course_metadata.system_prompt + GUIDED_LEARNING_PROMPT
        }
      }
      
      setCourseMetadata(metadataData.course_metadata)
      setDocumentCount(documentsData.total_count || 0)
      setIsCourseMetadataLoading(false)
      setIsLoading(false)
    }
    courseMetadata()
  }, [courseName, urlGuidedLearning])

  // UseEffect to check user permissions and fetch user email
  useEffect(() => {
    if (!isLoaded || isCourseMetadataLoading) {
      return
    }
    if (clerk_user_outer.isLoaded || isCourseMetadataLoading) {
      if (courseMetadata != null) {
        const permission_str = get_user_permission(
          courseMetadata,
          clerk_user_outer,
          router,
        )

        if (permission_str == 'edit' || permission_str == 'view') {
        } else {
          router.replace(`/${courseName}/not_authorized`)
        }
      } else {
        // 🆕 MAKE A NEW COURSE
        console.log('Course does not exist, redirecting to materials page')
        router.push(`/${courseName}/dashboard`)
      }
      // console.log(
      //   'Changing user email to: ',
      //   extractEmailsFromClerk(clerk_user_outer.user)[0],
      // )
      // This will not work because setUserEmail is async
      // setUserEmail(extractEmailsFromClerk(clerk_user_outer.user)[0] as string)
      const email = extractEmailsFromClerk(user)[0]
      if (email) {
        setCurrentEmail(email)
        // console.log('setting user email: ', user)
        // console.log('type of user: ', typeof user)
      } else {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY as string
        // console.log('key: ', key)
        const postHogUserObj = localStorage.getItem('ph_' + key + '_posthog')
        // console.log('posthog user obj: ', postHogUserObj)
        if (postHogUserObj) {
          const postHogUser = JSON.parse(postHogUserObj)
          setCurrentEmail(postHogUser.distinct_id)
          console.log(
            'setting user email as posthog user: ',
            postHogUser.distinct_id,
          )
        } else {
          // When user is not logged in and posthog user is not found, what to do?
          // This is where page will not load
        }
      }
    }
  }, [clerk_user_outer.isLoaded, isCourseMetadataLoading])

  return (
    <>
      {!isLoading && currentEmail && courseMetadata && (
        <Home
          current_email={currentEmail}
          course_metadata={courseMetadata}
          course_name={courseName}
          document_count={documentCount}
        />
      )}
      {isLoading && !currentEmail && (
        <MainPageBackground>
          <div
            className={`flex items-center justify-center font-montserratHeading ${montserrat_heading.variable}`}
          >
            <span className="mr-2">Warming up the knowledge engines...</span>
            <LoadingSpinner size="sm" />
          </div>
        </MainPageBackground>
      )}
    </>
  )
}

export default ChatPage
