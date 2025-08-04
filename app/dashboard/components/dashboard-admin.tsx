"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useMobile } from "@/hooks/use-mobile"
import { RefreshCw, BookOpen, GraduationCap, Users } from "lucide-react"
import { getAdminStats } from "../admin-actions"
import { GridAlunos } from "./grid-alunos"
import { getSignedPhotoUrl } from "./sidebar-actions"
import type { User } from "@/lib/auth-service"
import { getUserFresh } from "./sidebar-actions"

// URL da imagem padrão - será carregada dinamicamente
let DEFAULT_IMAGE_URL = "https://avs3.guardia.work/rar/DM011730_copy-removebg-preview.png"

// Função para carregar a URL padrão dinamicamente
async function loadDefaultImageUrl() {
  try {
    const { getDefaultImageUrlClient } = await import("@/lib/minio-config")
    DEFAULT_IMAGE_URL = getDefaultImageUrlClient()
  } catch (error) {
    console.error("Erro ao carregar URL padrão:", error)
  }
}

interface DashboardAdminProps {
  user: User
}

export function DashboardAdmin({ user }: DashboardAdminProps) {
  const [stats, setStats] = useState({
    cursosCount: 0,
    aulasCount: 0,
    alunosCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const isMobile = useMobile()

  // Carregar dados frescos do usuário e sua foto
  useEffect(() => {
    const loadFreshUserData = async () => {
      if (user?.email) {
        const freshUserData = await getUserFresh(user.email)

        if (freshUserData?.url_foto) {
          setPhotoLoading(true)

          try {
            const signedUrl = await getSignedPhotoUrl(freshUserData.url_foto)
            if (signedUrl) {
              setUserPhotoUrl(signedUrl)
            }
          } catch (error) {
            console.error("Erro ao carregar foto:", error)
          } finally {
            setPhotoLoading(false)
          }
        }
      }
    }

    if (user) {
      loadFreshUserData()
    }
  }, [user])

  useEffect(() => {
    if (user?.uid && !loading) {
      loadStats()
    }
  }, [user?.uid]) // Apenas reagir a mudanças no UID

  const loadStats = async () => {
    try {
      setLoading(true)
      console.log("📊 DashboardAdmin: Carregando estatísticas para:", { userId: user.uid, perfil: user.perfis })
      
      const adminStats = await getAdminStats(user.uid, user.perfis)
      console.log("📊 DashboardAdmin: Estatísticas recebidas:", adminStats)
      
      // Verificação defensiva
      if (adminStats && typeof adminStats === 'object') {
        const newStats = {
          cursosCount: adminStats.cursosCount || 0,
          aulasCount: adminStats.aulasCount || 0,
          alunosCount: adminStats.alunosCount || 0,
        }
        console.log("✅ DashboardAdmin: Definindo stats:", newStats)
        setStats(newStats)
      } else {
        console.warn("⚠️ DashboardAdmin: Estatísticas inválidas recebidas:", adminStats)
        setStats({
          cursosCount: 0,
          aulasCount: 0,
          alunosCount: 0,
        })
      }
    } catch (error) {
      console.error("❌ DashboardAdmin: Erro ao carregar estatísticas:", error)
      setStats({
        cursosCount: 0,
        aulasCount: 0,
        alunosCount: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadStats()
    setRefreshing(false)
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

  const isAdmin = user.perfis === "admin"

  // Determinar qual foto usar
  const getHeroImage = () => {
    if (userPhotoUrl) {
      return userPhotoUrl
    }
    loadDefaultImageUrl()
    return DEFAULT_IMAGE_URL
  }

  return (
    <motion.div className="p-4 md:p-8" initial="hidden" animate="visible" variants={pageVariants}>
      <div className="max-w-7xl mx-auto">
        {/* Botão de atualizar */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando..." : "Atualizar dados"}
          </button>
        </div>

        {/* Hero Card */}
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
                          src={getHeroImage() || "/placeholder.svg"}
                          alt="Foto do instrutor"
                          className="w-24 h-32 object-cover rounded-xl"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_IMAGE_URL
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 ml-32 p-6">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-slate-200 to-blue-400 bg-clip-text text-transparent leading-tight">
                    {isAdmin ? "Painel Administrativo" : "Painel do Instrutor"}
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
                          src={getHeroImage() || "/placeholder.svg"}
                          alt="Foto do instrutor"
                          className="w-32 h-44 md:w-36 md:h-48 object-cover rounded-xl"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_IMAGE_URL
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 ml-48 p-8">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-slate-200 to-blue-400 bg-clip-text text-transparent leading-tight">
                    {isAdmin ? "Painel Administrativo" : "Painel do Instrutor"}
                  </h1>
                  <p className="text-2xl md:text-3xl font-semibold text-white mt-2">{user?.nome || "Usuário"}!</p>
                  <p className="text-slate-400 text-base mt-3">
                    {isAdmin
                      ? "Gerencie toda a plataforma e acompanhe as estatísticas globais"
                      : "Gerencie seus cursos, aulas e acompanhe seus alunos"}
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Cards de estatísticas - 3 cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={itemVariants}>
          {/* Card de Cursos */}
          <motion.div
            className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-indigo-500/30"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{isAdmin ? "Total de Cursos" : "Seus Cursos"}</h3>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-slate-700 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              {loading ? "Carregando..." : isAdmin ? `Total de cursos na plataforma` : `Cursos que você criou`}
            </p>
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
              {loading ? "-" : stats.cursosCount}
            </div>
          </motion.div>

          {/* Card de Aulas */}
          <motion.div
            className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-green-500/30"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{isAdmin ? "Total de Aulas" : "Suas Aulas"}</h3>
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-slate-700 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              {loading ? "Carregando..." : isAdmin ? `Total de aulas na plataforma` : `Aulas que você criou`}
            </p>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              {loading ? "-" : stats.aulasCount}
            </div>
          </motion.div>

          {/* Card de Alunos */}
          <motion.div
            className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-amber-500/30"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{isAdmin ? "Total de Alunos" : "Seus Alunos"}</h3>
              <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-slate-700 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              {loading
                ? "Carregando..."
                : isAdmin
                  ? `Alunos ativos na plataforma`
                  : `Alunos matriculados em seus cursos`}
            </p>
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              {loading ? "-" : stats.alunosCount}
            </div>
          </motion.div>
        </motion.div>

        {/* Grid de Alunos */}
        <motion.div className="mt-8" variants={itemVariants}>
          <GridAlunos user={user} />
        </motion.div>
      </div>
    </motion.div>
  )
}
