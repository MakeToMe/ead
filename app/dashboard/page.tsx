"use client"

import { useEffect, useState } from "react"
import { useAuthV2 } from "@/contexts/auth-context-v2"
import type { User } from "@/lib/auth-service-v2"
import { getUserFreshData, getDashboardStats, marcarAtividadesComoVisualizadas } from "./actions"
import { DashboardAdmin } from "./components/dashboard-admin"
import { useMobile } from "@/hooks/use-mobile"
import { motion } from "framer-motion"
import { RefreshCw, Play, CheckCircle, Award, BookOpen, Clock, Calendar, Bug } from "lucide-react"
import Link from "next/link"
import { getSignedPhotoUrl } from "./components/sidebar-actions"

// Placeholder simples - sem carregamento dinâmico
const DEFAULT_IMAGE_URL = "/placeholder.svg"

// Tipos para atividades recentes
interface Atividade {
  id: string
  tipo_atividade: string
  titulo: string
  descricao: string
  icone: string
  cor_icone: string
  url: string
  criado_em: string
  visualizada: boolean
}

// Dashboard para alunos (dashboard original)
function DashboardAluno({ user }: { user: User }) {
  const [stats, setStats] = useState({
    coursesCount: 0,
    certificatesCount: 0,
    recentActivities: [] as Atividade[],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)

  const isMobile = useMobile()

  // Carregar foto do usuário se for instrutor/admin
  useEffect(() => {
    const loadUserPhoto = async () => {
      // console.debug("🔍 Verificando se deve carregar foto personalizada...")
      // console.debug("Perfil do usuário:", user?.perfis)
      // console.debug("URL da foto:", user?.url_foto)

      if ((user?.perfis === "instrutor" || user?.perfis === "admin") && user?.url_foto) {
        // console.debug("✅ Usuário é instrutor/admin e tem foto - carregando...")
        setPhotoLoading(true)

        try {
          const signedUrl = await getSignedPhotoUrl(user.url_foto)
          // console.debug("📸 URL assinada recebida:", signedUrl)

          if (signedUrl) {
            // console.debug("✅ Foto carregada com sucesso para dashboard")
            setUserPhotoUrl(signedUrl)
          } else {
            // console.debug("❌ Não foi possível gerar URL assinada")
            setUserPhotoUrl(null)
          }
        } catch (error) {
          console.error("❌ Erro ao carregar foto:", error)
          setUserPhotoUrl(null)
        } finally {
          setPhotoLoading(false)
        }
      } else {
        // console.debug("ℹ️ Usuário é aluno ou não tem foto - usando foto padrão")
        setUserPhotoUrl(null)
      }
    }

    if (user) {
      loadUserPhoto()
    }
  }, [user])

  useEffect(() => {
    if (user?.uid) {
      loadFreshData(user.uid)
    }
  }, [user])

  const loadFreshData = async (userId: string) => {
    try {
      setLoading(true)
      const freshUserData = await getUserFreshData(userId)
      const dashboardStats = await getDashboardStats(userId)

      if (freshUserData) {
        // console.debug("Dados frescos recebidos:", freshUserData)
      }

      setStats(dashboardStats)

      if (dashboardStats.recentActivities?.length > 0) {
        await marcarAtividadesComoVisualizadas(userId)
      }
    } catch (error) {
      console.error("Erro ao carregar dados frescos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!user?.uid) return
    setRefreshing(true)
    await loadFreshData(user.uid)
    setRefreshing(false)
  }

  const getIconForActivity = (atividade: Atividade) => {
    const iconMap: Record<string, any> = {
      "play-circle": Play,
      "check-circle": CheckCircle,
      award: Award,
      "book-open": BookOpen,
      clock: Clock,
      calendar: Calendar,
      bug: Bug,
    }

    const IconComponent = iconMap[atividade.icone] || BookOpen
    const colorMap: Record<string, string> = {
      indigo: "text-indigo-400",
      green: "text-green-400",
      amber: "text-amber-400",
      blue: "text-blue-400",
      red: "text-red-400",
    }

    const colorClass = colorMap[atividade.cor_icone] || "text-indigo-400"

    return <IconComponent className={`h-5 w-5 ${colorClass}`} />
  }

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(data)
  }

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  // Determinar qual foto usar (sem carregamento dinâmico)
  const heroImageUrl = (user?.perfis === "instrutor" || user?.perfis === "admin") && userPhotoUrl 
    ? userPhotoUrl 
    : DEFAULT_IMAGE_URL

  return (
    <motion.div className="p-4 md:p-8" initial="hidden" animate="visible" variants={pageVariants}>
      <div className="max-w-7xl mx-auto">
        {/* Debug info - remover depois */}
        {(user?.perfis === "instrutor" || user?.perfis === "admin") && (
          <div className="mb-4 p-2 bg-slate-800 rounded text-xs text-slate-300">
            <strong>DEBUG:</strong> Perfil: {user?.perfis} | Foto URL: {user?.url_foto || "Nenhuma"} | Foto carregada:{" "}
            {userPhotoUrl ? "Sim" : "Não"} | Loading: {photoLoading ? "Sim" : "Não"}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-end mb-4 gap-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing || !user?.uid}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando..." : "Atualizar dados"}
          </button>
        </div>

        {/* Hero Card com Efeito 3D */}
        <motion.div className="relative mb-8" variants={itemVariants}>
          <div className="bg-gradient-to-r from-slate-700/80 to-slate-600/60 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-600/30 relative overflow-visible">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

            {/* Layout Mobile */}
            {isMobile ? (
              <div className="relative">
                <div className="absolute left-4 bottom-0 -top-4 z-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-black/30 rounded-2xl blur-xl transform translate-x-1 translate-y-1"></div>
                    <div className="relative rounded-2xl">
                      {photoLoading ? (
                        <div className="w-24 h-32 bg-slate-700 rounded-xl animate-pulse flex items-center justify-center">
                          <span className="text-slate-400 text-xs">Carregando...</span>
                        </div>
                      ) : (
                        <img
                          src={heroImageUrl || "/placeholder.svg"}
                          alt="Foto do usuário"
                          className="w-24 h-32 object-cover rounded-xl"
                          onError={(e) => {
                            // console.debug("❌ Erro ao carregar imagem, usando fallback")
                            e.currentTarget.src = DEFAULT_IMAGE_URL
                          }}
                          onLoad={() => {
                            // console.debug("✅ Imagem carregada com sucesso no hero")
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 ml-32 p-6">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-slate-200 to-blue-400 bg-clip-text text-transparent leading-tight">
                    Bem-vindo
                  </h1>
                  <p className="text-lg font-semibold text-white mt-1">{user?.nome || "Usuário"}!</p>
                </div>
              </div>
            ) : (
              <>
                <div className="absolute left-4 bottom-0 -top-6 z-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-black/30 rounded-2xl blur-xl transform translate-x-2 translate-y-2"></div>
                    <div className="relative rounded-2xl">
                      {photoLoading ? (
                        <div className="w-32 h-44 md:w-36 md:h-48 bg-slate-700 rounded-xl animate-pulse flex items-center justify-center">
                          <span className="text-slate-400 text-sm">Carregando foto...</span>
                        </div>
                      ) : (
                        <img
                          src={heroImageUrl || "/placeholder.svg"}
                          alt="Foto do usuário"
                          className="w-32 h-44 md:w-36 md:h-48 object-cover rounded-xl"
                          onError={(e) => {
                            // console.debug("❌ Erro ao carregar imagem, usando fallback")
                            e.currentTarget.src = DEFAULT_IMAGE_URL
                          }}
                          onLoad={() => {
                            // console.debug("✅ Imagem carregada com sucesso no hero")
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 ml-48 p-8">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-slate-200 to-blue-400 bg-clip-text text-transparent leading-tight">
                    Bem-vindo ao seu dashboard
                  </h1>
                  <p className="text-2xl md:text-3xl font-semibold text-white mt-2">{user?.nome || "Usuário"}!</p>
                  <p className="text-slate-400 text-base mt-3">
                    Gerencie seus cursos e acompanhe seu progresso na Plataforma R$antos
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Cards de estatísticas - Agora com 2 cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" variants={itemVariants}>
          <motion.div
            className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-indigo-500/30"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Seus Cursos</h3>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">📚</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              {loading
                ? "Carregando..."
                : `Você está matriculado em ${stats.coursesCount} ${stats.coursesCount === 1 ? "curso" : "cursos"}`}
            </p>
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
              {loading ? "-" : stats.coursesCount}
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-amber-500/30"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Certificados</h3>
              <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🏆</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">Certificados conquistados</p>
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              {loading ? "-" : stats.certificatesCount}
            </div>
          </motion.div>
        </motion.div>

        {/* Seção de atividades recentes */}
        <motion.div className="mt-8" variants={itemVariants}>
          <h2 className="text-2xl font-semibold text-white mb-6">Atividades Recentes</h2>
          <div className="bg-gradient-to-br from-slate-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl">
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-pulse flex space-x-4 w-full max-w-md">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-700 rounded"></div>
                      <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : stats.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="divide-y divide-slate-700/50">
                {stats.recentActivities.map((atividade) => (
                  <Link
                    href={atividade.url}
                    key={atividade.id}
                    className="block p-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 bg-slate-800/50 rounded-lg">{getIconForActivity(atividade)}</div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{atividade.titulo}</h3>
                        <p className="text-slate-400 text-sm">{atividade.descricao}</p>
                        <p className="text-slate-500 text-xs mt-1">{formatarData(atividade.criado_em)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-700/50 to-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <p className="text-slate-300 text-lg">Nenhuma atividade recente encontrada</p>
                <p className="text-slate-400 text-sm mt-2">
                  Suas atividades aparecerão aqui quando você começar a usar a plataforma
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user, isLoading } = useAuthV2()

  // Log removido - dados do usuário são logados apenas em caso de erro

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-400">Erro ao carregar dados do usuário</p>
        </div>
      </div>
    )
  }

  // Renderizar dashboard baseado no perfil
  if (user.perfis === "admin" || user.perfis === "instrutor") {
    return <DashboardAdmin user={user} />
  }

  // Dashboard padrão para alunos
  return <DashboardAluno user={user} />
}
