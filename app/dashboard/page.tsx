"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { RefreshCw, BookOpen, Award, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDashboardStats, marcarAtividadesComoVisualizadas } from "./actions"

interface DashboardStats {
  coursesCount: number
  certificatesCount: number
  recentActivities: Array<{
    id: string
    titulo: string
    descricao: string
    criado_em: string
    url: string
  }>
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    coursesCount: 0,
    certificatesCount: 0,
    recentActivities: []
  })
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Carregar dados do dashboard
  const carregarDados = async (userId: string) => {
    setLoading(true)
    try {
      const dashboardStats = await getDashboardStats(userId)
      setStats(dashboardStats)

      // Marcar atividades como visualizadas se houver
      if (dashboardStats.recentActivities?.length > 0) {
        await marcarAtividadesComoVisualizadas(userId)
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados quando usuário estiver disponível
  useEffect(() => {
    if (user?.uid) {
      carregarDados(user.uid)
    }
  }, [user?.uid])

  // Função de refresh manual
  const handleRefresh = async () => {
    if (!user?.uid || refreshing) return
    setRefreshing(true)
    await carregarDados(user.uid)
    setRefreshing(false)
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  // Se não há usuário
  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Usuário não encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-slate-300 to-blue-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-400 text-lg mt-2">Bem-vindo, {user.nome}!</p>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Cursos Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Seus Cursos</h3>
              <BookOpen className="h-8 w-8 text-indigo-400" />
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Você está matriculado em {stats.coursesCount} {stats.coursesCount === 1 ? "curso" : "cursos"}
            </p>
            <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
              {stats.coursesCount}
            </div>
          </motion.div>

          {/* Certificados Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Certificados</h3>
              <Award className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-slate-400 text-sm mb-4">Certificados conquistados</p>
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              {stats.certificatesCount || 0}
            </div>
          </motion.div>
        </div>

        {/* Atividades Recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl"
        >
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-slate-400" />
              Atividades Recentes
            </h2>
          </div>

          <div className="p-6">
            {stats.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivities.map((atividade) => (
                  <div
                    key={atividade.id}
                    className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{atividade.titulo}</h3>
                      <p className="text-slate-400 text-sm">{atividade.descricao}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(atividade.criado_em).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-300 text-lg">Nenhuma atividade recente</p>
                <p className="text-slate-400 text-sm mt-2">
                  Suas atividades aparecerão aqui quando você começar a usar a plataforma
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}