/**
 * Debug Dashboard - Interface visual para debug em desenvolvimento
 * 
 * Fornece uma interface visual para monitorar o estado do sistema,
 * logs, métricas e executar ações de debug.
 */

import enhancedLogger from "@/lib/enhanced-logger"
import { createLogger } from '@/lib/logger-factory'
import { EnvironmentUtils } from '@/lib/utils/environment'

const logger = createLogger('DebugDashboard', 'ERROR', 'Dashboard de debug visual')

export interface DashboardState {
  userState: any
  consistencyState: any
  logs: any[]
  metrics: any
  lastUpdate: string
}

class DebugDashboard {
  private isVisible: boolean = false
  private updateInterval: NodeJS.Timeout | null = null
  private dashboardElement: HTMLElement | null = null

  /**
   * Mostra o dashboard de debug
   */
  show(): void {
    if (!EnvironmentUtils.environmentValue(true, false)) {
      logger.warn('DebugDashboard: Disponível apenas em desenvolvimento')
      return
    }

    if (this.isVisible) {
      logger.debug('DebugDashboard: Dashboard já está visível')
      return
    }

    this.createDashboard()
    this.startAutoUpdate()
    this.isVisible = true

    logger.debug('DebugDashboard: Dashboard exibido')
  }

  /**
   * Esconde o dashboard de debug
   */
  hide(): void {
    if (!this.isVisible) return

    this.stopAutoUpdate()
    this.removeDashboard()
    this.isVisible = false

    logger.debug('DebugDashboard: Dashboard ocultado')
  }

