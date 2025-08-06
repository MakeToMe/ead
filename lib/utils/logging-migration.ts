/**
 * Utilitários para migração de logging
 * 
 * Facilita a migração de componentes existentes para o novo sistema
 * de logging controlado por componente.
 */

import { logManager } from '@/lib/log-manager'
import { createLogger } from '@/lib/logger-factory'
import type { LogLevel } from '@/lib/types/logging'

/**
 * Registra componentes padrão do sistema com suas configurações
 */
export function registerSystemComponents(): void {
  const components = [
    // Componentes de autenticação
    { name: 'AuthServiceV2', level: 'INFO' as LogLevel, description: 'Sistema de autenticação V2' },
    { name: 'AuthGuard', level: 'WARN' as LogLevel, description: 'Proteção de rotas autenticadas' },
    { name: 'AuthContext', level: 'INFO' as LogLevel, description: 'Contexto de autenticação' },
    
    // Componentes de estado
    { name: 'UserStateManager', level: 'INFO' as LogLevel, description: 'Gerenciador de estado do usuário' },
    { name: 'DataConsistencyValidator', level: 'WARN' as LogLevel, description: 'Validador de consistência' },
    
    // Componentes de logging
    { name: 'EnhancedLogger', level: 'WARN' as LogLevel, description: 'Sistema de logging melhorado' },
    { name: 'LogManager', level: 'ERROR' as LogLevel, description: 'Gerenciador central de logs' },
    
    // Ferramentas de debug
    { name: 'EmergencyStop', level: 'ERROR' as LogLevel, description: 'Sistema de parada de emergência' },
    { name: 'DebugDashboard', level: 'ERROR' as LogLevel, description: 'Dashboard de debug visual' },
    { name: 'ConsistencyDetection', level: 'ERROR' as LogLevel, description: 'Detecção de inconsistências' },
    { name: 'AutoCorrection', level: 'ERROR' as LogLevel, description: 'Auto-correção de dados' },
    { name: 'ConsoleCommands', level: 'ERROR' as LogLevel, description: 'Comandos de console' },
    { name: 'DebugLoader', level: 'ERROR' as LogLevel, description: 'Carregador de ferramentas de debug' },
    
    // Componentes de UI
    { name: 'DashboardLayout', level: 'WARN' as LogLevel, description: 'Layout do dashboard' },
    { name: 'CertificateComponents', level: 'INFO' as LogLevel, description: 'Componentes de certificado' },
    
    // Utilitários
    { name: 'PhotoCache', level: 'WARN' as LogLevel, description: 'Cache de fotos' },
    { name: 'MinioConfig', level: 'ERROR' as LogLevel, description: 'Configuração do Minio' },
    { name: 'UtilsArquivo', level: 'WARN' as LogLevel, description: 'Utilitários de arquivo' }
  ]

  components.forEach(({ name, level, description }) => {
    logManager.registerComponent(name, level, description)
  })
}

/**
 * Cria logger para componente com configuração automática
 */
export function createComponentLogger(
  componentName: string, 
  defaultLevel?: LogLevel, 
  description?: string
) {
  // Registrar componente se informações foram fornecidas
  if (defaultLevel && description) {
    logManager.registerComponent(componentName, defaultLevel, description)
  }
  
  return createLogger(componentName, defaultLevel, description)
}

/**
 * Migra console.log existentes para o novo sistema
 */
export function migrateConsoleLog(
  componentName: string,
  originalMessage: string,
  level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  data?: any
): void {
  const logger = createLogger(componentName)
  
  // Remover emojis e prefixos do sistema antigo
  const cleanMessage = originalMessage
    .replace(/^[🔍📝ℹ️⚠️❌🚨🔄✅🚪🏗️📊🎯🧹📥🛠️🔧🔇🐛📋🌍💾🏥]+\s*/, '')
    .replace(new RegExp(`^${componentName}:\\s*`, 'i'), '')
  
  switch (level) {
    case 'debug':
      logger.debug(cleanMessage, data)
      break
    case 'info':
      logger.info(cleanMessage, data)
      break
    case 'warn':
      logger.warn(cleanMessage, data)
      break
    case 'error':
      logger.error(cleanMessage, data)
      break
  }
}

