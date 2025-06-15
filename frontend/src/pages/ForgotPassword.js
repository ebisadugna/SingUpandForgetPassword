"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [errors, setErrors] = useState({})

  const { forgotPassword } = useAuth()

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear previous errors
    setErrors({})

    // Validate email
    if (!email) {
      setErrors({ email: "Email is required" })
      return
    }

    if (!validateEmail(email)) {
      setErrors({ email: "Please enter a valid email address" })
      return
    }

    setLoading(true)

    try {
      await forgotPassword(email)
      setEmailSent(true)
      toast.success("Password reset email sent successfully!")
    } catch (error) {
      console.error("Forgot password error:", error)
      toast.error(error.message || "Failed to send reset email")
      setErrors({ email: error.message || "Failed to send reset email" })
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    try {
      await forgotPassword(email)
      toast.success("Password reset email sent again!")
    } catch (error) {
      toast.error(error.message || "Failed to resend email")
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Check your email</h2>
            <p className="mt-2 text-sm text-gray-600">We've sent a password reset link to</p>
            <p className="text-sm font-medium text-gray-900">{email}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">Didn't receive the email? Check your spam folder or</p>
                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-500 font-medium text-sm disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Resend email"}
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <Link
                  to="/login"
                  className="flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Forgot your password?</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`w-full px-3 py-2 pl-10 border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) {
                      setErrors({ ...errors, email: "" })
                    }
                  }}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  "Send reset email"
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to login</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
