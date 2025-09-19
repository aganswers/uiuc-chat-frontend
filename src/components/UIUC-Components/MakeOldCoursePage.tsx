import Head from 'next/head'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Navbar from './navbars/Navbar'
import GlobalFooter from './GlobalFooter'
import { fetchPresignedUrl } from '~/utils/apiUtils'

import { CannotEditCourse } from './CannotEditCourse'
import { type CourseMetadata } from '~/types/courseMetadata'
import { UploadCard } from './UploadCard'
import DocumentGroupsCard from './DocumentGroupsCard'
import DocumentsCard from './DocumentsCard'

const MakeOldCoursePage = ({
  course_name,
  metadata,
  current_email,
}: {
  course_name: string
  metadata: CourseMetadata
  current_email: string
}) => {
  const [bannerUrl, setBannerUrl] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (metadata == null) {
          console.error('No metadata found for course')
          return
        }
        // fetch banner image url
        if (metadata?.banner_image_s3 && metadata.banner_image_s3 !== '') {
          console.log('Getting banner image: ', metadata.banner_image_s3)
          try {
            const url = await fetchPresignedUrl(
              metadata.banner_image_s3,
              course_name,
            )
            setBannerUrl(url as string)
            console.log('Got banner image: ', url)
          } catch (error) {
            console.error('Error fetching banner image: ', error)
          }
        }
      } catch (error) {
        console.error(error)
      }
    }

    fetchData()
  }, [metadata])

  // Check authorization
  if (
    metadata &&
    current_email !== (metadata.course_owner as string) &&
    metadata.course_admins.indexOf(current_email) === -1
  ) {
    router.replace(`/${course_name}/not_authorized`)
    return <CannotEditCourse course_name={course_name as string} />
  }

  return (
    <>
      <Navbar course_name={course_name} bannerUrl={bannerUrl} />

      <Head>
        <title>{course_name} - Dashboard - AgAnswers.ai</title>
        <meta
          name="description"
          content="The AI assistant built for agricultural projects."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Project Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your project content and settings
            </p>
          </div>

          <div className="space-y-8">
            {/* Upload Card Section */}
            <UploadCard
              projectName={course_name}
              current_user_email={current_email}
              metadata={metadata}
            />

            {/* Document Groups Section */}
            <DocumentGroupsCard course_name={course_name} />

            {/* Project Files Section */}
            <DocumentsCard course_name={course_name} metadata={metadata} />
          </div>
        </div>

        {/* <GlobalFooter /> */}
      </main>
    </>
  )
}

export default MakeOldCoursePage
