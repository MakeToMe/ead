"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  PlusCircle,
  PlayCircle,
  BookOpen,
  Settings,
  Award,
} from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { useAuthV2 } from "@/contexts/auth-context-v2"
import { usePhotoDisplay } from "@/hooks/use-photo"

interface DashboardSidebarProps {
  user?: any // Mantido para compatibilidade, mas não usado
}

export default function DashboardSidebar({ user: initialUser }: DashboardSidebarProps) {
  // Usar dados do hook otimizado
  const { user, signOut, profilePhotoUrl } = useAuthV2()
  
  // Usar hook de foto unificado, priorizando o profilePhotoUrl do contexto
  const { photoUrl, fallbackInitial, isLoading: photoLoading, hasError } = usePhotoDisplay(
    user?.uid,
    profilePhotoUrl || user?.url_foto,
    user?.nome
  )
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [manuallyCollapsed, setManuallyCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()

  // Logs removidos - dados do usuário e foto são logados apenas em caso de erro

  // Auto-collapse em telas pequenas, mas respeita escolha manual em desktop
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true)
      setIsMobileOpen(false)
    } else {
      setIsCollapsed(manuallyCollapsed)
    }
  }, [isMobile, manuallyCollapsed])

  const handleLogout = async () => {
    try {
      // AuthService cuida de tudo: servidor, cache, cookies, etc.
      await signOut()
      
      // Redirecionar para página inicial
      router.push("/")
      
    } catch (error) {
      console.error('❌ DashboardSidebar: Erro no logout', error)
      
      // Mesmo com erro, redirecionar
      router.push("/")
    }
  }

  const toggleCollapse = () => {
    if (!isMobile) {
      setManuallyCollapsed(!manuallyCollapsed)
      setIsCollapsed(!isCollapsed)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  // Dados vêm automaticamente do AuthService via hook otimizado

  const menuItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      href: "/trilha-aprendizado",
      icon: BookOpen,
      label: "Trilha de Aprendizado",
      isActive: pathname === "/trilha-aprendizado",
    },
    {
      href: "/certificados",
      icon: Award,
      label: "Certificados",
      isActive: pathname === "/certificados",
    },
    // Só mostrar para instrutores e admins
    ...(user?.perfis === "instrutor" || user?.perfis === "admin"
      ? [
          {
            href: "/meus-cursos",
            icon: PlusCircle,
            label: "Meus Cursos",
            isActive: pathname === "/meus-cursos",
          },
          {
            href: "/minhas-aulas",
            icon: PlayCircle,
            label: "Minhas Aulas",
            isActive: pathname === "/minhas-aulas",
          },
        ]
      : []),
    // Só mostrar para admins
    ...(user?.perfis === "admin"
      ? [
          {
            href: "/administracao",
            icon: Settings,
            label: "Administração",
            isActive: pathname === "/administracao",
          },
        ]
      : []),
  ]

  const bottomMenuItems = [
    {
      href: "/perfil",
      icon: User,
      label: "Perfil",
      isActive: pathname === "/perfil",
    },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">R$</span>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <h1 className="text-white font-bold text-lg whitespace-nowrap">R$antos</h1>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dados atualizados automaticamente via AuthService */}
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700/50">
        <AnimatePresence>
          {!isCollapsed ? (
            // Layout expandido - foto centralizada acima do texto
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center space-y-3"
            >
              {/* Foto do usuário */}
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-slate-700 rounded-full flex items-center justify-center overflow-hidden relative">
                {photoLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {photoUrl && !hasError && (
                      <img
                        src={photoUrl}
                        alt={user?.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log("❌ Erro ao carregar imagem, usando fallback")
                          // Esconder a imagem e mostrar fallback
                          const img = e.target as HTMLImageElement
                          img.style.display = 'none'
                          // Mostrar fallback
                          const fallback = img.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    )}
                    <span 
                      className="text-white font-bold text-xl absolute inset-0 flex items-center justify-center"
                      style={{ display: (!photoUrl || hasError) ? 'flex' : 'none' }}
                    >
                      {fallbackInitial}
                    </span>
                  </>
                )}
              </div>

              {/* Nome e perfil centralizados */}
              <div className="space-y-1">
                <p className="text-white font-medium text-sm">{user?.nome || "Carregando..."}</p>
                <p className="text-slate-400 text-xs capitalize">{user?.perfis || "aluno"}</p>
              </div>
            </motion.div>
          ) : (
            // Layout colapsado - apenas inicial pequena
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-slate-700 rounded-full flex items-center justify-center overflow-hidden relative">
                {photoLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {photoUrl && !hasError && (
                      <img
                        src={photoUrl}
                        alt={user?.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log("❌ Erro ao carregar imagem colapsada, usando fallback")
                          // Esconder a imagem e mostrar fallback
                          const img = e.target as HTMLImageElement
                          img.style.display = 'none'
                          // Mostrar fallback
                          const fallback = img.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    )}
                    <span 
                      className="text-white font-bold text-sm absolute inset-0 flex items-center justify-center"
                      style={{ display: (!photoUrl || hasError) ? 'flex' : 'none' }}
                    >
                      {fallbackInitial}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col">
        {/* Menu principal */}
        <ul className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    item.isActive
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Menu inferior (Perfil) */}
        <ul className="space-y-2 border-t border-slate-700/50 pt-4">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    item.isActive
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Toggle Button - Desktop only */}
      {!isMobile && (
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 border border-slate-600"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-white transition-all duration-200 lg:hidden"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          animate={{ width: isCollapsed ? 80 : 256 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-sm border-r border-slate-700/50 relative flex-shrink-0"
        >
          {sidebarContent}
        </motion.aside>
      )}

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
