/**
 * Console Commands - Comandos de console melhorados para debug
 * 
 * Fornece comandos estruturados e fáceis de usar para debug
 * do sistema de consistência de dados.
 */

import enhancedLogger from "@/lib/enhanced-logger"
import { logManager } from '@/lib/log-manager'
import type { LogLevel } from '@/lib/types/logging'

export interface ConsoleCommands {
  // Informações gerais
  info(): Promise<void>
  status(): Promise<void>
  
  // Consistência
  checkConsistency(): Promise<void>
  forceSync(): Promise<void>
  autoFix(): Promise<void>
  
  // Logs
  logs(level?: string, component?: string): void
  auditLogs(): void
  consistencyLogs(): void
  clearLogs(): void
  exportLogs(): void
  
  // Controles de logging
  setLogLevel(level: LogLevel): void
  setComponentLevel(component: string, level: LogLevel): void
  showLogConfig(): void
  enableQuietMode(): void
  enableDebugMode(): void
  enableNormalMode(): void
  
  // Dashboard
  showDashboard(): void
  hideDashboard(): void
  
  // Métricas
  metrics(): void
  performance(): void
  
  // Utilitários
  help(): void
  reset(): Promise<void>
}

class ConsoleCommandsImpl implements ConsoleCommands {
  
  /**
   * Mostra informações gerais do sistema
   */
  async info(): Promise<void> {
    console.group('ℹ️ System Information')
    
    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      const userInfo = userStateManager.getDebugInfo()
      const consistencyInfo = dataConsistencyValidator.getDebugInfo()
      const logStats = enhancedLogger.getStats()
      
      console.log('👤 User State:', userInfo)
      console.log('🔍 Consistency:', consistencyInfo)
      console.log('📝 Logs:', logStats)
      
    } catch (error) {
      console.error('❌ Erro ao obter informações:', error)
    }
    
