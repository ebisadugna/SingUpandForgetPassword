import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Set up axios defaults
  const token = localStorage.getItem("token")
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
  }

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const response = await axios.get("/api/auth/me")
          setUser(response.data.user)
        } catch (error) {
          localStorage.removeItem("token")
          delete axios.defaults.headers.common["Authorization"]
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      toast.success("Login successful!")
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed"
      toast.error(message)
      return { success: false, message }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await axios.post("/api/auth/register", { name, email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      toast.success("Registration successful!")
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed"
      toast.error(message)
      return { success: false, message }
    }
  }

  const loginWithToken = (token) => {
    localStorage.setItem("token", token)
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

    // Fetch user data
    axios
      .get("/api/auth/me")
      .then((response) => {
        setUser(response.data.user)
        toast.success("Login successful!")
      })
      .catch((error) => {
        logout()
        toast.error("Authentication failed")
      })
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
    toast.success("Logged out successfully")
  }

  const value = {
    user,
    loading,
    login,
    register,
    loginWithToken,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
