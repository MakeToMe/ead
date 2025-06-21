"use client"

interface CertificadoPublicoProps {
  certificado: any
}

export function CertificadoPublico({ certificado }: CertificadoPublicoProps) {
  return (
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
              <p className="text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">{certificado.descricao_curso}</p>
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
              <p className="text-sm text-gray-600 mb-1">Instrutor Responsável</p>
              <p className="text-lg font-semibold text-gray-800">
                {certificado.cursos?.users?.nome || "Sistema Educacional"}
              </p>
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
  )
}
