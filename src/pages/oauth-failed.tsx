import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function OAuthFailed() {
  const router = useRouter()

  useEffect(() => {
    // Close the popup window if it's a popup
    if (window.opener) {
      window.close()
    } else {
      // If not a popup, redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-800 mb-2">
          Authentication Failed
        </h1>
        <p className="text-red-600 mb-4">
          There was an error connecting your Google Drive account.
        </p>
        <p className="text-sm text-red-500">
          You can close this window and try again.
        </p>
      </div>
    </div>
  )
}