  /**
   * Alterna visibilidade do dashboard
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Cria o elemento do dashboard
   */
  private createDashboard(): void {
    if (typeof window === 'undefined') return

    // Remover dashboard existente se houver
    this.removeDashboard()

    // Criar container principal
    this.dashboardElement = document.createElement('div')
    this.dashboardElement.id = 'debug-dashboard'
    this.dashboardElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `

    // Adicionar conteúdo inicial
    this.updateDashboardContent()

    // Adicionar ao DOM
    document.body.appendChild(this.dashboardElement)
  }

  /**
   * Remove o dashboard do DOM
   */
  private removeDashboard(): void {
    if (this.dashboardElement) {
      this.dashboardElement.remove()
      this.dashboardElement = null
    }
  }

  /**
   * Atualiza o conteúdo do dashboard
   */
  private async updateDashboardContent(): Promise<void> {
    if (!this.dashboardElement) return

    try {
      const state = await this.getCurrentState()
      
      this.dashboardElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #333; padding-bottom: 8px;">
          <h3 style="margin: 0; color: #4CAF50;">🛠️ Debug Dashboard</h3>
          <button onclick="window.debugDashboard.hide()" style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">✕</button>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #2196F3;">👤 User State</h4>
          <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; font-size: 11px;">
            ${this.formatUserState(state.userState)}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #FF9800;">🔍 Consistency</h4>
          <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; font-size: 11px;">
            ${this.formatConsistencyState(state.consistencyState)}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #9C27B0;">📊 Metrics</h4>
          <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; font-size: 11px;">
            ${this.formatMetrics(state.metrics)}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #607D8B;">📝 Recent Logs</h4>
          <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; font-size: 10px; max-height: 200px; overflow-y: auto;">
            ${this.formatRecentLogs(state.logs)}
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button onclick="window.debugDashboard.executeAction('checkConsistency')" style="background: #4CAF50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 10px;">Check Consistency</button>
          <button onclick="window.debugDashboard.executeAction('forceSync')" style="background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 10px;">Force Sync</button>
          <button onclick="window.debugDashboard.executeAction('clearLogs')" style="background: #FF9800; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 10px;">Clear Logs</button>
          <button onclick="window.debugDashboard.executeAction('exportLogs')" style="background: #9C27B0; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 10px;">Export Logs</button>
        </div>

        <div style="margin-top: 12px; font-size: 10px; color: #888; text-align: center;">
          Last Update: ${state.lastUpdate}
        </div>
      `
    } catch (error) {
      logger.error('Erro ao atualizar conteúdo', {}, error)
    }
  }

  /**
   * Obtém o estado atual do sistema
   */
  private async getCurrentState(): Promise<DashboardState> {
    try {
      // Obter estado do UserStateManager
      let userState = {}
      try {
        const { default: userStateManager } = await import("@/lib/user-state-manager")
        userState = userStateManager.getDebugInfo()
      } catch (error) {
        userState = { error: 'Não disponível' }
      }

      // Obter estado do DataConsistencyValidator
      let consistencyState = {}
      try {
        const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
        consistencyState = dataConsistencyValidator.getDebugInfo()
      } catch (error) {
        consistencyState = { error: 'Não disponível' }
      }

      // Obter logs recentes
      const logs = enhancedLogger.getLogs().slice(-10)

      // Obter métricas
      const metrics = enhancedLogger.getStats()

      return {
        userState,
        consistencyState,
        logs,
        metrics,
        lastUpdate: new Date().toLocaleTimeString()
      }
    } catch (error) {
      logger.error('Erro ao obter estado', {}, error)
      return {
        userState: { error: 'Erro ao obter estado' },
        consistencyState: { error: 'Erro ao obter estado' },
        logs: [],
        metrics: {},
        lastUpdate: new Date().toLocaleTimeString()
      }
    }
  }

  /**
   * Formata estado do usuário para exibição
   */
  private formatUserState(userState: any): string {
    if (userState.error) {
      return `<span style="color: #f44336;">${userState.error}</span>`
    }

    return `
      <div><strong>User:</strong> ${userState.user?.nome || 'N/A'}</div>
      <div><strong>Profile:</strong> ${userState.user?.perfis || 'N/A'}</div>
      <div><strong>Loading:</strong> ${userState.isLoading ? 'Yes' : 'No'}</div>
      <div><strong>Cache Valid:</strong> ${userState.cacheValid ? 'Yes' : 'No'}</div>
      <div><strong>Subscribers:</strong> ${userState.subscribersCount || 0}</div>
      <div><strong>Inconsistencies:</strong> ${userState.consecutiveInconsistencies || 0}</div>
    `
  }

  /**
   * Formata estado de consistência para exibição
   */
  private formatConsistencyState(consistencyState: any): string {
    if (consistencyState.error) {
      return `<span style="color: #f44336;">${consistencyState.error}</span>`
    }

    return `
      <div><strong>Components:</strong> ${Object.keys(consistencyState.componentStates || {}).length}</div>
      <div><strong>History Count:</strong> ${consistencyState.inconsistencyHistoryCount || 0}</div>
      <div><strong>Last Check:</strong> ${consistencyState.lastConsistencyCheck || 'Never'}</div>
      <div><strong>Auto Fix:</strong> ${consistencyState.autoFixEnabled ? 'Enabled' : 'Disabled'}</div>
    `
  }

  /**
   * Formata métricas para exibição
   */
  private formatMetrics(metrics: any): string {
    if (!metrics || Object.keys(metrics).length === 0) {
      return '<span style="color: #888;">No metrics available</span>'
    }

    return `
      <div><strong>Total Logs:</strong> ${metrics.total || 0}</div>
      <div><strong>Errors:</strong> ${metrics.byLevel?.error || 0}</div>
      <div><strong>Warnings:</strong> ${metrics.byLevel?.warn || 0}</div>
      <div><strong>Session:</strong> ${metrics.sessionId?.substr(-8) || 'N/A'}</div>
    `
  }

  /**
   * Formata logs recentes para exibição
   */
  private formatRecentLogs(logs: any[]): string {
    if (!logs || logs.length === 0) {
      return '<span style="color: #888;">No recent logs</span>'
    }

    return logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString()
      const levelColor = this.getLogLevelColor(log.level)
      return `<div style="margin-bottom: 4px; border-left: 2px solid ${levelColor}; padding-left: 6px;">
        <span style="color: #888;">${time}</span> 
        <span style="color: ${levelColor};">[${log.level.toUpperCase()}]</span> 
        <span style="color: #4CAF50;">${log.component}</span>: 
        ${log.message}
      </div>`
    }).join('')
  }

  /**
   * Obtém cor para nível de log
   */
  private getLogLevelColor(level: string): string {
    const colors = {
      debug: '#607D8B',
      info: '#2196F3',
      warn: '#FF9800',
      error: '#f44336',
      critical: '#E91E63'
    }
    return colors[level as keyof typeof colors] || '#888'
  }

  /**
   * Executa ação do dashboard
   */
  async executeAction(action: string): Promise<void> {
    logger.debug(`Executando ação: ${action}`)

    try {
      switch (action) {
        case 'checkConsistency':
          const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
          const report = await dataConsistencyValidator.validateConsistency()
          logger.debug('Consistency Report:', report)
          break

        case 'forceSync':
          const { default: userStateManager } = await import("@/lib/user-state-manager")
          await userStateManager.forceRefresh()
          logger.debug('Force sync completed')
          break

        case 'clearLogs':
          enhancedLogger.clearLogs()
          logger.debug('Logs cleared')
          break

        case 'exportLogs':
          const exportData = enhancedLogger.exportLogs()
          this.downloadLogs(exportData)
          logger.debug('Logs exported')
          break

        default:
          logger.warn(`Ação desconhecida: ${action}`)
      }

      // Atualizar dashboard após ação
      setTimeout(() => this.updateDashboardContent(), 500)
    } catch (error) {
      logger.error(`Erro ao executar ação ${action}:`, { action }, error)
    }
  }

  /**
   * Faz download dos logs
   */
  private downloadLogs(data: string): void {
    if (typeof window === 'undefined') return

    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Inicia atualização automática
   */
  private startAutoUpdate(): void {
    this.updateInterval = setInterval(() => {
      this.updateDashboardContent()
    }, 5000) // Atualizar a cada 5 segundos
  }

  /**
   * Para atualização automática
   */
  private stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }
}

// Instância singleton
const debugDashboard = new DebugDashboard()

// Adicionar ao window para acesso global (apenas desenvolvimento)
EnvironmentUtils.onlyInDevelopment(() => {
  EnvironmentUtils.onlyInClient(() => {
    (window as any).debugDashboard = debugDashboard

    // Atalho de teclado para mostrar/ocultar dashboard (Ctrl+Shift+D)
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        debugDashboard.toggle()
      }
    })

    logger.debug('DebugDashboard: Carregado! Use Ctrl+Shift+D para mostrar/ocultar')
  })
})

export default debugDashboard