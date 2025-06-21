"use client"

import { useState } from "react"
import { Download, RotateCcw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PDFViewerProps {
  src: string
  title: string
  onProgress?: () => void
}

export function PDFViewer({ src, title, onProgress }: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const handleLoad = () => {
    setIsLoading(false)
    onProgress?.()
  }

  const handleError = () => {
    setError("Erro ao carregar o PDF")
    setIsLoading(false)
  }

  const downloadPDF = () => {
    const link = document.createElement("a")
    link.href = src
    link.download = `${title}.pdf`
    link.target = "_blank"
    link.click()
  }

  const openInNewTab = () => {
    window.open(src, "_blank")
  }

  if (error) {
    return (
      <div className="w-full h-[80vh] bg-slate-800 rounded-lg flex items-center justify-center">
        <div className="text-center text-slate-400">
          <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Erro ao carregar PDF</p>
          <p className="text-sm mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={openInNewTab}
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir em nova aba
            </Button>
            <Button
              variant="outline"
              onClick={downloadPDF}
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[80vh] bg-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header do PDF */}
      <div className="bg-slate-700/50 p-4 border-b border-slate-600/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
              DOCUMENTO
            </Badge>
            <span className="text-white font-medium truncate">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadPDF}
              className="text-slate-400 hover:text-white hover:bg-slate-600/50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openInNewTab}
              className="text-slate-400 hover:text-white hover:bg-slate-600/50"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Nova aba
            </Button>
          </div>
        </div>
      </div>

      {/* Área do PDF */}
      <div className="relative flex-1 min-h-0">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center z-10">
            <div className="text-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400 mx-auto mb-4"></div>
              <p>Carregando documento...</p>
              <p className="text-xs text-slate-500 mt-2">URL: {src}</p>
            </div>
          </div>
        )}

        <iframe
          src={`${src}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleError}
          title={title}
          allow="fullscreen"
        />
      </div>

      {/* Footer do PDF */}
      <div className="bg-slate-700/30 p-3 border-t border-slate-600/50 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Use os controles do navegador para navegar pelo documento</span>
          <div className="flex items-center gap-4">
            <span>Zoom, navegação e busca disponíveis</span>
          </div>
        </div>
      </div>
    </div>
  )
}
