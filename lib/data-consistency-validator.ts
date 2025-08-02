/**
 * Data Consistency Validator
 * 
 * Responsável por detectar e corrigir inconsistências de dados do usuário
 * entre diferentes componentes da aplicação.
 */

import type { User } from "@/lib/auth-client"
import enhancedLogger from "@/lib/enhanced-logger"

export interface Discrepancy {
  field: string
  sidebarValue: any
  mainValue: any
  severity: 'critical' | 'warning' | 'info'
  description: string
}

export interface ConsistencyReport {
  isConsistent: boolean
  discrepancies: Discrepancy[]
  timestamp: number
  recommendation: 'sync' | 'reload' | 'manual_check'
  componentsChecked: string[]
}

export interface ComponentState {
  componentName: string
  userData: User | null
  lastUpdate: number
  source: string
  isHealthy: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  userData: User | null
}

class DataConsistencyValidator {
  private componentStates: Map<string, ComponentState> = new Map()
  private inconsistencyHistory: Discrepancy[] = []
  private lastConsistencyCheck: number = 0
  private autoFixEnabled: boolean = true
  private retryAttempts: Map<string, number> = new Map()
  private readonly MAX_RETRY_ATTEMPTS = 3
  private readonly RETRY_DELAY_BASE = 1000 // 1 segundo base

  /**
   * Registra o estado de um componente
   */
  registerComponentState(componentName: string, userData: User | null, source: string): void {
    // Log apenas em desenvolvimento e apenas para erros
    if (process.env.NODE_ENV === 'development' && !userData) {
      console.warn(`⚠️ DataConsistencyValidator: Componente ${componentName} sem dados de usuário`)
    }

    this.componentStates.set(componentName, {
      componentName,
      userData,
      lastUpdate: Date.now(),
      source,
      isHealthy: true
    })
  }

  /**
   * Compara dados entre dois usuários e identifica discrepâncias
   */
  detectDiscrepancies(sidebarData: User | null, mainData: User | null): Discrepancy[] {
    const discrepancies: Discrepancy[] = []

    if (!sidebarData && !mainData) {
      return discrepancies
    }

    if (!sidebarData || !mainData) {
      discrepancies.push({
        field: 'user_existence',
        sidebarValue: sidebarData ? 'exists' : 'null',
        mainValue: mainData ? 'exists' : 'null',
        severity: 'critical',
        description: 'Um componente tem dados de usuário e outro não'
      })
      return discrepancies
    }

    // Verificar campos críticos
    const criticalFields = [
      { key: 'uid', name: 'ID do usuário' },
      { key: 'nome', name: 'Nome' },
      { key: 'perfis', name: 'Perfil' },
      { key: 'email', name: 'Email' }
    ]

    for (const field of criticalFields) {
      const sidebarValue = (sidebarData as any)[field.key]
      const mainValue = (mainData as any)[field.key]

      if (sidebarValue !== mainValue) {
        discrepancies.push({
          field: field.key,
          sidebarValue,
          mainValue,
          severity: field.key === 'uid' ? 'critical' : 'warning',
          description: `${field.name} diferente entre sidebar e conteúdo principal`
        })
      }
    }

    // Verificar campos opcionais
    const optionalFields = [
      { key: 'url_foto', name: 'Foto de perfil' },
      { key: 'whatsapp', name: 'WhatsApp' },
      { key: 'bio', name: 'Biografia' }
    ]

    for (const field of optionalFields) {
      const sidebarValue = (sidebarData as any)[field.key]
      const mainValue = (mainData as any)[field.key]

      if (sidebarValue !== mainValue) {
        discrepancies.push({
          field: field.key,
          sidebarValue,
          mainValue,
          severity: 'info',
          description: `${field.name} diferente entre componentes`
        })
      }
    }

    return discrepancies
  }

