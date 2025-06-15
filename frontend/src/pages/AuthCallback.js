"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CheckCircle, XCircle } from "lucide-react"

const AuthCallback = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState("processing")

  useEffect(() => {
    const handleCallback = () => {
      const token = searchParams.get("token")
      const error = searchParams.get("error")

      if (error) {
        console.error("OAuth error:", error)
        setStatus("error")
        setTimeout(() => {
          window.location.href = "/login?error=oauth_failed"
        }, 3000)
        return
      }

      if (token) {
        setStatus("success")

        // Store token and redirect
        localStorage.setItem("token", token)

        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 2000)
      } else {
        setStatus("error")
        setTimeout(() => {
          window.location.href = "/login"
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === "processing" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing authentication...</h2>
            <p className="text-gray-600">Please wait while we sign you in.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication successful!</h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication failed</h2>
            <p className="text-gray-600">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthCallback
