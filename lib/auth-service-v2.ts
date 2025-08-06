/**
 * AuthService V2 - Sistema de Autenticação Limpo e Robusto
 * 
 * Características:
 * - Hydration-safe (sem diferenças SSR/CSR)
 * - Anti-loop protections
 * - Circuit breaker pattern
 * - Cache inteligente com TTL
 * - Error handling robusto
 * - Logging controlado por ambiente
 */

import { createLogger } from '@/lib/logger-factory'

const logger = createLogger('AuthServiceV2', 'INFO', 'Sistema de autenticação V2')

export interface User {
  uid: string
  nome: string
  email: string
  perfis: string
  criado_em: string
  atualizado_em: string
  url_foto?: string
}

export interface AuthError {
  type: 'network' | 'credentials' | 'session' | 'server' | 'cors'
  message: string
  code?: string
  retryable: boolean
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: AuthError | null
  lastChecked: number
  cacheExpiry: number
}

export type AuthChangeCallback = (user: User | null, error?: AuthError) => void
export type UnsubscribeFn = () => void

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  lastFailureTime: number
  timeout: number
}

class AuthServiceV2 {
  
  // Configurações
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutos
  private readonly DEBOUNCE_TIME = 5 * 1000 // 5 segundos
  private readonly MAX_RETRIES = 3
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30 * 1000 // 30 segundos
  
