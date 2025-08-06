/**
 * UserStateManager - Gerenciador centralizado de estado do usuário
 * 
 * Responsável por:
 * - Manter estado global do usuário
 * - Notificar subscribers sobre mudanças
 * - Invalidar caches quando necessário
 * - Coordenar atualizações entre componentes
 */

import type { User } from "@/lib/auth-client"
import enhancedLogger from "@/lib/enhanced-logger"
import { createLogger } from '@/lib/logger-factory'

const logger = createLogger('UserStateManager', 'INFO', 'Gerenciador de estado do usuário')

// Tipos para eventos do usuário
export interface UserEvent {
  type: 'USER_UPDATED' | 'USER_LOGGED_OUT' | 'CACHE_INVALIDATED'
  user?: User | null
  timestamp: number
}

// Tipo para callback de subscriber
export type UserSubscriber = (user: User | null) => void

// Interface do estado do usuário
interface UserState {
  user: User | null
  isLoading: boolean
  lastUpdated: number
  cacheValid: boolean
}

class UserStateManager {
  private state: UserState = {
    user: null,
    isLoading: true,
    lastUpdated: 0,
    cacheValid: false
  }

  private subscribers: Set<UserSubscriber> = new Set()
  private debounceTimer: NodeJS.Timeout | null = null
  private healthCheckTimer: NodeJS.Timeout | null = null
  private consistencyCheckTimer: NodeJS.Timeout | null = null
  private readonly DEBOUNCE_DELAY = 100 // ms
  private readonly HEALTH_CHECK_INTERVAL = 60000 // 60 segundos (reduzido frequência)
  private readonly CONSISTENCY_CHECK_INTERVAL = 60000 // 60 segundos (reduzido frequência)
  private inconsistencyDetected = false
  private consecutiveInconsistencies = 0
  private readonly MAX_CONSECUTIVE_INCONSISTENCIES = 3

  /**
   * Inicializa o UserStateManager com dados iniciais
   */
  async initialize(): Promise<void> {
    const startTime = Date.now()
    enhancedLogger.info('UserStateManager', 'Inicializando UserStateManager')
    logger.debug('Inicializando...')
    
    this.state.isLoading = true
    this.notifySubscribers()
    
    try {
      // Tentar carregar dados diretamente - se falhar, não há sessão
      logger.debug('Tentando carregar dados do usuário')
      
      const freshUser = await this.refreshUser()
      
      if (!freshUser) {
        logger.debug('Nenhum usuário encontrado')
        this.state.isLoading = false
        this.state.user = null
        this.notifySubscribers()
        return
      }
      
      if (freshUser) {
        const duration = Date.now() - startTime
        enhancedLogger.performance('UserStateManager', 'initialize', duration, {
          userId: freshUser.uid,
          perfil: freshUser.perfis,
          nome: freshUser.nome
        })
        enhancedLogger.audit('UserStateManager', 'user_initialized', {
          userId: freshUser.uid,
          perfil: freshUser.perfis,
          nome: freshUser.nome
        })
        
        logger.info('Inicialização bem-sucedida', { 
          userId: freshUser.uid,
          perfil: freshUser.perfis,
          nome: freshUser.nome
        })
        
        // Iniciar monitoramento automático após inicialização bem-sucedida
        // APENAS se o usuário estiver autenticado
        this.startHealthCheck()
      } else {
        enhancedLogger.warn('UserStateManager', 'Nenhum usuário encontrado na inicialização')
        logger.warn('Nenhum usuário encontrado na inicialização')
        logger.debug('Monitoramento automático não será iniciado sem usuário autenticado')
      }
    } catch (error) {
      console.error('❌ UserStateManager: Erro na inicialização', error)
      
      // Tentar fallback para dados em cache como último recurso
      try {
        const { getCurrentClientUser } = await import("@/lib/auth-client")
        const cachedUser = getCurrentClientUser()
        
        if (cachedUser) {
          logger.info('Usando dados em cache como fallback', { 
            userId: cachedUser.uid,
            perfil: cachedUser.perfis,
            nome: cachedUser.nome
          })
          this.updateUser(cachedUser)
        } else {
          console.error('❌ UserStateManager: Nenhum dado disponível (cache e servidor falharam)')
          this.state.isLoading = false
          this.notifySubscribers()
        }
      } catch (cacheError) {
        console.error('❌ UserStateManager: Erro ao acessar cache de fallback', cacheError)
        this.state.isLoading = false
        this.notifySubscribers()
      }
    }
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser(): User | null {
    // Log apenas em debug mode para evitar spam
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
      console.log('📋 UserStateManager: getCurrentUser chamado', {
        hasUser: !!this.state.user,
        userId: this.state.user?.uid,
        cacheValid: this.state.cacheValid
      })
    }
    return this.state.user
  }

