// This is uiuc.chat/chat - useful to everyone as a free alternative to ChatGPT.com and Claude.ai.

import { montserrat_heading } from 'fonts'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import {
  LoadingPlaceholderForAdminPages,
  MainPageBackground,
} from '~/components/UIUC-Components/MainPageBackground'
import Home from '~/pages/api/home/home'
import { CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'

const ChatPage: NextPage = () => {
  const [metadata, setMetadata] = useState<CourseMetadata | null>()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const clerk_user_outer = useUser()
  const { user, isLoaded, isSignedIn } = clerk_user_outer
  const [currentEmail, setCurrentEmail] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      try {
        const local_metadata: CourseMetadata = (await fetchCourseMetadata(
          'chat',
        )) as CourseMetadata

        if (local_metadata && local_metadata.is_private) {
          local_metadata.is_private = JSON.parse(
            local_metadata.is_private as unknown as string,
          )
        }
        setMetadata(local_metadata)
      } catch (error) {
        console.error(error)
      }
    }
    fetchCourseData()
  }, [router.isReady])

  useEffect(() => {
    if (!router.isReady) return
    if (!metadata) return
    if (metadata == null) return

    // Everything is loaded
    setIsLoading(false)
  }, [router.isReady, metadata])

  useEffect(() => {
    if (!isLoaded) return
    const email = extractEmailsFromClerk(user)[0]
    if (email) {
      setCurrentEmail(email)
    } else {
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY as string
      const postHogUserObj = localStorage.getItem('ph_' + key + '_posthog')
      if (postHogUserObj) {
        const postHogUser = JSON.parse(postHogUserObj)
        setCurrentEmail(postHogUser.distinct_id)
      }
    }
  }, [isLoaded, user])

  if (isLoading) {
    return <LoadingPlaceholderForAdminPages />
  }

  const course_metadata = metadata

  // Loading spinner
  if (!course_metadata) {
    return (
      <MainPageBackground>
        <div
          className={`flex items-center justify-center font-montserratHeading ${montserrat_heading.variable}`}
        >
          <span className="mr-2">Warming up the knowledge engines...</span>
          <LoadingSpinner size="sm" />
        </div>
      </MainPageBackground>
    )
  }

  return (
    <>
      <Home
        current_email={currentEmail}
        course_metadata={course_metadata}
        course_name={'chat'}
        document_count={0}
        link_parameters={{
          guidedLearning: false,
          documentsOnly: false,
          systemPromptOnly: false,
        }}
      />
    </>
  )
}

export default ChatPage
