"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCursosDisponiveis, matricularAlunoManualmente } from "../admin-actions"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/auth-client"

interface Curso {
  id: string
  titulo: string
  nivel: string
  ativo: boolean
}

interface Aluno {
  uid: string
  nome: string
  email: string
  cursos: Array<{ id: string; titulo: string }>
}

interface ModalAdicionarCursoProps {
  isOpen: boolean
  onClose: () => void
  aluno: Aluno
  user: User
  onSuccess: () => void
}

export function ModalAdicionarCurso({ isOpen, onClose, aluno, user, onSuccess }: ModalAdicionarCursoProps) {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [matriculando, setMatriculando] = useState(false)
  const [cursoSelecionado, setCursoSelecionado] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadCursos()
    }
  }, [isOpen])

  const loadCursos = async () => {
    try {
      setLoading(true)
      const cursosDisponiveis = await getCursosDisponiveis(user.uid, user.perfis, aluno.uid)
      setCursos(cursosDisponiveis)
    } catch (error) {
      console.error("Erro ao carregar cursos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar cursos disponíveis",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMatricular = async () => {
    if (!cursoSelecionado) {
      toast({
        title: "Atenção",
        description: "Selecione um curso para matricular o aluno",
        variant: "destructive",
      })
      return
    }

    try {
      setMatriculando(true)
      const result = await matricularAlunoManualmente(user.uid, aluno.uid, cursoSelecionado)

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `${aluno.nome} foi matriculado no curso com sucesso`,
        })
        onSuccess()
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao matricular aluno",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao matricular:", error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setMatriculando(false)
    }
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel.toLowerCase()) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-xl font-semibold text-white">Adicionar Curso</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Matricular <span className="text-white font-medium">{aluno.nome}</span> em um novo curso
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                  <span className="ml-2 text-slate-400">Carregando cursos...</span>
                </div>
              ) : cursos.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm">Selecione um curso para matricular o aluno:</p>

                  <div className="grid gap-3 max-h-80 overflow-y-auto">
                    {cursos.map((curso) => (
                      <div
                        key={curso.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          cursoSelecionado === curso.id
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                        }`}
                        onClick={() => setCursoSelecionado(curso.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{curso.titulo}</h3>
                              <Badge className={`text-xs ${getNivelColor(curso.nivel)}`}>{curso.nivel}</Badge>
                            </div>
                          </div>

                          {cursoSelecionado === curso.id && (
                            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300">Nenhum curso disponível</p>
                  <p className="text-slate-400 text-sm mt-1">
                    O aluno já está matriculado em todos os cursos disponíveis
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {cursos.length > 0 && (
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-700 text-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleMatricular}
                  disabled={!cursoSelecionado || matriculando}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {matriculando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Matriculando...
                    </>
                  ) : (
                    "Matricular Aluno"
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