/**
 * Wrapper para facilitar migração gradual
 */
export function createMigrationWrapper(componentName: string, defaultLevel?: LogLevel) {
  const logger = createLogger(componentName, defaultLevel)
  
  return {
    // Métodos do novo sistema
    debug: (message: string, data?: any) => logger.debug(message, data),
    info: (message: string, data?: any) => logger.info(message, data),
    warn: (message: string, data?: any) => logger.warn(message, data),
    error: (message: string, data?: any, error?: Error) => logger.error(message, data, error),
    
    // Métodos de compatibilidade
    log: (message: string, data?: any) => logger.info(message, data),
    
    // Wrapper para console.log existente
    migrateLog: (originalMessage: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info', data?: any) => {
      migrateConsoleLog(componentName, originalMessage, level, data)
    }
  }
}

/**
 * Configurações recomendadas por tipo de ambiente
 */
export const EnvironmentConfigs = {
  development: {
    globalLevel: 'INFO' as LogLevel,
    quietMode: false,
    debugMode: false,
    componentOverrides: {
      'AuthServiceV2': 'DEBUG' as LogLevel,
      'UserStateManager': 'DEBUG' as LogLevel,
      'DebugDashboard': 'INFO' as LogLevel,
      'ConsoleCommands': 'INFO' as LogLevel
    }
  },
  
  production: {
    globalLevel: 'ERROR' as LogLevel,
    quietMode: true,
    debugMode: false,
    componentOverrides: {
      'AuthServiceV2': 'ERROR' as LogLevel,
      'UserStateManager': 'ERROR' as LogLevel,
      'DebugDashboard': 'SILENT' as LogLevel,
      'ConsoleCommands': 'SILENT' as LogLevel,
      'ConsistencyDetection': 'SILENT' as LogLevel,
      'AutoCorrection': 'SILENT' as LogLevel,
      'DebugLoader': 'SILENT' as LogLevel
    }
  },
  
  testing: {
    globalLevel: 'WARN' as LogLevel,
    quietMode: false,
    debugMode: false,
    componentOverrides: {
      'AuthServiceV2': 'WARN' as LogLevel,
      'UserStateManager': 'WARN' as LogLevel
    }
  }
}

/**
 * Aplica configuração baseada no ambiente
 */
export function applyEnvironmentConfig(environment: 'development' | 'production' | 'testing'): void {
  const config = EnvironmentConfigs[environment]
  
  // Aplicar configuração global
  logManager.setGlobalLevel(config.globalLevel)
  
  if (config.quietMode) {
    logManager.enableQuietMode()
  } else if (config.debugMode) {
    logManager.enableDebugMode()
  }
  
  // Aplicar overrides por componente
  Object.entries(config.componentOverrides).forEach(([component, level]) => {
    logManager.setComponentLevel(component, level)
  })
}

/**
 * Utilitário para debug de configuração
 */
export function debugLogConfiguration(): void {
  const config = logManager.getConfig()
  const registry = logManager.getComponentRegistry()
  
  console.group('🔧 Log Configuration Debug')
  console.log('Environment:', config.environment)
  console.log('Global Level:', config.globalLevel)
  console.log('Quiet Mode:', config.quietMode)
  console.log('Debug Mode:', config.debugMode)
  console.log('')
  
  console.log('Component Registry:')
  Object.entries(registry).forEach(([name, info]) => {
    const effectiveLevel = logManager.getEffectiveLevel(name)
    const isEnabled = logManager.isEnabled(name, 'INFO')
    console.log(`  ${name}: ${effectiveLevel} (enabled: ${isEnabled})`)
  })
  
  console.groupEnd()
}

// Auto-registrar componentes do sistema na inicialização
if (typeof window !== 'undefined') {
  // Aguardar um pouco para garantir que o LogManager está inicializado
  setTimeout(() => {
    registerSystemComponents()
  }, 100)
}