
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/auth-context"

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login with the current location
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
