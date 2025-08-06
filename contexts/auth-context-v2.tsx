"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService, User, AuthError } from '@/lib/auth-service-v2'
import { createLogger } from '@/lib/logger-factory'

const logger = createLogger('AuthContext', 'INFO', 'Contexto de autenticação')

interface AuthContextValue {
  // Estado (sempre consistente SSR/CSR)
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
  
  // Profile photo state
  profilePhotoUrl: string | null
  
  // Ações
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  clearError: () => void
  updateProfilePhoto: (photoUrl: string) => void
}

// Estado inicial consistente entre SSR e CSR
const INITIAL_STATE: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Sempre true inicialmente para evitar flash
  error: null,
  profilePhotoUrl: null,
  signIn: async () => { throw new Error('AuthContext not initialized') },
  signOut: async () => { throw new Error('AuthContext not initialized') },
  clearError: () => { throw new Error('AuthContext not initialized') },
  updateProfilePhoto: () => { throw new Error('AuthContext not initialized') }
}

const AuthContext = createContext<AuthContextValue>(INITIAL_STATE)

export function AuthProviderV2({ children }: { children: React.ReactNode }) {
  // Estado local do contexto
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // Flag para controlar hidratação
  useEffect(() => {
    setMounted(true)
    // console.log('🔄 AuthProviderV2: Componente montado no cliente')
  }, [])
  
  // Subscrever para mudanças de autenticação (apenas após montagem)
  useEffect(() => {
    if (!mounted) return
    
    logger.debug('Conectando com AuthService')
    
    const unsubscribe = authService.onAuthChange((newUser, authError) => {
      logger.debug('Estado atualizado', { 
        userId: newUser?.uid,
        hasError: !!authError,
        hasProfilePhoto: !!newUser?.url_foto
      })
      
      setUser(newUser)
      setIsLoading(authService.isLoading())
      setError(authError || null)
      setProfilePhotoUrl(newUser?.url_foto || null)
    })
    
    // Verificar sessão automaticamente após conectar
    authService.checkSession().catch((error) => {
      logger.debug('Erro na verificação automática de sessão', {}, error)
    }).finally(() => {
      setIsLoading(false)
    })
    
    return unsubscribe
  }, [mounted])
  
  // Métodos de autenticação
  const signIn = useCallback(async (email: string, password: string): Promise<User> => {
    setError(null)
    try {
      const user = await authService.signIn(email, password)
      return user
    } catch (err) {
      const authError = err as Error & AuthError
      setError(authError)
      throw err
    }
  }, [])
  
  const signOut = useCallback(async (): Promise<void> => {
    setError(null)
    try {
      await authService.signOut()
    } catch (err) {
      const authError = err as Error & AuthError
      setError(authError)
      throw err
    }
  }, [])
  
  const clearError = useCallback(() => {
    setError(null)
    authService.clearError()
  }, [])
  
  const updateProfilePhoto = useCallback((photoUrl: string) => {
    authService.updateUserProfilePhoto(photoUrl)
    setProfilePhotoUrl(photoUrl)
  }, [])
  
  // Calcular isAuthenticated baseado no estado atual
  const isAuthenticated = authService.isAuthenticated()
  
  const contextValue: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    profilePhotoUrl,
    signIn,
    signOut,
    clearError,
    updateProfilePhoto
  }
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook otimizado integrado
export function useAuthV2() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuthV2 deve ser usado dentro de um AuthProviderV2')
  }
  
  return context
}

// Exports compatíveis
export const useAuth = useAuthV2
export const AuthProvider = AuthProviderV2

// Função para verificar se tem permissão (helper)
export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false
  return user.perfis.includes(role)
}