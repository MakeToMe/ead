/**
 * AuthService - Única fonte de verdade para autenticação
 * 
 * Substitui completamente:
 * - auth-client.ts
 * - user-state-manager.ts
 * - Lógica complexa de cache e verificação
 * 
 * Responsabilidades:
 * - Gerenciamento de sessão simplificado
 * - Cache inteligente com TTL
 * - Verificação de sessão otimizada
 * - Eventos de mudança de estado
 */

export interface User {
  uid: string
  nome: string
  email: string
  perfis: 'admin' | 'instrutor' | 'aluno'
  url_foto?: string
  criado_em: string
  atualizado_em: string
}

export interface AuthError {
  type: 'network' | 'credentials' | 'session' | 'server'
  message: string
  code?: string
  retryable: boolean
}

interface SessionState {
  user: User | null
  isLoading: boolean
  lastChecked: number
  expiresAt: number
}

type AuthChangeCallback = (user: User | null, error?: AuthError) => void

class AuthService {
  private state: SessionState = {
    user: null,
    isLoading: true,
    lastChecked: 0,
    expiresAt: 0
  }

  private callbacks: Set<AuthChangeCallback> = new Set()
  private readonly CACHE_TTL = 300000 // 5 minutos
  private readonly SESSION_CHECK_DEBOUNCE = 5000 // 5 segundos (aumentado para reduzir requisições)
  private readonly MAX_RETRIES = 1 // Reduzido para 1 retry apenas
  private sessionCheckTimer: NodeJS.Timeout | null = null
  private pendingSessionCheck: Promise<User | null> | null = null
  private requestCache: Map<string, { promise: Promise<any>, timestamp: number }> = new Map()
  private retryCount = 0
  private initialized = false
  private consecutiveErrors = 0
  private readonly MAX_CONSECUTIVE_ERRORS = 5
  private circuitBreakerUntil = 0
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000 // 1 minuto

