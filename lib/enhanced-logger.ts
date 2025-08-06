/**
 * Enhanced Logger - Sistema de logs melhorado para debug
 * 
 * Fornece logs estruturados, timestamps detalhados e diferentes níveis de log
 * para facilitar o debug de problemas de consistência de dados.
 * 
 * Integrado com LogManager para controle granular de níveis por componente.
 */

// LogManager import removido para evitar dependências circulares
import type { LogLevel as NewLogLevel, LogEntry as NewLogEntry } from '@/lib/types/logging'
import { EnvironmentUtils } from '@/lib/utils/environment'

// Manter compatibilidade com tipos antigos
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
  userId?: string
  sessionId?: string
  stackTrace?: string
}

// Mapeamento entre níveis antigos e novos
const LEVEL_MAPPING: Record<LogLevel, NewLogLevel> = {
  'debug': 'DEBUG',
  'info': 'INFO',
  'warn': 'WARN',
  'error': 'ERROR',
  'critical': 'ERROR'
}

class EnhancedLogger {
  private logs: LogEntry[] = []
  private readonly MAX_LOGS = 1000
  private sessionId: string
  private isEnabled: boolean = true
  private readonly COMPONENT_NAME = 'EnhancedLogger'

  constructor() {
    this.sessionId = this.generateSessionId()
    
    // LogManager registration removido temporariamente para evitar dependência circular
    
    // Log de inicialização apenas se permitido
    EnvironmentUtils.onlyInClient(() => {
      if (this.shouldLog('info')) {
        console.log(`📝 EnhancedLogger: Inicializado com sessão ${this.sessionId}`)
      }
    })
  }

  /**
   * Log de debug (controlado pelo LogManager)
   */
  debug(component: string, message: string, data?: any): void {
    if (this.shouldLog('debug', component)) {
      this.log('debug', component, message, data)
    }
  }

  /**
   * Log de informação (controlado pelo LogManager)
   */
  info(component: string, message: string, data?: any): void {
    if (this.shouldLog('info', component)) {
      this.log('info', component, message, data)
    }
  }

  /**
   * Log de warning (controlado pelo LogManager)
   */
  warn(component: string, message: string, data?: any): void {
    if (this.shouldLog('warn', component)) {
      this.log('warn', component, message, data)
    }
  }

  /**
   * Log de erro (controlado pelo LogManager)
   */
  error(component: string, message: string, data?: any, error?: Error): void {
    if (this.shouldLog('error', component)) {
      const logData = {
        ...data,
        error: error ? {
          message: error.message,
          stack: error.stack
        } : undefined
      }
      
      this.log('error', component, message, logData, error?.stack)
    }
  }

  /**
   * Log crítico (sempre visível, mas respeitando modo silencioso)
   */
  critical(component: string, message: string, data?: any, error?: Error): void {
    const logData = {
      ...data,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    }
    
    // Sempre salvar logs críticos
    this.log('critical', component, message, logData, error?.stack)
    
    // Exibir no console apenas se não estiver em modo silencioso
    if (this.shouldLog('critical', component)) {
      console.error(`🚨 CRITICAL [${component}]: ${message}`, logData)
    }
  }

  /**
   * Log de auditoria para mudanças de dados (apenas em desenvolvimento se habilitado)
   */
  audit(component: string, action: string, data: any): void {
    // Só fazer log de auditoria se explicitamente habilitado ou em caso de erro
    if (!this.shouldLog('debug', component)) {
      // Salvar apenas no localStorage, sem exibir no console
      const auditData = {
        action,
        timestamp: new Date().toISOString(),
        ...data
      }
      this.saveAuditLog(auditData)
      return
    }

    const auditMessage = `AUDIT: ${action}`
    const auditData = {
      action,
      timestamp: new Date().toISOString(),
      ...data
    }
    
    this.log('info', component, auditMessage, auditData)
    
    // Salvar logs de auditoria separadamente
    this.saveAuditLog(auditData)
  }

  /**
   * Log de performance (controlado pelo LogManager)
   */
  performance(component: string, operation: string, duration: number, data?: any): void {
    const perfData = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...data
    }
    