  /**
   * Verifica se está carregando
   */
  isLoading(): boolean {
    return this.state.isLoading
  }

  /**
   * Verifica se o cache é válido
   */
  isCacheValid(): boolean {
    return this.state.cacheValid && (Date.now() - this.state.lastUpdated) < 300000 // 5 minutos
  }

  /**
   * Atualiza o usuário e notifica subscribers
   */
  updateUser(user: User | null): void {
    const previousUser = this.state.user
    const hasChanges = !previousUser || !user || 
      previousUser.uid !== user.uid ||
      previousUser.nome !== user.nome ||
      previousUser.perfis !== user.perfis
    
    enhancedLogger.audit('UserStateManager', 'user_updated', {
      previous: {
        userId: previousUser?.uid,
        nome: previousUser?.nome,
        perfil: previousUser?.perfis
      },
      new: {
        userId: user?.uid,
        nome: user?.nome,
        perfil: user?.perfis
      },
      hasChanges
    })
    
    console.log('🔄 UserStateManager: Atualizando usuário', { 
      previous: {
        userId: previousUser?.uid,
        nome: previousUser?.nome,
        perfil: previousUser?.perfis
      },
      new: {
        userId: user?.uid,
        nome: user?.nome,
        perfil: user?.perfis
      },
      hasChanges
    })

    this.state = {
      user,
      isLoading: false,
      lastUpdated: Date.now(),
      cacheValid: true
    }

    this.notifySubscribers()
    
    // Emitir evento de atualização
    this.emitEvent({
      type: 'USER_UPDATED',
      user,
      timestamp: Date.now()
    })
  }

  /**
   * Recarrega dados do usuário do servidor
   */
  async refreshUser(retryCount = 0): Promise<User | null> {
    const maxRetries = 3
    const retryDelay = Math.pow(2, retryCount) * 1000 // Backoff exponencial
    
    console.log('🔄 UserStateManager: Recarregando usuário do servidor', { 
      attempt: retryCount + 1, 
      maxRetries 
    })
    
    this.state.isLoading = true
    this.notifySubscribers()

    try {
      // Importar dinamicamente para evitar dependência circular
      const { ensureUserLoaded } = await import("@/lib/auth-client")
      const user = await ensureUserLoaded()
      
      // Validar dados recebidos
      if (user) {
        console.log('✅ UserStateManager: Dados válidos recebidos do servidor', {
          userId: user.uid,
          nome: user.nome,
          perfil: user.perfis,
          email: user.email,
          hasRequiredFields: !!(user.uid && user.nome && user.perfis && user.email)
        })
        
        // Verificar se dados são válidos
        if (!user.uid || !user.nome || !user.perfis || !user.email) {
          console.warn('⚠️ UserStateManager: Dados incompletos recebidos', user)
        }
      } else {
        console.warn('⚠️ UserStateManager: Nenhum usuário retornado do servidor')
      }
      
      this.updateUser(user)
      return user
    } catch (error) {
      console.error('❌ UserStateManager: Erro ao recarregar usuário', { 
        error, 
        attempt: retryCount + 1,
        willRetry: retryCount < maxRetries
      })
      
      // Retry com backoff exponencial
      if (retryCount < maxRetries) {
        console.log(`⏳ UserStateManager: Tentando novamente em ${retryDelay}ms`)
        
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.refreshUser(retryCount + 1)
      }
      
      // Se todas as tentativas falharam, usar dados em cache se disponíveis
      if (this.state.user && this.state.cacheValid) {
        console.log('💾 UserStateManager: Usando dados em cache após falha')
        this.state.isLoading = false
        this.notifySubscribers()
        return this.state.user
      }
      
      // Falha completa
      this.state.isLoading = false
      this.notifySubscribers()
      
      // Emitir evento de erro para componentes interessados
      this.emitEvent({
        type: 'CACHE_INVALIDATED',
        user: null,
        timestamp: Date.now()
      })
      
      return null
    }
  }

