/**
 * Simple Log Cleanup - Versão simplificada para limpeza de logs
 */

/**
 * Configura logging baseado no ambiente
 */
export function configureLoggingForEnvironment(): void {
  if (typeof window === 'undefined') return

  if (process.env.NODE_ENV === 'production') {
    // Produção: apenas erros
    localStorage.setItem('log_level', 'ERROR')
    localStorage.setItem('quiet_mode', 'true')
  } else {
    // Desenvolvimento: warnings e erros
    localStorage.setItem('log_level', 'WARN') 
    localStorage.setItem('quiet_mode', 'false')
  }
}

/**
 * Ativa modo silencioso
 */
export function enableQuietMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('log_level', 'ERROR')
    localStorage.setItem('quiet_mode', 'true')
    console.log('🔇 Modo silencioso ativado')
  }
}

/**
 * Ativa modo debug
 */
export function enableDebugMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('log_level', 'DEBUG')
    localStorage.setItem('quiet_mode', 'false')
    console.log('🐛 Modo debug ativado')
  }
}

// Configurar automaticamente
if (typeof window !== 'undefined') {
  setTimeout(() => {
    configureLoggingForEnvironment()
  }, 100)
}

// Comandos de debug
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).logCleanup = {
    enableQuietMode,
    enableDebugMode,
    configureLoggingForEnvironment
  }
}