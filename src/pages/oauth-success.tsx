import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function OAuthSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Close the popup window if it's a popup
    if (window.opener) {
      window.close()
    } else {
      // If not a popup, redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-green-800 mb-2">
          Authentication Successful!
        </h1>
        <p className="text-green-600">
          You can now close this window and return to the application.
        </p>
      </div>
    </div>
  )
}