  /**
   * Invalida o cache do usuário
   */
  invalidateCache(): void {
    console.log('🗑️ UserStateManager: Invalidando cache')
    
    this.state.cacheValid = false
    this.refreshUser()
  }

  /**
   * Invalida cache de usuário específico (se for o atual)
   */
  invalidateUserCache(userId: string): void {
    if (this.state.user?.uid === userId) {
      console.log('🗑️ UserStateManager: Invalidando cache do usuário atual', { userId })
      this.invalidateCache()
    }
  }

  /**
   * Invalida cache inconsistente forçadamente
   */
  forceInvalidateInconsistentCache(): void {
    console.log('🗑️ UserStateManager: Invalidação forçada de cache inconsistente')
    
    this.state.cacheValid = false
    this.inconsistencyDetected = true
    
    // Forçar refresh imediato
    this.refreshUser()
  }

  /**
   * Reload automático de dados do servidor com retry
   */
  async autoReloadFromServer(retryCount = 0): Promise<User | null> {
    const maxRetries = 5
    const retryDelay = Math.pow(2, retryCount) * 500 // Backoff exponencial mais rápido
    
    console.log('🔄 UserStateManager: Auto-reload do servidor', { 
      attempt: retryCount + 1, 
      maxRetries 
    })

    try {
      // Invalidar cache primeiro
      this.state.cacheValid = false
      
      // Tentar refresh
      const user = await this.refreshUser()
      
      if (user) {
        console.log('✅ UserStateManager: Auto-reload bem-sucedido')
        return user
      } else if (retryCount < maxRetries) {
        console.log(`⏳ UserStateManager: Auto-reload falhou, tentando novamente em ${retryDelay}ms`)
        
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.autoReloadFromServer(retryCount + 1)
      }
      
      return null
    } catch (error) {
      console.error('❌ UserStateManager: Erro no auto-reload', error)
      
      if (retryCount < maxRetries) {
        console.log(`⏳ UserStateManager: Erro no auto-reload, tentando novamente em ${retryDelay}ms`)
        
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.autoReloadFromServer(retryCount + 1)
      }
      
      return null
    }
  }

  /**
   * Limpa todos os dados e notifica logout
   */
  clearAll(): void {
    console.log('🧹 UserStateManager: Limpando todos os dados')
    
    this.state = {
      user: null,
      isLoading: false,
      lastUpdated: 0,
      cacheValid: false
    }

    // Notificar logout
    this.emitEvent({
      type: 'USER_LOGGED_OUT',
      user: null,
      timestamp: Date.now()
    })

    this.notifySubscribers()
  }

  /**
   * Adiciona um subscriber para receber atualizações
   */
  subscribe(callback: UserSubscriber): () => void {
    console.log('📡 UserStateManager: Novo subscriber adicionado')
    
    this.subscribers.add(callback)
    
    // Enviar estado atual imediatamente
    callback(this.state.user)

    // Retornar função de unsubscribe
    return () => {
      console.log('📡 UserStateManager: Subscriber removido')
      this.subscribers.delete(callback)
    }
  }

  /**
   * Notifica todos os subscribers com debounce
   */
  private notifySubscribers(): void {
    // Cancelar timer anterior se existir
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // Agendar notificação com debounce
    this.debounceTimer = setTimeout(() => {
      this.subscribers.forEach(callback => {
        try {
          callback(this.state.user)
        } catch (error) {
          console.error('❌ UserStateManager: Erro ao notificar subscriber', error)
        }
      })

      this.debounceTimer = null
    }, this.DEBOUNCE_DELAY)
  }

  /**
   * Emite evento para listeners externos
   */
  private emitEvent(event: UserEvent): void {
    console.log('📡 UserStateManager: Emitindo evento', event.type)
    
    // Aqui poderia ser implementado um sistema de eventos mais robusto
    // Por enquanto, apenas log para debug
  }

  /**
   * Força refresh manual (para uso em caso de problemas)
   */
  async forceRefresh(): Promise<User | null> {
    console.log('🔄 UserStateManager: Refresh manual forçado')
    
    // Invalidar cache primeiro
    this.state.cacheValid = false
    
    // Tentar refresh
    return this.refreshUser()
  }

