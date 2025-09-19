import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { extractEmailsFromClerk } from '../clerkHelpers'

export default function Header({ isNavbar = false }: { isNavbar?: boolean }) {
  const clerk_obj = useUser()
  const posthog = usePostHog()
  const [userEmail, setUserEmail] = useState('no_email')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (clerk_obj.isLoaded) {
      if (clerk_obj.isSignedIn) {
        const emails = extractEmailsFromClerk(clerk_obj.user)
        setUserEmail(emails[0] || 'no_email')

        posthog?.identify(clerk_obj.user.id, {
          email: emails[0] || 'no_email',
        })
      }
      setIsLoaded(true)
    }
  }, [clerk_obj.isLoaded])

  if (!isLoaded) {
    return (
      <header
        className={`flex items-center justify-end bg-white ${isNavbar ? 'px-2 py-1' : 'p-4'}`}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
        </div>
      </header>
    )
  }

  return (
    <header
      className={`flex items-center justify-end bg-white ${isNavbar ? 'px-2 py-1' : 'p-4'}`}
    >
      <SignedIn>
        <div className="flex items-center">
          <UserButton />
        </div>
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>
    </header>
  )
}

export function LandingPageHeader({
  forGeneralPurposeNotLandingpage = false,
}: {
  forGeneralPurposeNotLandingpage?: boolean
}) {
  const clerk_obj = useUser()
  const [userEmail, setUserEmail] = useState('no_email')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const posthog = usePostHog()

  useEffect(() => {
    if (clerk_obj.isLoaded) {
      if (clerk_obj.isSignedIn) {
        const emails = extractEmailsFromClerk(clerk_obj.user)
        setUserEmail(emails[0] || 'no_email')

        posthog?.identify(clerk_obj.user.id, {
          email: emails[0] || 'no_email',
        })
      }
      setIsLoaded(true)
    }
  }, [clerk_obj.isLoaded])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (!isLoaded) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                AgAnswers.<span className="text-orange-600">ai</span>
              </h1>
            </div>

            {/* Loading skeleton */}
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-6 sm:flex">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 transition-colors hover:text-orange-600 sm:text-2xl">
                AgAnswers.<span className="text-orange-600">ai</span>
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {!forGeneralPurposeNotLandingpage && (
              <>
                <SignedIn>
                  <Link
                    href="/new"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-orange-600"
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
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal" fallbackRedirectUrl="/new">
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-orange-600">
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
                    </button>
                  </SignInButton>
                </SignedOut>
              </>
            )}

            {/* User Authentication */}
            <SignedIn>
              <div className="flex items-center">
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <button className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-3 md:hidden">
            <SignedIn>
              <div className="flex items-center">
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <button className="text-sm font-medium text-gray-700 transition-colors hover:text-orange-600">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>

            {!forGeneralPurposeNotLandingpage && (
              <button
                onClick={toggleMobileMenu}
                className="rounded-lg p-2 text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                aria-label="Toggle mobile menu"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
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
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {!forGeneralPurposeNotLandingpage && isMobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              <SignedIn>
                <Link
                  href="/new"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                  onClick={() => setIsMobileMenuOpen(false)}
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
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal" fallbackRedirectUrl="/new">
                  <button 
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                    onClick={() => setIsMobileMenuOpen(false)}
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
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
