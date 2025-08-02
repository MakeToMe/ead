/**
 * Emergency Stop - Para monitoramento em caso de loop
 */

export async function emergencyStop() {
  console.log('🚨 EMERGENCY STOP: Parando todos os monitoramentos')
  
  try {
    const { default: userStateManager } = await import("@/lib/user-state-manager")
    
    // Parar todos os timers
    userStateManager.stopHealthCheck()
    
    // NÃO limpar dados automaticamente - apenas parar monitoramentos
    console.log('✅ EMERGENCY STOP: Monitoramentos parados (dados preservados)')
    
    return true
  } catch (error) {
    console.error('❌ EMERGENCY STOP: Erro ao parar monitoramentos', error)
    return false
  }
}

export async function emergencyReset() {
  console.log('🔄 EMERGENCY RESET: Resetando sistema completo')
  
  try {
    await emergencyStop()
    
    // Recarregar página após 1 segundo
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
    return true
  } catch (error) {
    console.error('❌ EMERGENCY RESET: Erro no reset', error)
    return false
  }
}

// Adicionar ao window para acesso imediato
if (typeof window !== 'undefined') {
  (window as any).emergencyStop = emergencyStop
  (window as any).emergencyReset = emergencyReset
  
  console.log('🚨 EMERGENCY STOP disponível: execute emergencyStop() para parar loops')
  console.log('🔄 EMERGENCY RESET disponível: execute emergencyReset() para reset completo')
}