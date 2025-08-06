/**
 * Emergency Stop - Para monitoramento em caso de loop
 */

import { createLogger } from '@/lib/logger-factory'

const logger = createLogger('EmergencyStop', 'ERROR', 'Sistema de parada de emergência')

export async function emergencyStop() {
  // Log removido - só aparece quando realmente executado pelo usuário
  
  try {
    const { default: userStateManager } = await import("@/lib/user-state-manager")
    
    // Parar todos os timers
    userStateManager.stopHealthCheck()
    
    // NÃO limpar dados automaticamente - apenas parar monitoramentos
    // Log removido - sucesso é implícito pelo return true
    
    return true
  } catch (error) {
    logger.error('EMERGENCY STOP: Erro ao parar monitoramentos', {}, error)
    return false
  }
}

export async function emergencyReset() {
  // Log removido - só aparece quando realmente executado pelo usuário
  
  try {
    await emergencyStop()
    
    // Recarregar página após 1 segundo
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
    return true
  } catch (error) {
    logger.error('EMERGENCY RESET: Erro no reset', {}, error)
    return false
  }
}

import { EnvironmentUtils } from '@/lib/utils/environment'

// Adicionar ao window para acesso imediato (apenas em desenvolvimento)
EnvironmentUtils.onlyInClient(() => {
  (window as any).emergencyStop = emergencyStop
  (window as any).emergencyReset = emergencyReset
  
  // Logs de disponibilidade apenas em desenvolvimento
  EnvironmentUtils.onlyInDevelopment(() => {
    logger.debug('EMERGENCY STOP disponível: execute emergencyStop() para parar loops')
    logger.debug('EMERGENCY RESET disponível: execute emergencyReset() para reset completo')
  })
})