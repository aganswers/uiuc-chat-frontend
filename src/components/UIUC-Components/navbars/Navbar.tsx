import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState, useContext } from 'react'
import { montserrat_heading } from 'fonts'
import GlobalHeader from '~/components/UIUC-Components/navbars/GlobalHeader'
import HomeContext from '~/pages/api/home/home.context'
import { UserSettings } from '../../Chat/UserSettings'
import {
  Flex,
  Indicator,
  Container,
  Burger,
  Paper,
  createStyles,
  rem,
  Transition,
  Tooltip,
  Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  ChartDots3,
  MessageChatbot,
  ReportAnalytics,
  MessageCode,
  Code,
  Brain,
} from 'tabler-icons-react'
import { IconHome, IconFilePlus, IconClipboardText } from '@tabler/icons-react'

interface NavbarProps {
  course_name?: string
  bannerUrl?: string
  isPlain?: boolean
}

interface NavItem {
  name: React.ReactNode
  icon: React.ReactElement
  link: string
}

interface NavigationContentProps {
  items: NavItem[]
  opened: boolean
  activeLink: string
  onLinkClick: () => void
  onToggle: () => void
  courseName: string
}

const HEADER_HEIGHT = rem(90)

const useStyles = createStyles((theme) => ({
  burger: {
    [theme.fn.largerThan('md')]: {
      display: 'none',
    },
  },

  links: {
    padding: '0em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',

    [theme.fn.smallerThan('md')]: {
      display: 'none',
    },
  },

  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  link: {
    fontSize: rem(13),
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    margin: '0.1rem',
    fontWeight: 700,
    transition:
      'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
    borderRadius: theme.radius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    '&:hover': {
      color: '#ea580c',
      backgroundColor: 'rgba(234, 88, 12, 0.1)',
      textDecoration: 'none',
      borderRadius: '8px',
    },

    '&[data-active="true"]': {
      color: '#ea580c',
      borderBottom: '2px solid #ea580c',
      textDecoration: 'none',
      borderRadius: '8px',
      backgroundColor: 'rgba(234, 88, 12, 0.1)',
      textAlign: 'right',
    },

    [theme.fn.smallerThan('md')]: {
      display: 'list-item',
      textAlign: 'center',
      borderRadius: 0,
      padding: theme.spacing.xs,
    },
  },

  dropdown: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    right: '20px',
    zIndex: 2,
    borderRadius: '10px',
    overflow: 'hidden',
    width: '200px',
    [theme.fn.largerThan('lg')]: {
      display: 'none',
    },
  },

  iconButton: {
    color: '#374151',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    transition: 'all 0.2s ease',

    '&:hover': {
      color: '#ea580c',
      backgroundColor: 'rgba(234, 88, 12, 0.1)',
    },
  },

  divider: {
    borderColor: 'rgba(156, 163, 175, 0.3)',
    height: '2rem',
    marginTop: '0.25rem',
  },
}))

const styles = {
  logoContainerBox: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    height: '100%',
    maxWidth:
      typeof window !== 'undefined' && window.innerWidth > 600 ? '80%' : '100%',
    paddingRight:
      typeof window !== 'undefined' && window.innerWidth > 600 ? '4px' : '25px',
    paddingLeft: '25px',
  },
  thumbnailImage: {
    objectFit: 'cover',
    objectPosition: 'center',
    height: '100%',
    width: 'auto',
  },
} as const

function Logo() {
  return (
    <div className="flex-1">
      <Link href="/">
        <h2 className="ms-4 cursor-pointer text-2xl font-extrabold tracking-tight text-gray-900 sm:text-[1.8rem]">
          AgAnswers.<span className="text-orange-500">ai</span>
        </h2>
      </Link>
    </div>
  )
}

function BannerImage({ url }: { url: string }) {
  return (
    <div style={styles.logoContainerBox}>
      <Image
        src={url}
        style={styles.thumbnailImage}
        width={2000}
        height={2000}
        alt="Course chatbot logo"
        aria-label="The course creator uploaded a logo for this chatbot."
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
    </div>
  )
}

