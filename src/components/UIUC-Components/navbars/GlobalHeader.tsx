import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/nextjs'
import { IconClipboardText, IconFile } from '@tabler/icons-react'
// import MagicBell, {
//   FloatingNotificationInbox,
// } from '@magicbell/magicbell-react'

export default function Header({ isNavbar = false }: { isNavbar?: boolean }) {
  const headerStyle = isNavbar
    ? {
        backgroundColor: 'white',
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0.2em 0.2em',
        paddingRight: '0.3em',
      }
    : {
        backgroundColor: 'white',
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '1em',
      }

  const clerk_obj = useUser()
  const posthog = usePostHog()
  const [userEmail, setUserEmail] = useState('no_email')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (clerk_obj.isLoaded) {
      if (clerk_obj.isSignedIn) {
        const emails = extractEmailsFromClerk(clerk_obj.user)
        setUserEmail(emails[0] || 'no_email')

        // Posthog identify
        posthog?.identify(clerk_obj.user.id, {
          email: emails[0] || 'no_email',
        })
      }
      setIsLoaded(true)
    } else {
      // console.debug('NOT LOADED OR SIGNED IN')
    }
  }, [clerk_obj.isLoaded])

  if (!isLoaded) {
    return (
      <header style={headerStyle} className="py-16">
        {/* Skeleton placeholders for two icons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div
            className="skeleton-box"
            style={{ width: '35px', height: '35px', borderRadius: '50%' }}
          ></div>
          <div style={{ paddingLeft: '0px', paddingRight: '10px' }} />
          <div
            className="skeleton-box"
            style={{ width: '35px', height: '35px', borderRadius: '50%' }}
          ></div>
        </div>
      </header>
    )
  }

  return (
    <header style={headerStyle} className="py-16">
      <SignedIn>
        {/* Docs: https://www.magicbell.com/docs/libraries/react#custom-themes */}
        {/* <MagicBell
          apiKey={process.env.NEXT_PUBLIC_MAGIC_BELL_API as string}
          userEmail={userEmail}
          theme={magicBellTheme}
          locale="en"
          images={{
            emptyInboxUrl:
              'https://assets.kastan.ai/minified_empty_chat_art.png',
          }}
        > */}
        {/* {(props) => (
            <FloatingNotificationInbox width={400} height={500} {...props} />
          )}
        </MagicBell> */}
        {/* Add some padding for separation */}
        <div style={{ paddingLeft: '0px', paddingRight: '10px' }}></div>
        {/* Mount the UserButton component */}
        <UserButton />
      </SignedIn>
      <SignedOut>
        {/* Signed out users get sign in button */}
        <SignInButton />
      </SignedOut>
    </header>
  )
}

