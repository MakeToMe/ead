/**
 * Photo Cache Manager - Gerenciador de cache unificado para fotos de perfil
 * 
 * Responsável por:
 * - Cache unificado de URLs de foto entre componentes
 * - Retry automático para falhas de carregamento
 * - Sincronização de atualizações de foto
 * - Fallback consistente para iniciais
 */

import enhancedLogger from "@/lib/enhanced-logger"

export interface PhotoCacheEntry {
  userId: string
  photoPath: string | null
  signedUrl: string | null
  timestamp: number
  retryCount: number
  isValid: boolean
}

export interface PhotoLoadResult {
  success: boolean
  url: string | null
  fallbackInitial: string
  error?: string
}

class PhotoCacheManager {
  private cache: Map<string, PhotoCacheEntry> = new Map()
  private readonly CACHE_DURATION = 600000 // 10 minutos (aumentado para melhor performance)
  private readonly MAX_RETRY_ATTEMPTS = 3
  private readonly RETRY_DELAY = 1000 // 1 segundo
  private subscribers: Map<string, Set<(result: PhotoLoadResult) => void>> = new Map()

  /**
   * Obtém URL da foto com cache e retry automático
   */
  async getPhotoUrl(userId: string, photoPath: string | null, userName: string): Promise<PhotoLoadResult> {
    // Log apenas em caso de erro (removido log de debug)

    const fallbackInitial = this.generateFallbackInitial(userName)

    // Se não há foto, retornar fallback imediatamente
    if (!photoPath) {
      return {
        success: true,
        url: null,
        fallbackInitial
      }
    }

    // Verificar cache
    const cached = this.getCachedEntry(userId, photoPath)
    if (cached && cached.isValid) {
      enhancedLogger.debug('PhotoCacheManager', 'URL obtida do cache', {
        userId,
        cachedUrl: cached.signedUrl
      })

      return {
        success: true,
        url: cached.signedUrl,
        fallbackInitial
      }
    }

    // Carregar nova URL assinada
    try {
      const signedUrl = await this.loadSignedUrl(photoPath, cached?.retryCount || 0)
      
      if (signedUrl) {
        // Atualizar cache
        this.updateCache(userId, photoPath, signedUrl)
        
        enhancedLogger.audit('PhotoCacheManager', 'photo_url_loaded', {
          userId,
          photoPath,
          signedUrl: signedUrl.substring(0, 50) + '...'
        })

        // Notificar subscribers
        this.notifySubscribers(userId, {
          success: true,
          url: signedUrl,
          fallbackInitial
        })

        return {
          success: true,
          url: signedUrl,
          fallbackInitial
        }
      } else {
        throw new Error('URL assinada não pôde ser gerada')
      }
    } catch (error) {
      enhancedLogger.error('PhotoCacheManager', 'Erro ao carregar foto', {
        userId,
        photoPath,
        error: error.message
      }, error as Error)

      // Incrementar contador de retry se necessário
      if (cached) {
        cached.retryCount++
        cached.isValid = false
      }

      // Notificar subscribers sobre o erro
      this.notifySubscribers(userId, {
        success: false,
        url: null,
        fallbackInitial,
        error: error.message
      })

      return {
        success: false,
        url: null,
        fallbackInitial,
        error: error.message
      }
    }
  }

  /**
   * Atualiza foto no cache quando há mudança
   */
  async updatePhoto(userId: string, newPhotoPath: string | null, userName: string): Promise<PhotoLoadResult> {
    enhancedLogger.audit('PhotoCacheManager', 'photo_updated', {
      userId,
      newPhotoPath,
      userName
    })

    // Invalidar cache existente
    this.invalidateUserCache(userId)

    // Carregar nova foto
    const result = await this.getPhotoUrl(userId, newPhotoPath, userName)

    // Notificar todos os subscribers sobre a atualização
    this.notifySubscribers(userId, result)

    return result
  }

  /**
   * Invalida cache de um usuário específico
   */
  invalidateUserCache(userId: string): void {
    const entry = this.cache.get(userId)
    if (entry) {
      entry.isValid = false
      enhancedLogger.debug('PhotoCacheManager', 'Cache invalidado para usuário', { userId })
    }
  }

  /**
   * Invalida todo o cache
   */
  invalidateAllCache(): void {
    this.cache.clear()
    enhancedLogger.debug('PhotoCacheManager', 'Todo o cache foi invalidado')
  }

