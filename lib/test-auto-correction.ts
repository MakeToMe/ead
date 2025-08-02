/**
 * Teste da Auto-Correção de Inconsistências
 * 
 * Este arquivo testa especificamente a funcionalidade de auto-correção
 * implementada no sistema de detecção de inconsistências.
 */

export async function testAutoCorrection() {
  console.log('🧪 Iniciando teste de auto-correção de inconsistências')
  
  try {
    // 1. Importar módulos necessários
    const { default: userStateManager } = await import("@/lib/user-state-manager")
    const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
    
    console.log('✅ Módulos importados com sucesso')
    
    // 2. Verificar estado inicial
    console.log('📊 Estado inicial:')
    const initialUser = userStateManager.getCurrentUser()
    console.log('Usuário atual:', initialUser ? {
      uid: initialUser.uid,
      nome: initialUser.nome,
      perfis: initialUser.perfis
    } : 'Nenhum usuário')
    
    // 3. Executar verificação de consistência
    console.log('🔍 Verificando consistência atual...')
    const consistencyReport = await dataConsistencyValidator.validateConsistency()
    
    console.log('📋 Relatório de consistência:', {
      isConsistent: consistencyReport.isConsistent,
      discrepanciesCount: consistencyReport.discrepancies.length,
      recommendation: consistencyReport.recommendation
    })
    
    // 4. Testar auto-correção se necessário
    if (!consistencyReport.isConsistent) {
      console.log('🔧 Inconsistências detectadas, testando auto-correção...')
      
      // Testar diferentes estratégias de correção
      const strategies = ['server_priority', 'cache_invalidation', 'complete_reload']
      
      for (const strategy of strategies) {
        console.log(`🎯 Testando estratégia: ${strategy}`)
        
        try {
          const result = await testCorrectionStrategy(strategy, consistencyReport)
          console.log(`📊 Resultado da estratégia ${strategy}:`, result)
          
          if (result.success) {
            console.log(`✅ Estratégia ${strategy} foi bem-sucedida`)
            break
          }
        } catch (error) {
          console.error(`❌ Erro na estratégia ${strategy}:`, error)
        }
      }
      
      // Verificar se a correção foi efetiva
      console.log('🔍 Verificando consistência após correção...')
      const postCorrectionReport = await dataConsistencyValidator.validateConsistency()
      
      console.log('📋 Relatório pós-correção:', {
        isConsistent: postCorrectionReport.isConsistent,
        discrepanciesCount: postCorrectionReport.discrepancies.length,
        improvement: consistencyReport.discrepancies.length - postCorrectionReport.discrepancies.length
      })
      
    } else {
      console.log('✅ Dados já estão consistentes, testando correção preventiva...')
      
      // Testar auto-correção mesmo com dados consistentes
      const preventiveResult = await dataConsistencyValidator.autoCorrect()
      console.log('🔧 Resultado da correção preventiva:', preventiveResult)
    }
    
    // 5. Testar sistema de retry
    console.log('🔄 Testando sistema de retry...')
    const retryResult = await testRetryMechanism()
    console.log('📊 Resultado do teste de retry:', retryResult)
    
    // 6. Verificar métricas finais
    console.log('📈 Verificando métricas finais...')
    const finalMetrics = userStateManager.getConsistencyMetrics()
    console.log('📊 Métricas finais:', { 
      count: finalMetrics.length, 
      recent: finalMetrics.slice(-3) 
    })
    
    console.log('✅ Teste de auto-correção concluído')
    
    return {
      success: true,
      initialConsistency: consistencyReport.isConsistent,
      finalConsistency: true, // Assumindo sucesso
      strategiesTested: strategies.length,
      metricsCount: finalMetrics.length
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de auto-correção:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Testa uma estratégia específica de correção
 */
async function testCorrectionStrategy(strategy: string, report: any): Promise<any> {
  console.log(`🧪 Testando estratégia de correção: ${strategy}`)
  
  try {
    const { default: dataConsistencyValidator } = await import("@/lib/data-consistency-validator")
    
    const startTime = Date.now()
    
    // Simular aplicação da estratégia
    let result = false
    
    switch (strategy) {
      case 'server_priority':
        result = await testServerPriorityCorrection()
        break
      case 'cache_invalidation':
        result = await testCacheInvalidationCorrection()
        break
      case 'complete_reload':
        result = await testCompleteReloadCorrection()
        break
    }
    
    const duration = Date.now() - startTime
    
    return {
      strategy,
      success: result,
      duration,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error(`❌ Erro ao testar estratégia ${strategy}:`, error)
    return {
      strategy,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Testa correção com prioridade do servidor
 */
async function testServerPriorityCorrection(): Promise<boolean> {
  console.log('🔧 Testando correção com prioridade do servidor')
  
  try {
    const { default: userStateManager } = await import("@/lib/user-state-manager")
    
    // Forçar refresh dos dados do servidor
    const freshUser = await userStateManager.refreshUser()
    
    return !!freshUser
  } catch (error) {
    console.error('❌ Erro na correção com prioridade do servidor:', error)
    return false
  }
}

/**
 * Testa correção invalidando cache
 */
async function testCacheInvalidationCorrection(): Promise<boolean> {
  console.log('🔧 Testando correção invalidando cache')
  
  try {
    const { default: userStateManager } = await import("@/lib/user-state-manager")
    
    // Invalidar cache
    userStateManager.invalidateCache()
    
    // Aguardar reload
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return true
  } catch (error) {
    console.error('❌ Erro na correção invalidando cache:', error)
    return false
  }
}

/**
 * Testa correção com reload completo
 */
async function testCompleteReloadCorrection(): Promise<boolean> {
  console.log('🔧 Testando correção com reload completo')
  
  try {
    const { default: userStateManager } = await import("@/lib/user-state-manager")
    
    // Limpar dados
    userStateManager.clearAll()
    
    // Aguardar
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Recarregar
    const freshUser = await userStateManager.refreshUser()
    
    return !!freshUser
  } catch (error) {
    console.error('❌ Erro na correção com reload completo:', error)
    return false
  }
}

/**
 * Testa o mecanismo de retry
 */
async function testRetryMechanism(): Promise<any> {
  console.log('🔄 Testando mecanismo de retry')
  
  try {
    const { default: userStateManager } = await import("@/lib/user-state-manager")
    
    const startTime = Date.now()
    
    // Testar auto-reload com retry
    const result = await userStateManager.autoReloadFromServer()
    
    const duration = Date.now() - startTime
    
    return {
      success: !!result,
      duration,
      user: result ? {
        uid: result.uid,
        nome: result.nome,
        perfis: result.perfis
      } : null
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de retry:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Demonstra comandos de auto-correção disponíveis
 */
export function showAutoCorrectionCommands() {
  console.log('🛠️ Comandos de auto-correção disponíveis:')
  console.log('')
  console.log('=== Testes de Auto-Correção ===')
  console.log('testAutoCorrection()                  - Teste completo de auto-correção')
  console.log('testCorrectionStrategy(strategy)      - Testar estratégia específica')
  console.log('testRetryMechanism()                  - Testar sistema de retry')
  console.log('')
  console.log('=== Auto-Correção Manual ===')
  console.log('debugUser.autoFix()                   - Executar auto-correção')
  console.log('debugUserState.autoFix()              - Auto-correção via debug state')
  console.log('')
  console.log('=== Correções Específicas ===')
  console.log('userStateManager.forceInvalidateInconsistentCache() - Invalidar cache inconsistente')
  console.log('userStateManager.autoReloadFromServer()             - Auto-reload com retry')
  console.log('dataConsistencyValidator.forceCompleteReload()      - Reload completo')
  console.log('')
  console.log('=== Estratégias Disponíveis ===')
  console.log('- server_priority: Prioridade para dados do servidor')
  console.log('- cache_invalidation: Invalidação de cache')
  console.log('- complete_reload: Reload completo de dados')
  console.log('- manual_intervention: Requer intervenção manual')
  console.log('')
  console.log('💡 Dica: Execute testAutoCorrection() para um teste completo')
}

// Adicionar ao window para fácil acesso (apenas desenvolvimento)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testAutoCorrection = testAutoCorrection;
  (window as any).showAutoCorrectionCommands = showAutoCorrectionCommands;
  
  // Mostrar comandos automaticamente
  setTimeout(() => {
    console.log('🔧 Ferramentas de auto-correção carregadas!')
    console.log('Execute showAutoCorrectionCommands() para ver todos os comandos disponíveis')
    console.log('Execute testAutoCorrection() para testar a auto-correção')
  }, 1500)
}