"use client"

import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

interface CertificadoActionsProps {
  linkPublico: string
}

export default function CertificadoActions({ linkPublico }: CertificadoActionsProps) {
  const copiarLink = () => {
    navigator.clipboard.writeText(linkPublico)

    // Toast notification melhorada
    const toast = document.createElement("div")
    toast.textContent = "✅ Link copiado!"
    toast.className =
      "fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg z-50 shadow-lg transition-all duration-300"
    document.body.appendChild(toast)

    // Animação de entrada
    setTimeout(() => (toast.style.transform = "translateY(0)"), 10)

    // Remover após 3 segundos
    setTimeout(() => {
      toast.style.transform = "translateY(-100%)"
      setTimeout(() => document.body.removeChild(toast), 300)
    }, 3000)
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Compartilhar</h3>
      <div className="space-y-3">
        <Button asChild variant="outline" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkPublico)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </Button>
        <Button asChild variant="outline" className="w-full bg-sky-500 hover:bg-sky-600 text-white border-sky-500">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(linkPublico)}&text=Confira%20meu%20certificado%20de%20conclusão!`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitter
          </a>
        </Button>
        <Button
          onClick={copiarLink}
          variant="outline"
          className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copiar Link
        </Button>
      </div>
    </div>
  )
}
