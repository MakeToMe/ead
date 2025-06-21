"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookOpen, Play, Clock, GraduationCap, Star, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  buscarCursosDisponiveis,
  buscarCursosMatriculados,
  matricularEmCurso,
  type CursoDisponivel,
  type CursoMatriculado,
} from "./actions"

export default function TrilhaAprendizadoPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cursosMatriculados, setCursosMatriculados] = useState<CursoMatriculado[]>([])
  const [cursosDisponiveis, setCursosDisponiveis] = useState<CursoDisponivel[]>([])
  const [carregandoMatriculados, setCarregandoMatriculados] = useState(true)
  const [carregandoDisponiveis, setCarregandoDisponiveis] = useState(true)
  const [matriculando, setMatriculando] = useState<string | null>(null)
  const { toast } = useToast()

  // Carregar cursos matriculados
  useEffect(() => {
    const carregarCursosMatriculados = async () => {
      if (!user?.uid) return

      try {
        const resultado = await buscarCursosMatriculados(user.uid)
        if (resultado.success) {
          setCursosMatriculados(resultado.data || [])
        }
      } catch (error) {
        console.error("Erro ao carregar cursos matriculados:", error)
      } finally {
        setCarregandoMatriculados(false)
      }
    }

    carregarCursosMatriculados()
  }, [user?.uid])

  // Carregar cursos disponíveis
  useEffect(() => {
    const carregarCursosDisponiveis = async () => {
      if (!user?.uid) return

      try {
        const resultado = await buscarCursosDisponiveis(user.uid)
        if (resultado.success) {
          setCursosDisponiveis(resultado.data || [])
        }
      } catch (error) {
        console.error("Erro ao carregar cursos disponíveis:", error)
      } finally {
        setCarregandoDisponiveis(false)
      }
    }

    carregarCursosDisponiveis()
  }, [user?.uid])

  const handleMatricula = async (cursoId: string) => {
    if (!user?.uid) return

    setMatriculando(cursoId)
    try {
      const resultado = await matricularEmCurso(cursoId, user.uid)

      if (resultado.success) {
        toast({
          variant: "success",
          title: "Sucesso!",
          description: resultado.message,
        })

        // Recarregar listas
        const [matriculados, disponiveis] = await Promise.all([
          buscarCursosMatriculados(user.uid),
          buscarCursosDisponiveis(user.uid),
        ])

        if (matriculados.success) setCursosMatriculados(matriculados.data || [])
        if (disponiveis.success) setCursosDisponiveis(disponiveis.data || [])
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: resultado.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao fazer matrícula",
      })
    } finally {
      setMatriculando(null)
    }
  }

  const continuarCurso = (cursoId: string) => {
    router.push(`/assistir-curso/${cursoId}`)
  }

  const formatarDuracao = (minutos: number) => {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    if (horas > 0) {
      return `${horas}h ${mins}min`
    }
    return `${mins}min`
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "concluida":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "pausada":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativa":
        return "Ativa"
      case "concluida":
        return "Concluída"
      case "pausada":
        return "Pausada"
      default:
        return "Inativa"
    }
  }

  // Calcular cursos não matriculados
  const cursosNaoMatriculados = cursosDisponiveis.filter((curso) => !curso.matriculado)
  const totalCursosDisponiveis = cursosDisponiveis.length
  const temCursosDisponiveis = totalCursosDisponiveis > 0

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Trilha de Aprendizado</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Acompanhe seu progresso e descubra novos cursos para expandir seus conhecimentos
          </p>
        </motion.div>

        {/* Cursos Matriculados */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white">Meus Cursos</h2>
            <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
              {cursosMatriculados.length}
            </Badge>
          </div>

          {carregandoMatriculados ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
                  <div className="h-48 bg-slate-700 rounded-t-lg"></div>
                  <CardHeader className="space-y-3">
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-3 bg-slate-700 rounded"></div>
                    <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cursosMatriculados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursosMatriculados.map((curso, index) => (
                <motion.div
                  key={curso.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200 h-full overflow-hidden">
                    {/* Imagem do Curso */}
                    <div className="relative h-48 w-full overflow-hidden">
                      {curso.imagem_url ? (
                        <Image
                          src={curso.imagem_url || "/placeholder.svg"}
                          alt={curso.titulo}
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-slate-500" />
                        </div>
                      )}
                      {/* Badge de Status sobreposto */}
                      <div className="absolute top-3 right-3">
                        <Badge className={getStatusColor(curso.status)}>{getStatusLabel(curso.status)}</Badge>
                      </div>
                    </div>

                    <CardHeader className="space-y-3">
                      <CardTitle className="text-white text-lg leading-tight">{curso.titulo}</CardTitle>
                      <p className="text-slate-400 text-sm">por {curso.instrutor_nome}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-slate-300 text-sm line-clamp-2">{curso.descricao}</p>

                      {/* Progresso */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Progresso</span>
                          <span className="text-indigo-400 font-medium">{curso.progresso_percentual}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-indigo-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${curso.progresso_percentual}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-400 pt-2 border-t border-slate-700/50">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Play className="w-4 h-4" />
                            <span>{curso.total_aulas}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatarDuracao(curso.duracao_total)}</span>
                          </div>
                        </div>
                        <span className="text-xs">{formatarData(curso.data_matricula)}</span>
                      </div>

                      <Button
                        onClick={() => continuarCurso(curso.id)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                      >
                        Continuar Curso
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800/30 border-slate-700/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum curso matriculado</h3>
                <p className="text-slate-400 mb-6 max-w-md">
                  Você ainda não se matriculou em nenhum curso. Explore os cursos disponíveis abaixo e comece sua
                  jornada de aprendizado!
                </p>
              </CardContent>
            </Card>
          )}
        </motion.section>

        {/* Cursos Disponíveis - Só mostra se existem cursos no sistema */}
        {temCursosDisponiveis && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Cursos Disponíveis</h2>
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {cursosNaoMatriculados.length}
              </Badge>
            </div>

            {carregandoDisponiveis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700/50 animate-pulse">
                    <div className="h-48 bg-slate-700 rounded-t-lg"></div>
                    <CardHeader className="space-y-3">
                      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-3 bg-slate-700 rounded"></div>
                      <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                      <div className="h-8 bg-slate-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : cursosNaoMatriculados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cursosNaoMatriculados.map((curso, index) => (
                  <motion.div
                    key={curso.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200 h-full overflow-hidden">
                      {/* Imagem do Curso */}
                      <div className="relative h-48 w-full overflow-hidden">
                        {curso.imagem_url ? (
                          <Image
                            src={curso.imagem_url || "/placeholder.svg"}
                            alt={curso.titulo}
                            fill
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-slate-500" />
                          </div>
                        )}
                      </div>

                      <CardHeader className="space-y-3">
                        <CardTitle className="text-white text-lg leading-tight">{curso.titulo}</CardTitle>
                        <p className="text-slate-400 text-sm">por {curso.instrutor_nome}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-slate-300 text-sm line-clamp-2">{curso.descricao}</p>

                        <div className="flex items-center justify-between text-sm text-slate-400 pt-2 border-t border-slate-700/50">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Play className="w-4 h-4" />
                              <span>{curso.total_aulas}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatarDuracao(curso.duracao_total)}</span>
                            </div>
                          </div>
                          <span className="text-xs">{formatarData(curso.criado_em)}</span>
                        </div>

                        <Button
                          onClick={() => handleMatricula(curso.id)}
                          disabled={matriculando === curso.id}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          {matriculando === curso.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Matriculando...
                            </div>
                          ) : (
                            "Iniciar Curso"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800/30 border-slate-700/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Todos os cursos já foram iniciados</h3>
                  <p className="text-slate-400 max-w-md">
                    Parabéns! Você já se matriculou em todos os cursos disponíveis. Continue seus estudos nos cursos em
                    andamento.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.section>
        )}

        {/* Estado quando não há cursos no sistema */}
        {!carregandoDisponiveis && !temCursosDisponiveis && cursosMatriculados.length === 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="bg-slate-800/30 border-slate-700/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Nenhum curso disponível</h3>
                <p className="text-slate-400 max-w-lg">
                  Ainda não há cursos criados no sistema. Entre em contato com os instrutores ou aguarde novos cursos
                  serem adicionados.
                </p>
              </CardContent>
            </Card>
          </motion.section>
        )}
      </div>
    </div>
  )
}
