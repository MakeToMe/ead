/**
 * Log Cleanup Utilities - Utilitários para limpeza e controle de logs
 * Versão simplificada que funciona sem dependências complexas
 */

/**
 * Configura modo silencioso para produção
 */
export function enableQuietMode(): void {
  if (typeof window !== 'undefined') {
    // Configuração simples via localStorage para o EnhancedLogger
    localStorage.setItem('log_level', 'ERROR')
    localStorage.setItem('quiet_mode', 'true')
    console.log('🔇 Modo silencioso ativado - apenas logs de erro serão exibidos')
  }
}

/**
 * Configura modo de desenvolvimento com logs controlados
 */
export function enableDevelopmentMode(): void {
  if (typeof window !== 'undefined') {
    // Configuração simples via localStorage
    localStorage.setItem('log_level', 'WARN')
    localStorage.setItem('quiet_mode', 'false')
    console.log('🛠️ Modo desenvolvimento ativado - logs controlados')
  }
}

/**
 * Ativa modo debug completo (apenas para troubleshooting)
 */
export function enableDebugMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('log_level', 'DEBUG')
    localStorage.setItem('quiet_mode', 'false')
    console.log('🐛 Modo debug ativado - todos os logs serão exibidos')
  }
}

/**
 * Configura automaticamente baseado no ambiente
 */
export function configureLoggingForEnvironment(): void {
  if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'production') {
      enableQuietMode()
    } else {
      enableDevelopmentMode()
    }
  }
}

/**
 * Remove logs excessivos de console.log diretos (para migração)
 */
export function suppressDirectConsoleLogs(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Sobrescrever console.log em produção (manter error e warn)
    const originalLog = console.log
    console.log = (...args: any[]) => {
      // Só permitir logs que começam com emoji de erro
      const firstArg = args[0]
      if (typeof firstArg === 'string' && (firstArg.startsWith('❌') || firstArg.startsWith('🚨'))) {
        originalLog.apply(console, args)
      }
      // Silenciar todos os outros console.log
    }
  }
}

// Adicionar comandos de debug ao window
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).logCleanup = {
    enableQuietMode,
    enableDevelopmentMode,
    enableDebugMode,
    configureLoggingForEnvironment,
    suppressDirectConsoleLogs
  }
}