/**
 * Utilitários para detecção e configuração de ambiente
 */

import type { LogLevel, LogConfig } from '@/lib/types/logging'

export class EnvironmentDetector {
  /**
   * Detecta o ambiente atual baseado em múltiplas fontes
   */
  static detectEnvironment(): 'development' | 'production' {
    // 1. Verificar NODE_ENV
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
      return process.env.NODE_ENV === 'production' ? 'production' : 'development'
    }
    
    // 2. Verificar se está no browser e analisar URL
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      
      // Desenvolvimento local
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' || 
          hostname.includes('dev') ||
          hostname.includes('staging') ||
          hostname.includes('test')) {
        return 'development'
      }
      
      // Verificar porta de desenvolvimento
      const port = window.location.port
      if (port && ['3000', '3001', '8080', '8000', '5173', '4200'].includes(port)) {
        return 'development'
      }
    }
    
    // 3. Verificar outras variáveis de ambiente
    if (typeof process !== 'undefined') {
      if (process.env?.VERCEL_ENV === 'development' ||
          process.env?.NODE_ENV === 'dev' ||
          process.env?.ENVIRONMENT === 'development') {
        return 'development'
      }
    }
    
    // Default para produção por segurança
    return 'production'
  }

  /**
   * Verifica se está em desenvolvimento
   */
  static isDevelopment(): boolean {
    return this.detectEnvironment() === 'development'
  }

  /**
   * Verifica se está em produção
   */
  static isProduction(): boolean {
    return this.detectEnvironment() === 'production'
  }

  /**
   * Verifica se está rodando no servidor (SSR)
   */
  static isServer(): boolean {
    return typeof window === 'undefined'
  }

  /**
   * Verifica se está rodando no cliente
   */
  static isClient(): boolean {
    return typeof window !== 'undefined'
  }

  /**
   * Obtém informações detalhadas do ambiente
   */
  static getEnvironmentInfo(): {
    environment: 'development' | 'production'
    isServer: boolean
    isClient: boolean
    hostname?: string
    port?: string
    userAgent?: string
    nodeEnv?: string
  } {
    const environment = this.detectEnvironment()
    const isServer = this.isServer()
    const isClient = this.isClient()
    
    let hostname: string | undefined
    let port: string | undefined
    let userAgent: string | undefined
    
    if (isClient) {
      hostname = window.location.hostname
      port = window.location.port
      userAgent = navigator.userAgent
    }
    
    const nodeEnv = typeof process !== 'undefined' ? process.env?.NODE_ENV : undefined
    
    return {
      environment,
      isServer,
      isClient,
      hostname,
      port,
      userAgent,
      nodeEnv
    }
  }
}

export class DefaultConfigurations {
  /**
   * Configuração padrão para desenvolvimento
   */
  static getDevelopmentConfig(): Partial<LogConfig> {
    return {
      environment: 'development',
      globalLevel: 'INFO',
      quietMode: false,
      debugMode: false,
      persistSettings: true,
      componentLevels: {
        'AuthServiceV2': 'INFO',
        'EnhancedLogger': 'WARN',
        'EmergencyStop': 'ERROR',
        'DebugDashboard': 'ERROR',
        'ConsistencyDetection': 'ERROR',
        'AutoCorrection': 'ERROR',
        'ConsoleCommands': 'ERROR',
        'UserStateManager': 'INFO',
        'DataConsistencyValidator': 'WARN'
      }
    }
  }

  /**
   * Configuração padrão para produção
   */
  static getProductionConfig(): Partial<LogConfig> {
    return {
      environment: 'production',
      globalLevel: 'ERROR',
      quietMode: true,
      debugMode: false,
      persistSettings: false,
      componentLevels: {
        'AuthServiceV2': 'ERROR',
        'EnhancedLogger': 'ERROR',
        'EmergencyStop': 'ERROR',
        'DebugDashboard': 'SILENT',
        'ConsistencyDetection': 'SILENT',
        'AutoCorrection': 'SILENT',
        'ConsoleCommands': 'SILENT',
        'UserStateManager': 'ERROR',
        'DataConsistencyValidator': 'ERROR'
      }
    }
  }