function NavText({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${montserrat_heading.variable} font-montserratHeading`}>
      {children}
    </span>
  )
}

function NavigationContent({
  items,
  opened,
  activeLink,
  onLinkClick,
  onToggle,
  courseName,
}: NavigationContentProps) {
  const { classes } = useStyles()
  const router = useRouter()

  return (
    <>
      <Transition transition="pop-top-right" duration={200} mounted={opened}>
        {(styles) => (
          <Paper className={classes.dropdown} withBorder style={styles}>
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                onClick={() => onLinkClick()}
                data-active={activeLink === item.link}
                className={classes.link}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                  {item.name}
                </span>
              </Link>
            ))}
          </Paper>
        )}
      </Transition>
      <button
        className={classes.link}
        onClick={() => {
          if (courseName) router.push(`/${courseName}/chat`)
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <MessageChatIcon />
          <span
            style={{
              whiteSpace: 'nowrap',
              marginRight: '-5px',
              paddingRight: '2px',
              padding: '4px 0',
            }}
            className={`${montserrat_heading.variable} font-montserratHeading`}
          >
            Chat
          </span>
        </div>
      </button>
      <Container className={classes.inner} style={{ paddingLeft: '0px' }}>
        <div className={classes.links}>
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.link}
              onClick={() => onLinkClick()}
              data-active={activeLink === item.link}
              className={classes.link}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {item.icon}
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </Container>
      <Burger
        opened={opened}
        onClick={onToggle}
        className={classes.burger}
        size="sm"
      />
    </>
  )
}

// Icon Components
export function MessageChatIcon() {
  return (
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
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  )
}

export function DashboardIcon() {
  return (
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
  )
}

export function LLMIcon() {
  return (
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
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  )
}

export function ReportIcon() {
  return (
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
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  )
}

export function ApiIcon() {
  return (
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
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  )
}

export function ChartDots3Icon() {
  return (
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
        d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 011 1v1a2 2 0 002 2z"
      />
    </svg>
  )
}

export function FileIcon() {
  return (
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
  )
}

export function ClipboardIcon() {
  return (
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

export default function Navbar({
  course_name = '',
  bannerUrl = '',
  isPlain = false,
}: NavbarProps) {
  const [opened, { toggle, close }] = useDisclosure(false)
  const router = useRouter()
  const [activeLink, setActiveLink] = useState<string>('')

  // Check if HomeContext is available (only on dashboard/chat pages)
  let homeContext
  try {
    homeContext = useContext(HomeContext)
  } catch (error) {
    // HomeContext not available on non-dashboard pages
    homeContext = null
  }

  const {
    state: { showModelSettings } = { showModelSettings: false },
    dispatch: homeDispatch,
    handleNewConversation,
  } = homeContext || { state: { showModelSettings: false }, dispatch: () => {}, handleNewConversation: () => {} }

  useEffect(() => {
    if (!router.isReady) return
    const path = router.asPath.split('?')[0]
    if (path) setActiveLink(path)
  }, [router.asPath, router.isReady])

  // Check if we're on a dashboard/chat page (where HomeContext should be available)
  const isDashboardPage = course_name && homeContext && [
    `/${course_name}/dashboard`,
    `/${course_name}/chat`, 
    `/${course_name}/llms`,
    `/${course_name}/tools`
  ].some(path => router.asPath.startsWith(path))

  const items: NavItem[] = [
    {
      name: <span>Dashboard</span>,
      icon: <DashboardIcon />,
      link: `/${course_name}/dashboard`,
    },
    {
      name: <span>Chat</span>,
      icon: <MessageChatIcon />,
      link: `/${course_name}/chat`,
    },
    // {
    //   name: <span>LLMs</span>,
    //   icon: <LLMIcon />,
    //   link: `/${course_name}/llms`,
    // },
    // {
    //   name: (
    //     <div className="relative">
    //       <span>Analysis</span>
    //       <span className="absolute -right-6 -top-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-xs text-white">
    //         New
    //       </span>
    //     </div>
    //   ),
    //   icon: <ReportIcon />,
    //   link: `/${course_name}/analysis`,
    // },
    // {
    //   name: <span>Tools</span>,
    //   icon: <ChartDots3Icon />,
    //   link: `/${course_name}/tools`,
    // },
    // {
    //   name: <span>API</span>,
    //   icon: <ApiIcon />,
    //   link: `/${course_name}/api`,
    // },
  ]

  if (isPlain) {
    return (
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              AgAnswers.<span className="text-orange-500">ai</span>
            </Link>
            <GlobalHeader isNavbar={true} />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`sticky top-0 border-b border-gray-200 bg-white ${opened ? 'z-[60]' : 'z-50'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Project Name */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-gray-900">
              AgAnswers.<span className="text-orange-500">ai</span>
            </Link>
            {course_name && (
              <>
                <div className="text-gray-400">/</div>
                <span className="font-medium text-gray-700">{course_name}</span>
              </>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                onClick={close}
                className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeLink === item.link
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden items-center space-x-8 md:flex">
              {isDashboardPage ? (
                <>
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
                    className="flex items-center space-x-1 text-gray-700 transition-colors hover:text-orange-600"
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
                    <span className="text-sm">New Chat</span>
                  </button>
                  <button
                    onClick={() => {
                      homeDispatch({
                        field: 'showModelSettings',
                        value: !showModelSettings,
                      })
                    }}
                    className="flex items-center space-x-1 text-gray-700 transition-colors hover:text-orange-600"
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
                    <span className="text-sm">Settings</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/new"
                    className="flex items-center space-x-1 text-gray-700 transition-colors hover:text-orange-600"
                  >
                    <FileIcon />
                    <span className="text-sm">New Project</span>
                  </Link>
                  {/* <Link
                    href="https://docs.uiuc.chat/"
                    className="text-sm text-gray-700 transition-colors hover:text-orange-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Docs
                  </Link> */}
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggle}
              className="rounded-md p-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 md:hidden"
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

            <GlobalHeader isNavbar={true} />
          </div>
        </div>

        {/* Mobile Navigation */}
        {opened && (
          <div className="border-t border-gray-200 py-4 md:hidden">
            <nav className="space-y-2">
              {items.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  onClick={close}
                  className={`flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activeLink === item.link
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
              <div className="mt-2 border-t border-gray-200 pt-2">
                {isDashboardPage ? (
                  <>
                    <button
                      onClick={() => {
                        handleNewConversation()
                        close()
                        setTimeout(() => {
                          const chatInput = document.querySelector(
                            'textarea.chat-input',
                          ) as HTMLTextAreaElement
                          if (chatInput) {
                            chatInput.focus()
                          }
                        }, 100)
                      }}
                      className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600"
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
                        close()
                      }}
                      className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600"
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
                  </>
                ) : (
                  <>
                    <Link
                      href="/new"
                      className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                    >
                      <FileIcon />
                      <span>New Project</span>
                    </Link>
                    {/* <Link
                      href="https://docs.uiuc.chat/"
                      className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ClipboardIcon />
                      <span>Documentation</span>
                    </Link> */}
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Model Settings Modal */}
      {isDashboardPage && showModelSettings && (
        <div className="absolute right-4 top-16 z-50 rounded-lg border border-gray-200 bg-white shadow-lg">
          <UserSettings />
        </div>
      )}
    </header>
  )
}
