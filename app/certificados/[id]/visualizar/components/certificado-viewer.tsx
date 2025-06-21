"use client"

interface CertificadoViewerProps {
  certificado: any
}

export function CertificadoViewer({ certificado }: CertificadoViewerProps) {
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
      {/* Template do Certificado */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 p-8 md:p-12">
        {/* Decorações */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-4 left-4 w-16 h-16 border-4 border-blue-300 rounded-full"></div>
          <div className="absolute top-8 right-8 w-12 h-12 border-4 border-indigo-300 rounded-full"></div>
          <div className="absolute bottom-8 left-8 w-20 h-20 border-4 border-purple-300 rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-14 h-14 border-4 border-blue-300 rounded-full"></div>
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 text-center">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Certificado</h1>
            <p className="text-lg text-gray-600">de Participação</p>
          </div>

          {/* Texto principal */}
          <div className="mb-8">
            <p className="text-lg text-gray-700 mb-4">Certificamos que</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2 inline-block">
              {certificado.nome_aluno}
            </h2>
            <p className="text-lg text-gray-700 mb-2">participou do curso</p>
            <h3 className="text-2xl md:text-3xl font-semibold text-blue-800 mb-4">{certificado.titulo_curso}</h3>
            {certificado.descricao_curso && (
              <p className="text-gray-600 mb-4 max-w-2xl mx-auto">{certificado.descricao_curso}</p>
            )}
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
            <div>
              <p className="text-gray-600">Carga Horária</p>
              <p className="font-semibold text-gray-800">{certificado.carga_horaria} horas</p>
            </div>
            <div>
              <p className="text-gray-600">Data de Conclusão</p>
              <p className="font-semibold text-gray-800">
                {new Date(certificado.data_conclusao).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Certificado Nº</p>
              <p className="font-semibold text-gray-800">{certificado.numero_certificado}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-300">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <div className="w-32 h-0.5 bg-gray-400 mx-auto md:mx-0 mb-2"></div>
              <p className="text-sm text-gray-600">Instrutor</p>
              <p className="font-semibold text-gray-800">{certificado.cursos?.users?.nome || "Sistema"}</p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Verifique a autenticidade em:</p>
              <p className="text-xs text-gray-600 font-mono">
                {process.env.NEXT_PUBLIC_SITE_URL}/verificar-certificado
              </p>
              <p className="text-xs text-gray-500 mt-1">Hash: {certificado.hash_verificacao.substring(0, 16)}...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
