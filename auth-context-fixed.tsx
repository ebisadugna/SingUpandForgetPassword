"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User, LoginData, RegisterData } from "../types/auth"
import authService from "../services/authService"
import { auth } from "../config/firebase"
import {
  signInWithRedirect,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"
import { useNavigate } from "react-router-dom"

interface AuthContextType {
  currentUser: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  signOut: () => Promise<void> // Alias for logout
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  signOut: async () => {}, // Alias for logout
  signInWithGoogle: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redirectChecked, setRedirectChecked] = useState(false) // Add this state to track if we've checked for redirect
  const navigate = useNavigate()

  // Handle user data fetching and role-based navigation
  const handleUserData = async (firebaseUser: any) => {
    try {
      if (!firebaseUser) {
        console.error("No Firebase user provided to handleUserData")
        throw new Error("No user data available")
      }

      // Get the ID token
      const idToken = await firebaseUser.getIdToken(true) // Force refresh token
      console.log("Got Firebase ID token", idToken)

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

        // Navigate based on role
        const currentPath = window.location.pathname
        if (currentPath === "/login" || currentPath === "/register") {
          console.log("Navigating to:", user.role === "admin" ? "/admin" : "/dashboard")
          console.log("user.role", user.role)
          navigate(user.role === "admin" ? "/admin" : "/dashboard")
        }
      } catch (error: any) {
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
    } catch (error: any) {
      console.error("Error in handleUserData:", error)
      setError("Failed to process authentication")
      setCurrentUser(null)
      await auth.signOut()
      navigate("/login")
    }
  }

  // Handle redirect result and auth state changes
  useEffect(() => {
    let unsubscribe: () => void

    const initialize = async () => {
      try {
        setLoading(true)

        // Set persistence to LOCAL
        await setPersistence(auth, browserLocalPersistence)

        // First, check for redirect result - this will only run once per page load
        if (!redirectChecked) {
          console.log("Checking for redirect result...")
          try {
            const result = await getRedirectResult(auth)
            console.log("Redirect result:", result)

            if (result?.user) {
              console.log("Got redirect result with user:", result.user)
              await handleUserData(result.user)
            } else {
              console.log("No redirect result or user found")
            }
          } catch (redirectError) {
            console.error("Error getting redirect result:", redirectError)
            setError("Failed to complete authentication")
          } finally {
            setRedirectChecked(true) // Mark that we've checked for redirect
          }
        }

        // Then set up auth state listener
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          console.log("Auth state changed:", firebaseUser)

          try {
            if (firebaseUser) {
              // Only handle user data if we don't have a current user or if the UID changed
              if (!currentUser || currentUser.uid !== firebaseUser.uid) {
                await handleUserData(firebaseUser)
              }
            } else {
              setCurrentUser(null)
              await authService.setAuthToken(null)
              const currentPath = window.location.pathname
              console.log("currentPath", currentPath)
              if (currentPath !== "/login" && currentPath !== "/register") {
                navigate("/login")
              }
            }
          } catch (error) {
            console.error("Error in auth state change handler:", error)
            setError("Authentication state change failed")
            setCurrentUser(null)
            navigate("/login")
          } finally {
            setLoading(false)
          }
        })
      } catch (error) {
        console.error("Error during initialization:", error)
        setError("Failed to initialize authentication")
        setCurrentUser(null)
        setLoading(false)
        navigate("/login")
      }
    }

    initialize()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [navigate, currentUser, redirectChecked]) // Add redirectChecked to dependencies

  const signInWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)
      console.log("Starting Google sign-in...")

      const provider = new GoogleAuthProvider()
      provider.addScope("profile")
      provider.addScope("email")

      // Clear any existing auth state
      await auth.signOut()

      // Reset the redirectChecked state so we check for redirect result on next page load
      setRedirectChecked(false)

      // Trigger the redirect
      await signInWithRedirect(auth, provider)
      // The redirect result will be handled by the useEffect above
    } catch (error: any) {
      console.error("Google Sign-In error:", error)
      setError(error.message || "Failed to sign in with Google")
      setLoading(false)
    }
  }

  const login = async (data: LoginData) => {
    try {
      setError(null)
      // First sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
      await handleUserData(userCredential.user)
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Failed to log in")
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setError(null)
      // First create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)

      // Then register in your backend
      const { user } = await authService.register({
        ...data,
        uid: userCredential.user.uid,
      })
      setCurrentUser(user)

      // Navigate based on role
      navigate(user.role === "admin" ? "/admin" : "/dashboard")
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to register")
      throw error
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await auth.signOut()
      setCurrentUser(null)
      authService.setAuthToken(null)
      navigate("/login")
    } catch (error: any) {
      console.error("Logout error:", error)
      setError(error.message || "Failed to log out")
      throw error
    }
  }

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    error,
    login,
    register,
    logout,
    signOut: logout,
    signInWithGoogle,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export default AuthContext
