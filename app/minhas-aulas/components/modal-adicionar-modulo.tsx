"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle } from "lucide-react"
import { criarModulo, buscarCursosDoInstrutor } from "../actions"
import type { ModuloData } from "../actions"
import { getCurrentClientUser } from "@/lib/auth-client"
import { useToast } from "@/hooks/use-toast"

interface ModalAdicionarModuloProps {
  onModuloAdicionado: () => void
}

interface Curso {
  id: string
  titulo: string
}

export default function ModalAdicionarModulo({ onModuloAdicionado }: ModalAdicionarModuloProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    curso_id: "",
    titulo: "",
    descricao: "",
    ordem: "",
    ativo: true,
  })

  // Carregar cursos quando o modal abrir
  useEffect(() => {
    if (open) {
      carregarCursos()
    }
  }, [open])

  const carregarCursos = async () => {
    const currentUser = getCurrentClientUser()
    if (!currentUser?.uid) return

    setLoadingCursos(true)
    try {
      const result = await buscarCursosDoInstrutor(currentUser.uid)
      if (result.success) {
        setCursos(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar cursos:", error)
    } finally {
      setLoadingCursos(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const currentUser = getCurrentClientUser()
      if (!currentUser?.uid) {
        toast({
          variant: "destructive",
          title: "Erro de autenticação",
          description: "Usuário não identificado",
        })
        return
      }

      // Validações
      if (!formData.curso_id) {
        toast({
          variant: "destructive",
          title: "Campo obrigatório",
          description: "Selecione um curso",
        })
        return
      }

      if (!formData.titulo.trim()) {
        toast({
          variant: "destructive",
          title: "Campo obrigatório",
          description: "Título é obrigatório",
        })
        return
      }

      if (!formData.descricao.trim()) {
        toast({
          variant: "destructive",
          title: "Campo obrigatório",
          description: "Descrição é obrigatória",
        })
        return
      }

      const moduloData: ModuloData = {
        curso_id: formData.curso_id,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim(),
        ordem: Number.parseInt(formData.ordem) || 1,
        ativo: formData.ativo,
      }

      const result = await criarModulo(moduloData, currentUser.uid)

      if (result.success) {
        toast({
          variant: "success",
          title: "✅ Sucesso!",
          description: "Módulo criado com sucesso!",
        })
        setOpen(false)
        resetForm()
        onModuloAdicionado()
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao criar módulo",
          description: result.message || "Erro inesperado",
        })
      }
    } catch (error) {
      console.error("Erro:", error)
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Erro inesperado ao criar módulo",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      curso_id: "",
      titulo: "",
      descricao: "",
      ordem: "",
      ativo: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
          <PlusCircle className="w-4 h-4 mr-2" />
          Adicionar Módulo
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-800/95 to-gray-900/95 border-slate-700/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Adicionar Novo Módulo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Curso */}
          <div className="space-y-2">
            <Label className="text-slate-300">Curso *</Label>
            <Select
              value={formData.curso_id}
              onValueChange={(value) => setFormData({ ...formData, curso_id: value })}
              disabled={loadingCursos}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-green-500/50 text-white">
                <SelectValue placeholder={loadingCursos ? "Carregando cursos..." : "Selecione o curso"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800/95 border-slate-700 text-white backdrop-blur-sm">
                {cursos.map((curso) => (
                  <SelectItem key={curso.id} value={curso.id} className="focus:bg-slate-700/80 focus:text-white">
                    {curso.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-slate-300">
              Título do Módulo *
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Introdução ao React"
              className="bg-slate-800/50 border-slate-700 focus:border-green-500/50 text-white"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-slate-300">
              Descrição *
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o que será abordado neste módulo..."
              className="min-h-[100px] bg-slate-800/50 border-slate-700 focus:border-green-500/50 text-white"
              required
            />
          </div>

          {/* Ordem */}
          <div className="space-y-2">
            <Label htmlFor="ordem" className="text-slate-300">
              Ordem
            </Label>
            <Input
              id="ordem"
              type="number"
              min="1"
              value={formData.ordem}
              onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
              placeholder="1"
              className="bg-slate-800/50 border-slate-700 focus:border-green-500/50 text-white"
            />
          </div>

          {/* Status Ativo */}
          <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <div>
              <Label className="text-slate-300 font-medium">Módulo Ativo</Label>
              <p className="text-slate-400 text-sm">O módulo ficará visível para os alunos</p>
            </div>
            <Switch
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? "Criando..." : "Criar Módulo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