  /**
   * Valida consistência entre todos os componentes registrados
   */
  async validateConsistency(): Promise<ConsistencyReport> {
    const startTime = Date.now()
    enhancedLogger.info('DataConsistencyValidator', 'Iniciando validação de consistência')
    console.log('🔍 DataConsistencyValidator: Iniciando validação de consistência')

    const timestamp = Date.now()
    this.lastConsistencyCheck = timestamp

    const componentsChecked: string[] = []
    const allDiscrepancies: Discrepancy[] = []

    // Obter dados de diferentes fontes
    const userStateManagerData = await this.getUserFromUserStateManager()
    const authContextData = await this.getUserFromAuthContext()
    const serverData = await this.getUserFromServer()

    // Registrar estados
    this.registerComponentState('UserStateManager', userStateManagerData, 'cache')
    this.registerComponentState('AuthContext', authContextData, 'context')
    this.registerComponentState('Server', serverData, 'server')

    componentsChecked.push('UserStateManager', 'AuthContext', 'Server')

    // Comparar UserStateManager vs AuthContext
    const userStateVsAuth = this.detectDiscrepancies(userStateManagerData, authContextData)
    allDiscrepancies.push(...userStateVsAuth.map(d => ({ ...d, description: `UserStateManager vs AuthContext: ${d.description}` })))

    // Comparar AuthContext vs Server
    const authVsServer = this.detectDiscrepancies(authContextData, serverData)
    allDiscrepancies.push(...authVsServer.map(d => ({ ...d, description: `AuthContext vs Server: ${d.description}` })))

    // Comparar UserStateManager vs Server
    const userStateVsServer = this.detectDiscrepancies(userStateManagerData, serverData)
    allDiscrepancies.push(...userStateVsServer.map(d => ({ ...d, description: `UserStateManager vs Server: ${d.description}` })))

    // Adicionar ao histórico
    this.inconsistencyHistory.push(...allDiscrepancies)

    // Determinar recomendação
    let recommendation: 'sync' | 'reload' | 'manual_check' = 'sync'
    
    const criticalDiscrepancies = allDiscrepancies.filter(d => d.severity === 'critical')
    if (criticalDiscrepancies.length > 0) {
      recommendation = 'reload'
    } else if (allDiscrepancies.length > 3) {
      recommendation = 'manual_check'
    }

    const report: ConsistencyReport = {
      isConsistent: allDiscrepancies.length === 0,
      discrepancies: allDiscrepancies,
      timestamp,
      recommendation,
      componentsChecked
    }

    const duration = Date.now() - startTime
    // Log apenas se houver inconsistências ou em desenvolvimento
    if (!report.isConsistent || process.env.NODE_ENV === 'development') {
      enhancedLogger.consistency('DataConsistencyValidator', 'consistency_check_completed', {
        isConsistent: report.isConsistent,
        discrepancies: allDiscrepancies,
        recommendation,
        componentsChecked
      })
      
      if (!report.isConsistent) {
        console.warn('⚠️ DataConsistencyValidator: Inconsistências detectadas', {
          discrepanciesCount: allDiscrepancies.length,
          criticalCount: criticalDiscrepancies.length,
          recommendation
        })
      }
    }

    // Auto-correção se habilitada
    if (!report.isConsistent && this.autoFixEnabled) {
      console.log('🔧 DataConsistencyValidator: Iniciando auto-correção')
      await this.autoCorrect(report)
    }

    return report
  }

  /**
   * Força sincronização de todos os componentes
   */
  async forceSynchronization(): Promise<void> {
    console.log('🔄 DataConsistencyValidator: Forçando sincronização')

    try {
      // Importar UserStateManager dinamicamente
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      
      // Invalidar cache e forçar reload
      userStateManager.invalidateCache()
      await userStateManager.refreshUser()

      console.log('✅ DataConsistencyValidator: Sincronização forçada concluída')
    } catch (error) {
      console.error('❌ DataConsistencyValidator: Erro na sincronização forçada', error)
      throw error
    }
  }

  /**
   * Auto-correção baseada no relatório de consistência
   */
  async autoCorrect(report?: ConsistencyReport): Promise<boolean> {
    console.log('🔧 DataConsistencyValidator: Iniciando auto-correção')

    try {
      if (!report) {
        report = await this.validateConsistency()
      }

      if (report.isConsistent) {
        console.log('✅ DataConsistencyValidator: Dados já estão consistentes')
        return true
      }

      // Aplicar sistema de prioridades para correção
      const correctionStrategy = this.determineCorrectionStrategy(report)
      console.log('🎯 DataConsistencyValidator: Estratégia de correção determinada:', correctionStrategy)

      // Executar correção com retry
      const success = await this.executeCorrection(correctionStrategy, report)
      
      if (success) {
        console.log('✅ DataConsistencyValidator: Auto-correção bem-sucedida')
        this.resetRetryAttempts()
      } else {
        console.error('❌ DataConsistencyValidator: Auto-correção falhou')
      }
      
      return success
    } catch (error) {
      console.error('❌ DataConsistencyValidator: Erro na auto-correção', error)
      return false
    }
  }

