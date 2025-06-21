"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getCurrentClientUser, ensureUserLoaded, type User } from "@/lib/auth-client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getCurrentClientUser())
  const [isLoading, setIsLoading] = useState(user === null)

  useEffect(() => {
    // Carrega/garante usuário de forma assíncrona via cookie
    ensureUserLoaded().then((u) => {
      setUser(u)
      setIsLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
