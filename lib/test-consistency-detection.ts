/**
 * Teste da Detecção Automática de Inconsistências
 * 
 * Este arquivo demonstra como testar a funcionalidade de detecção
 * automática de inconsistências implementada.
 */

export async function testConsistencyDetection() {
  console.log('🧪 Iniciando teste de detecção de inconsistências')
  
  try {
    // 1. Importar módulos necessários
    const { default: userStateManager } = await import("@/lib/user-state-manager")
    const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
    const { default: debugUserState } = await import("@/lib/debug-user-state")
    
    console.log('✅ Módulos importados com sucesso')
    
    // 2. Verificar estado inicial
    console.log('📊 Estado inicial:')
    const initialInfo = await debugUserState.getInfo()
    console.log(initialInfo)
    
    // 3. Iniciar monitoramento automático
    console.log('🚀 Iniciando monitoramento automático...')
    await debugUserState.startMonitoring()
    
    // 4. Executar verificação manual
    console.log('🔍 Executando verificação manual de consistência...')
    const consistencyReport = await debugUserState.checkConsistency()
    console.log('📋 Relatório de consistência:', consistencyReport)
    
    // 5. Comparar componentes
    console.log('🔍 Comparando dados entre componentes...')
    const comparison = await debugUserState.compareComponents()
    console.log('📊 Comparação de componentes:', comparison)
    
    // 6. Verificar métricas
    console.log('📈 Verificando métricas...')
    const metrics = debugUserState.getMetrics()
    console.log('📊 Métricas atuais:', { count: metrics.length, recent: metrics.slice(-3) })
    
    // 7. Testar auto-correção se necessário
    if (!consistencyReport.isConsistent) {
      console.log('🔧 Inconsistências detectadas, testando auto-correção...')
      const fixResult = await debugUserState.autoFix()
      console.log('🔧 Resultado da auto-correção:', fixResult)
    }
    
    console.log('✅ Teste de detecção de inconsistências concluído')
    
    return {
      success: true,
      initialState: initialInfo,
      consistencyReport,
      comparison,
      metricsCount: metrics.length
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de detecção de inconsistências:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Demonstra comandos de debug disponíveis
 */
export function showDebugCommands() {
  console.log('🛠️ Comandos de debug disponíveis:')
  console.log('')
  console.log('=== UserStateManager ===')
  console.log('debugUserState.getInfo()              - Informações completas do estado')
  console.log('debugUserState.startMonitoring()      - Iniciar monitoramento automático')
  console.log('debugUserState.stopMonitoring()       - Parar monitoramento automático')
  console.log('debugUserState.checkConsistency()     - Verificação manual de consistência')
  console.log('debugUserState.compareComponents()    - Comparar dados entre componentes')
  console.log('debugUserState.forceSync()            - Forçar sincronização')
  console.log('debugUserState.autoFix()              - Executar auto-correção')
  console.log('')
  console.log('=== Métricas e Histórico ===')
  console.log('debugUserState.getMetrics()           - Obter métricas de consistência')
  console.log('debugUserState.getInconsistencyHistory() - Histórico de inconsistências')
  console.log('debugUserState.clearHistory()         - Limpar histórico')
  console.log('')
  console.log('=== DataConsistencyValidator ===')
  console.log('debugUser.checkConsistency()          - Verificar consistência')
  console.log('debugUser.compareComponents()         - Comparar componentes')
  console.log('debugUser.forceSync()                 - Forçar sincronização')
  console.log('debugUser.autoFix()                   - Auto-correção')
  console.log('debugUser.getInconsistencyHistory()   - Histórico de inconsistências')
  console.log('')
  console.log('=== UserStateManager Direto ===')
  console.log('userStateManager.getDebugInfo()       - Info de debug do UserStateManager')
  console.log('userStateManager.forceRefresh()       - Forçar refresh')
  console.log('userStateManager.invalidateCache()    - Invalidar cache')
  console.log('')
  console.log('💡 Dica: Execute testConsistencyDetection() para um teste completo')
}

import { EnvironmentUtils } from '@/lib/utils/environment'
import { createLogger } from '@/lib/logger-factory'

const logger = createLogger('ConsistencyDetection', 'ERROR', 'Detecção de inconsistências')

// Adicionar ao window para fácil acesso (apenas desenvolvimento)
EnvironmentUtils.onlyInDevelopment(() => {
  EnvironmentUtils.onlyInClient(() => {
    (window as any).testConsistencyDetection = testConsistencyDetection;
    (window as any).showDebugCommands = showDebugCommands;
    
    // Mostrar comandos automaticamente apenas se debug estiver habilitado
    setTimeout(() => {
      if (logger.isEnabled('DEBUG')) {
        logger.debug('Ferramentas de debug carregadas!')
        logger.debug('Execute showDebugCommands() para ver todos os comandos disponíveis')
        logger.debug('Execute testConsistencyDetection() para testar a detecção automática')
      }
    }, 1000)
  })
})