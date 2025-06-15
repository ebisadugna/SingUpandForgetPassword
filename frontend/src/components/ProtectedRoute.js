"use client"

import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation()
  const { isAuthenticated, user, loading } = useAuth()

  try {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }

    if (!isAuthenticated) {
      // Redirect to login with the current location
      return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (adminOnly && user?.role !== "admin") {
      return <Navigate to="/dashboard" replace />
    }

    return children
  } catch (error) {
    console.error("ProtectedRoute error:", error)
    // If there's an error with the auth context, redirect to login
    return <Navigate to="/login" replace />
  }
}

export default ProtectedRoute
