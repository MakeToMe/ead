"use client"

import { Shield, Calendar, Clock, Hash } from "lucide-react"

interface VerificacaoInfoProps {
  certificado: any
}

export function VerificacaoInfo({ certificado }: VerificacaoInfoProps) {
  return (
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
          Este certificado foi verificado e é válido. Todas as informações foram confirmadas em nossa base de dados.
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Verificação Rápida</h3>
        <div className="text-center">
          <div className="bg-gray-100 p-4 rounded-lg inline-block mb-3">
            {/* QR Code placeholder */}
            <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
              QR Code
            </div>
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
              <p className="text-sm text-gray-600">{new Date(certificado.emitido_em).toLocaleDateString("pt-BR")}</p>
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

      {/* Instruções */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-3">Como Verificar</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>• Escaneie o QR Code acima</p>
          <p>• Ou acesse nossa página de verificação</p>
          <p>• Use o hash de verificação para confirmar</p>
        </div>
      </div>
    </div>
  )
}
