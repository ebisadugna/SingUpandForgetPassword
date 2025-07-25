import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import toast from "react-hot-toast"
import { sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { auth } from "../config/firebase" // Declare the auth variable here

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  console.log("useAuth context:", context)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const path=process.env.REACT_APP_API_URL || "http://localhost:5000"

  // Set up axios defaults and interceptors
  useEffect(() => {
    const token = localStorage.getItem("token")
    console.log("AuthProvider token:", token)
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }

    // Add response interceptor for handling 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem("token")
          delete axios.defaults.headers.common["Authorization"]
          setUser(null)

          // Only redirect if not already on login/register pages
          const currentPath = window.location.pathname
          if (currentPath !== "/login" && currentPath !== "/register" && currentPath !== "/auth/callback") {
            navigate("/login", { replace: true })
          }
        }
        return Promise.reject(error)
      },
    )

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [navigate])

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
          const response = await axios.get("/api/auth/me")
          setUser(response.data.user)
        } catch (error) {
          console.error("Auth check failed:", error)
          localStorage.removeItem("token")
          delete axios.defaults.headers.common["Authorization"]
          setUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password,setError) => {
    try {
      setError(null)
      setLoading(true)

      const response = await axios.post(`${path}/api/auth/login`, { email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      toast.success("Login successful!")

      // Navigate to dashboard or intended page
      const from = location.state?.from?.pathname || (user.role === "admin" ? "/admin" : "/dashboard")
      navigate(from, { replace: true })

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed"
      setError(message)
      // toast.error(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    try {
      setError(null)
      setLoading(true)

      const response = await axios.post(`${path}/api/auth/register`, { name, email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      toast.success("Registration successful!")

      // Navigate based on role
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true })

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed"
      setError(message)
      toast.error(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)

      // Redirect to Google OAuth
      const googleAuthUrl = `${path}/api/auth/google`
      window.location.href = googleAuthUrl
    } catch (error) {
      const message = "Google sign-in failed"
      setError(message)
      toast.error(message)
      setLoading(false)
    }
  }

  const loginWithToken = async (token) => {
    try {
      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      // Fetch user data
      const response = await axios.get(`${path}/api/auth/me`)
      setUser(response.data.user)
      const user = response.data.user

      toast.success("Login successful!")
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true })

      return { success: true }
    } catch (error) {
      console.error("Token login failed:", error)
      logout()
      toast.error("Authentication failed")
      return { success: false }
    }
  }

  // const forgotPassword = async (email) => {
  //   try {
  //     setError(null)
  //     setLoading(true)
  //     console.log("Sending password reset email to:", email)

  //     await sendPasswordResetEmail(auth, email, {
  //       url: `${window.location.origin}/login`,
  //       handleCodeInApp: false,
  //     })

  //     console.log("Password reset email sent successfully")
  //     return { success: true, message: "Password reset email sent successfully" }
  //   } catch (error) {
  //     console.error("Forgot password error:", error)
  //     const errorMessage = getFirebaseErrorMessage(error.code)
  //     setError(errorMessage)
  //     throw new Error(errorMessage)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const forgotPassword = async (email) => {
    try {
      const response = axios.post(`${path}/api/auth/forgot-password`, { email })
      console.log("Password reset email sent successfully", response.data);
      return response.data; // If no error thrown, status was 2xx
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to send reset email";
      throw new Error(message);
    }
  }


  const resetPassword = async (token, newPassword) => {
    try {
      setError(null)
      setLoading(true)
      console.log("Resetting password with backend token:", token)

      const response = await axios.post(`${path}/api/auth/reset-password/${token}`, {
        newPassword,
      })

      toast.success(response.data.message || "Password reset successful")
      return { success: true }
    } catch (error) {
      console.error("Backend reset password error:", error)
      const message = error.response?.data?.message || "Password reset failed"
      setError(message)
      toast.error(message)
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  // const verifyResetCode = async (oobCode) => {
  //   try {
  //     setError(null)
  //     console.log("Verifying reset code:", oobCode)

  //     const email = await verifyPasswordResetCode(auth, oobCode)
  //     console.log("Reset code verified for email:", email)

  //     return { success: true, email }
  //   } catch (error) {
  //     console.error("Verify reset code error:", error)
  //     const errorMessage = getFirebaseErrorMessage(error.code)
  //     setError(errorMessage)
  //     throw new Error(errorMessage)
  //   }
  // }

  const verifyResetCode = async (token) => {
    try {
      const response = await axios.post(`${path}/api/auth/verify-reset-code`, {
        token, // ✅ matches backend
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error("Invalid or expired reset token");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Invalid reset link";
      throw new Error(message);
    }
  };



  // Helper function to get user-friendly error messages
  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No account found with this email address"
      case "auth/invalid-email":
        return "Invalid email address"
      case "auth/too-many-requests":
        return "Too many requests. Please try again later"
      case "auth/network-request-failed":
        return "Network error. Please check your connection"
      case "auth/invalid-action-code":
        return "Invalid or expired reset code"
      case "auth/expired-action-code":
        return "Reset code has expired. Please request a new one"
      case "auth/weak-password":
        return "Password should be at least 6 characters"
      case "auth/wrong-password":
        return "Incorrect password"
      case "auth/invalid-credential":
        return "Invalid email or password"
      default:
        return "An error occurred. Please try again"
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
    setError(null)
    toast.success("Logged out successfully")
    navigate("/login", { replace: true })
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    loginWithToken,
    logout,
    forgotPassword,
    resetPassword,
    verifyResetCode,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    setError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
