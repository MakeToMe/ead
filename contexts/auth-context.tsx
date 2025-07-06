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
    let mounted = true
    const load = async () => {
      const u = await ensureUserLoaded()
      if (mounted) {
        setUser(u)
        setIsLoading(false)
      }
    }
    load()

    // Ouvir eventos de mudança de autenticação vindos de auth-client
    const handler = async () => {
      const u = await ensureUserLoaded()
      if (mounted) {
        setUser(u)
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("auth-changed", handler)
    }
    return () => {
      mounted = false
      if (typeof window !== "undefined") {
        window.removeEventListener("auth-changed", handler)
      }
    }
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
