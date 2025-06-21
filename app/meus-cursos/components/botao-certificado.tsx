"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Award, CheckCircle } from "lucide-react"
import { verificarElegibilidadeCertificado, emitirCertificado } from "@/app/certificados/actions"
import { toast } from "@/hooks/use-toast"

interface BotaoCertificadoProps {
  cursoId: string
  userId: string
  progresso: number
  className?: string
}

export default function BotaoCertificado({ cursoId, userId, progresso, className }: BotaoCertificadoProps) {
  const [loading, setLoading] = useState(false)
  const [certificadoEmitido, setCertificadoEmitido] = useState<string | null>(null)

  const handleEmitirCertificado = async () => {
    if (progresso < 100) {
      toast({
        title: "Curso não concluído",
        description: `Complete 100% do curso para obter o certificado. Progresso atual: ${progresso}%`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Primeiro verificar elegibilidade
      const elegibilidade = await verificarElegibilidadeCertificado(cursoId, userId)

      if (!elegibilidade.elegivel) {
        if (elegibilidade.certificado_existente) {
          setCertificadoEmitido(elegibilidade.certificado_existente.numero_certificado)
          toast({
            title: "Certificado já emitido",
            description: `Certificado ${elegibilidade.certificado_existente.numero_certificado} já foi emitido para este curso.`,
          })
        } else {
          toast({
            title: "Não elegível",
            description: elegibilidade.motivo,
            variant: "destructive",
          })
        }
        return
      }

      // Emitir certificado
      const resultado = await emitirCertificado(cursoId, userId)

      if (resultado.success && resultado.certificado) {
        setCertificadoEmitido(resultado.certificado.numero_certificado)
        toast({
          title: "Certificado emitido!",
          description: `Certificado ${resultado.certificado.numero_certificado} foi emitido com sucesso.`,
        })
      } else {
        toast({
          title: "Erro ao emitir certificado",
          description: resultado.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao emitir certificado:", error)
      toast({
        title: "Erro interno",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Se curso não está 100% concluído
  if (progresso < 100) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="bg-slate-700/50 border-slate-600 text-slate-400 cursor-not-allowed"
        disabled
      >
        <Award className="h-4 w-4 mr-2" />
        Certificado ({progresso}%)
      </Button>
    )
  }

  // Se certificado já foi emitido
  if (certificadoEmitido) {
    return (
      <Button
        size="sm"
        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
        onClick={() => window.open(`/certificados`, "_blank")}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Certificado Emitido
      </Button>
    )
  }

  // Botão para emitir certificado
  return (
    <Button
      size="sm"
      className={`bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white ${className}`}
      onClick={handleEmitirCertificado}
      disabled={loading}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
      ) : (
        <Award className="h-4 w-4 mr-2" />
      )}
      {loading ? "Emitindo..." : "Obter Certificado"}
    </Button>
  )
}