  /**
   * Subscreve para receber atualizações de foto de um usuário
   */
  subscribe(userId: string, callback: (result: PhotoLoadResult) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set())
    }
    
    this.subscribers.get(userId)!.add(callback)
    
    enhancedLogger.debug('PhotoCacheManager', 'Novo subscriber adicionado', { userId })

    // Retornar função de unsubscribe
    return () => {
      const userSubscribers = this.subscribers.get(userId)
      if (userSubscribers) {
        userSubscribers.delete(callback)
        if (userSubscribers.size === 0) {
          this.subscribers.delete(userId)
        }
      }
      enhancedLogger.debug('PhotoCacheManager', 'Subscriber removido', { userId })
    }
  }

  /**
   * Retry automático para falhas de carregamento
   */
  async retryPhotoLoad(userId: string, userName: string): Promise<PhotoLoadResult> {
    const entry = this.cache.get(userId)
    if (!entry || entry.retryCount >= this.MAX_RETRY_ATTEMPTS) {
      enhancedLogger.warn('PhotoCacheManager', 'Máximo de tentativas excedido', {
        userId,
        retryCount: entry?.retryCount || 0
      })
      
      return {
        success: false,
        url: null,
        fallbackInitial: this.generateFallbackInitial(userName),
        error: 'Máximo de tentativas excedido'
      }
    }

    // Aguardar delay antes do retry
    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (entry.retryCount + 1)))

    return this.getPhotoUrl(userId, entry.photoPath, userName)
  }

  /**
   * Obtém entrada do cache se válida
   */
  private getCachedEntry(userId: string, photoPath: string): PhotoCacheEntry | null {
    const entry = this.cache.get(userId)
    
    if (!entry || entry.photoPath !== photoPath) {
      return null
    }

    // Verificar se cache ainda é válido
    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION
    if (isExpired) {
      entry.isValid = false
      return entry
    }

    return entry.isValid ? entry : null
  }

  /**
   * Atualiza entrada no cache
   */
  private updateCache(userId: string, photoPath: string | null, signedUrl: string | null): void {
    this.cache.set(userId, {
      userId,
      photoPath,
      signedUrl,
      timestamp: Date.now(),
      retryCount: 0,
      isValid: true
    })
  }

  /**
   * Carrega URL assinada do servidor
   */
  private async loadSignedUrl(photoPath: string, retryCount: number = 0): Promise<string | null> {
    try {
      // Importar dinamicamente para evitar dependência circular
      const { getSignedPhotoUrl } = await import("@/app/dashboard/components/sidebar-actions")
      
      enhancedLogger.debug('PhotoCacheManager', 'Carregando URL assinada', {
        photoPath,
        retryCount
      })

      const signedUrl = await getSignedPhotoUrl(photoPath)
      
      if (!signedUrl) {
        throw new Error('URL assinada não foi retornada')
      }

      return signedUrl
    } catch (error) {
      enhancedLogger.error('PhotoCacheManager', 'Erro ao carregar URL assinada', {
        photoPath,
        retryCount,
        error: error.message
      }, error as Error)
      
      throw error
    }
  }

  /**
   * Gera inicial de fallback consistente
   */
  private generateFallbackInitial(userName: string): string {
    if (!userName || userName.trim() === '') {
      return '?'
    }

    // Pegar primeira letra do primeiro nome
    const firstLetter = userName.trim().charAt(0).toUpperCase()
    
    // Se for um caractere especial, usar '?'
    if (!/[A-ZÀ-ÿ]/.test(firstLetter)) {
      return '?'
    }

    return firstLetter
  }

  /**
   * Notifica subscribers sobre mudanças
   */
  private notifySubscribers(userId: string, result: PhotoLoadResult): void {
    const userSubscribers = this.subscribers.get(userId)
    if (userSubscribers) {
      userSubscribers.forEach(callback => {
        try {
          callback(result)
        } catch (error) {
          enhancedLogger.error('PhotoCacheManager', 'Erro ao notificar subscriber', {
            userId,
            error: error.message
          }, error as Error)
        }
      })
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): any {
    const stats = {
      totalEntries: this.cache.size,
      validEntries: 0,
      expiredEntries: 0,
      totalSubscribers: 0,
      entriesByUser: {} as Record<string, any>
    }

    const now = Date.now()

    this.cache.forEach((entry, userId) => {
      const isExpired = now - entry.timestamp > this.CACHE_DURATION
      
      if (entry.isValid && !isExpired) {
        stats.validEntries++
      } else {
        stats.expiredEntries++
      }

      stats.entriesByUser[userId] = {
        photoPath: entry.photoPath,
        hasSignedUrl: !!entry.signedUrl,
        isValid: entry.isValid,
        isExpired,
        retryCount: entry.retryCount,
        age: now - entry.timestamp
      }
    })

    this.subscribers.forEach(subscribers => {
      stats.totalSubscribers += subscribers.size
    })

    return stats
  }

  /**
   * Limpa cache expirado
   */
  cleanExpiredCache(): void {
    const now = Date.now()
    let cleanedCount = 0

    this.cache.forEach((entry, userId) => {
      const isExpired = now - entry.timestamp > this.CACHE_DURATION
      if (isExpired && !entry.isValid) {
        this.cache.delete(userId)
        cleanedCount++
      }
    })

    if (cleanedCount > 0) {
      enhancedLogger.debug('PhotoCacheManager', 'Cache expirado limpo', {
        cleanedCount,
        remainingEntries: this.cache.size
      })
    }
  }
}

// Instância singleton
const photoCacheManager = new PhotoCacheManager()

// Limpar cache expirado periodicamente
if (typeof window !== 'undefined') {
  setInterval(() => {
    photoCacheManager.cleanExpiredCache()
  }, 60000) // A cada minuto
}

// Adicionar ao window para debug (apenas desenvolvimento)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).photoCacheManager = photoCacheManager
  
  // Comandos de debug
  ;(window as any).debugPhoto = {
    getStats: () => photoCacheManager.getCacheStats(),
    invalidateUser: (userId: string) => photoCacheManager.invalidateUserCache(userId),
    invalidateAll: () => photoCacheManager.invalidateAllCache(),
    cleanExpired: () => photoCacheManager.cleanExpiredCache()
  }
}

export default photoCacheManager