    const level: LogLevel = duration > 5000 ? 'warn' : duration > 2000 ? 'info' : 'debug'
    
    if (this.shouldLog(level, component)) {
      this.log(level, component, `PERFORMANCE: ${operation} took ${duration}ms`, perfData)
    }
  }

  /**
   * Log de consistência específico (controlado pelo LogManager)
   */
  consistency(component: string, event: string, data: any): void {
    if (this.shouldLog('info', component)) {
      const consistencyData = {
        event,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        ...data
      }
      
      this.log('info', component, `CONSISTENCY: ${event}`, consistencyData)
      
      // Salvar logs de consistência separadamente
      this.saveConsistencyLog(consistencyData)
    }
  }

  /**
   * Verifica se deve fazer log baseado na configuração
   */
  private shouldLog(level: LogLevel, component?: string): boolean {
    if (!this.isEnabled) return false
    
    // Verificar configuração do localStorage primeiro (fallback simples)
    if (typeof window !== 'undefined') {
      const quietMode = localStorage.getItem('quiet_mode') === 'true'
      const configLevel = localStorage.getItem('log_level') || 'WARN'
      
      if (quietMode && level !== 'error' && level !== 'critical') {
        return false
      }
      
      // Hierarquia de níveis: DEBUG > INFO > WARN > ERROR > CRITICAL
      const levelHierarchy = {
        'debug': 0,
        'info': 1, 
        'warn': 2,
        'error': 3,
        'critical': 4
      }
      
      const configHierarchy = {
        'DEBUG': 0,
        'INFO': 1,
        'WARN': 2, 
        'ERROR': 3
      }
      
      const currentLevelValue = levelHierarchy[level] ?? 2
      const configLevelValue = configHierarchy[configLevel as keyof typeof configHierarchy] ?? 2
      
      return currentLevelValue >= configLevelValue
    }
    
    // Implementação simplificada sem LogManager
    // Em desenvolvimento: permitir warn, error, critical
    // Em produção: apenas error e critical
    if (process.env.NODE_ENV === 'production') {
      return level === 'error' || level === 'critical'
    } else {
      return level === 'warn' || level === 'error' || level === 'critical'
    }
  }

  /**
   * Método principal de log
   */
  private log(level: LogLevel, component: string, message: string, data?: any, stackTrace?: string): void {
    if (!this.isEnabled) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      stackTrace
    }

    // Adicionar ao array de logs
    this.logs.push(entry)

    // Manter apenas os últimos MAX_LOGS
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS)
    }

    // Exibir no console apenas se permitido pelo LogManager
    if (this.shouldLog(level, component)) {
      this.displayLog(entry)
    }

    // Salvar no localStorage para persistência
    this.persistLogs()
  }

  /**
   * Exibe log no console com formatação apropriada
   */
  private displayLog(entry: LogEntry): void {
    const prefix = this.getLogPrefix(entry.level)
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const logMessage = `${prefix} [${timestamp}] [${entry.component}]: ${entry.message}`

    switch (entry.level) {
      case 'debug':
        console.debug(logMessage, entry.data)
        break
      case 'info':
        console.log(logMessage, entry.data)
        break
      case 'warn':
        console.warn(logMessage, entry.data)
        break
      case 'error':
        console.error(logMessage, entry.data)
        break
      case 'critical':
        console.error(logMessage, entry.data)
        if (entry.stackTrace) {
          console.error('Stack trace:', entry.stackTrace)
        }
        break
    }
  }

  /**
   * Obtém prefixo visual para o nível de log
   */
  private getLogPrefix(level: LogLevel): string {
    const prefixes = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨'
    }
    return prefixes[level]
  }

  /**
   * Obtém ID do usuário atual
   */
  private getCurrentUserId(): string | undefined {
    try {
      // Tentar obter do UserStateManager se disponível
      if (typeof window !== 'undefined' && (window as any).userStateManager) {
        const user = (window as any).userStateManager.getCurrentUser()
        return user?.uid
      }
    } catch (error) {
      // Ignorar erros ao obter userId
    }
    return undefined
  }

  /**
   * Gera ID único da sessão
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Persiste logs no localStorage
   */
  private persistLogs(): void {
    if (typeof window === 'undefined') return

    try {
      const recentLogs = this.logs.slice(-100) // Manter apenas os últimos 100
      localStorage.setItem('enhanced_logs', JSON.stringify(recentLogs))
    } catch (error) {
      console.warn('⚠️ EnhancedLogger: Erro ao persistir logs', error)
    }
  }

  /**
   * Salva log de auditoria separadamente
   */
  private saveAuditLog(data: any): void {
    if (typeof window === 'undefined') return

    try {
      const auditLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]')
      auditLogs.push(data)
      
      // Manter apenas os últimos 50 logs de auditoria
      if (auditLogs.length > 50) {
        auditLogs.splice(0, auditLogs.length - 50)
      }
      
      localStorage.setItem('audit_logs', JSON.stringify(auditLogs))
    } catch (error) {
      console.warn('⚠️ EnhancedLogger: Erro ao salvar log de auditoria', error)
    }
  }

  /**
   * Salva log de consistência separadamente
   */
  private saveConsistencyLog(data: any): void {
    if (typeof window === 'undefined') return

    try {
      const consistencyLogs = JSON.parse(localStorage.getItem('consistency_logs') || '[]')
      consistencyLogs.push(data)
      
      // Manter apenas os últimos 100 logs de consistência
      if (consistencyLogs.length > 100) {
        consistencyLogs.splice(0, consistencyLogs.length - 100)
      }
      
      localStorage.setItem('consistency_logs', JSON.stringify(consistencyLogs))
    } catch (error) {
      console.warn('⚠️ EnhancedLogger: Erro ao salvar log de consistência', error)
    }
  }

  /**
   * Obtém todos os logs
   */
  getLogs(level?: LogLevel, component?: string): LogEntry[] {
    let filteredLogs = [...this.logs]

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    if (component) {
      filteredLogs = filteredLogs.filter(log => log.component === component)
    }

    return filteredLogs
  }

  /**
   * Obtém logs de auditoria
   */
  getAuditLogs(): any[] {
    if (typeof window === 'undefined') return []
    
    try {
      return JSON.parse(localStorage.getItem('audit_logs') || '[]')
    } catch (error) {
      console.warn('⚠️ EnhancedLogger: Erro ao obter logs de auditoria', error)
      return []
    }
  }

  /**
   * Obtém logs de consistência
   */
  getConsistencyLogs(): any[] {
    if (typeof window === 'undefined') return []
    
    try {
      return JSON.parse(localStorage.getItem('consistency_logs') || '[]')
    } catch (error) {
      console.warn('⚠️ EnhancedLogger: Erro ao obter logs de consistência', error)
      return []
    }
  }

  /**
   * Limpa todos os logs
   */
  clearLogs(): void {
    this.logs = []
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('enhanced_logs')
      localStorage.removeItem('audit_logs')
      localStorage.removeItem('consistency_logs')
    }
    
    console.log('🧹 EnhancedLogger: Todos os logs foram limpos')
  }

  /**
   * Exporta logs para download
   */
  exportLogs(): string {
    const exportData = {
      sessionId: this.sessionId,
      exportTimestamp: new Date().toISOString(),
      logs: this.logs,
      auditLogs: this.getAuditLogs(),
      consistencyLogs: this.getConsistencyLogs()
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Habilita/desabilita logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    
    if (this.shouldLog('info')) {
      console.log(`📝 EnhancedLogger: Logging ${enabled ? 'habilitado' : 'desabilitado'}`)
    }
  }

  /**
   * Define nível global de logging
   */
  setGlobalLevel(level: NewLogLevel): void {
    // logManager.setGlobalLevel(level) // Temporariamente comentado
    
    if (this.shouldLog('info')) {
      console.log(`📝 EnhancedLogger: Nível global definido para ${level}`)
    }
  }

  /**
   * Define nível de logging para componente específico
   */
  setComponentLevel(component: string, level: NewLogLevel): void {
    // logManager.setComponentLevel(component, level) // Temporariamente comentado
    
    if (this.shouldLog('info')) {
      console.log(`📝 EnhancedLogger: Nível do componente ${component} definido para ${level}`)
    }
  }

  /**
   * Ativa modo silencioso
   */
  enableQuietMode(): void {
    // logManager.enableQuietMode() // Temporariamente comentado
    
    if (this.shouldLog('info')) {
      console.log('🔇 EnhancedLogger: Modo silencioso ativado')
    }
  }

  /**
   * Ativa modo debug
   */
  enableDebugMode(): void {
    // logManager.enableDebugMode() // Temporariamente comentado
    console.log('🐛 EnhancedLogger: Modo debug ativado')
  }

  /**
   * Obtém configuração atual do LogManager
   */
  getLogConfig(): any {
    return { simplified: true } // logManager.getConfig() // Temporariamente comentado
  }

  /**
   * Obtém informações de debug do LogManager
   */
  getLogManagerDebugInfo(): any {
    return { simplified: true } // logManager.getDebugInfo() // Temporariamente comentado
  }

  /**
   * Obtém estatísticas dos logs
   */
  getStats(): any {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<LogLevel, number>,
      byComponent: {} as Record<string, number>,
      sessionId: this.sessionId,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp
    }

    // Contar por nível
    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1
      stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1
    })

    return stats
  }
}