  /**
   * Configuração para modo debug
   */
  static getDebugConfig(): Partial<LogConfig> {
    return {
      globalLevel: 'VERBOSE',
      quietMode: false,
      debugMode: true,
      componentLevels: {
        'AuthServiceV2': 'DEBUG',
        'EnhancedLogger': 'DEBUG',
        'EmergencyStop': 'DEBUG',
        'DebugDashboard': 'DEBUG',
        'ConsistencyDetection': 'DEBUG',
        'AutoCorrection': 'DEBUG',
        'ConsoleCommands': 'DEBUG',
        'UserStateManager': 'DEBUG',
        'DataConsistencyValidator': 'DEBUG'
      }
    }
  }

  /**
   * Configuração para modo silencioso
   */
  static getQuietConfig(): Partial<LogConfig> {
    return {
      globalLevel: 'ERROR',
      quietMode: true,
      debugMode: false,
      componentLevels: {}
    }
  }

  /**
   * Obtém configuração baseada no ambiente
   */
  static getEnvironmentBasedConfig(): Partial<LogConfig> {
    const environment = EnvironmentDetector.detectEnvironment()
    
    if (environment === 'production') {
      return this.getProductionConfig()
    } else {
      return this.getDevelopmentConfig()
    }
  }

  /**
   * Níveis de log recomendados por tipo de componente
   */
  static getRecommendedLevels(): Record<string, LogLevel> {
    return {
      // Componentes críticos - apenas erros em produção
      'auth': 'ERROR',
      'security': 'ERROR',
      'payment': 'ERROR',
      
      // Componentes de sistema - warnings importantes
      'database': 'WARN',
      'cache': 'WARN',
      'validation': 'WARN',
      
      // Componentes de UI - informações básicas
      'ui': 'INFO',
      'navigation': 'INFO',
      'forms': 'INFO',
      
      // Componentes de debug - apenas em desenvolvimento
      'debug': 'DEBUG',
      'testing': 'DEBUG',
      'development': 'DEBUG'
    }
  }
}

/**
 * Utilitários para execução condicional baseada no ambiente
 */
export const EnvironmentUtils = {
  /**
   * Executa código apenas em desenvolvimento
   */
  onlyInDevelopment(fn: () => void): void {
    if (EnvironmentDetector.isDevelopment()) {
      try {
        fn()
      } catch (error) {
        console.warn('EnvironmentUtils: Erro em código de desenvolvimento', error)
      }
    }
  },

  /**
   * Executa código apenas em produção
   */
  onlyInProduction(fn: () => void): void {
    if (EnvironmentDetector.isProduction()) {
      try {
        fn()
      } catch (error) {
        console.error('EnvironmentUtils: Erro em código de produção', error)
      }
    }
  },

  /**
   * Executa código apenas no cliente
   */
  onlyInClient(fn: () => void): void {
    if (EnvironmentDetector.isClient()) {
      try {
        fn()
      } catch (error) {
        console.warn('EnvironmentUtils: Erro em código do cliente', error)
      }
    }
  },

  /**
   * Executa código apenas no servidor
   */
  onlyInServer(fn: () => void): void {
    if (EnvironmentDetector.isServer()) {
      try {
        fn()
      } catch (error) {
        console.error('EnvironmentUtils: Erro em código do servidor', error)
      }
    }
  },

  /**
   * Retorna valor baseado no ambiente
   */
  environmentValue<T>(developmentValue: T, productionValue: T): T {
    return EnvironmentDetector.isDevelopment() ? developmentValue : productionValue
  },

  /**
   * Executa função e retorna resultado baseado no ambiente
   */
  environmentFunction<T>(developmentFn: () => T, productionFn: () => T): T {
    return EnvironmentDetector.isDevelopment() ? developmentFn() : productionFn()
  }
}