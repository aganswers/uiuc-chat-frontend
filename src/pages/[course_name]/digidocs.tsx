import { type NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import DigiDocsDropzone from '~/components/DigiDocs/DigiDocsDropzone'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'

const DigiDocsPage: NextPage = () => {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const [courseName, setCourseName] = useState<string>('')

  useEffect(() => {
    if (!router.isReady) return
    const name = (router.query.course_name as string) || ''
    setCourseName(name)
  }, [router.isReady, router.query.course_name])

  if (!router.isReady || !isLoaded || !courseName) {
    return (
      <div className="flex h-screen flex-col bg-white">
        <div className="flex h-16 items-center border-b border-gray-200 bg-white px-4">
          <div className="text-xl font-bold text-gray-900">
            AgAnswers.<span className="text-orange-500">ai</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <AuthComponent course_name={courseName} />
  }

  return (
    <>
      <Head>
        <title>{courseName} - DigiDocs | AgAnswers.ai</title>
        <meta name="description" content="Upload farm logistics documents as images. We OCR them into searchable, chat-usable documents." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen flex-col bg-white">
        <Navbar course_name={courseName} />
        <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">DigiDocs</h1>
            <p className="mt-1 text-sm text-gray-600">
              Drag and drop images of farm documents (receipts, shipping labels, packing lists, soil test results, etc.).
              They&apos;ll be converted to rich HTML via OCR, ingested, and made searchable for the Search pane and usable by the chatbot.
            </p>
          </div>

          <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <DigiDocsDropzone courseName={courseName} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">How it works</h2>
            <ol className="mt-2 list-inside list-decimal text-sm text-gray-600">
              <li>Upload one or more images (JPG, PNG, TIFF, WEBP).</li>
              <li>We perform OCR and generate a polished HTML version of the document.</li>
              <li>The HTML is ingested so it becomes searchable and available to the chatbot for data-augmented answers.</li>
            </ol>
            <p className="mt-3 text-xs text-gray-500">
              Tip: Use clear, high-resolution images for best OCR results. Each file will appear under your project&apos;s materials once indexing completes.
            </p>
          </section>
        </main>
      </div>
    </>
  )
}

export default DigiDocsPage
