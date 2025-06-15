"use client"

import { useAuth } from "../contexts/auth-context"
import { auth } from "../config/firebase"

export function AuthDebug() {
  const { currentUser, firebaseUser, loading, isAuthenticated } = useAuth()

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? "true" : "false"}</div>
        <div>Authenticated: {isAuthenticated ? "true" : "false"}</div>
        <div>Firebase User: {firebaseUser?.uid || "null"}</div>
        <div>Current User: {currentUser?.uid || "null"}</div>
        <div>Auth Current User: {auth.currentUser?.uid || "null"}</div>
      </div>
    </div>
  )
}
