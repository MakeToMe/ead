"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import DashboardSidebar from "@/app/dashboard/components/dashboard-sidebar"
import AuthGuardV2 from "@/components/auth-guard-v2"
import { useAuthV2 } from "@/contexts/auth-context-v2"

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * DashboardLayout simplificado usando AuthGuard
 * 
 * Responsabilidades:
 * - Determinar se precisa de sidebar
 * - Aplicar layout do dashboard
 * - AuthGuard cuida da autenticação
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuthV2()
  const pathname = usePathname()

  // Verifica se estamos em uma rota do dashboard que precisa de proteção
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/meus-cursos") ||
    pathname.startsWith("/minhas-aulas") ||
    pathname.startsWith("/trilha-aprendizado") ||
    pathname.startsWith("/assistir-curso") ||
    pathname.startsWith("/minhas-aulas/adicionar") ||
    pathname.startsWith("/administracao") ||
    pathname.startsWith("/certificados")

  // Rotas que não precisam de sidebar (fullscreen)
  const isFullscreenRoute =
    pathname.startsWith("/assistir-curso") ||
    pathname.startsWith("/minhas-aulas/adicionar") ||
    pathname.startsWith("/minhas-aulas/editar")

  // Se não é rota do dashboard, renderiza sem proteção
  if (!isDashboardRoute) {
    return <>{children}</>
  }

  // Para rotas do dashboard, usar AuthGuardV2 com loading customizado
  return (
    <AuthGuardV2
      fallback={<DashboardLoadingScreen />}
      redirectTo="/"
    >
      {isFullscreenRoute ? (
        // Rotas fullscreen (sem sidebar)
        <>{children}</>
      ) : (
        // Layout padrão do dashboard com sidebar
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
          <DashboardSidebar user={user} />
          <main className="flex-1 overflow-y-auto">
            <div className="transition-opacity duration-150 ease-in-out">
              {children}
            </div>
          </main>
        </div>
      )}
    </AuthGuardV2>
  )
}

/**
 * Loading screen customizado para o dashboard
 */
function DashboardLoadingScreen() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      {/* Sidebar placeholder */}
      <div className="w-64 bg-slate-800/50 border-r border-slate-700/50 animate-pulse" />
      
      {/* Loading content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Carregando dashboard...</p>
        </div>
      </div>
    </div>
  )
}
