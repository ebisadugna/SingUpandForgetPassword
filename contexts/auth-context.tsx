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
  type User as FirebaseUser,
} from "firebase/auth"
import { useNavigate } from "react-router-dom"

interface AuthContextType {
  currentUser: User | null
  firebaseUser: FirebaseUser | null // Add Firebase user for debugging
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  firebaseUser: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  signOut: async () => {},
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)
  const navigate = useNavigate()

  // Handle user data fetching and role-based navigation
  const handleUserData = async (firebaseUser: FirebaseUser) => {
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
        if (currentPath === "/login" || currentPath === "/register") {
          console.log("Navigating to:", user.role === "admin" ? "/admin" : "/dashboard")
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

  // Initialize Firebase Auth
  useEffect(() => {
    let unsubscribe: () => void

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
          console.log("Firebase user details:", {
            uid: firebaseUser?.uid,
            email: firebaseUser?.email,
            displayName: firebaseUser?.displayName,
            emailVerified: firebaseUser?.emailVerified,
          })

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
            if (currentPath !== "/login" && currentPath !== "/register") {
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
  }, [])

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
    } catch (error: any) {
      console.error("Google Sign-In error:", error)
      setError(error.message || "Failed to sign in with Google")
      setLoading(false)
    }
  }

  const login = async (data: LoginData) => {
    try {
      setError(null)
      setLoading(true)
      console.log("Attempting email/password login...")

      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
      console.log("Email/password login successful:", userCredential.user)

      // The onAuthStateChanged listener will handle the rest
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Failed to log in")
      setLoading(false)
      throw error
    }
  }

  const register = async (data: RegisterData) => {
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
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to register")
      setLoading(false)
      throw error
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
    } catch (error: any) {
      console.error("Logout error:", error)
      setError(error.message || "Failed to log out")
      throw error
    }
  }

  // Debug logging
  useEffect(() => {
    console.log("Auth Context State:", {
      currentUser: currentUser?.uid || "null",
      firebaseUser: firebaseUser?.uid || "null",
      isAuthenticated: !!currentUser,
      loading,
      authInitialized,
      error,
    })
  }, [currentUser, firebaseUser, loading, authInitialized, error])

  const value: AuthContextType = {
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
