"use client"

import { useEffect, useState } from 'react'
import { EnvironmentUtils } from '@/lib/utils/environment'

export default function DebugLoader() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Carregar ferramentas de debug apenas em desenvolvimento
    EnvironmentUtils.onlyInDevelopment(() => {
      EnvironmentUtils.onlyInClient(() => {
        // Aguardar um pouco para garantir que tudo está carregado
        const timer = setTimeout(() => {
          Promise.all([
            import("@/lib/test-consistency-detection").catch(() => {}),
            import("@/lib/test-auto-correction").catch(() => {}),
            import("@/lib/emergency-stop").catch(() => {}),
            import("@/lib/debug-dashboard").catch(() => {}),
            import("@/lib/console-commands").catch(() => {})
          ]).then(() => {
            // Usar logger factory para log controlado
            import("@/lib/logger-factory").then(({ createLogger }) => {
              const logger = createLogger('DebugLoader', 'ERROR', 'Carregador de ferramentas de debug')
              logger.debug('Debug tools loaded successfully')
            })
          }).catch(() => {
            // Log de erro apenas se necessário
            import("@/lib/logger-factory").then(({ createLogger }) => {
              const logger = createLogger('DebugLoader', 'ERROR', 'Carregador de ferramentas de debug')
              logger.warn('Some debug tools failed to load')
            })
          })
        }, 1000)

        return () => clearTimeout(timer)
      })
    })
  }, [mounted])

  // Não renderizar nada no servidor
  if (!mounted) return null

  return null
}