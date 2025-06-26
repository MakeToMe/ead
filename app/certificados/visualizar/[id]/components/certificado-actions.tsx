"use client"

import { Button } from "@/components/ui/button"
import { Copy, Linkedin } from "lucide-react"

interface CertificadoActionsProps {
  linkPublico: string
  linkedInUrl: string
}

export default function CertificadoActions({ linkPublico, linkedInUrl }: CertificadoActionsProps) {
  const copiarLinkedIn = () => {
    navigator.clipboard.writeText(linkedInUrl)

    const toast = document.createElement("div")
    toast.textContent = "✅ Link do LinkedIn copiado!"
    toast.className =
      "fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg z-50 shadow-lg transition-all duration-300"
    document.body.appendChild(toast)
    setTimeout(() => (toast.style.transform = "translateY(0)"), 10)
    setTimeout(() => {
      toast.style.transform = "translateY(-100%)"
      setTimeout(() => document.body.removeChild(toast), 300)
    }, 3000)
  }

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
        <Button
          onClick={copiarLinkedIn}
          variant="outline"
          className="w-full bg-[#0077B5] hover:bg-[#00669B] text-white border-[#0077B5]"
        >
          <Linkedin className="h-4 w-4 mr-2" />
          Compartilhar Certificado
        </Button>
        <Button asChild variant="outline" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkPublico)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="h-4 w-4 mr-2" />
            Publicar Certificado
          </a>
        </Button>
        <Button asChild variant="outline" className="w-full bg-sky-500 hover:bg-sky-600 text-white border-sky-500">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(linkPublico)}&text=Confira%20meu%20certificado%20de%20conclusão!`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-4 w-4 mr-2"><path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.564-2.005.974-3.127 1.195-.897-.956-2.178-1.555-3.594-1.555-2.723 0-4.931 2.208-4.931 4.93 0 .386.045.762.127 1.124-4.094-.205-7.725-2.165-10.152-5.144-.424.729-.666 1.57-.666 2.475 0 1.708.87 3.213 2.188 4.099-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.419-1.68 1.318-3.809 2.105-6.102 2.105-.395 0-.779-.023-1.161-.067 2.179 1.396 4.768 2.213 7.557 2.213 9.054 0 14-7.496 14-13.986 0-.209 0-.42-.016-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z"/></svg>
            Publicar Certificado
          </a>
        </Button>
        <Button
          onClick={copiarLink}
          variant="outline"
          className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copiar Link Público
        </Button>
      </div>
    </div>
  )
}
