"use client"

import { useEffect } from 'react'
import { configureLoggingForEnvironment } from '@/lib/utils/simple-log-cleanup'

/**
 * Componente para inicializar limpeza de logs no lado do cliente
 */
export default function LogCleanupInit() {
  useEffect(() => {
    // Configurar logging baseado no ambiente
    configureLoggingForEnvironment()
  }, [])

  return null // Componente invisível
}