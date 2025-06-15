import axios from "axios"

class AuthService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"
    this.token = localStorage.getItem("authToken")

    // Set up axios defaults
    axios.defaults.baseURL = this.baseURL

    if (this.token) {
      this.setAuthHeader(this.token)
    }
  }

  setAuthHeader(token) {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common["Authorization"]
    }
  }

  async setAuthToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem("authToken", token)
      this.setAuthHeader(token)
    } else {
      localStorage.removeItem("authToken")
      this.setAuthHeader(null)
    }
  }

  async getUserData(uid = null) {
    try {
      let url = "/auth/me"
      if (uid) {
        url = `/auth/user/${uid}`
      }

      const response = await axios.get(url)
      return response.data
    } catch (error) {
      console.error("Error fetching user data:", error)
      if (error.response?.status === 404) {
        throw new Error("USER_NOT_FOUND")
      }
      throw error
    }
  }

  async handleGoogleSignIn(userData) {
    try {
      const response = await axios.post("/auth/google-signin", userData)
      return response.data
    } catch (error) {
      console.error("Error handling Google sign-in:", error)
      throw error
    }
  }

  async register(userData) {
    try {
      const response = await axios.post("/auth/register", userData)
      return response.data
    } catch (error) {
      console.error("Error registering user:", error)
      throw error
    }
  }

  async login(credentials) {
    try {
      const response = await axios.post("/auth/login", credentials)
      return response.data
    } catch (error) {
      console.error("Error logging in:", error)
      throw error
    }
  }

  async logout() {
    try {
      await axios.post("/auth/logout")
      await this.setAuthToken(null)
    } catch (error) {
      console.error("Error logging out:", error)
      // Still clear local token even if server request fails
      await this.setAuthToken(null)
    }
  }
}

const authService = new AuthService()
export default authService
