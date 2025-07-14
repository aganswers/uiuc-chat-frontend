import Link from 'next/link'
import React, { ReactNode } from 'react'
import { LandingPageHeader } from './navbars/GlobalHeader'
import Navbar from './navbars/Navbar'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './LoadingSpinner'

interface MainPageBackgroundProps {
  children: ReactNode
}

export const MainPageBackground: React.FC<MainPageBackgroundProps> = ({
  children,
}) => {
  return (
    <>
      <LandingPageHeader forGeneralPurposeNotLandingpage={true} />
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Link href="/">
            <h2 className="mb-8 text-4xl font-bold text-gray-900">
              AgAnswers.
              <span className="text-orange-500">ai</span>
            </h2>
          </Link>
          {children}
        </div>
      </main>
    </>
  )
}

export const LoadingPlaceholderForAdminPages = ({}) => {
  const router = useRouter()
  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  return (
    <>
      <Navbar course_name={getCurrentPageName()} />
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4">
            <LoadingSpinner size="lg" />
          </div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </main>
    </>
  )
}

// export default MainPageBackground
