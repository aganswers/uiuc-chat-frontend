import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useDisclosure } from '@mantine/hooks'
import Image from 'next/image'
import { useEffect, useState, useContext, useRef } from 'react'
import { useRouter } from 'next/router'
import { montserrat_heading } from 'fonts'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import HomeContext from '~/pages/api/home/home.context'
import { UserSettings } from '../../Chat/UserSettings'
import { usePostHog } from 'posthog-js/react'

interface ChatNavbarProps {
  bannerUrl?: string
  isgpt4?: boolean
}

const ChatNavbar = ({ bannerUrl = '', isgpt4 = true }: ChatNavbarProps) => {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  const [windowWidth, setWindowWidth] = useState(0)
  const [opened, { toggle }] = useDisclosure(false)
  const [isAdminOrOwner, setIsAdminOrOwner] = useState(false)

  const {
    state: { showModelSettings },
    dispatch: homeDispatch,
    handleNewConversation,
  } = useContext(HomeContext)

  const getCurrentCourseName = () => {
    return router.query.course_name as string
  }

  useEffect(() => {
    const fetchCourses = async () => {
      if (!isLoaded || !isSignedIn) return

      try {
        const response = await fetch(`/api/UIUC-api/getAllCourseNames`)
        if (response.ok) {
          const data = await response.json()
          const currentCourse = getCurrentCourseName()

          if (data.course_names?.includes(currentCourse)) {
            const metadataResponse = await fetch(
              `/api/UIUC-api/getCourseMetadata?course_name=${currentCourse}`,
            )
            if (metadataResponse.ok) {
              const metadataData = await metadataResponse.json()
              const metadata = metadataData.course_metadata

              if (metadata) {
                const userEmails = extractEmailsFromClerk(user)
                const userEmail = userEmails[0]

                const isOwner = metadata.course_owner === userEmail
                const isAdmin = metadata.course_admins?.includes(userEmail)

                setIsAdminOrOwner(isOwner || isAdmin)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error)
      }
    }

    fetchCourses()
  }, [isLoaded, isSignedIn, user, router.query.course_name])

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Project Name */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-gray-900">
              AgAnswers.<span className="text-orange-500">ai</span>
            </Link>
            {getCurrentCourseName() && (
              <>
                <div className="text-gray-400">/</div>
                <span className="font-medium text-gray-700">
                  {getCurrentCourseName()}
                </span>
              </>
            )}
          </div>

          {/* Desktop Actions - Ordered: New Chat, Settings, Dashboard */}
          <div className="hidden items-center space-x-4 md:flex">
            <button
              onClick={() => {
                handleNewConversation()
                setTimeout(() => {
                  const chatInput = document.querySelector(
                    'textarea.chat-input',
                  ) as HTMLTextAreaElement
                  if (chatInput) {
                    chatInput.focus()
                  }
                }, 100)
              }}
              className="flex items-center space-x-2 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50 hover:text-orange-500"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Chat</span>
            </button>

            <button
              onClick={() => {
                homeDispatch({
                  field: 'showModelSettings',
                  value: !showModelSettings,
                })
              }}
              className="flex items-center space-x-2 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50 hover:text-orange-500"
            >
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Settings</span>
            </button>

            {/* Dashboard button - always visible when inside a project */}
            {getCurrentCourseName() && (
              <Link
                href={`/${getCurrentCourseName()}/dashboard`}
                className="flex items-center space-x-2 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-50 hover:text-orange-500"
              >
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
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5v4M16 5v4"
                  />
                </svg>
                <span>Dashboard</span>
              </Link>
            )}

            {/* User Button */}
            <div className="flex items-center">
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <SignInButton />
              </SignedOut>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggle}
            className="rounded-md p-2 text-gray-700 hover:bg-gray-50 hover:text-orange-500 md:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {opened ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {opened && (
          <div className="border-t border-gray-200 py-4 md:hidden">
            <nav className="space-y-2">
              <button
                onClick={() => {
                  handleNewConversation()
                  toggle()
                  setTimeout(() => {
                    const chatInput = document.querySelector(
                      'textarea.chat-input',
                    ) as HTMLTextAreaElement
                    if (chatInput) {
                      chatInput.focus()
                    }
                  }, 100)
                }}
                className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-500"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>New Chat</span>
              </button>

              <button
                onClick={() => {
                  homeDispatch({
                    field: 'showModelSettings',
                    value: !showModelSettings,
                  })
                  toggle()
                }}
                className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-500"
              >
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Settings</span>
              </button>

              {/* Dashboard button - always visible when inside a project */}
              {getCurrentCourseName() && (
                <Link
                  href={`/${getCurrentCourseName()}/dashboard`}
                  className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-orange-500"
                  onClick={toggle}
                >
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
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5v4M16 5v4"
                    />
                  </svg>
                  <span>Dashboard</span>
                </Link>
              )}

              {/* Mobile User Button */}
              <div className="px-3 py-2">
                <SignedIn>
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  <SignInButton />
                </SignedOut>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Model Settings Modal */}
      {showModelSettings && (
        <div className="absolute right-4 top-16 z-50 rounded-lg border border-gray-200 bg-white shadow-lg">
          <UserSettings />
        </div>
      )}
    </header>
  )
}

export default ChatNavbar
