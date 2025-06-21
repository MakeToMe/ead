"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import DashboardSidebar from "@/app/dashboard/components/dashboard-sidebar"
import { useAuth } from "@/contexts/auth-context"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Verifica se estamos em uma rota do dashboard
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/meus-cursos") ||
    pathname.startsWith("/minhas-aulas") ||
    pathname.startsWith("/trilha-aprendizado") ||
    pathname.startsWith("/assistir-curso") ||
    pathname.startsWith("/minhas-aulas/adicionar") ||
    pathname.startsWith("/administracao") ||
    pathname.startsWith("/certificados") // ← JÁ INCLUÍDO

  useEffect(() => {
    if (!isLoading && !isAuthenticated && isDashboardRoute) {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, isDashboardRoute, router])

  // Se não é rota do dashboard, renderiza normalmente
  if (!isDashboardRoute) {
    return <>{children}</>
  }

  // Loading otimizado para rotas do dashboard
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
        <div className="w-64 bg-slate-800/50 border-r border-slate-700/50 animate-pulse" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  // Se não autenticado, não renderiza nada (redirecionamento em andamento)
  if (!isAuthenticated || !user) {
    return null
  }

  // Para a página de assistir curso, não renderiza o sidebar
  if (
    pathname.startsWith("/assistir-curso") ||
    pathname.startsWith("/minhas-aulas/adicionar") ||
    pathname.startsWith("/minhas-aulas/editar")
  ) {
    return <>{children}</>
  }

  // Layout do dashboard com sidebar persistente
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      {/* Sidebar persistente - renderizada UMA VEZ */}
      <DashboardSidebar user={user} />

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="transition-opacity duration-150 ease-in-out">{children}</div>
      </main>
    </div>
  )
}