  /**
   * Inicia health check periódico
   */
  startHealthCheck(): void {
    if (this.healthCheckTimer) {
      console.log('⚠️ UserStateManager: Health check já está ativo')
      return
    }

    console.log('🏥 UserStateManager: Iniciando health check periódico')
    
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck()
      } catch (error) {
        console.error('❌ UserStateManager: Erro no health check periódico', error)
      }
    }, this.HEALTH_CHECK_INTERVAL)

    // Também iniciar detecção automática de inconsistências
    this.startConsistencyCheck()
  }

  /**
   * Inicia detecção automática de inconsistências
   */
  startConsistencyCheck(): void {
    if (this.consistencyCheckTimer) {
      console.log('⚠️ UserStateManager: Detecção de inconsistência já está ativa')
      return
    }

    console.log('🔍 UserStateManager: Iniciando detecção automática de inconsistências')
    
    this.consistencyCheckTimer = setInterval(async () => {
      try {
        await this.performConsistencyCheck()
      } catch (error) {
        console.error('❌ UserStateManager: Erro na detecção de inconsistência', error)
      }
    }, this.CONSISTENCY_CHECK_INTERVAL)
  }

  /**
   * Para health check periódico
   */
  stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
      console.log('🏥 UserStateManager: Health check periódico parado')
    }

    // Também parar detecção de inconsistências
    this.stopConsistencyCheck()
  }

  /**
   * Para detecção automática de inconsistências
   */
  stopConsistencyCheck(): void {
    if (this.consistencyCheckTimer) {
      clearInterval(this.consistencyCheckTimer)
      this.consistencyCheckTimer = null
      console.log('🔍 UserStateManager: Detecção de inconsistência parada')
    }
  }

  /**
   * Executa verificação de saúde e consistência
   */
  private async performHealthCheck(): Promise<void> {
    console.log('🏥 UserStateManager: Executando health check')

    try {
      // Verificar conectividade
      const isConnected = await this.checkConnectivity()
      if (!isConnected) {
        console.warn('⚠️ UserStateManager: Problemas de conectividade detectados')
        return
      }

      // Verificar consistência de dados
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      const consistencyReport = await dataConsistencyValidator.validateConsistency()

      if (!consistencyReport.isConsistent) {
        console.warn('⚠️ UserStateManager: Inconsistências detectadas no health check', {
          discrepanciesCount: consistencyReport.discrepancies.length,
          recommendation: consistencyReport.recommendation
        })

        // Auto-correção se habilitada
        if (consistencyReport.recommendation === 'sync') {
          console.log('🔧 UserStateManager: Iniciando auto-correção via health check')
          await this.refreshUser()
        }
      } else {
        console.log('✅ UserStateManager: Health check OK - dados consistentes')
      }
    } catch (error) {
      console.error('❌ UserStateManager: Erro no health check', error)
    }
  }

  /**
   * Executa verificação automática de consistência
   */
  private async performConsistencyCheck(): Promise<void> {
    console.log('🔍 UserStateManager: Executando verificação de consistência automática')

    try {
      // Verificar se há usuário logado
      if (!this.state.user) {
        console.log('ℹ️ UserStateManager: Nenhum usuário logado, pulando verificação de consistência')
        return
      }

      // Verificar conectividade antes de prosseguir
      const isConnected = await this.checkConnectivity()
      if (!isConnected) {
        console.warn('⚠️ UserStateManager: Problemas de conectividade, pulando verificação de consistência')
        return
      }

      // Importar validator
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      // Executar validação
      const consistencyReport = await dataConsistencyValidator.validateConsistency()

      if (!consistencyReport.isConsistent) {
        this.inconsistencyDetected = true
        this.consecutiveInconsistencies++

        console.warn('🚨 UserStateManager: INCONSISTÊNCIA DETECTADA!', {
          discrepanciesCount: consistencyReport.discrepancies.length,
          consecutiveInconsistencies: this.consecutiveInconsistencies,
          criticalDiscrepancies: consistencyReport.discrepancies.filter(d => d.severity === 'critical').length,
          recommendation: consistencyReport.recommendation
        })

        // Mostrar alerta visual para o usuário se inconsistências críticas
        const criticalDiscrepancies = consistencyReport.discrepancies.filter(d => d.severity === 'critical')
        if (criticalDiscrepancies.length > 0) {
          this.showInconsistencyAlert(criticalDiscrepancies)
        }

        // Auto-correção baseada na severidade e número de tentativas
        if (this.consecutiveInconsistencies <= this.MAX_CONSECUTIVE_INCONSISTENCIES) {
          console.log('🔧 UserStateManager: Tentando auto-correção automática')
          
          const correctionSuccess = await dataConsistencyValidator.autoCorrect(consistencyReport)
          
          if (correctionSuccess) {
            console.log('✅ UserStateManager: Auto-correção bem-sucedida')
            this.inconsistencyDetected = false
            this.consecutiveInconsistencies = 0
          } else {
            console.error('❌ UserStateManager: Auto-correção falhou')
          }
        } else {
          console.error('🚨 UserStateManager: Muitas inconsistências consecutivas, requer intervenção manual')
          this.showCriticalInconsistencyAlert()
        }

        // Emitir evento de inconsistência
        this.emitEvent({
          type: 'CACHE_INVALIDATED',
          user: this.state.user,
          timestamp: Date.now()
        })

      } else {
        // Dados consistentes
        if (this.inconsistencyDetected) {
          console.log('✅ UserStateManager: Consistência restaurada')
          this.inconsistencyDetected = false
          this.consecutiveInconsistencies = 0
        }
      }

      // Registrar métricas apenas se houver inconsistências
      if (!consistencyReport.isConsistent) {
        this.recordConsistencyMetrics(consistencyReport)
      }

    } catch (error) {
      console.error('❌ UserStateManager: Erro na verificação de consistência', error)
    }
  }

  /**
   * Verifica se há sessão válida
   */
  async checkValidSession(): Promise<boolean> {
    try {
      // Tentar fazer a requisição diretamente - se funcionar, há sessão válida
      const response = await fetch('/api/auth/me', { 
        method: 'GET',
        credentials: 'include'
      })
      
      console.log('🔍 UserStateManager: Verificando sessão', {
        status: response.status,
        ok: response.ok
      })
      
      // Se retornou 200, há sessão válida
      if (response.ok) {
        console.log('✅ UserStateManager: Sessão válida encontrada')
        return true
      }
      
      // 401 significa não autenticado
      if (response.status === 401) {
        console.log('ℹ️ UserStateManager: Sessão inválida ou expirada (401)')
        return false
      }
      
      // 404 significa rota não encontrada
      if (response.status === 404) {
        console.warn('⚠️ UserStateManager: Rota /api/auth/me não encontrada (404)')
        return false
      }
      
      return false
    } catch (error) {
      console.error('❌ UserStateManager: Erro ao verificar sessão', error)
      return false
    }
  }

  /**
   * Verifica se há problemas de conectividade
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/me', { 
        method: 'GET',
        credentials: 'include'
      })
      
      // 401 significa não autenticado, mas conectividade OK
      // 404 significa rota não encontrada, problema de conectividade
      if (response.status === 401) {
        console.log('ℹ️ UserStateManager: Usuário não autenticado (401)')
        return true // Conectividade OK, apenas não autenticado
      }
      
      if (response.status === 404) {
        console.warn('⚠️ UserStateManager: Rota /api/auth/me não encontrada (404)')
        return false
      }
      
      return response.ok
    } catch (error) {
      console.error('❌ UserStateManager: Health check falhou', error)
      return false
    }
  }

  /**
   * Mostra alerta visual para inconsistências críticas
   */
  private showInconsistencyAlert(criticalDiscrepancies: any[]): void {
    console.warn('🚨 UserStateManager: Mostrando alerta de inconsistência crítica')
    
    // Em um ambiente real, isso seria uma notificação toast ou modal
    // Por enquanto, apenas log detalhado
    console.group('🚨 INCONSISTÊNCIA CRÍTICA DETECTADA')
    console.warn('Foram detectadas inconsistências críticas nos seus dados:')
    
    criticalDiscrepancies.forEach((discrepancy, index) => {
      console.warn(`${index + 1}. ${discrepancy.description}`)
      console.warn(`   Sidebar: ${JSON.stringify(discrepancy.sidebarValue)}`)
      console.warn(`   Principal: ${JSON.stringify(discrepancy.mainValue)}`)
    })
    
    console.warn('O sistema está tentando corrigir automaticamente...')
    console.groupEnd()

    // Tentar mostrar notificação no browser se disponível
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Inconsistência de dados detectada', {
          body: 'Seus dados estão sendo sincronizados automaticamente.',
          icon: '/favicon.ico'
        })
      }
    }
  }

  /**
   * Mostra alerta para inconsistências críticas que requerem intervenção
   */
  private showCriticalInconsistencyAlert(): void {
    console.error('🚨 UserStateManager: Alerta crítico - requer intervenção manual')
    
    console.group('🚨 INTERVENÇÃO MANUAL NECESSÁRIA')
    console.error('Múltiplas tentativas de correção falharam.')
    console.error('Recomendações:')
    console.error('1. Recarregue a página')
    console.error('2. Faça logout e login novamente')
    console.error('3. Limpe o cache do navegador')
    console.error('4. Entre em contato com o suporte se o problema persistir')
    console.groupEnd()

    // Tentar mostrar notificação crítica
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Problema crítico de sincronização', {
          body: 'Por favor, recarregue a página ou faça login novamente.',
          icon: '/favicon.ico',
          requireInteraction: true
        })
      }
    }
  }

  /**
   * Registra métricas de consistência para monitoramento
   */
  private recordConsistencyMetrics(report: any): void {
    const metrics = {
      timestamp: Date.now(),
      isConsistent: report.isConsistent,
      discrepanciesCount: report.discrepancies.length,
      criticalCount: report.discrepancies.filter((d: any) => d.severity === 'critical').length,
      warningCount: report.discrepancies.filter((d: any) => d.severity === 'warning').length,
      recommendation: report.recommendation,
      consecutiveInconsistencies: this.consecutiveInconsistencies,
      userId: this.state.user?.uid
    }

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 UserStateManager: Métricas de consistência', metrics)
    }

    // Em produção, isso seria enviado para um sistema de monitoramento
    // Por enquanto, apenas armazenar localmente para debug
    if (typeof window !== 'undefined') {
      const existingMetrics = JSON.parse(localStorage.getItem('consistency_metrics') || '[]')
      existingMetrics.push(metrics)
      
      // Manter apenas os últimos 50 registros
      if (existingMetrics.length > 50) {
        existingMetrics.splice(0, existingMetrics.length - 50)
      }
      
      localStorage.setItem('consistency_metrics', JSON.stringify(existingMetrics))
    }
  }

  /**
   * Obtém métricas de consistência armazenadas
   */
  getConsistencyMetrics(): any[] {
    if (typeof window === 'undefined') return []
    
    return JSON.parse(localStorage.getItem('consistency_metrics') || '[]')
  }

  /**
   * Limpa métricas de consistência
   */
  clearConsistencyMetrics(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('consistency_metrics')
      console.log('🧹 UserStateManager: Métricas de consistência limpas')
    }
  }

  /**
   * Obtém informações de debug do estado atual
   */
  getDebugInfo(): object {
    return {
      user: this.state.user ? {
        uid: this.state.user.uid,
        nome: this.state.user.nome,
        perfis: this.state.user.perfis
      } : null,
      isLoading: this.state.isLoading,
      lastUpdated: new Date(this.state.lastUpdated).toISOString(),
      cacheValid: this.state.cacheValid,
      subscribersCount: this.subscribers.size,
      cacheAge: Date.now() - this.state.lastUpdated,
      inconsistencyDetected: this.inconsistencyDetected,
      consecutiveInconsistencies: this.consecutiveInconsistencies,
      healthCheckActive: !!this.healthCheckTimer,
      consistencyCheckActive: !!this.consistencyCheckTimer,
      recentMetrics: this.getConsistencyMetrics().slice(-5)
    }
  }
}

// Instância singleton
const userStateManager = new UserStateManager()

// Adicionar ao window para debug (apenas em desenvolvimento)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).userStateManager = userStateManager;
  
  // Comandos de debug adicionais
  (window as any).debugUserState = {
    getInfo: () => userStateManager.getDebugInfo(),
    forceRefresh: () => userStateManager.forceRefresh(),
    startHealthCheck: () => userStateManager.startHealthCheck(),
    stopHealthCheck: () => userStateManager.stopHealthCheck(),
    startConsistencyCheck: () => userStateManager.startConsistencyCheck(),
    stopConsistencyCheck: () => userStateManager.stopConsistencyCheck(),
    getMetrics: () => userStateManager.getConsistencyMetrics(),
    clearMetrics: () => userStateManager.clearConsistencyMetrics(),
    invalidateCache: () => userStateManager.invalidateCache()
  }
}

export default userStateManager