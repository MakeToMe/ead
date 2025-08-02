"use client"

import { FileText, Video, BookOpen, AlertCircle } from "lucide-react"
import { VideoPlayer } from "./video-player"
import { PDFViewer } from "./pdf-viewer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AulaDetalhada } from "../actions"

interface ContentViewerProps {
  aula: AulaDetalhada
  onProgress?: (currentTime?: number, duration?: number) => void
  onCompleted?: () => void
}

export function ContentViewer({ aula, onProgress, onCompleted }: ContentViewerProps) {
  const getIconeAula = (tipo: string) => {
    switch (tipo) {
      case "video":
        return <Video className="w-8 h-8 text-indigo-400" />
      case "pdf":
      case "texto":
        return <FileText className="w-8 h-8 text-red-400" />
      default:
        return <BookOpen className="w-8 h-8 text-slate-400" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "video":
        return "VÍDEO"
      case "pdf":
        return "PDF"
      case "texto":
        return "DOCUMENTO"
      default:
        return "CONTEÚDO"
    }
  }

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "video":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
      case "pdf":
      case "texto":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Função para detectar se é PDF baseado na URL
  const isPDFContent = (tipo: string, url: string) => {
    return tipo === "pdf" || tipo === "texto" || url?.toLowerCase().includes(".pdf")
  }

  // Log para debug
  /* debug: dados da aula removido */

  // Se não há arquivo, mostrar estado vazio
  if (!aula.media_url) {
    return (
      <div className="w-full h-96 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700/50">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              {getIconeAula(aula.tipo)}
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{aula.titulo}</h3>
                <p className="text-slate-400 mb-4">{aula.descricao}</p>
                <Badge variant="secondary" className={getTipoBadgeColor(aula.tipo)}>
                  {getTipoLabel(aula.tipo)}
                </Badge>
              </div>
              <div className="text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Conteúdo em preparação</p>
                <p className="text-sm">Este material ainda não foi disponibilizado</p>
              </div>
              {/* Status info */}
              <div className="text-xs text-slate-600 bg-slate-700/30 p-2 rounded">
                <div>ID: {aula.id}</div>
                <div>Tipo: {aula.tipo}</div>
                <div>Status: Conteúdo não disponível</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Renderizar conteúdo baseado no tipo
  if (aula.tipo === "video") {
    return (
      <div className="w-full">
        <VideoPlayer src={aula.media_url} title={aula.titulo} onProgress={onProgress} onEnded={onCompleted} />
      </div>
    )
  }

  // Renderizar PDF para tipos "pdf", "texto" ou URLs que contenham .pdf
  if (isPDFContent(aula.tipo, aula.media_url)) {
    return (
      <div className="w-full">
        <PDFViewer src={aula.media_url} title={aula.titulo} onProgress={onCompleted} />
      </div>
    )
  }

  // Tipo desconhecido
  return (
    <div className="w-full h-96 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700/50">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">{aula.titulo}</h3>
              <p className="text-slate-400 mb-4">{aula.descricao}</p>
              <Badge variant="secondary" className={getTipoBadgeColor(aula.tipo)}>
                {getTipoLabel(aula.tipo)}
              </Badge>
            </div>
            <div className="text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Tipo de conteúdo não suportado</p>
              <p className="text-sm">Tipo: {aula.tipo}</p>
            </div>
            {/* Status info */}
            <div className="text-xs text-slate-600 bg-slate-700/30 p-2 rounded">
              <div>ID: {aula.id}</div>
              <div>Tipo: {aula.tipo}</div>
              <div>Status: Tipo não suportado</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
