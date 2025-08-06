/**
 * Logger Factory - Cria loggers específicos por componente
 * 
 * Fornece uma interface simplificada para criar loggers que respeitam
 * automaticamente as configurações do LogManager por componente.
 */

import { logManager } from '@/lib/log-manager'
import enhancedLogger from '@/lib/enhanced-logger'
import type { LogLevel, ComponentLogger, LoggerFactory as ILoggerFactory } from '@/lib/types/logging'

class ComponentLoggerImpl implements ComponentLogger {
  constructor(private componentName: string) {}

  debug(message: string, data?: any): void {
    enhancedLogger.debug(this.componentName, message, data)
  }

  info(message: string, data?: any): void {
    enhancedLogger.info(this.componentName, message, data)
  }

  warn(message: string, data?: any): void {
    enhancedLogger.warn(this.componentName, message, data)
  }

  error(message: string, data?: any, error?: Error): void {
    enhancedLogger.error(this.componentName, message, data, error)
  }

  critical(message: string, data?: any, error?: Error): void {
    enhancedLogger.critical(this.componentName, message, data, error)
  }

  /**
   * Métodos específicos do componente
   */
  audit(action: string, data: any): void {
    enhancedLogger.audit(this.componentName, action, data)
  }

  performance(operation: string, duration: number, data?: any): void {
    enhancedLogger.performance(this.componentName, operation, duration, data)
  }

  consistency(event: string, data: any): void {
    enhancedLogger.consistency(this.componentName, event, data)
  }

  /**
   * Verifica se um nível está habilitado para este componente
   */
  isEnabled(level: LogLevel): boolean {
    return logManager.isEnabled(this.componentName, level)
  }

  /**
   * Define nível específico para este componente
   */
  setLevel(level: LogLevel): void {
    logManager.setComponentLevel(this.componentName, level)
  }

  /**
   * Obtém nível efetivo para este componente
   */
  getLevel(): LogLevel {
    return logManager.getEffectiveLevel(this.componentName)
  }
}

class LoggerFactory implements ILoggerFactory {
  private loggers = new Map<string, ComponentLogger>()

  /**
   * Cria um novo logger para o componente
   */
  createLogger(componentName: string): ComponentLogger {
    const logger = new ComponentLoggerImpl(componentName)
    this.loggers.set(componentName, logger)
    return logger
  }

  /**
   * Obtém logger existente ou cria um novo
   */
  getLogger(componentName: string): ComponentLogger {
    let logger = this.loggers.get(componentName)
    
    if (!logger) {
      logger = this.createLogger(componentName)
    }
    
    return logger
  }

  /**
   * Registra componente no LogManager
   */
  registerComponent(name: string, defaultLevel: LogLevel, description: string): void {
    logManager.registerComponent(name, defaultLevel, description)
  }

  /**
   * Obtém todos os loggers criados
   */
  getAllLoggers(): Map<string, ComponentLogger> {
    return new Map(this.loggers)
  }

  /**
   * Remove logger do cache
   */
  removeLogger(componentName: string): boolean {
    return this.loggers.delete(componentName)
  }

  /**
   * Limpa todos os loggers
   */
  clearLoggers(): void {
    this.loggers.clear()
  }

  /**
   * Obtém estatísticas dos loggers
   */
  getStats(): {
    totalLoggers: number
    loggerNames: string[]
    registeredComponents: number
  } {
    const componentRegistry = logManager.getComponentRegistry()
    
    return {
      totalLoggers: this.loggers.size,
      loggerNames: Array.from(this.loggers.keys()),
      registeredComponents: Object.keys(componentRegistry).length
    }
  }
}

// Instância singleton
export const loggerFactory = new LoggerFactory()

// Exportar logManager para uso direto
export { logManager } from '@/lib/log-manager'

/**
 * Função utilitária para criar logger rapidamente
 */
export function createLogger(componentName: string, defaultLevel?: LogLevel, description?: string): ComponentLogger {
  // Registrar componente se informações foram fornecidas
  if (defaultLevel && description) {
    loggerFactory.registerComponent(componentName, defaultLevel, description)
  }
  
  return loggerFactory.getLogger(componentName)
}

/**
 * Decorator para classes que precisam de logging
 */
export function WithLogger(componentName: string, defaultLevel: LogLevel = 'INFO', description?: string) {
  return function<T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      protected logger: ComponentLogger

      constructor(...args: any[]) {
        super(...args)
        
        // Registrar componente
        if (description) {
          loggerFactory.registerComponent(componentName, defaultLevel, description)
        }
        
        // Criar logger
        this.logger = loggerFactory.getLogger(componentName)
      }
    }
  }
}

export default loggerFactory