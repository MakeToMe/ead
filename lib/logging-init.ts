/**
 * Inicialização do Sistema de Logging
 * 
 * Configura automaticamente o sistema de logging baseado no ambiente
 * e registra todos os componentes do sistema.
 */

import { logManager } from '@/lib/log-manager'
import { EnvironmentUtils } from '@/lib/utils/environment'
import { applyEnvironmentConfig, registerSystemComponents } from '@/lib/utils/logging-migration'

/**
 * Inicializa o sistema de logging
 */
export function initializeLogging(): void {
  try {
    // Registrar componentes do sistema
    registerSystemComponents()
    
    // Aplicar configuração baseada no ambiente
    const environment = EnvironmentUtils.environmentValue('development', 'production')
    applyEnvironmentConfig(environment)
    
    // Log de inicialização apenas em desenvolvimento
    EnvironmentUtils.onlyInDevelopment(() => {
      const config = logManager.getConfig()
      console.log('📝 Sistema de logging inicializado', {
        environment: config.environment,
        globalLevel: config.globalLevel,
        quietMode: config.quietMode,
        debugMode: config.debugMode
      })
    })
    
  } catch (error) {
    // Fallback para console nativo em caso de erro
    console.error('❌ Erro ao inicializar sistema de logging:', error)
  }
}

/**
 * Configura logging para produção
 */
export function configureProductionLogging(): void {
  logManager.enableQuietMode()
  
  // Desabilitar logs de componentes de debug
  const debugComponents = [
    'DebugDashboard',
    'ConsistencyDetection', 
    'AutoCorrection',
    'ConsoleCommands',
    'DebugLoader'
  ]
  
  debugComponents.forEach(component => {
    logManager.setComponentLevel(component, 'SILENT')
  })
}

/**
 * Configura logging para desenvolvimento
 */
export function configureDevelopmentLogging(): void {
  logManager.setGlobalLevel('INFO')
  
  // Habilitar logs mais detalhados para componentes principais
  logManager.setComponentLevel('AuthServiceV2', 'DEBUG')
  logManager.setComponentLevel('UserStateManager', 'DEBUG')
  logManager.setComponentLevel('AuthContext', 'DEBUG')
}

/**
 * Utilitário para debug rápido
 */
export function enableDebugLogging(): void {
  logManager.enableDebugMode()
  console.log('🐛 Debug logging habilitado - todos os logs serão exibidos')
}

/**
 * Utilitário para modo silencioso rápido
 */
export function enableQuietLogging(): void {
  logManager.enableQuietMode()
  console.log('🔇 Modo silencioso habilitado - apenas erros críticos serão exibidos')
}

// Auto-inicializar quando o módulo for carregado
if (typeof window !== 'undefined') {
  // Aguardar um pouco para garantir que tudo está carregado
  setTimeout(() => {
    initializeLogging()
  }, 100)
}

// Adicionar utilitários ao window para acesso rápido (apenas desenvolvimento)
EnvironmentUtils.onlyInDevelopment(() => {
  EnvironmentUtils.onlyInClient(() => {
    (window as any).loggingUtils = {
      enableDebug: enableDebugLogging,
      enableQuiet: enableQuietLogging,
      showConfig: () => {
        const config = logManager.getConfig()
        const registry = logManager.getComponentRegistry()
        console.table(registry)
        console.log('Current config:', config)
      },
      resetToDefaults: () => {
        logManager.resetToDefaults()
        console.log('✅ Configuração de logging resetada para padrões')
      }
    }
  })
})