  constructor() {
    // Inicializar verificação de sessão apenas no cliente e apenas uma vez
    if (typeof window !== 'undefined' && !this.initialized) {
      this.initializeSession()
    }
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser(): User | null {
    return this.state.user
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.state.user && this.isCacheValid()
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
    // Só executar no cliente
    if (typeof window === 'undefined') {
      throw this.createAuthError('network', 'Login só pode ser executado no cliente')
    }

    this.setLoading(true)

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw this.createAuthError('credentials', errorData.message || 'Credenciais inválidas')
      }

      const { user } = await response.json()
      
      if (!user) {
        throw this.createAuthError('server', 'Resposta inválida do servidor')
      }

      // Atualizar estado e cache
      this.updateUserState(user)
      
      console.log('✅ AuthService: Login bem-sucedido', { userId: user.uid, nome: user.nome })
      
      return user
    } catch (error) {
      this.setLoading(false)
      
      if (error instanceof Error && error.name === 'AuthError') {
        throw error
      }
      
      // Erro de rede ou outro erro não tratado
      throw this.createAuthError('network', 'Erro de conexão. Tente novamente.')
    }
  }

  /**
   * Registra novo usuário
   */
  async signUp(name: string, email: string, password: string): Promise<User> {
    // Só executar no cliente
    if (typeof window === 'undefined') {
      throw this.createAuthError('network', 'Signup só pode ser executado no cliente')
    }

    this.setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw this.createAuthError('credentials', errorData.message || 'Erro ao criar conta')
      }

      const { user } = await response.json()
      
      if (!user) {
        throw this.createAuthError('server', 'Resposta inválida do servidor')
      }

      // Atualizar estado e cache
      this.updateUserState(user)
      
      console.log('✅ AuthService: Cadastro bem-sucedido', { userId: user.uid, nome: user.nome })
      
      return user
    } catch (error) {
      this.setLoading(false)
      
      if (error instanceof Error && error.name === 'AuthError') {
        throw error
      }
      
      throw this.createAuthError('network', 'Erro de conexão. Tente novamente.')
    }
  }

  /**
   * Faz logout do usuário
   */
  async signOut(): Promise<void> {
    console.log('🚪 AuthService: Iniciando logout')

    try {
      // Fazer logout no servidor (só no cliente)
      if (typeof window !== 'undefined') {
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include'
        })
      }
    } catch (error) {
      console.warn('⚠️ AuthService: Erro ao fazer logout no servidor', error)
      // Continuar com logout local mesmo se servidor falhar
    }

    // Limpar estado local
    this.clearSession()
    
    console.log('✅ AuthService: Logout completo')
  }

  /**
   * Verifica sessão atual com cache otimizado
   */
  async checkSession(): Promise<User | null> {
    const cacheKey = 'session-check'
    
    // Verificar circuit breaker
    if (this.isCircuitBreakerOpen()) {
      console.log('🚫 AuthService: Circuit breaker ativo - pulando verificação de sessão')
      this.setLoading(false)
      return this.state.user
    }
    
    // Se já há uma verificação em andamento, reutilizar
    if (this.pendingSessionCheck) {
      console.log('🔄 AuthService: Reutilizando verificação de sessão em andamento')
      return this.pendingSessionCheck
    }

    // Se cache ainda é válido, retornar usuário atual
    if (this.isCacheValid() && this.state.user) {
      console.log('✅ AuthService: Usando cache válido de sessão')
      return this.state.user
    }

    // Verificar cache de requests
    const cachedRequest = this.requestCache.get(cacheKey)
    if (cachedRequest && (Date.now() - cachedRequest.timestamp) < this.SESSION_CHECK_DEBOUNCE) {
      console.log('🔄 AuthService: Reutilizando request de sessão recente')
      return cachedRequest.promise
    }

    // Criar nova verificação
    this.pendingSessionCheck = this.performSessionCheck()
    
    // Adicionar ao cache de requests
    this.requestCache.set(cacheKey, {
      promise: this.pendingSessionCheck,
      timestamp: Date.now()
    })
    
    try {
      const user = await this.pendingSessionCheck
      this.retryCount = 0 // Reset retry count on success
      this.consecutiveErrors = 0 // Reset consecutive errors on success
      return user
    } catch (error) {
      console.error('❌ AuthService: Erro na verificação de sessão', error)
      this.consecutiveErrors++
      
      // Ativar circuit breaker se muitos erros consecutivos
      if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        this.activateCircuitBreaker()
      }
      
      throw error
    } finally {
      this.pendingSessionCheck = null
      // Limpar cache após um tempo
      setTimeout(() => {
        this.requestCache.delete(cacheKey)
      }, this.SESSION_CHECK_DEBOUNCE)
    }
  }

  /**
   * Força refresh da sessão
   */
  async refreshSession(): Promise<User | null> {
    this.invalidateCache()
    return this.checkSession()
  }

  /**
   * Registra callback para mudanças de autenticação
   */
  onAuthChange(callback: AuthChangeCallback): () => void {
    this.callbacks.add(callback)
    
    // Enviar estado atual imediatamente
    callback(this.state.user)
    
    // Retornar função de cleanup
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * Limpa cache de sessão e requests
   */
  clearCache(): void {
    console.log('🧹 AuthService: Limpando todos os caches')
    this.invalidateCache()
    this.requestCache.clear()
    this.retryCount = 0
    
    // Limpar timer se existir
    if (this.sessionCheckTimer) {
      clearTimeout(this.sessionCheckTimer)
      this.sessionCheckTimer = null
    }
  }

  /**
   * Obtém informações de debug
   */
  getDebugInfo(): object {
    return {
      user: this.state.user ? {
        uid: this.state.user.uid,
        nome: this.state.user.nome,
        perfis: this.state.user.perfis
      } : null,
      isLoading: this.state.isLoading,
      isAuthenticated: this.isAuthenticated(),
      cacheValid: this.isCacheValid(),
      lastChecked: new Date(this.state.lastChecked).toISOString(),
      expiresAt: new Date(this.state.expiresAt).toISOString(),
      callbacksCount: this.callbacks.size,
      consecutiveErrors: this.consecutiveErrors,
      circuitBreakerActive: this.isCircuitBreakerOpen(),
      circuitBreakerUntil: this.circuitBreakerUntil > 0 ? new Date(this.circuitBreakerUntil).toISOString() : null
    }
  }

  /**
   * Inicializa verificação de sessão com debounce
   */
  private async initializeSession(): Promise<void> {
    // Evitar múltiplas inicializações
    if (this.initialized) {
      console.log('⚠️ AuthService: Já inicializado, ignorando')
      return
    }

    this.initialized = true

    // Verificação única na inicialização (sem loops)
    console.log('🚀 AuthService: Verificação única de sessão na inicialização')
    
    try {
      await this.checkSession()
    } catch (error) {
      console.warn('⚠️ AuthService: Erro na inicialização da sessão', error)
      this.setLoading(false)
    }
  }

  /**
   * Executa verificação de sessão no servidor com retry
   */
  private async performSessionCheck(): Promise<User | null> {
    // Só executar no cliente
    if (typeof window === 'undefined') {
      this.setLoading(false)
      return null
    }

    this.setLoading(true)

    try {
      console.log('🔍 AuthService: Fazendo requisição para /api/auth/me', {
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack?.split('\n').slice(1, 4)
      })
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        // Não autenticado - limpar sessão
        console.log('🚪 AuthService: Usuário não autenticado (401)')
        this.clearSession()
        return null
      }

      if (!response.ok) {
        throw new Error(`Session check failed: ${response.status}`)
      }

      const { user } = await response.json()
      
      if (user) {
        console.log('✅ AuthService: Sessão válida encontrada', { userId: user.uid })
        this.updateUserState(user)
        return user
      } else {
        console.log('⚠️ AuthService: Resposta sem usuário, limpando sessão')
        this.clearSession()
        return null
      }
    } catch (error) {
      console.error('❌ AuthService: Erro na verificação de sessão', error)
      
      // Verificar se é erro de CORS - não fazer retry
      if (this.isCorsError(error)) {
        console.error('🚫 AuthService: Erro de CORS detectado - parando tentativas')
        this.clearSession()
        return null
      }
      
      // Implementar retry com backoff para erros de rede (exceto CORS)
      if (this.isNetworkError(error) && this.retryCount < this.MAX_RETRIES) {
        this.retryCount++
        const delay = Math.pow(2, this.retryCount) * 2000 // Aumentado o delay base
        
        console.log(`🔄 AuthService: Tentativa ${this.retryCount}/${this.MAX_RETRIES} em ${delay}ms`)
        
        return new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const result = await this.performSessionCheck()
              resolve(result)
            } catch (retryError) {
              console.error('❌ AuthService: Erro no retry', retryError)
              this.clearSession()
              resolve(null)
            }
          }, delay)
        })
      }
      
      // Se há usuário em cache e erro é de rede, manter cache temporariamente
      if (this.state.user && this.isNetworkError(error) && this.retryCount >= this.MAX_RETRIES) {
        console.log('⚠️ AuthService: Mantendo cache após falha de rede')
        this.setLoading(false)
        return this.state.user
      }
      
      // Caso contrário, limpar sessão
      this.clearSession()
      return null
    }
  }

  /**
   * Atualiza estado do usuário
   */
  private updateUserState(user: User): void {
    const now = Date.now()
    
    this.state = {
      user,
      isLoading: false,
      lastChecked: now,
      expiresAt: now + this.CACHE_TTL
    }

    // Notificar callbacks
    this.notifyCallbacks(user)
  }

  /**
   * Limpa sessão completamente com error handling
   */
  private clearSession(): void {
    console.log('🧹 AuthService: Limpando sessão completa')
    
    try {
      this.state = {
        user: null,
        isLoading: false,
        lastChecked: Date.now(),
        expiresAt: 0
      }

      // Limpar storages com error handling
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear()
          sessionStorage.clear()
          console.log('✅ AuthService: Storages limpos')
        } catch (storageError) {
          console.warn('⚠️ AuthService: Erro ao limpar storages', storageError)
        }
      }

      // Limpar caches
      this.clearCache()

      // Notificar callbacks
      this.notifyCallbacks(null)
      
      console.log('✅ AuthService: Sessão limpa com sucesso')
    } catch (error) {
      console.error('❌ AuthService: Erro ao limpar sessão', error)
      // Mesmo com erro, garantir que o estado seja limpo
      this.state = {
        user: null,
        isLoading: false,
        lastChecked: Date.now(),
        expiresAt: 0
      }
    }
  }

  /**
   * Define estado de loading
   */
  private setLoading(loading: boolean): void {
    if (this.state.isLoading !== loading) {
      this.state.isLoading = loading
      this.notifyCallbacks(this.state.user)
    }
  }

  /**
   * Invalida cache
   */
  private invalidateCache(): void {
    this.state.expiresAt = 0
  }

  /**
   * Verifica se cache é válido
   */
  private isCacheValid(): boolean {
    return Date.now() < this.state.expiresAt
  }

  /**
   * Verifica se erro é de rede
   */
  private isNetworkError(error: any): boolean {
    return error instanceof TypeError || 
           (error.message && error.message.includes('fetch'))
  }

  /**
   * Verifica se erro é de CORS
   */
  private isCorsError(error: any): boolean {
    return error instanceof TypeError && 
           (error.message.includes('CORS') || 
            error.message.includes('Cross-Origin') ||
            error.message.includes('blocked'))
  }

  /**
   * Verifica se o circuit breaker está ativo
   */
  private isCircuitBreakerOpen(): boolean {
    return Date.now() < this.circuitBreakerUntil
  }

  /**
   * Ativa o circuit breaker
   */
  private activateCircuitBreaker(): void {
    this.circuitBreakerUntil = Date.now() + this.CIRCUIT_BREAKER_TIMEOUT
    console.warn(`🚫 AuthService: Circuit breaker ativado por ${this.CIRCUIT_BREAKER_TIMEOUT/1000}s devido a ${this.consecutiveErrors} erros consecutivos`)
  }

  /**
   * Cria erro de autenticação com contexto
   */
  private createAuthError(type: AuthError['type'], message: string, code?: string, context?: any): Error {
    const error = new Error(message) as Error & AuthError
    error.name = 'AuthError'
    error.type = type
    error.code = code
    error.retryable = type === 'network'
    
    // Log estruturado para debug
    console.error('🚨 AuthService: Erro criado', {
      type,
      message,
      code,
      context,
      timestamp: new Date().toISOString(),
      retryable: error.retryable
    })
    
    return error
  }

  /**
   * Notifica todos os callbacks com error handling
   */
  private notifyCallbacks(user: User | null, error?: AuthError): void {
    this.callbacks.forEach((callback, index) => {
      try {
        callback(user, error)
      } catch (err) {
        console.error(`❌ AuthService: Erro ao notificar callback ${index}`, {
          error: err,
          callbackCount: this.callbacks.size,
          user: user ? { uid: user.uid, nome: user.nome } : null
        })
        
        // Remover callback problemático para evitar loops
        this.callbacks.delete(callback)
        console.warn('⚠️ AuthService: Callback removido devido a erro')
      }
    })
  }
}

// Instância singleton
const authService = new AuthService()

// Adicionar ao window para debug (apenas desenvolvimento)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).authService = authService
  
  // Comandos de debug
  ;(window as any).debugAuth = {
    getInfo: () => authService.getDebugInfo(),
    checkSession: () => authService.checkSession(),
    refreshSession: () => authService.refreshSession(),
    clearCache: () => authService.clearCache(),
    signOut: () => authService.signOut(),
    stopAll: () => {
      console.log('🛑 PARANDO TODAS AS VERIFICAÇÕES DE SESSÃO')
      authService.clearCache()
      // Limpar todos os timers e requests pendentes
      if (authService.sessionCheckTimer) {
        clearTimeout(authService.sessionCheckTimer)
        authService.sessionCheckTimer = null
      }
      authService.pendingSessionCheck = null
      authService.requestCache.clear()
      console.log('✅ Todas as verificações paradas')
    }
  }
}

export default authService