  /**
   * Determina a estratégia de correção baseada no sistema de prioridades
   */
  private determineCorrectionStrategy(report: ConsistencyReport): 'server_priority' | 'cache_invalidation' | 'complete_reload' | 'manual_intervention' {
    const criticalDiscrepancies = report.discrepancies.filter(d => d.severity === 'critical')
    const warningDiscrepancies = report.discrepancies.filter(d => d.severity === 'warning')
    
    console.log('📊 DataConsistencyValidator: Analisando discrepâncias', {
      critical: criticalDiscrepancies.length,
      warning: warningDiscrepancies.length,
      total: report.discrepancies.length
    })

    // Prioridade 1: Inconsistências críticas (UID, dados essenciais)
    if (criticalDiscrepancies.length > 0) {
      const hasUidDiscrepancy = criticalDiscrepancies.some(d => d.field === 'uid')
      if (hasUidDiscrepancy) {
        console.warn('🚨 DataConsistencyValidator: Discrepância crítica de UID detectada')
        return 'complete_reload'
      }
      return 'server_priority'
    }

    // Prioridade 2: Múltiplas inconsistências de warning
    if (warningDiscrepancies.length > 2) {
      return 'cache_invalidation'
    }

    // Prioridade 3: Poucas inconsistências, sync simples
    if (report.discrepancies.length <= 2) {
      return 'server_priority'
    }

    // Prioridade 4: Muitas inconsistências, requer intervenção
    return 'manual_intervention'
  }

  /**
   * Executa a correção com retry e backoff exponencial
   */
  private async executeCorrection(strategy: string, report: ConsistencyReport): Promise<boolean> {
    const attemptKey = `${strategy}_${Date.now()}`
    const currentAttempts = this.retryAttempts.get(strategy) || 0

    if (currentAttempts >= this.MAX_RETRY_ATTEMPTS) {
      console.error('🚨 DataConsistencyValidator: Máximo de tentativas excedido para estratégia:', strategy)
      return false
    }

    try {
      console.log(`🔧 DataConsistencyValidator: Executando correção (tentativa ${currentAttempts + 1}/${this.MAX_RETRY_ATTEMPTS}):`, strategy)

      let correctionResult = false

      switch (strategy) {
        case 'server_priority':
          correctionResult = await this.applyServerPriorityCorrection()
          break
          
        case 'cache_invalidation':
          correctionResult = await this.applyCacheInvalidationCorrection()
          break
          
        case 'complete_reload':
          correctionResult = await this.applyCompleteReloadCorrection()
          break
          
        case 'manual_intervention':
          console.warn('⚠️ DataConsistencyValidator: Estratégia requer intervenção manual')
          return false
      }

      if (correctionResult) {
        // Verificar se a correção foi realmente efetiva
        const verificationReport = await this.validateConsistency()
        if (verificationReport.isConsistent) {
          console.log('✅ DataConsistencyValidator: Correção verificada com sucesso')
          return true
        } else {
          console.warn('⚠️ DataConsistencyValidator: Correção aplicada mas inconsistências ainda existem')
          correctionResult = false
        }
      }

      if (!correctionResult) {
        // Incrementar tentativas e tentar novamente com delay
        this.retryAttempts.set(strategy, currentAttempts + 1)
        
        if (currentAttempts < this.MAX_RETRY_ATTEMPTS - 1) {
          const delay = this.RETRY_DELAY_BASE * Math.pow(2, currentAttempts)
          console.log(`⏳ DataConsistencyValidator: Tentativa falhou, tentando novamente em ${delay}ms`)
          
          await new Promise(resolve => setTimeout(resolve, delay))
          return this.executeCorrection(strategy, report)
        }
      }

      return correctionResult
    } catch (error) {
      console.error('❌ DataConsistencyValidator: Erro na execução da correção:', error)
      
      // Incrementar tentativas mesmo em caso de erro
      this.retryAttempts.set(strategy, currentAttempts + 1)
      
      if (currentAttempts < this.MAX_RETRY_ATTEMPTS - 1) {
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, currentAttempts)
        console.log(`⏳ DataConsistencyValidator: Erro na tentativa, tentando novamente em ${delay}ms`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.executeCorrection(strategy, report)
      }
      
      return false
    }
  }

