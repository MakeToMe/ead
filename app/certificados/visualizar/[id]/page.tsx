

import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { buscarCertificadoPorId } from "../../actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, Copy, Award, ArrowLeft, Calendar, User, Hash, Shield } from "lucide-react"
import Link from "next/link"

interface PageProps {
  params: {
    id: string
  }
}

async function CertificadoContent({ id }: { id: string }) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/")
  }

  const result = await buscarCertificadoPorId(id, user.uid)
  if (!result.success || !result.data) {
    notFound()
  }

  const certificado = result.data
  const linkPublico = `http://localhost:3000/certificado/${certificado.hash_verificacao}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Button
            asChild
            variant="outline"
            className="bg-slate-800/60 hover:bg-slate-700/60 text-white border-slate-600"
          >
            <Link href="/certificados">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Certificados
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificado Principal */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Certificado de Conclusão</h1>
                    <p className="text-slate-400">#{certificado.numero_certificado}</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={`${
                    certificado.status === "ativo"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                >
                  {certificado.status}
                </Badge>
              </div>

              {/* Template do Certificado */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-12 text-center border-8 border-gradient-to-r from-amber-400 to-yellow-500 relative overflow-hidden">
                {/* Decorações de fundo */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full -translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full translate-x-20 translate-y-20"></div>
                <div className="absolute top-1/2 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full translate-x-12 -translate-y-12"></div>

                {/* Conteúdo do Certificado */}
                <div className="relative z-10">
                  <div className="mb-8">
                    <h2 className="text-4xl font-bold text-gray-800 mb-2">CERTIFICADO</h2>
                    <p className="text-lg text-gray-600">de Participação</p>
                  </div>

                  <div className="mb-8">
                    <p className="text-lg text-gray-700 mb-4">Certificamos que</p>
                    <h3 className="text-3xl font-bold text-gray-800 mb-4 border-b-2 border-amber-400 pb-2 inline-block">
                      {certificado.nome_aluno}
                    </h3>
                    <p className="text-lg text-gray-700">concluiu com êxito o curso</p>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-2xl font-bold text-gray-800 mb-2">{certificado.titulo_curso}</h4>
                    <p className="text-gray-600">com carga horária de {certificado.carga_horaria} horas</p>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="text-left">
                      <p className="text-sm text-gray-600">
                        Emitido em {new Date(certificado.emitido_em).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-32 h-px bg-gray-400 mb-2"></div>
                      <p className="text-sm text-gray-600">Assinatura Digital</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap gap-4 mt-8">
                <Button className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  <a href={linkPublico} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Público
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar com Detalhes */}
          <div className="space-y-6">
            {/* Informações do Certificado */}
            <div className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" />
                Detalhes do Certificado
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-400">Aluno</p>
                    <p className="text-white">{certificado.nome_aluno}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-400">Data de Emissão</p>
                    <p className="text-white">{new Date(certificado.emitido_em).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-400">Hash de Verificação</p>
                    <p className="text-white text-xs font-mono break-all">{certificado.hash_verificacao}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">QR Code</h3>
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block mb-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(linkPublico)}`}
                    alt="QR Code do Certificado"
                    className="w-32 h-32"
                  />
                </div>
                <p className="text-slate-400 text-sm">Escaneie para verificar publicamente</p>
              </div>
            </div>

            {/* Compartilhamento */}
            <div className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Compartilhar</h3>
              <div className="space-y-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                >
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkPublico)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white border-sky-500"
                >
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(linkPublico)}&text=Confira%20meu%20certificado%20de%20conclusão!`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(linkPublico)
                    // Toast notification
                    const toast = document.createElement("div")
                    toast.textContent = "Link copiado!"
                    toast.className = "fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50"
                    document.body.appendChild(toast)
                    setTimeout(() => document.body.removeChild(toast), 2000)
                  }}
                  variant="outline"
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Página de nível de servidor: decodifica params e renderiza conteúdo

/* --- Página principal --- */
export default function VisualizarCertificadoPage({ params }: { params: { id: string } }) {
  return <CertificadoContent id={params.id} />
}
{ params }: { params: { id: string } }) {
  return <CertificadoContent id={params.id} />
}
/* --- Página principal --- */
export default function VisualizarCertificadoPage({ params }: { params: { id: string } }) {
  return <CertificadoContent id={params.id} />
}
{ params }: { params: { id: string } }) {
  return <CertificadoContent id={params.id} />
}
{ params }: { params: Promise<{ id: string }> }) {
  
  return <CertificadoContent id={id} />
 }: { params: Promise<{ id: string }> }) {
  
  return (
     fallback={<div className="min-h-screen bg-slate-900" />}> 
      <CertificadoContent id={id} />
    </Suspense>
  )
}
  
  return <CertificadoContent id={id} />
 }: { params: Promise<{ id: string }> }) {
  

  ; podemos renderizar CertificadoContent diretamente.
  return (
    
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Botão Voltar Skeleton */}
            <div className="mb-6">
              <div className="h-10 w-48 bg-slate-700/50 animate-pulse rounded-lg" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Certificado Principal Skeleton */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
                  {/* Header Skeleton */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-700/50 animate-pulse rounded-xl" />
                      <div>
                        <div className="h-6 w-48 bg-slate-700/50 animate-pulse rounded mb-2" />
                        <div className="h-4 w-32 bg-slate-700/50 animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="h-6 w-16 bg-slate-700/50 animate-pulse rounded" />
                  </div>

                  {/* Template Skeleton */}
                  <div className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-lg p-12 mb-8">
                    <div className="text-center space-y-6">
                      <div className="h-12 w-64 bg-slate-600/50 animate-pulse rounded mx-auto" />
                      <div className="h-8 w-48 bg-slate-600/50 animate-pulse rounded mx-auto" />
                      <div className="h-10 w-80 bg-slate-600/50 animate-pulse rounded mx-auto" />
                      <div className="h-6 w-56 bg-slate-600/50 animate-pulse rounded mx-auto" />
                    </div>
                  </div>

                  {/* Botões Skeleton */}
                  <div className="flex gap-4">
                    <div className="h-10 w-32 bg-slate-700/50 animate-pulse rounded" />
                    <div className="h-10 w-32 bg-slate-700/50 animate-pulse rounded" />
                  </div>
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
                  >
                    <div className="h-6 w-32 bg-slate-700/50 animate-pulse rounded mb-4" />
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-slate-700/50 animate-pulse rounded" />
                      <div className="h-4 w-3/4 bg-slate-700/50 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
}
