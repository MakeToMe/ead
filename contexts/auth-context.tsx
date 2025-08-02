"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import authService, { type User, type AuthError } from "@/lib/auth-service"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: AuthError | null
  signIn: (email: string, password: string) => Promise<User>
  signUp: (name: string, email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  signIn: async () => { throw new Error('AuthContext not initialized') },
  signUp: async () => { throw new Error('AuthContext not initialized') },
  signOut: async () => { throw new Error('AuthContext not initialized') },
  clearError: () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [mounted, setMounted] = useState(false)

  // Aguardar montagem no cliente para evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  // Subscrever para mudanças de autenticação
  useEffect(() => {
    if (!mounted) return

    const unsubscribe = authService.onAuthChange((newUser, authError) => {
      setUser(newUser)
      setIsLoading(authService.isLoading())
      
      if (authError) {
        setError(authError)
      }

      // Log apenas mudanças significativas em desenvolvimento
      if (process.env.NODE_ENV === 'development' && newUser?.uid !== user?.uid) {
        console.log('📡 AuthProvider: Estado de autenticação atualizado', { 
          userId: newUser?.uid,
          nome: newUser?.nome,
          isAuthenticated: !!newUser
        })
      }
    })

    return unsubscribe
  }, [mounted, user?.uid])

  // Métodos de autenticação
  const signIn = useCallback(async (email: string, password: string): Promise<User> => {
    setError(null)
    try {
      const user = await authService.signIn(email, password)
      return user
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      throw authError
    }
  }, [])

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<User> => {
    setError(null)
    try {
      const user = await authService.signUp(name, email, password)
      return user
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      throw authError
    }
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    setError(null)
    try {
      await authService.signOut()
    } catch (err) {
      console.error('❌ AuthProvider: Erro no logout', err)
      // Não mostrar erro de logout para o usuário
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: authService.isAuthenticated(),
        error,
        signIn,
        signUp,
        signOut,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook otimizado integrado
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  const { user, isLoading, isAuthenticated, error, signIn, signUp, signOut, clearError } = context
  
  // Métodos de conveniência memoizados
  const hasRole = useCallback((role: User['perfis']): boolean => {
    return user?.perfis === role
  }, [user?.perfis])
  
  const getUserId = useCallback((): string | null => {
    return user?.uid || null
  }, [user?.uid])
  
  const getUserName = useCallback((): string | null => {
    return user?.nome || null
  }, [user?.nome])
  
  const getUserEmail = useCallback((): string | null => {
    return user?.email || null
  }, [user?.email])
  
  // Retorno memoizado para evitar re-renders desnecessários
  return useMemo(() => ({
    // Estado
    user,
    isLoading,
    isAuthenticated,
    error,
    
    // Métodos de autenticação
    signIn,
    signUp,
    signOut,
    clearError,
    
    // Métodos de conveniência
    hasRole,
    getUserId,
    getUserName,
    getUserEmail
  }), [
    user,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
    hasRole,
    getUserId,
    getUserName,
    getUserEmail
  ])
}