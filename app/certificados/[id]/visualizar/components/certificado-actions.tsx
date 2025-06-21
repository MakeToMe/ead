"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CertificadoActionsProps {
  linkPublico: string
}

export default function CertificadoActions({ linkPublico }: CertificadoActionsProps) {
  const [copiado, setCopiado] = useState(false)
  const { toast } = useToast()

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkPublico)
      setCopiado(true)
      toast({
        title: "Link copiado!",
        description: "O link do certificado foi copiado para a área de transferência.",
        duration: 3000,
      })
      setTimeout(() => setCopiado(false), 2000)
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Share2 className="h-5 w-5 text-blue-400" />
        Compartilhar
      </h3>

      <div className="space-y-4">
        {/* Link para copiar */}
        <div>
          <label className="text-sm text-slate-400 block mb-2">Link público:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={linkPublico}
              readOnly
              className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
            />
            <Button
              onClick={copiarLink}
              size="sm"
              variant="outline"
              className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Botões de redes sociais */}
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1 bg-blue-700 hover:bg-blue-800">
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkPublico)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </Button>
          <Button asChild size="sm" className="flex-1 bg-sky-600 hover:bg-sky-700">
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(linkPublico)}&text=${encodeURIComponent("Acabei de receber meu certificado de conclusão!")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