    console.groupEnd()
  }

  /**
   * Mostra status atual do sistema
   */
  async status(): Promise<void> {
    console.group('📊 System Status')
    
    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      const user = userStateManager.getCurrentUser()
      const isLoading = userStateManager.isLoading()
      const cacheValid = userStateManager.isCacheValid()
      
      console.log('🟢 User Logged In:', !!user)
      console.log('🔄 Loading:', isLoading)
      console.log('💾 Cache Valid:', cacheValid)
      
      if (user) {
        console.log('👤 Current User:', {
          uid: user.uid,
          nome: user.nome,
          perfis: user.perfis
        })
      }
      
      // Verificar consistência
      const report = await dataConsistencyValidator.validateConsistency()
      console.log('✅ Data Consistent:', report.isConsistent)
      
      if (!report.isConsistent) {
        console.log('⚠️ Discrepancies:', report.discrepancies.length)
        console.log('💡 Recommendation:', report.recommendation)
      }
      
    } catch (error) {
      console.error('❌ Erro ao obter status:', error)
    }
    
    console.groupEnd()
  }

  /**
   * Executa verificação de consistência
   */
  async checkConsistency(): Promise<void> {
    console.group('🔍 Consistency Check')
    
    try {
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      console.log('🔄 Checking consistency...')
      const report = await dataConsistencyValidator.validateConsistency()
      
      console.log('📊 Consistency Report:')
      console.log('  ✅ Is Consistent:', report.isConsistent)
      console.log('  📋 Discrepancies:', report.discrepancies.length)
      console.log('  💡 Recommendation:', report.recommendation)
      console.log('  🕐 Timestamp:', new Date(report.timestamp).toLocaleString())
      
      if (report.discrepancies.length > 0) {
        console.group('⚠️ Discrepancies Details')
        report.discrepancies.forEach((discrepancy, index) => {
          console.log(`${index + 1}. ${discrepancy.description}`)
          console.log(`   Field: ${discrepancy.field}`)
          console.log(`   Severity: ${discrepancy.severity}`)
          console.log(`   Sidebar: ${JSON.stringify(discrepancy.sidebarValue)}`)
          console.log(`   Main: ${JSON.stringify(discrepancy.mainValue)}`)
        })
        console.groupEnd()
      }
      
    } catch (error) {
      console.error('❌ Erro na verificação de consistência:', error)
    }
    
    console.groupEnd()
  }

  /**
   * Força sincronização
   */
  async forceSync(): Promise<void> {
    console.group('🔄 Force Sync')
    
    try {
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      
      console.log('🔄 Forcing synchronization...')
      const user = await userStateManager.forceRefresh()
      
      if (user) {
        console.log('✅ Sync successful')
        console.log('👤 Updated user:', {
          uid: user.uid,
          nome: user.nome,
          perfis: user.perfis
        })
      } else {
        console.warn('⚠️ Sync completed but no user data')
      }
      
    } catch (error) {
      console.error('❌ Erro na sincronização forçada:', error)
    }
    
    console.groupEnd()
  }

  /**
   * Executa auto-correção
   */
  async autoFix(): Promise<void> {
    console.group('🔧 Auto Fix')
    
    try {
      const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
      
      console.log('🔧 Running auto-correction...')
      const success = await dataConsistencyValidator.autoCorrect()
      
      if (success) {
        console.log('✅ Auto-correction successful')
      } else {
        console.warn('⚠️ Auto-correction failed or not needed')
      }
      
      // Verificar resultado
      const report = await dataConsistencyValidator.validateConsistency()
      console.log('📊 Post-correction status:', {
        isConsistent: report.isConsistent,
        discrepancies: report.discrepancies.length
      })
      
    } catch (error) {
      console.error('❌ Erro na auto-correção:', error)
    }
    
    console.groupEnd()
  }

  /**
   * Mostra logs filtrados
   */
  logs(level?: string, component?: string): void {
    console.group('📝 Logs')
    
    const logs = enhancedLogger.getLogs(level as any, component)
    
    console.log(`📊 Found ${logs.length} logs`)
    if (level) console.log(`🔍 Filtered by level: ${level}`)
    if (component) console.log(`🔍 Filtered by component: ${component}`)
    
    logs.slice(-20).forEach(log => {
      const time = new Date(log.timestamp).toLocaleTimeString()
      const prefix = this.getLogPrefix(log.level)
      console.log(`${prefix} [${time}] [${log.component}]: ${log.message}`, log.data)
    })
    
    console.groupEnd()
  }

  /**
   * Mostra logs de auditoria
   */
  auditLogs(): void {
    console.group('📋 Audit Logs')
    
    const auditLogs = enhancedLogger.getAuditLogs()
    
    console.log(`📊 Found ${auditLogs.length} audit logs`)
    
    auditLogs.slice(-10).forEach(log => {
      const time = new Date(log.timestamp).toLocaleTimeString()
      console.log(`📋 [${time}] ${log.action}:`, log)
    })
    
    console.groupEnd()
  }

  /**
   * Mostra logs de consistência
   */
  consistencyLogs(): void {
    console.group('🔍 Consistency Logs')
    
    const consistencyLogs = enhancedLogger.getConsistencyLogs()
    
    console.log(`📊 Found ${consistencyLogs.length} consistency logs`)
    
    consistencyLogs.slice(-10).forEach(log => {
      const time = new Date(log.timestamp).toLocaleTimeString()
      console.log(`🔍 [${time}] ${log.event}:`, log)
    })
    
    console.groupEnd()
  }

  /**
   * Limpa todos os logs
   */
  clearLogs(): void {
    enhancedLogger.clearLogs()
    console.log('🧹 All logs cleared')
  }

  /**
   * Exporta logs
   */
  exportLogs(): void {
    const exportData = enhancedLogger.exportLogs()
    
    if (typeof window !== 'undefined') {
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('📥 Logs exported to file')
    } else {
      console.log('📄 Export data:', exportData)
    }
  }

  /**
   * Mostra dashboard visual
   */
  showDashboard(): void {
    if (typeof window !== 'undefined') {
      import("@/lib/debug-dashboard").then(({ default: debugDashboard }) => {
        debugDashboard.show()
        console.log('📊 Debug dashboard shown')
      })
    } else {
      console.warn('⚠️ Dashboard not available in server environment')
    }
  }

  /**
   * Esconde dashboard visual
   */
  hideDashboard(): void {
    if (typeof window !== 'undefined') {
      import("@/lib/debug-dashboard").then(({ default: debugDashboard }) => {
        debugDashboard.hide()
        console.log('📊 Debug dashboard hidden')
      })
    }
  }

  /**
   * Mostra métricas
   */
  metrics(): void {
    console.group('📊 Metrics')
    
    const stats = enhancedLogger.getStats()
    
    console.log('📈 Log Statistics:')
    console.log('  Total Logs:', stats.total)
    console.log('  By Level:', stats.byLevel)
    console.log('  By Component:', stats.byComponent)
    console.log('  Session ID:', stats.sessionId)
    console.log('  Oldest Log:', stats.oldestLog)
    console.log('  Newest Log:', stats.newestLog)
    
    console.groupEnd()
  }

  /**
   * Mostra métricas de performance
   */
  performance(): void {
    console.group('⚡ Performance Metrics')
    
    const logs = enhancedLogger.getLogs().filter(log => 
      log.message.includes('PERFORMANCE:')
    )
    
    console.log(`📊 Found ${logs.length} performance logs`)
    
    logs.slice(-10).forEach(log => {
      const time = new Date(log.timestamp).toLocaleTimeString()
      console.log(`⚡ [${time}] ${log.message}`, log.data)
    })
    
    console.groupEnd()
  }

  /**
   * Define nível global de logging
   */
  setLogLevel(level: LogLevel): void {
    logManager.setGlobalLevel(level)
    console.log(`📝 Nível global de logging definido para: ${level}`)
  }

  /**
   * Define nível de logging para componente específico
   */
  setComponentLevel(component: string, level: LogLevel): void {
    logManager.setComponentLevel(component, level)
    console.log(`📝 Nível do componente ${component} definido para: ${level}`)
  }

  /**
   * Mostra configuração atual de logging
   */
  showLogConfig(): void {
    console.group('⚙️ Log Configuration')
    
    const config = logManager.getConfig()
    const registry = logManager.getComponentRegistry()
    
    console.log('🌍 Environment:', config.environment)
    console.log('📊 Global Level:', config.globalLevel)
    console.log('🔇 Quiet Mode:', config.quietMode)
    console.log('🐛 Debug Mode:', config.debugMode)
    console.log('💾 Persist Settings:', config.persistSettings)
    console.log('')
    
    console.log('📦 Component Levels:')
    Object.entries(registry).forEach(([name, info]) => {
      const effectiveLevel = logManager.getEffectiveLevel(name)
      console.log(`  ${name}: ${effectiveLevel} (default: ${info.defaultLevel})`)
    })
    
    console.groupEnd()
  }

  /**
   * Ativa modo silencioso
   */
  enableQuietMode(): void {
    logManager.enableQuietMode()
    console.log('🔇 Modo silencioso ativado - apenas erros críticos serão exibidos')
  }

  /**
   * Ativa modo debug
   */
  enableDebugMode(): void {
    logManager.enableDebugMode()
    console.log('🐛 Modo debug ativado - todos os logs serão exibidos')
  }

  /**
   * Ativa modo normal
   */
  enableNormalMode(): void {
    logManager.enableNormalMode()
    console.log('📝 Modo normal ativado - logs baseados na configuração padrão')
  }

  /**
   * Mostra ajuda
   */
  help(): void {
    console.group('🛠️ Available Commands')
    
    console.log('📋 General Information:')
    console.log('  debug.info()           - Show system information')
    console.log('  debug.status()         - Show current status')
    console.log('  debug.help()           - Show this help')
    console.log('')
    
    console.log('🔍 Consistency:')
    console.log('  debug.checkConsistency() - Check data consistency')
    console.log('  debug.forceSync()         - Force synchronization')
    console.log('  debug.autoFix()           - Run auto-correction')
    console.log('')
    
    console.log('📝 Logs:')
    console.log('  debug.logs()              - Show all logs')
    console.log('  debug.logs("error")       - Show error logs only')
    console.log('  debug.logs(null, "UserStateManager") - Show logs from component')
    console.log('  debug.auditLogs()         - Show audit logs')
    console.log('  debug.consistencyLogs()   - Show consistency logs')
    console.log('  debug.clearLogs()         - Clear all logs')
    console.log('  debug.exportLogs()        - Export logs to file')
    console.log('')
    
    console.log('⚙️ Log Control:')
    console.log('  debug.setLogLevel(level)     - Set global log level')
    console.log('  debug.setComponentLevel(component, level) - Set component level')
    console.log('  debug.showLogConfig()        - Show current log configuration')
    console.log('  debug.enableQuietMode()      - Enable quiet mode (errors only)')
    console.log('  debug.enableDebugMode()      - Enable debug mode (all logs)')
    console.log('  debug.enableNormalMode()     - Enable normal mode')
    console.log('')
    
    console.log('📊 Dashboard & Metrics:')
    console.log('  debug.showDashboard()     - Show visual dashboard')
    console.log('  debug.hideDashboard()     - Hide visual dashboard')
    console.log('  debug.metrics()           - Show log metrics')
    console.log('  debug.performance()       - Show performance metrics')
    console.log('')
    
    console.log('🔧 Utilities:')
    console.log('  debug.reset()             - Reset all data')
    console.log('')
    
    console.log('📊 Available Log Levels:')
    console.log('  SILENT  - No logs')
    console.log('  ERROR   - Only errors')
    console.log('  WARN    - Warnings and errors')
    console.log('  INFO    - Info, warnings and errors')
    console.log('  DEBUG   - Debug and above')
    console.log('  VERBOSE - All logs including trace')
    console.log('')
    
    console.log('💡 Tips:')
    console.log('  - Use Ctrl+Shift+D to toggle dashboard')
    console.log('  - All commands return promises where applicable')
    console.log('  - Logs are automatically persisted in localStorage')
    console.log('  - Use debug.showLogConfig() to see current settings')
    
    console.groupEnd()
  }

  /**
   * Reset completo do sistema
   */
  async reset(): Promise<void> {
    console.group('🔄 System Reset')
    
    try {
      console.log('🧹 Clearing all logs...')
      enhancedLogger.clearLogs()
      
      console.log('🔄 Resetting user state...')
      const { default: userStateManager } = await import("@/lib/user-state-manager")
      userStateManager.clearAll()
      
      console.log('⏳ Waiting for reset to complete...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('🚀 Reinitializing...')
      await userStateManager.initialize()
      
      console.log('✅ System reset complete')
      
    } catch (error) {
      console.error('❌ Erro no reset do sistema:', error)
    }
    
    console.groupEnd()
  }

  /**
   * Obtém prefixo para nível de log
   */
  private getLogPrefix(level: string): string {
    const prefixes = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨'
    }
    return prefixes[level as keyof typeof prefixes] || 'ℹ️'
  }
}

// Instância singleton
const consoleCommands = new ConsoleCommandsImpl()

import { EnvironmentUtils } from '@/lib/utils/environment'
import { createLogger } from '@/lib/logger-factory'

const logger = createLogger('ConsoleCommands', 'ERROR', 'Comandos de console')

// Adicionar ao window para acesso global (apenas desenvolvimento)
EnvironmentUtils.onlyInDevelopment(() => {
  EnvironmentUtils.onlyInClient(() => {
    (window as any).debug = consoleCommands
    
    // Mostrar ajuda automaticamente apenas se debug estiver habilitado
    setTimeout(() => {
      if (logger.isEnabled('DEBUG')) {
        logger.debug('Debug commands loaded! Type debug.help() for available commands')
      }
    }, 2000)
  })
})

export default consoleCommands