"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import { excluirAula } from "../actions"
import { getCurrentClientUser } from "@/lib/auth-client"
import { useToast } from "@/hooks/use-toast"

interface Aula {
  id: string
  titulo: string
  cursos: { titulo: string }
}

interface ModalConfirmarExclusaoProps {
  aula: Aula | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAulaExcluida: () => void
}

export default function ModalConfirmarExclusao({
  aula,
  open,
  onOpenChange,
  onAulaExcluida,
}: ModalConfirmarExclusaoProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleConfirmarExclusao = async () => {
    if (!aula) return

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

      const result = await excluirAula(aula.id, currentUser.uid)

      if (result.success) {
        toast({
          variant: "success",
          title: "✅ Sucesso!",
          description: "Aula excluída com sucesso!",
        })
        onOpenChange(false)
        onAulaExcluida()
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao excluir aula",
          description: result.message || "Erro inesperado",
        })
      }
    } catch (error) {
      console.error("Erro:", error)
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Erro inesperado ao excluir aula",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!aula) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] bg-gradient-to-br from-slate-800/95 to-gray-900/95 border-slate-700/50 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-red-400">Confirmar Exclusão</DialogTitle>
              <DialogDescription className="text-slate-400">Esta ação não pode ser desfeita</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-white text-sm mb-2">Você está prestes a excluir a aula:</p>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-white font-medium">{aula.titulo}</p>
              <p className="text-slate-400 text-sm">Curso: {aula.cursos.titulo}</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-400 text-sm font-medium mb-1">Atenção:</p>
                <ul className="text-slate-300 text-xs space-y-1">
                  <li>• A aula será removida permanentemente</li>
                  <li>• Os alunos não terão mais acesso ao conteúdo</li>
                  <li>• A duração do curso será recalculada</li>
                  <li>• Esta ação não pode ser desfeita</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-0"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarExclusao}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0"
            >
              {loading ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