  /**
   * Aplica correção com prioridade do servidor
   */
  private async applyServerPriorityCorrection(): Promise<boolean> {
    console.log('🔧 DataConsistencyValidator: Aplicando correção com prioridade do servidor')

    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      
      // Forçar refresh dos dados do servidor
      const freshUser = await userStateManager.refreshUser()
      
      if (freshUser) {
        console.log('✅ DataConsistencyValidator: Dados atualizados do servidor')
        return true
      } else {
        console.warn('⚠️ DataConsistencyValidator: Nenhum dado obtido do servidor')
        return false
      }
    } catch (error) {
      console.error('❌ DataConsistencyValidator: Erro na correção com prioridade do servidor', error)
      return false
    }
  }

  /**
   * Aplica correção invalidando cache
   */
  private async applyCacheInvalidationCorrection(): Promise<boolean> {
    console.log('🔧 DataConsistencyValidator: Aplicando correção invalidando cache')

    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      
      // Invalidar cache e forçar reload
      userStateManager.invalidateCache()
      
      // Aguardar um pouco para o reload acontecer
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ DataConsistencyValidator: Cache invalidado e dados recarregados')
      return true
    } catch (error) {
      console.error('❌ DataConsistencyValidator: Erro na invalidação de cache', error)
      return false
    }
  }

  /**
   * Aplica correção com reload completo
   */
  private async applyCompleteReloadCorrection(): Promise<boolean> {
    console.log('🔧 DataConsistencyValidator: Aplicando correção com reload completo')

    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      
      // Limpar todos os dados
      userStateManager.clearAll()
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recarregar dados frescos
      const freshUser = await userStateManager.refreshUser()
      
      if (freshUser) {
        console.log('✅ DataConsistencyValidator: Reload completo bem-sucedido')
        return true
      } else {
        console.warn('⚠️ DataConsistencyValidator: Reload completo falhou')
        return false
      }
    } catch (error) {
      console.error('❌ DataConsistencyValidator: Erro no reload completo', error)
      return false
    }
  }

  /**
   * Reseta contadores de tentativas
   */
  private resetRetryAttempts(): void {
    this.retryAttempts.clear()
    console.log('🔄 DataConsistencyValidator: Contadores de tentativas resetados')
  }

  /**
   * Força reload completo de todos os dados (método público)
   */
  async forceCompleteReload(): Promise<void> {
    console.log('🔄 DataConsistencyValidator: Forçando reload completo')

    try {
      // Importar UserStateManager dinamicamente
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      
      // Limpar todos os caches
      userStateManager.clearAll()
      
      // Recarregar dados frescos
      await userStateManager.refreshUser()

      console.log('✅ DataConsistencyValidator: Reload completo concluído')
    } catch (error) {
      console.error('❌ DataConsistencyValidator: Erro no reload completo', error)
      throw error
    }
  }

  /**
   * Obtém dados do UserStateManager
   */
  private async getUserFromUserStateManager(): Promise<User | null> {
    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      return userStateManager.getCurrentUser()
    } catch (error) {
      console.error('❌ DataConsistencyValidator: Erro ao obter dados do UserStateManager', error)
      return null
    }
  }

  /**
   * Obtém dados do AuthContext (simulado)
   */
  private async getUserFromAuthContext(): Promise<User | null> {
    // Em um ambiente real, isso seria obtido do contexto React
    // Por enquanto, vamos simular obtendo do UserStateManager
    return this.getUserFromUserStateManager()
  }

  /**
   * Obtém dados diretamente do servidor
   */
  private async getUserFromServer(): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.status === 401) {
        console.log('ℹ️ DataConsistencyValidator: Usuário não autenticado')
        return null
      }

      if (response.status === 404) {
        console.warn('⚠️ DataConsistencyValidator: Rota não encontrada, usando dados do cache')
        return null
      }

      if (!response.ok) {
        console.warn('⚠️ DataConsistencyValidator: Falha ao obter dados do servidor', response.status)
        return null
      }

      const data = await response.json()
      return data.user || null
    } catch (error) {
      console.error('❌ DataConsistencyValidator: Erro ao obter dados do servidor', error)
      return null
    }
  }

  /**
   * Obtém histórico de inconsistências
   */
  getInconsistencyHistory(): Discrepancy[] {
    return [...this.inconsistencyHistory]
  }

  /**
   * Limpa histórico de inconsistências
   */
  clearInconsistencyHistory(): void {
    this.inconsistencyHistory = []
    console.log('🧹 DataConsistencyValidator: Histórico de inconsistências limpo')
  }

  /**
   * Habilita/desabilita auto-correção
   */
  setAutoFixEnabled(enabled: boolean): void {
    this.autoFixEnabled = enabled
    console.log(`🔧 DataConsistencyValidator: Auto-correção ${enabled ? 'habilitada' : 'desabilitada'}`)
  }

  /**
   * Obtém informações de debug
   */
  getDebugInfo(): object {
    return {
      componentStates: Object.fromEntries(this.componentStates),
      inconsistencyHistoryCount: this.inconsistencyHistory.length,
      lastConsistencyCheck: new Date(this.lastConsistencyCheck).toISOString(),
      autoFixEnabled: this.autoFixEnabled,
      recentInconsistencies: this.inconsistencyHistory.slice(-5)
    }
  }
}

// Instância singleton
const dataConsistencyValidator = new DataConsistencyValidator()

// Adicionar ao window para debug (apenas em desenvolvimento)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugUser = {
    checkConsistency: () => dataConsistencyValidator.validateConsistency(),
    compareComponents: () => dataConsistencyValidator.getDebugInfo(),
    forceSync: () => dataConsistencyValidator.forceSynchronization(),
    getInconsistencyHistory: () => dataConsistencyValidator.getInconsistencyHistory(),
    autoFix: () => dataConsistencyValidator.autoCorrect(),
    clearHistory: () => dataConsistencyValidator.clearInconsistencyHistory()
  }
}

export default dataConsistencyValidator