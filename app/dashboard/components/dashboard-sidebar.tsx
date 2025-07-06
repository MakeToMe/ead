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
  RefreshCw,
  PlusCircle,
  PlayCircle,
  BookOpen,
  Settings,
  Award,
} from "lucide-react"
import { destroyClientSession, ensureUserLoaded, type User as AuthUser } from "@/lib/auth-client"
import { useMobile } from "@/hooks/use-mobile"
import { getUserFresh, getSignedPhotoUrl } from "./sidebar-actions"

interface DashboardSidebarProps {
  user: AuthUser
}

export default function DashboardSidebar({ user: initialUser }: DashboardSidebarProps) {
  const [user, setUser] = useState<AuthUser>(initialUser)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [manuallyCollapsed, setManuallyCollapsed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useMobile()

  // Carregar foto do usuário
  useEffect(() => {
    const loadPhoto = async () => {
      if (user?.url_foto) {
        const signedUrl = await getSignedPhotoUrl(user.url_foto)
        if (signedUrl) {
          setPhotoUrl(signedUrl)
        } else {
          setPhotoUrl(null)
        }
      } else {
        setPhotoUrl(null)
      }
    }
    loadPhoto()
  }, [user?.url_foto, user?.email])

  // Atualiza dados do usuário quando a rota muda
  useEffect(() => {
    const refreshUserData = async () => {
      if (!user?.email) {
        return
      }

      try {
        const freshUser = await getUserFresh(user.email)
        if (freshUser) {
          // Verificar se é realmente o mesmo usuário
          if (freshUser.email !== user.email) {
            // Forçar logout se dados não conferem
            handleLogout()
            return
          }

          setUser(freshUser)

          // Atualizar foto se mudou
          if (freshUser.url_foto) {
            const signedUrl = await getSignedPhotoUrl(freshUser.url_foto)
            setPhotoUrl(signedUrl)
          } else {
            setPhotoUrl(null)
          }
        }
      } catch (error) {
        console.error("💥 Erro ao atualizar dados da sidebar:", error)
      }
    }

    // Refresh sempre que a rota mudar
    refreshUserData()

    // Refresh adicional quando sair da página de perfil
    if (pathname !== "/perfil") {
      const timer = setTimeout(refreshUserData, 500)
      return () => clearTimeout(timer)
    }
  }, [pathname, user?.email])

  // Adicionar listener para eventos customizados de atualização de perfil e sessão
  useEffect(() => {
    const handleProfileUpdate = async () => {
      if (user?.email) {
        const freshUser = await getUserFresh(user.email)
        if (freshUser) {
          setUser(freshUser)
          if (freshUser.url_foto) {
            const signedUrl = await getSignedPhotoUrl(freshUser.url_foto)
            setPhotoUrl(signedUrl)
          } else {
            setPhotoUrl(null)
          }
        }
      }
    }

    window.addEventListener("profileUpdated", handleProfileUpdate)
      const handleAuthChanged = async () => {
        const current = await ensureUserLoaded()
        if (!current) {
          // Sem sessão -> limpar e voltar à home
          setUser({} as AuthUser)
          setPhotoUrl(null)
          return
        }
        const latest = current
        if (latest) {
          setUser(latest)
          if (latest.url_foto) {
            const signedUrl = await getSignedPhotoUrl(latest.url_foto)
            setPhotoUrl(signedUrl)
          } else {
            setPhotoUrl(null)
          }
        } else {
          // Sem sessão => limpar user
          setUser({} as AuthUser)
          setPhotoUrl(null)
        }
      }
      window.addEventListener("auth-changed", handleAuthChanged)
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate)
      window.removeEventListener("auth-changed", handleAuthChanged)
    }
  }, [user?.email])

  // Auto-collapse em telas pequenas, mas respeita escolha manual em desktop
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true)
      setIsMobileOpen(false)
    } else {
      setIsCollapsed(manuallyCollapsed)
    }
  }, [isMobile, manuallyCollapsed])

  const handleLogout = () => {
    // Limpar todos os estados locais
    setUser({} as AuthUser)
    setPhotoUrl(null)

    // Limpar localStorage
    if (typeof window !== "undefined") {
      localStorage.clear()
      sessionStorage.clear()
    }

    // Destruir sessão
    destroyClientSession()

    // Forçar reload completo da página
    window.location.href = "/"
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

  // Atualização manual dos dados
  const refreshData = async () => {
    if (!user?.email || isRefreshing) return

    setIsRefreshing(true)

    try {
      const freshUser = await getUserFresh(user.email)
      if (freshUser) {
        setUser(freshUser)
        // Atualizar foto se mudou
        if (freshUser.url_foto) {
          const signedUrl = await getSignedPhotoUrl(freshUser.url_foto)
          setPhotoUrl(signedUrl)
        } else {
          setPhotoUrl(null)
        }
      }
    } catch (error) {
      console.error("💥 Erro no refresh manual:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

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

          {!isCollapsed && (
            <button
              onClick={refreshData}
              className="text-slate-400 hover:text-white transition-colors"
              disabled={isRefreshing}
              title="Atualizar dados"
            >
              <RefreshCw size={16} className={`${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}
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
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img
                    src={photoUrl || "/placeholder.svg"}
                    alt={user?.nome}
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.log("❌ Erro ao carregar imagem, usando fallback")
                      setPhotoUrl(null)
                    }}
                  />
                ) : (
                  <span className="text-white font-bold text-xl">{user?.nome?.charAt(0).toUpperCase() || "?"}</span>
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
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img
                    src={photoUrl || "/placeholder.svg"}
                    alt={user?.nome}
                    className="w-full h-full object-cover"
                    onError={() => setPhotoUrl(null)}
                  />
                ) : (
                  <span className="text-white font-bold text-sm">{user?.nome?.charAt(0).toUpperCase() || "?"}</span>
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
