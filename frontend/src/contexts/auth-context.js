"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  signInWithRedirect,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth"
import { auth } from "../config/firebase"
import authService from "../services/authService"

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authInitialized, setAuthInitialized] = useState(false)
  const navigate = useNavigate()

  // Handle user data fetching and role-based navigation
  const handleUserData = async (firebaseUser) => {
    try {
      console.log("Processing Firebase user:", firebaseUser)

      if (!firebaseUser) {
        console.error("No Firebase user provided to handleUserData")
        throw new Error("No user data available")
      }

      // Get the ID token
      const idToken = await firebaseUser.getIdToken(true)
      console.log("Got Firebase ID token")

      // Set authorization header for future requests
      await authService.setAuthToken(idToken)

      try {
        // Try to get existing user data
        const { user } = await authService.getUserData(firebaseUser.uid)
        console.log("Got existing user data:", user)

        if (!user) {
          throw new Error("USER_NOT_FOUND")
        }

        setCurrentUser(user)
        console.log("Current user set:", user)

        // Navigate based on role
        const currentPath = window.location.pathname
        if (currentPath === "/login" || currentPath === "/register" || currentPath === "/forgot-password") {
          console.log("Navigating to:", user.role === "admin" ? "/admin" : "/dashboard")
          navigate(user.role === "admin" ? "/admin" : "/dashboard")
        }
      } catch (error) {
        console.error("Error in user data fetch:", error)

        if (error.message === "USER_NOT_FOUND") {
          // New user - register them
          console.log("User not found, registering new user with Google data")
          const { user: newUser } = await authService.handleGoogleSignIn({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || "",
          })

          if (!newUser) {
            throw new Error("Failed to create new user")
          }

          console.log("Successfully registered new user:", newUser)
          setCurrentUser(newUser)
          navigate(newUser.role === "admin" ? "/admin" : "/dashboard")
        } else {
          console.error("Error getting user data:", error)
          setError("Failed to get user data")
          await auth.signOut()
        }
      }
    } catch (error) {
      console.error("Error in handleUserData:", error)
      setError("Failed to process authentication")
      setCurrentUser(null)
      await auth.signOut()
      navigate("/login")
    }
  }

  // Initialize Firebase Auth
  useEffect(() => {
    let unsubscribe

    const initializeAuth = async () => {
      try {
        console.log("Initializing Firebase Auth...")

        // Set persistence first
        await setPersistence(auth, browserLocalPersistence)
        console.log("Firebase persistence set to LOCAL")

        // Check for redirect result first
        try {
          const result = await getRedirectResult(auth)
          console.log("Redirect result:", result)

          if (result?.user) {
            console.log("Processing redirect result user:", result.user)
            setFirebaseUser(result.user)
            await handleUserData(result.user)
          }
        } catch (redirectError) {
          console.error("Error getting redirect result:", redirectError)
        }

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log("Auth state changed. Firebase user:", firebaseUser)

          setFirebaseUser(firebaseUser)

          if (firebaseUser) {
            // User is signed in
            if (!currentUser || currentUser.uid !== firebaseUser.uid) {
              await handleUserData(firebaseUser)
            }
          } else {
            // User is signed out
            console.log("No Firebase user - clearing state")
            setCurrentUser(null)
            await authService.setAuthToken(null)

            const currentPath = window.location.pathname
            if (
              currentPath !== "/login" &&
              currentPath !== "/register" &&
              currentPath !== "/forgot-password" &&
              currentPath !== "/reset-password"
            ) {
              navigate("/login")
            }
          }

          if (!authInitialized) {
            setAuthInitialized(true)
          }
          setLoading(false)
        })
      } catch (error) {
        console.error("Error initializing auth:", error)
        setError("Failed to initialize authentication")
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, []) // Remove dependencies to prevent infinite loops

  const signInWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)
      console.log("Starting Google sign-in...")

      const provider = new GoogleAuthProvider()
      provider.addScope("profile")
      provider.addScope("email")

      // Use redirect method
      await signInWithRedirect(auth, provider)
    } catch (error) {
      console.error("Google Sign-In error:", error)
      setError(error.message || "Failed to sign in with Google")
      setLoading(false)
    }
  }

  const login = async (data) => {
    try {
      setError(null)
      setLoading(true)
      console.log("Attempting email/password login...")

      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
      console.log("Email/password login successful:", userCredential.user)

      // The onAuthStateChanged listener will handle the rest
    } catch (error) {
      console.error("Login error:", error)
      setError(error.message || "Failed to log in")
      setLoading(false)
      throw error
    }
  }

  const register = async (data) => {
    try {
      setError(null)
      setLoading(true)

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      console.log("Registration successful:", userCredential.user)

      // Register in your backend
      const { user } = await authService.register({
        ...data,
        uid: userCredential.user.uid,
      })

      setCurrentUser(user)
      navigate(user.role === "admin" ? "/admin" : "/dashboard")
    } catch (error) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to register")
      setLoading(false)
      throw error
    }
  }

  const forgotPassword = async (email) => {
    try {
      setError(null)
      setLoading(true)
      console.log("Sending password reset email to:", email)

      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      })

      console.log("Password reset email sent successfully")
      return { success: true, message: "Password reset email sent successfully" }
    } catch (error) {
      console.error("Forgot password error:", error)
      const errorMessage = getFirebaseErrorMessage(error.code)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (oobCode, newPassword) => {
    try {
      setError(null)
      setLoading(true)
      console.log("Resetting password with code:", oobCode)

      // Verify the password reset code first
      await verifyPasswordResetCode(auth, oobCode)

      // Reset the password
      await confirmPasswordReset(auth, oobCode, newPassword)

      console.log("Password reset successful")
      return { success: true, message: "Password reset successful" }
    } catch (error) {
      console.error("Reset password error:", error)
      const errorMessage = getFirebaseErrorMessage(error.code)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const verifyResetCode = async (oobCode) => {
    try {
      setError(null)
      console.log("Verifying reset code:", oobCode)

      const email = await verifyPasswordResetCode(auth, oobCode)
      console.log("Reset code verified for email:", email)

      return { success: true, email }
    } catch (error) {
      console.error("Verify reset code error:", error)
      const errorMessage = getFirebaseErrorMessage(error.code)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      console.log("Logging out...")

      await auth.signOut()
      setCurrentUser(null)
      setFirebaseUser(null)
      await authService.setAuthToken(null)
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
      setError(error.message || "Failed to log out")
      throw error
    }
  }

  // Add this method after the verifyResetCode method
  const loginWithToken = async (token) => {
    try {
      setError(null)
      setLoading(true)
      console.log("Logging in with token...")

      // Store the token
      await authService.setAuthToken(token)

      // Get user data
      const response = await authService.getUserData()
      if (response.user) {
        setCurrentUser(response.user)
        console.log("User logged in with token:", response.user)
        return response.user
      } else {
        throw new Error("Invalid user data")
      }
    } catch (error) {
      console.error("Token login error:", error)
      await authService.setAuthToken(null)
      setError("Failed to authenticate with token")
      throw error
    } finally {
      setLoading(false)
    }
  }

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

  // Update the value object to include loginWithToken
  const value = {
    currentUser,
    firebaseUser,
    isAuthenticated: !!currentUser,
    loading,
    error,
    login,
    register,
    logout,
    signOut: logout,
    signInWithGoogle,
    forgotPassword,
    resetPassword,
    verifyResetCode,
    loginWithToken,
    setError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