import Link from 'next/link'
import { montserrat_heading } from 'fonts'
import { createStyles, Group, rem } from '@mantine/core'
import { extractEmailsFromClerk } from '../clerkHelpers'
import { useEffect, useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { IconFilePlus } from '@tabler/icons-react'

export function LandingPageHeader({
  forGeneralPurposeNotLandingpage = false,
}: {
  forGeneralPurposeNotLandingpage?: boolean
}) {
  const { classes, theme } = useStyles()
  const headerStyle: React.CSSProperties = forGeneralPurposeNotLandingpage
    ? {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        padding: '2rem 2rem',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }
    : {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        padding: '1rem 2rem',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }

  const clerk_obj = useUser()
  const [userEmail, setUserEmail] = useState('no_email')
  const [isLoaded, setIsLoaded] = useState(false)
  const posthog = usePostHog()

  useEffect(() => {
    if (clerk_obj.isLoaded) {
      if (clerk_obj.isSignedIn) {
        const emails = extractEmailsFromClerk(clerk_obj.user)
        setUserEmail(emails[0] || 'no_email')

        // Posthog identify
        posthog?.identify(clerk_obj.user.id, {
          email: emails[0] || 'no_email',
        })
      }
      setIsLoaded(true)
    } else {
      // console.debug('NOT LOADED OR SIGNED IN')
    }
  }, [clerk_obj.isLoaded])

  if (!isLoaded) {
    return (
      <header style={headerStyle}>
        {/* Logo on the left */}
        <h1 className="text-2xl font-bold text-gray-900">
          AgAnswers.<span className="text-orange-600">ai</span>
        </h1>

        {/* Skeleton placeholders on the right */}
        <div className="flex items-center gap-4">
          <div
            className="skeleton-box h-8 w-8 animate-pulse rounded-full bg-gray-200"
          ></div>
          <div
            className="skeleton-box h-8 w-8 animate-pulse rounded-full bg-gray-200"
          ></div>
        </div>
      </header>
    )
  }

  return (
    <header style={headerStyle}>
      {/* Logo on the left */}
      <h1 className="text-2xl font-bold text-gray-900">
        AgAnswers.<span className="text-orange-600">ai</span>
      </h1>

      {/* Navigation and user controls on the right */}
      <div className="flex items-center gap-6">
        {forGeneralPurposeNotLandingpage === false && (
          <>
            <Link
              href="/new"
              className="flex items-center gap-2 font-medium text-gray-700 transition-colors hover:text-orange-600"
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
              Projects
            </Link>
            <Link
              href="https://docs.uiuc.chat/"
              className="font-medium text-gray-700 transition-colors hover:text-orange-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </Link>
          </>
        )}
        <SignedIn>
          <div className="flex items-center">
            <UserButton />
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton>
            <button className="font-medium text-gray-700 transition-colors hover:text-orange-600">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  )
}

export function FileIcon() {
  return (
    <IconFilePlus size={20} strokeWidth={2} style={{ marginRight: '5px' }} />
  )
}

export function IconClipboardTexts() {
  return (
    <IconClipboardText
      size={20}
      strokeWidth={2}
      style={{ marginRight: '5px' }}
    />
  )
}

const HEADER_HEIGHT = rem(84)

const useStyles = createStyles((theme) => ({
  inner: {
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  links: {
    padding: '.2em, 1em',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',

    [theme.fn.smallerThan('sm')]: {
      display: 'none',
    },
  },
  link: {
    // textTransform: 'uppercase',
    fontSize: rem(13),
    color: '#f1f5f9',
    padding: `${theme.spacing.sm} ${theme.spacing.xs}`,
    // margin: '0.35rem',
    fontWeight: 700,
    transition:
      'border-color 100ms ease, color 100ms ease, background-color 100ms ease',
    borderRadius: theme.radius.sm, // added to make the square edges round

    '&:hover': {
      color: '#ea580c', // orange-600
      backgroundColor: 'rgba(234, 88, 12, 0.1)',
      textDecoration: 'none',
      borderRadius: '10px',
    },
    '&[data-active="true"]': {
      color: '#ea580c', // orange-600
      borderBottom: '2px solid #ea580c', // orange-600
      textDecoration: 'none', // remove underline
      borderRadius: '10px', // added to make the square edges round when hovered
      backgroundColor: '#fef3f2', // orange-50
      textAlign: 'right', // align the text to the right
    },
  },
}))

// DOCS: https://www.magicbell.com/docs/libraries/react#custom-themes
// export const magicBellTheme = {
//   prose: {
//     headings: '#ffffff',
//     links: '#ea580c',
//     bold: '#ffffff',
//     hr: '#ea580c',
//     quotes: '#ffffff',
//     quoteBorders: '#ea580c',
//     captions: '#ea580c',
//     code: '#ffffff',
//     preCode: '#ea580c',
//     preBg: '#070711',
//     thBorders: '#ea580c',
//     tdBorders: '#ea580c',
//     buttonBorders: '#ea580c',
//     buttons: '#ffffff',
//     fontMono:
//       'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
//   },
//   icon: {
//     borderColor: '#fff',
//     width: '24px',
//   },
//   header: {
//     backgroundColor: '#15162c',
//     backgroundOpacity: 1,
//     borderRadius: '8px',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//     fontSize: '14px',
//     fontWeight: 'inherit',
//     textColor: '#e2e8f0',
//     // textAlign: 'left' as "center" | "left" | "right" | "inherit" | "initial" | "justify",
//     // textTransform: 'uppercase' as "uppercase" | "lowercase" | "capitalize" | "none" | "inherit" | "initial" | "revert" | "unset",
//     textTransform: 'uppercase' as
//       | 'inherit'
//       | 'initial'
//       | 'none'
//       | 'capitalize'
//       | 'lowercase'
//       | 'uppercase',
//     padding: '16px 24px',
//     borderColor: '#807f7f',
//   },
//   footer: {
//     backgroundColor: '#15162c',
//     backgroundOpacity: 1,
//     borderRadius: '8px',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//     fontSize: '14px',
//     fontWeight: 'inherit',
//     textColor: '#15162c',
//     textAlign: 'left' as
//       | 'center'
//       | 'left'
//       | 'right'
//       | 'inherit'
//       | 'initial'
//       | 'justify',
//     // textTransform: 'none',
//     padding: '16px 24px',
//     borderColor: '#807f7f',
//   },
//   banner: {
//     backgroundColor: '#15162c',
//     backgroundOpacity: 0.1,
//     textColor: '#e2e8f0',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//     // textAlign: 'left',
//     fontSize: '14px',
//     boxShadow: 'none',
//   },
//   unseenBadge: {
//     backgroundColor: '#DF4759',
//     backgroundOpacity: 1,
//     borderRadius: '4px',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//     fontSize: '14px',
//     fontWeight: 'inherit',
//     textColor: 'white',
//     // textAlign: 'left' as "center" | "left" | "right" | "inherit" | "initial" | "justify",
//     // textTransform: undefined,
//   },
//   container: {
//     backgroundColor: '#15162c',
//     backgroundOpacity: 1,
//     borderRadius: '8px',
//     fontFamily:
//       '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//     fontWeight: 'inherit',
//     fontSize: '14px',
//     textColor: '#e2e8f0',
//     // textAlign: 'left',
//     // textTransform: 'none',
//     boxShadow:
//       '0px 20px 25px rgba(84, 95, 111, 0.1), 0px 10px 10px rgba(84, 95, 111, 0.04)',
//   },
//   notification: {
//     default: {
//       backgroundColor: 'transparent',
//       backgroundOpacity: 0,
//       borderRadius: '8px',
//       fontFamily:
//         '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
//       fontSize: '14px',
//       fontWeight: 'inherit',
//       textColor: '#e2e8f0',
//       // textAlign: 'left',
//       // textTransform: 'none',
//       margin: '4px',
//       padding: '16px 20px 16px 12px',
//       title: {
//         fontFamily: 'inherit',
//         fontSize: 'inherit',
//         fontWeight: 500,
//         textColor: 'inherit',
//       },
//       hover: {
//         backgroundColor: '#ea580c',
//         backgroundOpacity: 0.16,
//       },
//       state: {
//         color: 'transparent',
//       },
//     },
//     unread: {
//       backgroundColor: '#ea580c',
//       backgroundOpacity: 0.3,
//       state: {
//         color: '#ea580c',
//       },
//     },
//     unseen: {
//       backgroundColor: '#ea580c',
//       backgroundOpacity: 0.05,
//       state: {
//         color: '#ea580c',
//       },
//     },
//   },
// }
