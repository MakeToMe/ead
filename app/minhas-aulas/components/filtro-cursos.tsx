"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, ChevronDown, Filter, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Atualizar a interface Curso para incluir a contagem de aulas
interface Curso {
  id: string
  titulo: string
  totalAulas?: number
}

interface FiltroCursosProps {
  cursos: Curso[]
  cursoSelecionado: string | null
  onCursoSelecionado: (cursoId: string | null) => void
}

// Atualizar o componente para exibir o ícone e a contagem
export default function FiltroCursos({ cursos, cursoSelecionado, onCursoSelecionado }: FiltroCursosProps) {
  const [cursoAtual, setCursoAtual] = useState<Curso | null>(null)

  useEffect(() => {
    if (cursoSelecionado) {
      const curso = cursos.find((c) => c.id === cursoSelecionado)
      setCursoAtual(curso || null)
    } else {
      setCursoAtual(null)
    }
  }, [cursoSelecionado, cursos])

  const handleSelectCurso = (cursoId: string | null) => {
    onCursoSelecionado(cursoId)
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-slate-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-4 mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-white font-medium">Filtrar por curso</h2>
            <p className="text-slate-400 text-sm">
              {cursoAtual ? `Mostrando aulas de: ${cursoAtual.titulo}` : "Mostrando todas as aulas"}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:text-white text-slate-300"
            >
              {cursoAtual ? cursoAtual.titulo : "Todos os cursos"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-slate-800/95 border-slate-700 text-white backdrop-blur-sm">
            <DropdownMenuItem
              className="focus:bg-slate-700/80 focus:text-white"
              onClick={() => handleSelectCurso(null)}
            >
              <div className="flex items-center justify-between w-full">
                <span>Todos os cursos</span>
                {!cursoAtual && <Check className="h-4 w-4 text-indigo-400" />}
              </div>
            </DropdownMenuItem>
            {cursos.map((curso) => (
              <DropdownMenuItem
                key={curso.id}
                className="focus:bg-slate-700/80 focus:text-white"
                onClick={() => handleSelectCurso(curso.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{curso.titulo}</span>
                  <div className="flex items-center gap-2">
                    {cursoAtual?.id === curso.id && <Check className="h-4 w-4 text-indigo-400" />}
                    <div className="flex items-center gap-1 bg-slate-700/50 px-2 py-0.5 rounded-full">
                      <PlayCircle className="h-3 w-3 text-indigo-400" />
                      <span className="text-xs font-medium text-slate-300">{curso.totalAulas || 0}</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}
