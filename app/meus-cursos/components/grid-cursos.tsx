"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Edit, Trash2, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { atualizarStatusCurso } from "../actions"
import { useRouter } from "next/navigation"

interface Curso {
  id: string
  titulo: string
  descricao: string
  nivel: string
  ativo: boolean
  imagem_url?: string
  duracao_total?: number
  criado_em: string
  atualizado_em: string
}

interface GridCursosProps {
  cursos: Curso[]
  onEditarCurso: (curso: Curso) => void
  onExcluirCurso: (cursoId: string) => void
  onStatusChange: (cursoId: string, novoStatus: boolean) => void
  userId: string
}

export default function GridCursos({ cursos, onEditarCurso, onExcluirCurso, onStatusChange, userId }: GridCursosProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingStatus, setLoadingStatus] = useState<Record<string, boolean>>({})

  const formatarDuracao = (minutos?: number) => {
    if (!minutos) return "Não definida"
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    if (horas > 0) {
      return `${horas}h ${mins > 0 ? `${mins}min` : ""}`
    }
    return `${mins}min`
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR")
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case "iniciante":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "intermediario":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "avancado":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  const handleStatusChange = async (curso: Curso, novoStatus: boolean) => {
    setLoadingStatus((prev) => ({ ...prev, [curso.id]: true }))

    try {
      const result = await atualizarStatusCurso(curso.id, novoStatus, userId)

      if (result.success) {
        onStatusChange(curso.id, novoStatus)
        toast({
          variant: "success",
          title: "Status atualizado",
          description: `Curso ${novoStatus ? "ativado" : "desativado"} com sucesso!`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.message || "Erro ao atualizar status",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro inesperado ao atualizar status",
      })
    } finally {
      setLoadingStatus((prev) => ({ ...prev, [curso.id]: false }))
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  const handleEditarCurso = (curso: Curso) => {
    router.push(`/meus-cursos/editar/${curso.id}`)
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {cursos.map((curso) => (
        <motion.div
          key={curso.id}
          variants={itemVariants}
          className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          {/* Imagem de Capa */}
          <div className="aspect-video w-full bg-slate-700 relative overflow-hidden">
            {curso.imagem_url ? (
              <img
                src={curso.imagem_url || "/placeholder.svg"}
                alt={curso.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-2xl">📚</span>
                  </div>
                  <p className="text-slate-400 text-sm">Sem imagem</p>
                </div>
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {/* Título */}
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{curso.titulo}</h3>

            {/* Toggle Ativo/Inativo */}
            <div className="flex items-center justify-between mb-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
              <span className="text-sm text-slate-300">{curso.ativo ? "Curso ativo" : "Curso inativo"}</span>
              <Switch
                checked={curso.ativo}
                onCheckedChange={(checked) => handleStatusChange(curso, checked)}
                disabled={loadingStatus[curso.id]}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>

            {/* Nível */}
            <div className="mb-3">
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getNivelColor(curso.nivel)}`}
              >
                {curso.nivel.charAt(0).toUpperCase() + curso.nivel.slice(1)}
              </span>
            </div>

            {/* Descrição */}
            <p className="text-slate-400 text-sm mb-4 line-clamp-3">{curso.descricao}</p>

            {/* Informações */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Clock className="w-3 h-3" />
                <span>{formatarDuracao(curso.duracao_total)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <Calendar className="w-3 h-3" />
                <span>Criado em {formatarData(curso.criado_em)}</span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleEditarCurso(curso)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              >
                <Edit className="w-3 h-3 mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                onClick={() => onExcluirCurso(curso.id)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
