/**
 * LogManager - Sistema central de controle de logging
 * 
 * Fornece controle granular sobre níveis de log por componente
 * e ambiente, com configurações persistentes e detecção automática.
 */

export type LogLevel = 'SILENT' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'VERBOSE'

export interface LogConfig {
  environment: 'development' | 'production'
  globalLevel: LogLevel
  componentLevels: Record<string, LogLevel>
  quietMode: boolean
  debugMode: boolean
  persistSettings: boolean
}

export interface ComponentRegistry {
  [componentName: string]: {
    defaultLevel: LogLevel
    currentLevel: LogLevel
    description: string
  }
}

export interface LogManagerInterface {
  setGlobalLevel(level: LogLevel): void
  setComponentLevel(component: string, level: LogLevel): void
  getEffectiveLevel(component: string): LogLevel
  isEnabled(component: string, level: LogLevel): boolean
  enableQuietMode(): void
  enableDebugMode(): void
  getConfig(): LogConfig
  resetToDefaults(): void
}

class LogManager implements LogManagerInterface {
  private static instance: LogManager | null = null
  private config: LogConfig
  private componentRegistry: ComponentRegistry = {}
  private readonly STORAGE_KEY = 'log_manager_config'
  
  // Hierarquia de níveis (menor número = maior prioridade)
  private readonly LEVEL_PRIORITY: Record<LogLevel, number> = {
    'SILENT': 0,
    'ERROR': 1,
    'WARN': 2,
    'INFO': 3,
    'DEBUG': 4,
    'VERBOSE': 5
  }

  private constructor() {
    this.config = this.getDefaultConfig()
    this.loadPersistedConfig()
    this.registerDefaultComponents()
  }

