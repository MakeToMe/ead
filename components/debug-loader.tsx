"use client"

import { useEffect, useState } from 'react'

export default function DebugLoader() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Aguardar um pouco para garantir que tudo está carregado
      const timer = setTimeout(() => {
        Promise.all([
          import("@/lib/test-consistency-detection").catch(() => {}),
          import("@/lib/test-auto-correction").catch(() => {}),
          import("@/lib/emergency-stop").catch(() => {}),
          import("@/lib/debug-dashboard").catch(() => {}),
          import("@/lib/console-commands").catch(() => {})
        ]).then(() => {
          console.log('🛠️ Debug tools loaded successfully')
        }).catch(() => {
          console.warn('⚠️ Some debug tools failed to load')
        })
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [mounted])

  // Não renderizar nada no servidor
  if (!mounted) return null

  return null
}