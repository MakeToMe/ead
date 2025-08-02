/**
 * Enhanced Logger - Sistema de logs melhorado para debug
 * 
 * Fornece logs estruturados, timestamps detalhados e diferentes níveis de log
 * para facilitar o debug de problemas de consistência de dados.
 */

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

class EnhancedLogger {
  private logs: LogEntry[] = []
  private readonly MAX_LOGS = 1000
  private sessionId: string
  private isEnabled: boolean = true

  constructor() {
    this.sessionId = this.generateSessionId()
    
    // Só fazer log no cliente para evitar problemas de hidratação
    if (typeof window !== 'undefined') {
      console.log(`📝 EnhancedLogger: Inicializado com sessão ${this.sessionId}`)
    }
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(component: string, message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', component, message, data)
    }
  }

  /**
   * Log de informação
   */
  info(component: string, message: string, data?: any): void {
    this.log('info', component, message, data)
  }

  /**
   * Log de warning
   */
  warn(component: string, message: string, data?: any): void {
    this.log('warn', component, message, data)
  }

  /**
   * Log de erro
   */
  error(component: string, message: string, data?: any, error?: Error): void {
    const logData = {
      ...data,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    }
    
    this.log('error', component, message, logData, error?.stack)
  }

  /**
   * Log crítico (sempre visível)
   */
  critical(component: string, message: string, data?: any, error?: Error): void {
    const logData = {
      ...data,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : undefined
    }
    
    this.log('critical', component, message, logData, error?.stack)
    
    // Logs críticos sempre aparecem no console
    console.error(`🚨 CRITICAL [${component}]: ${message}`, logData)
  }

  /**
   * Log de auditoria para mudanças de dados
   */
  audit(component: string, action: string, data: any): void {
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
   * Log de performance
   */
  performance(component: string, operation: string, duration: number, data?: any): void {
    const perfData = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...data
    }
    
    const level: LogLevel = duration > 5000 ? 'warn' : duration > 2000 ? 'info' : 'debug'
    this.log(level, component, `PERFORMANCE: ${operation} took ${duration}ms`, perfData)
  }

  /**
   * Log de consistência específico
   */
  consistency(component: string, event: string, data: any): void {
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

    // Exibir no console baseado no nível
    this.displayLog(entry)

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
    console.log(`📝 EnhancedLogger: Logging ${enabled ? 'habilitado' : 'desabilitado'}`)
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
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).enhancedLogger = enhancedLogger
  
  // Comandos de debug
  ;(window as any).debugLogs = {
    getLogs: (level?: LogLevel, component?: string) => enhancedLogger.getLogs(level, component),
    getAuditLogs: () => enhancedLogger.getAuditLogs(),
    getConsistencyLogs: () => enhancedLogger.getConsistencyLogs(),
    clearLogs: () => enhancedLogger.clearLogs(),
    exportLogs: () => enhancedLogger.exportLogs(),
    getStats: () => enhancedLogger.getStats(),
    setEnabled: (enabled: boolean) => enhancedLogger.setEnabled(enabled)
  }
}

export default enhancedLogger