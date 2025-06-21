"use client"

import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Shield, Calendar, Clock, Hash, ExternalLink, Download } from "lucide-react"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    hash: string
  }
}

async function getCertificadoPublico(hash: string) {
  const supabase = createServerSupabaseClient()

  const { data: certificado, error } = await supabase
    .from("certificados")
    .select(`
      numero_certificado,
      nome_aluno,
      titulo_curso,
      descricao_curso,
      carga_horaria,
      data_inicio,
      data_conclusao,
      status,
      hash_verificacao,
      emitido_em
    `)
    .eq("hash_verificacao", hash)
    .single()

  if (error || !certificado) {
    return null
  }

  return certificado
}

async function CertificadoPublicoContent({ hash }: { hash: string }) {
  const certificado = await getCertificadoPublico(hash)

  if (!certificado) {
    notFound()
  }

  if (certificado.status !== "ativo") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-orange-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Certificado {certificado.status}</h1>
          <p className="text-gray-600">Este certificado não está mais ativo.</p>
        </div>
      </div>
    )
  }

  const linkVerificacao = `http://localhost:3000/certificado/${hash}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Certificado Digital</h1>
              <p className="text-sm text-gray-600">Verificação Pública de Autenticidade</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Shield className="w-4 h-4" />
              Verificado
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Certificado */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              {/* Template do Certificado - Versão Pública */}
              <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 md:p-16">
                {/* Decorações geométricas */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full opacity-20"></div>
                  <div className="absolute top-8 -right-8 w-32 h-32 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full opacity-20"></div>
                  <div className="absolute -bottom-8 left-8 w-28 h-28 bg-gradient-to-br from-indigo-200 to-blue-300 rounded-full opacity-20"></div>
                  <div className="absolute bottom-4 right-4 w-20 h-20 bg-gradient-to-br from-pink-200 to-purple-300 rounded-full opacity-20"></div>

                  {/* Padrão geométrico */}
                  <div className="absolute top-0 left-0 w-full h-full opacity-5">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100" height="100" fill="url(#grid)" />
                    </svg>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="relative z-10 text-center">
                  {/* Header elegante */}
                  <div className="mb-12">
                    <div className="inline-block mb-4">
                      <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-4"></div>
                      <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Certificado
                      </h1>
                      <p className="text-xl text-gray-600 font-light">de Conclusão</p>
                      <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mt-4"></div>
                    </div>
                  </div>

                  {/* Texto principal */}
                  <div className="mb-12">
                    <p className="text-lg text-gray-700 mb-6 font-light">Certificamos que</p>
                    <div className="mb-8">
                      <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">{certificado.nome_aluno}</h2>
                      <div className="w-32 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto"></div>
                    </div>
                    <p className="text-lg text-gray-700 mb-4 font-light">concluiu com êxito o curso</p>
                    <h3 className="text-3xl md:text-4xl font-bold text-blue-800 mb-6">{certificado.titulo_curso}</h3>
                    {certificado.descricao_curso && (
                      <p className="text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
                        {certificado.descricao_curso}
                      </p>
                    )}
                  </div>

                  {/* Detalhes em cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Carga Horária</p>
                      <p className="text-xl font-bold text-gray-800">{certificado.carga_horaria}h</p>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Concluído em</p>
                      <p className="text-xl font-bold text-gray-800">
                        {new Date(certificado.data_conclusao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Certificado Nº</p>
                      <p className="text-lg font-bold text-gray-800 font-mono">{certificado.numero_certificado}</p>
                    </div>
                  </div>

                  {/* Footer com assinatura */}
                  <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-300">
                    <div className="text-center md:text-left mb-6 md:mb-0">
                      <div className="w-40 h-0.5 bg-gray-400 mx-auto md:mx-0 mb-3"></div>
                      <p className="text-sm text-gray-600 mb-1">Assinatura Digital</p>
                      <p className="text-lg font-semibold text-gray-800">Sistema Educacional</p>
                    </div>

                    <div className="text-center">
                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">Emitido digitalmente em</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {new Date(certificado.emitido_em).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar de verificação */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Status de Verificação */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Certificado Verificado</h3>
                    <p className="text-sm text-green-600">Autenticidade confirmada</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Este certificado foi verificado e é válido. Todas as informações foram confirmadas em nossa base de
                  dados.
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Verificação Rápida</h3>
                <div className="text-center">
                  <div className="bg-gray-100 p-4 rounded-lg inline-block mb-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(linkVerificacao)}`}
                      alt="QR Code do Certificado"
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="text-sm text-gray-600">Escaneie para verificar</p>
                </div>
              </div>

              {/* Detalhes Técnicos */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Detalhes da Emissão</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Data de Emissão</p>
                      <p className="text-sm text-gray-600">
                        {new Date(certificado.emitido_em).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Duração do Curso</p>
                      <p className="text-sm text-gray-600">{certificado.carga_horaria} horas</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Hash className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Hash de Verificação</p>
                      <p className="text-xs text-gray-600 font-mono break-all">{certificado.hash_verificacao}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Ações</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="w-4 h-4" />
                    Baixar PDF
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(linkVerificacao)
                      alert("Link copiado para a área de transferência!")
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Copiar Link
                  </button>
                </div>
              </div>

              {/* Instruções */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-blue-800 mb-3">Como Verificar</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>• Escaneie o QR Code acima</p>
                  <p>• Ou acesse nossa página de verificação</p>
                  <p>• Use o hash de verificação para confirmar</p>
                  <p>• Compartilhe este link para validação</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Certificado Digital Verificado</h3>
            <p className="text-sm text-gray-600 mb-4">
              Este certificado foi emitido digitalmente e pode ser verificado através do hash de autenticação.
            </p>
            <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
              <span>🔒 Seguro</span>
              <span>✅ Verificado</span>
              <span>🌐 Público</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function CertificadoPublicoPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando certificado...</p>
          </div>
        </div>
      }
    >
      <CertificadoPublicoContent hash={params.hash} />
    </Suspense>
  )
}
