/**
 * usePhoto Hook - Hook React para gerenciar fotos de perfil
 * 
 * Fornece uma interface React para o PhotoCacheManager,
 * com atualizações automáticas e retry integrado.
 */

import { useState, useEffect, useCallback } from 'react'
import photoCacheManager, { type PhotoLoadResult } from '@/lib/photo-cache-manager'
import enhancedLogger from '@/lib/enhanced-logger'

export interface UsePhotoOptions {
  autoRetry?: boolean
  retryDelay?: number
}

export interface UsePhotoReturn {
  photoUrl: string | null
  fallbackInitial: string
  isLoading: boolean
  error: string | null
  retry: () => Promise<void>
  updatePhoto: (newPhotoPath: string | null) => Promise<void>
}

/**
 * Hook para gerenciar foto de perfil de um usuário
 */
export function usePhoto(
  userId: string | undefined,
  photoPath: string | null | undefined,
  userName: string | undefined,
  options: UsePhotoOptions = {}
): UsePhotoReturn {
  const { autoRetry = true, retryDelay = 2000 } = options

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [fallbackInitial, setFallbackInitial] = useState<string>('?')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para carregar foto
  const loadPhoto = useCallback(async () => {
    if (!userId || !userName) {
      enhancedLogger.debug('usePhoto', 'Dados insuficientes para carregar foto', {
        hasUserId: !!userId,
        hasUserName: !!userName
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await photoCacheManager.getPhotoUrl(userId, photoPath || null, userName)
      
      setPhotoUrl(result.url)
      setFallbackInitial(result.fallbackInitial)
      
      if (!result.success && result.error) {
        setError(result.error)
        
        // Auto-retry se habilitado
        if (autoRetry && result.error !== 'Máximo de tentativas excedido') {
          setTimeout(() => {
            enhancedLogger.debug('usePhoto', 'Tentando retry automático', { userId })
            loadPhoto()
          }, retryDelay)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      enhancedLogger.error('usePhoto', 'Erro ao carregar foto', {
        userId,
        photoPath,
        error: errorMessage
      }, err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, photoPath, userName, autoRetry, retryDelay])

  // Função para retry manual
  const retry = useCallback(async () => {
    if (!userId || !userName) return
    
    enhancedLogger.debug('usePhoto', 'Retry manual solicitado', { userId })
    
    setError(null)
    await photoCacheManager.retryPhotoLoad(userId, userName)
  }, [userId, userName])

  // Função para atualizar foto
  const updatePhoto = useCallback(async (newPhotoPath: string | null) => {
    if (!userId || !userName) return

    enhancedLogger.audit('usePhoto', 'photo_update_requested', {
      userId,
      oldPhotoPath: photoPath,
      newPhotoPath
    })

    setIsLoading(true)
    setError(null)

    try {
      const result = await photoCacheManager.updatePhoto(userId, newPhotoPath, userName)
      
      setPhotoUrl(result.url)
      setFallbackInitial(result.fallbackInitial)
      
      if (!result.success && result.error) {
        setError(result.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar foto'
      setError(errorMessage)
      enhancedLogger.error('usePhoto', 'Erro ao atualizar foto', {
        userId,
        newPhotoPath,
        error: errorMessage
      }, err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, userName, photoPath])

  // Carregar foto quando dados mudarem (com dependências específicas)
  useEffect(() => {
    if (userId && userName) {
      loadPhoto()
    }
  }, [userId, photoPath, userName]) // Dependências específicas em vez de loadPhoto

  // Subscrever para atualizações automáticas
  useEffect(() => {
    if (!userId) return

    const unsubscribe = photoCacheManager.subscribe(userId, (result: PhotoLoadResult) => {
      enhancedLogger.debug('usePhoto', 'Atualização recebida via subscription', {
        userId,
        success: result.success,
        hasUrl: !!result.url
      })

      setPhotoUrl(result.url)
      setFallbackInitial(result.fallbackInitial)
      
      if (!result.success && result.error) {
        setError(result.error)
      } else {
        setError(null)
      }
      
      setIsLoading(false)
    })

    return unsubscribe
  }, [userId])

  return {
    photoUrl,
    fallbackInitial,
    isLoading,
    error,
    retry,
    updatePhoto
  }
}

/**
 * Hook simplificado para apenas exibir foto (sem atualizações)
 */
export function usePhotoDisplay(
  userId: string | undefined,
  photoPath: string | null | undefined,
  userName: string | undefined
) {
  const { photoUrl, fallbackInitial, isLoading, error } = usePhoto(userId, photoPath, userName, {
    autoRetry: true
  })

  return {
    photoUrl,
    fallbackInitial,
    isLoading,
    hasError: !!error
  }
}