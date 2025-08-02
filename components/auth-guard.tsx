"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * AuthGuard - Componente para proteção de rotas
 * 
 * Substitui a lógica complexa do DashboardLayout
 * Fornece proteção simples e confiável para rotas autenticadas
 */
export default function AuthGuard({ 
  children, 
  fallback = <LoadingScreen />, 
  redirectTo = "/" 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Se não está carregando e não está autenticado, redirecionar
    if (!isLoading && !isAuthenticated) {
      console.log('🚪 AuthGuard: Usuário não autenticado, redirecionando para', redirectTo)
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return fallback
  }

  // Se não está autenticado, mostrar loading (enquanto redireciona)
  if (!isAuthenticated) {
    return fallback
  }

  // Usuário autenticado, mostrar conteúdo
  return <>{children}</>
}

/**
 * Tela de loading padrão
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-300 text-lg">Verificando autenticação...</p>
      </div>
    </div>
  )
}