  /**
   * Singleton pattern - retorna instância única
   */
  static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager()
    }
    return LogManager.instance
  }

  /**
   * Obtém configuração padrão baseada no ambiente
   */
  private getDefaultConfig(): LogConfig {
    const environment = this.detectEnvironment()
    
    return {
      environment,
      globalLevel: environment === 'production' ? 'ERROR' : 'INFO',
      componentLevels: {},
      quietMode: environment === 'production',
      debugMode: false,
      persistSettings: true
    }
  }

  /**
   * Detecta o ambiente atual
   */
  private detectEnvironment(): 'development' | 'production' {
    // Verificar NODE_ENV
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
      return process.env.NODE_ENV === 'production' ? 'production' : 'development'
    }
    
    // Verificar se está em desenvolvimento (localhost, etc)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev')) {
        return 'development'
      }
    }
    
    // Default para produção por segurança
    return 'production'
  }

  /**
   * Carrega configuração persistida do localStorage
   */
  private loadPersistedConfig(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const persistedConfig = JSON.parse(stored)
        
        // Mesclar com configuração padrão, mantendo ambiente atual
        this.config = {
          ...this.config,
          ...persistedConfig,
          environment: this.config.environment // Sempre usar ambiente detectado
        }
      }
    } catch (error) {
      console.warn('LogManager: Erro ao carregar configuração persistida', error)
    }
  }

  /**
   * Persiste configuração no localStorage
   */
  private persistConfig(): void {
    if (!this.config.persistSettings || typeof window === 'undefined') return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config))
    } catch (error) {
      console.warn('LogManager: Erro ao persistir configuração', error)
    }
  }

  /**
   * Registra componentes padrão do sistema
   */
  private registerDefaultComponents(): void {
    const defaultLevel = this.config.environment === 'production' ? 'ERROR' : 'INFO'
    
    this.registerComponent('AuthServiceV2', defaultLevel, 'Sistema de autenticação V2')
    this.registerComponent('EnhancedLogger', 'WARN', 'Sistema de logging melhorado')
    this.registerComponent('EmergencyStop', 'ERROR', 'Sistema de parada de emergência')
    this.registerComponent('DebugDashboard', 'ERROR', 'Dashboard de debug visual')
    this.registerComponent('ConsistencyDetection', 'ERROR', 'Detecção de inconsistências')
    this.registerComponent('AutoCorrection', 'ERROR', 'Auto-correção de dados')
    this.registerComponent('ConsoleCommands', 'ERROR', 'Comandos de console')
    this.registerComponent('UserStateManager', defaultLevel, 'Gerenciador de estado do usuário')
    this.registerComponent('DataConsistencyValidator', 'WARN', 'Validador de consistência')
  }

  /**
   * Registra um novo componente
   */
  registerComponent(name: string, defaultLevel: LogLevel, description: string): void {
    this.componentRegistry[name] = {
      defaultLevel,
      currentLevel: this.config.componentLevels[name] || defaultLevel,
      description
    }
  }

  /**
   * Define nível global de logging
   */
  setGlobalLevel(level: LogLevel): void {
    this.config.globalLevel = level
    this.persistConfig()
  }

  /**
   * Define nível de logging para componente específico
   */
  setComponentLevel(component: string, level: LogLevel): void {
    this.config.componentLevels[component] = level
    
    if (this.componentRegistry[component]) {
      this.componentRegistry[component].currentLevel = level
    }
    
    this.persistConfig()
  }

  /**
   * Obtém nível efetivo para um componente
   */
  getEffectiveLevel(component: string): LogLevel {
    // Se está em modo silencioso, sempre retornar SILENT
    if (this.config.quietMode) {
      return 'SILENT'
    }

    // Se está em modo debug, sempre retornar VERBOSE
    if (this.config.debugMode) {
      return 'VERBOSE'
    }

    // Verificar nível específico do componente
    const componentLevel = this.config.componentLevels[component]
    if (componentLevel) {
      return componentLevel
    }

    // Verificar nível padrão do componente registrado
    const registeredComponent = this.componentRegistry[component]
    if (registeredComponent) {
      return registeredComponent.currentLevel
    }

    // Usar nível global
    return this.config.globalLevel
  }

  /**
   * Verifica se um nível de log está habilitado para um componente
   */
  isEnabled(component: string, level: LogLevel): boolean {
    const effectiveLevel = this.getEffectiveLevel(component)
    const effectivePriority = this.LEVEL_PRIORITY[effectiveLevel]
    const requestedPriority = this.LEVEL_PRIORITY[level]
    
    return requestedPriority <= effectivePriority
  }

  /**
   * Ativa modo silencioso (apenas erros críticos)
   */
  enableQuietMode(): void {
    this.config.quietMode = true
    this.config.debugMode = false
    this.persistConfig()
  }

  /**
   * Ativa modo debug (todos os logs)
   */
  enableDebugMode(): void {
    this.config.debugMode = true
    this.config.quietMode = false
    this.persistConfig()
  }

  /**
   * Desativa modos especiais
   */
  enableNormalMode(): void {
    this.config.debugMode = false
    this.config.quietMode = this.config.environment === 'production'
    this.persistConfig()
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): LogConfig {
    return { ...this.config }
  }

  /**
   * Obtém registro de componentes
   */
  getComponentRegistry(): ComponentRegistry {
    return { ...this.componentRegistry }
  }

  /**
   * Reseta para configurações padrão
   */
  resetToDefaults(): void {
    this.config = this.getDefaultConfig()
    this.registerDefaultComponents()
    this.persistConfig()
  }

  /**
   * Limpa configurações persistidas
   */
  clearPersistedConfig(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
    }
    this.resetToDefaults()
  }

  /**
   * Obtém informações de debug
   */
  getDebugInfo(): any {
    return {
      config: this.config,
      componentRegistry: this.componentRegistry,
      environment: this.config.environment,
      totalComponents: Object.keys(this.componentRegistry).length,
      activeComponents: Object.keys(this.config.componentLevels).length
    }
  }
}

// Utilitários de ambiente
export const EnvironmentUtils = {
  /**
   * Verifica se está em desenvolvimento
   */
  isDevelopment(): boolean {
    return LogManager.getInstance().getConfig().environment === 'development'
  },

  /**
   * Verifica se está em produção
   */
  isProduction(): boolean {
    return LogManager.getInstance().getConfig().environment === 'production'
  },

  /**
   * Executa código apenas em desenvolvimento
   */
  onlyInDevelopment(fn: () => void): void {
    if (this.isDevelopment()) {
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
    if (this.isProduction()) {
      try {
        fn()
      } catch (error) {
        console.error('EnvironmentUtils: Erro em código de produção', error)
      }
    }
  }
}

// Exportar instância singleton
export const logManager = LogManager.getInstance()
export default logManager