  // Estado interno
  private state: AuthState = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    lastChecked: 0,
    cacheExpiry: 0
  }
  
  // Circuit breaker
  private circuitBreaker: CircuitBreakerState = {
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: 0,
    timeout: this.CIRCUIT_BREAKER_TIMEOUT
  }
  
  // Controle de requests
  private pendingRequest: Promise<User | null> | null = null
  private lastRequestTime = 0
  private retryCount = 0
  
  // Callbacks
  private callbacks = new Set<AuthChangeCallback>()
  
  constructor() {
    logger.debug('AuthServiceV2: Inicializado')
  }
  

  
  // ==================== MÉTODOS PÚBLICOS ====================
  
  /**
   * Retorna o usuário atual (apenas do cache)
   */
  getCurrentUser(): User | null {
    return this.state.user
  }
  
  /**
   * Retorna a URL da foto de perfil do usuário atual
   */
  getCurrentUserProfilePhoto(): string | null {
    return this.state.user?.url_foto || null
  }
  
  /**
   * Atualiza a foto de perfil do usuário atual
   */
  updateUserProfilePhoto(photoUrl: string): void {
    if (this.state.user) {
      this.updateState({
        user: {
          ...this.state.user,
          url_foto: photoUrl
        }
      })
    }
  }
  
  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && this.isCacheValid()
  }
  
  /**
   * Verifica se está carregando
   */
  isLoading(): boolean {
    return this.state.isLoading
  }
  
  /**
   * Faz login do usuário
   */
  async signIn(email: string, password: string): Promise<User> {
    logger.debug('Iniciando login')
    
    // Validação básica
    if (!email || !password) {
      throw this.createError('credentials', 'Email e senha são obrigatórios')
    }
    
    this.setLoading(true)
    this.clearError()
    
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.message || `Erro ${response.status}`
        
        if (response.status === 401) {
          throw this.createError('credentials', message)
        } else {
          throw this.createError('server', message)
        }
      }
      
      const { user } = await response.json()
      
      if (!user) {
        throw this.createError('server', 'Resposta inválida do servidor')
      }
      
      // Atualizar estado
      this.updateState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
        lastChecked: Date.now(),
        cacheExpiry: Date.now() + this.CACHE_TTL
      })
      
      // Reset circuit breaker on success
      this.resetCircuitBreaker()
      
      // Log removido - sucesso é implícito pelo retorno do usuário
      return user
      
    } catch (error) {
      this.setLoading(false)
      this.recordFailure()
      
      logger.error('Erro no login', { email }, error as Error)
      throw error
    }
  }
  
  /**
   * Faz cadastro de novo usuário
   */
  async signUp(name: string, email: string, password: string): Promise<User> {
    logger.debug('Iniciando cadastro')
    
    // Validação básica
    if (!name || !email || !password) {
      throw this.createError('credentials', 'Nome, email e senha são obrigatórios')
    }
    
    if (password.length < 6) {
      throw this.createError('credentials', 'A senha deve ter pelo menos 6 caracteres')
    }
    
    this.setLoading(true)
    this.clearError()
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.message || `Erro ${response.status}`
        
        if (response.status === 409) {
          throw this.createError('credentials', 'Este email já está em uso')
        } else {
          throw this.createError('server', message)
        }
      }
      
      const { user } = await response.json()
      
      if (!user) {
        throw this.createError('server', 'Resposta inválida do servidor')
      }
      
      // Atualizar estado
      this.updateState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
        lastChecked: Date.now(),
        cacheExpiry: Date.now() + this.CACHE_TTL
      })
      
      // Reset circuit breaker on success
      this.resetCircuitBreaker()
      
      logger.info('Cadastro bem-sucedido', { userId: user.uid })
      return user
      
    } catch (error) {
      this.setLoading(false)
      this.recordFailure()
      
      logger.error('Erro no cadastro', { email }, error as Error)
      throw error
    }
  }

  /**
   * Faz logout do usuário
   */
  async signOut(): Promise<void> {
    logger.debug('Iniciando logout')
    
    try {
      // Chamar API de logout
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      logger.warn('Erro ao fazer logout no servidor', {}, error as Error)
      // Continuar com logout local mesmo se servidor falhar
    }
    
    // Limpar estado local
    this.updateState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      lastChecked: Date.now(),
      cacheExpiry: 0
    })
    
    logger.debug('Logout completo')
  }
  
  /**
   * Verifica sessão atual com proteções anti-loop
   */
  async checkSession(): Promise<User | null> {
    // Só executar no cliente
    if (typeof window === 'undefined') {
      return null
    }
    
    // Verificar circuit breaker
    if (this.circuitBreaker.state === 'OPEN') {
      if (Date.now() - this.circuitBreaker.lastFailureTime < this.circuitBreaker.timeout) {
        logger.debug('Circuit breaker OPEN, pulando verificação')
        return this.state.user
      } else {
        // Tentar half-open
        this.circuitBreaker.state = 'HALF_OPEN'
        logger.debug('Circuit breaker HALF_OPEN, tentando verificação')
      }
    }
    
    // Verificar debounce
    const now = Date.now()
    if (now - this.lastRequestTime < this.DEBOUNCE_TIME) {
      logger.debug('Debounce ativo, usando cache')
      return this.state.user
    }
    
    // Verificar cache válido
    if (this.isCacheValid() && this.state.user) {
      logger.debug('Cache válido')
      return this.state.user
    }
    
    // Verificar se já há request em andamento
    if (this.pendingRequest) {
      logger.debug('Reutilizando request em andamento')
      return this.pendingRequest
    }
    
    // Fazer nova verificação
    this.pendingRequest = this.performSessionCheck()
    this.lastRequestTime = now
    
    try {
      const result = await this.pendingRequest
      this.resetCircuitBreaker()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    } finally {
      this.pendingRequest = null
    }
  }
  
  /**
   * Registra callback para mudanças de autenticação
   */
  onAuthChange(callback: AuthChangeCallback): UnsubscribeFn {
    this.callbacks.add(callback)
    
    // Enviar estado atual imediatamente
    callback(this.state.user, this.state.error || undefined)
    
    return () => {
      this.callbacks.delete(callback)
    }
  }
  
  /**
   * Limpa erro atual
   */
  clearError(): void {
    if (this.state.error) {
      this.updateState({ ...this.state, error: null })
    }
  }
  
  // ==================== MÉTODOS PRIVADOS ====================
  
  /**
   * Executa verificação de sessão no servidor
   */
  private async performSessionCheck(): Promise<User | null> {
    this.setLoading(true)
    
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.status === 401) {
        // Não autenticado - estado normal
        this.updateState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
          lastChecked: Date.now(),
          cacheExpiry: 0
        })
        return null
      }
      
      if (!response.ok) {
        throw this.createError('server', `Erro ${response.status}`)
      }
      
      const { user } = await response.json()
      
      if (!user) {
        throw this.createError('server', 'Resposta inválida do servidor')
      }
      
      // Atualizar estado
      this.updateState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
        lastChecked: Date.now(),
        cacheExpiry: Date.now() + this.CACHE_TTL
      })
      
      return user
      
    } catch (error) {
      this.setLoading(false)
      
      // Verificar se é erro de CORS
      if (this.isCorsError(error)) {
        logger.warn('Erro de CORS detectado, parando verificações')
        this.circuitBreaker.state = 'OPEN'
        this.circuitBreaker.lastFailureTime = Date.now()
        return null
      }
      
      logger.error('Erro na verificação de sessão', {}, error as Error)
      throw error
    }
  }
  
  /**
   * Atualiza estado e notifica callbacks
   */
  private updateState(newState: Partial<AuthState>): void {
    const oldUser = this.state.user
    this.state = { ...this.state, ...newState }
    
    // Só notificar se usuário mudou
    if (oldUser?.uid !== this.state.user?.uid) {
      this.notifyCallbacks()
    }
  }
  
  /**
   * Define estado de loading
   */
  private setLoading(loading: boolean): void {
    if (this.state.isLoading !== loading) {
      this.state.isLoading = loading
      this.notifyCallbacks()
    }
  }
  
  /**
   * Verifica se cache é válido
   */
  private isCacheValid(): boolean {
    return Date.now() < this.state.cacheExpiry
  }
  
  /**
   * Verifica se é erro de CORS
   */
  private isCorsError(error: any): boolean {
    const message = error?.message || ''
    return message.includes('CORS') || 
           message.includes('Cross-Origin') || 
           message.includes('blocked') ||
           error?.name === 'TypeError' // Fetch errors são TypeError
  }
  
  /**
   * Registra falha no circuit breaker
   */
  private recordFailure(): void {
    this.circuitBreaker.failureCount++
    this.circuitBreaker.lastFailureTime = Date.now()
    
    if (this.circuitBreaker.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreaker.state = 'OPEN'
      logger.warn('Circuit breaker OPEN devido a muitas falhas', { 
        failureCount: this.circuitBreaker.failureCount 
      })
    }
  }
  
  /**
   * Reseta circuit breaker
   */
  private resetCircuitBreaker(): void {
    this.circuitBreaker.state = 'CLOSED'
    this.circuitBreaker.failureCount = 0
    this.retryCount = 0
  }
  
  /**
   * Cria erro tipado
   */
  private createError(type: AuthError['type'], message: string, code?: string): Error {
    const error = new Error(message) as Error & AuthError
    error.name = 'AuthError'
    error.type = type
    error.code = code
    error.retryable = type === 'network'
    
    // Atualizar estado com erro
    this.updateState({ ...this.state, error })
    
    return error
  }
  
  /**
   * Notifica todos os callbacks
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.state.user, this.state.error || undefined)
      } catch (error) {
        logger.error('Erro ao notificar callback', {}, error as Error)
        // Remover callback problemático
        this.callbacks.delete(callback)
      }
    })
  }
}

// Exportar instância única
export const authService = new AuthServiceV2()
export const authServiceV2 = authService // Compatibilidade temporária