// Instância singleton
const enhancedLogger = new EnhancedLogger()

// Adicionar ao window para debug (apenas em desenvolvimento)
EnvironmentUtils.onlyInDevelopment(() => {
  if (typeof window !== 'undefined') {
    (window as any).enhancedLogger = enhancedLogger
    
    // Comandos de debug expandidos
    ;(window as any).debugLogs = {
      // Comandos existentes
      getLogs: (level?: LogLevel, component?: string) => enhancedLogger.getLogs(level, component),
      getAuditLogs: () => enhancedLogger.getAuditLogs(),
      getConsistencyLogs: () => enhancedLogger.getConsistencyLogs(),
      clearLogs: () => enhancedLogger.clearLogs(),
      exportLogs: () => enhancedLogger.exportLogs(),
      getStats: () => enhancedLogger.getStats(),
      setEnabled: (enabled: boolean) => enhancedLogger.setEnabled(enabled),
      
      // Novos comandos de controle de nível
      setGlobalLevel: (level: NewLogLevel) => enhancedLogger.setGlobalLevel(level),
      setComponentLevel: (component: string, level: NewLogLevel) => enhancedLogger.setComponentLevel(component, level),
      enableQuietMode: () => enhancedLogger.enableQuietMode(),
      enableDebugMode: () => enhancedLogger.enableDebugMode(),
      getLogConfig: () => enhancedLogger.getLogConfig(),
      getLogManagerInfo: () => enhancedLogger.getLogManagerDebugInfo(),
      
      // Comandos de ajuda
      help: () => {
        console.group('📝 Enhanced Logger Commands')
        console.log('=== Log Retrieval ===')
        console.log('debugLogs.getLogs(level?, component?) - Get filtered logs')
        console.log('debugLogs.getAuditLogs() - Get audit logs')
        console.log('debugLogs.getConsistencyLogs() - Get consistency logs')
        console.log('debugLogs.getStats() - Get log statistics')
        console.log('')
        console.log('=== Log Control ===')
        console.log('debugLogs.setGlobalLevel(level) - Set global log level')
        console.log('debugLogs.setComponentLevel(component, level) - Set component log level')
        console.log('debugLogs.enableQuietMode() - Enable quiet mode')
        console.log('debugLogs.enableDebugMode() - Enable debug mode')
        console.log('debugLogs.setEnabled(boolean) - Enable/disable logging')
        console.log('')
        console.log('=== Configuration ===')
        console.log('debugLogs.getLogConfig() - Get current log configuration')
        console.log('debugLogs.getLogManagerInfo() - Get LogManager debug info')
        console.log('')
        console.log('=== Utilities ===')
        console.log('debugLogs.clearLogs() - Clear all logs')
        console.log('debugLogs.exportLogs() - Export logs to file')
        console.log('')
        console.log('Available levels: SILENT, ERROR, WARN, INFO, DEBUG, VERBOSE')
        console.groupEnd()
      }
    }
  }
})

export default enhancedLogger