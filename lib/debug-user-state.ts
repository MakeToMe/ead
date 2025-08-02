/**
 * Debug User State - Ferramentas de debug para estado do usuário
 * 
 * Este arquivo fornece ferramentas de debug para testar e monitorar
 * a consistência de dados do usuário entre componentes.
 */

import type { User } from "@/lib/auth-client"

export interface DebugUserState {
  // Informações gerais
  getInfo(): Promise<object>
  
  // Controle de monitoramento
  startMonitoring(): Promise<void>
  stopMonitoring(): Promise<void>
  
  // Verificações manuais
  checkConsistency(): Promise<object>
  compareComponents(): Promise<object>
  
  // Ações de correção
  forceSync(): Promise<void>
  autoFix(): Promise<boolean>
  
  // Métricas e histórico
  getMetrics(): any[]
  getInconsistencyHistory(): any[]
  clearHistory(): void
  
  // Simulação de problemas (apenas desenvolvimento)
  simulateInconsistency(): Promise<void>
  simulateNetworkError(): Promise<void>
}

class DebugUserStateImpl implements DebugUserState {
  
  /**
   * Obtém informações completas do estado atual
   */
  async getInfo(): Promise<object> {
    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      const userStateInfo = userStateManager.getDebugInfo()
      const validatorInfo = dataConsistencyValidator.getDebugInfo()
      
      return {
        timestamp: new Date().toISOString(),
        userStateManager: userStateInfo,
        dataConsistencyValidator: validatorInfo,
        browser: {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
          online: typeof window !== 'undefined' ? window.navigator.onLine : true,
          cookiesEnabled: typeof window !== 'undefined' ? window.navigator.cookieEnabled : true
        }
      }
    } catch (error) {
      console.error('❌ DebugUserState: Erro ao obter informações', error)
      return { error: error.message }
    }
  }

  /**
   * Inicia monitoramento automático
   */
  async startMonitoring(): Promise<void> {
    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      
      userStateManager.startHealthCheck()
      console.log('✅ DebugUserState: Monitoramento iniciado')
    } catch (error) {
      console.error('❌ DebugUserState: Erro ao iniciar monitoramento', error)
    }
  }

  /**
   * Para monitoramento automático
   */
  async stopMonitoring(): Promise<void> {
    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      
      userStateManager.stopHealthCheck()
      console.log('✅ DebugUserState: Monitoramento parado')
    } catch (error) {
      console.error('❌ DebugUserState: Erro ao parar monitoramento', error)
    }
  }

  /**
   * Executa verificação manual de consistência
   */
  async checkConsistency(): Promise<object> {
    try {
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      console.log('🔍 DebugUserState: Executando verificação de consistência manual')
      const report = await dataConsistencyValidator.validateConsistency()
      
      console.log('📊 DebugUserState: Relatório de consistência', report)
      return report
    } catch (error) {
      console.error('❌ DebugUserState: Erro na verificação de consistência', error)
      return { error: error.message }
    }
  }

  /**
   * Compara dados entre componentes
   */
  async compareComponents(): Promise<object> {
    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      // Obter dados de diferentes fontes
      const userStateData = userStateManager.getCurrentUser()
      const serverData = await this.getUserFromServer()
      
      // Comparar dados
      const discrepancies = dataConsistencyValidator.detectDiscrepancies(userStateData, serverData)
      
      const comparison = {
        timestamp: new Date().toISOString(),
        userStateManager: {
          data: userStateData ? {
            uid: userStateData.uid,
            nome: userStateData.nome,
            perfis: userStateData.perfis,
            email: userStateData.email
          } : null,
          source: 'UserStateManager'
        },
        server: {
          data: serverData ? {
            uid: serverData.uid,
            nome: serverData.nome,
            perfis: serverData.perfis,
            email: serverData.email
          } : null,
          source: 'Server API'
        },
        discrepancies,
        isConsistent: discrepancies.length === 0
      }
      
      console.log('🔍 DebugUserState: Comparação de componentes', comparison)
      return comparison
    } catch (error) {
      console.error('❌ DebugUserState: Erro na comparação de componentes', error)
      return { error: error.message }
    }
  }

  /**
   * Força sincronização manual
   */
  async forceSync(): Promise<void> {
    try {
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      console.log('🔄 DebugUserState: Forçando sincronização manual')
      await dataConsistencyValidator.forceSynchronization()
      console.log('✅ DebugUserState: Sincronização manual concluída')
    } catch (error) {
      console.error('❌ DebugUserState: Erro na sincronização manual', error)
    }
  }

  /**
   * Executa auto-correção manual
   */
  async autoFix(): Promise<boolean> {
    try {
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      console.log('🔧 DebugUserState: Executando auto-correção manual')
      const success = await dataConsistencyValidator.autoCorrect()
      
      console.log(success ? '✅' : '❌', 'DebugUserState: Auto-correção', success ? 'bem-sucedida' : 'falhou')
      return success
    } catch (error) {
      console.error('❌ DebugUserState: Erro na auto-correção', error)
      return false
    }
  }

  /**
   * Obtém métricas de consistência
   */
  getMetrics(): any[] {
    try {
      if (typeof window === 'undefined') return []
      
      const metrics = JSON.parse(localStorage.getItem('consistency_metrics') || '[]')
      console.log('📊 DebugUserState: Métricas de consistência', { count: metrics.length })
      return metrics
    } catch (error) {
      console.error('❌ DebugUserState: Erro ao obter métricas', error)
      return []
    }
  }

  /**
   * Obtém histórico de inconsistências
   */
  async getInconsistencyHistory(): Promise<any[]> {
    try {
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      const history = dataConsistencyValidator.getInconsistencyHistory()
      console.log('📋 DebugUserState: Histórico de inconsistências', { count: history.length })
      return history
    } catch (error) {
      console.error('❌ DebugUserState: Erro ao obter histórico', error)
      return []
    }
  }

  /**
   * Limpa histórico de inconsistências
   */
  async clearHistory(): Promise<void> {
    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      userStateManager.clearConsistencyMetrics()
      dataConsistencyValidator.clearInconsistencyHistory()
      
      console.log('🧹 DebugUserState: Histórico limpo')
    } catch (error) {
      console.error('❌ DebugUserState: Erro ao limpar histórico', error)
    }
  }

  /**
   * Simula inconsistência para teste (apenas desenvolvimento)
   */
  async simulateInconsistency(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('⚠️ DebugUserState: Simulação disponível apenas em desenvolvimento')
      return
    }

    try {
      console.log('🎭 DebugUserState: Simulando inconsistência para teste')
      
      // Esta função seria implementada para forçar dados diferentes
      // entre componentes para testar a detecção
      console.warn('⚠️ DebugUserState: Simulação de inconsistência não implementada ainda')
    } catch (error) {
      console.error('❌ DebugUserState: Erro na simulação', error)
    }
  }

  /**
   * Simula erro de rede para teste
   */
  async simulateNetworkError(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('⚠️ DebugUserState: Simulação disponível apenas em desenvolvimento')
      return
    }

    try {
      console.log('🎭 DebugUserState: Simulando erro de rede para teste')
      
      // Esta função seria implementada para simular falhas de rede
      console.warn('⚠️ DebugUserState: Simulação de erro de rede não implementada ainda')
    } catch (error) {
      console.error('❌ DebugUserState: Erro na simulação', error)
    }
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
        console.log('ℹ️ DebugUserState: Usuário não autenticado')
        return null
      }

      if (response.status === 404) {
        console.warn('⚠️ DebugUserState: Rota não encontrada')
        return null
      }

      if (!response.ok) {
        console.warn('⚠️ DebugUserState: Falha ao obter dados do servidor', response.status)
        return null
      }

      const data = await response.json()
      return data.user || null
    } catch (error) {
      console.error('❌ DebugUserState: Erro ao obter dados do servidor', error)
      return null
    }
  }
}

// Instância singleton
const debugUserState = new DebugUserStateImpl()

// Adicionar ao window para debug (apenas em desenvolvimento)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugUserState = debugUserState
}

export default debugUserState