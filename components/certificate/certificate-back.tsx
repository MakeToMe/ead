"use client"
import { Shield } from "lucide-react"

interface AulaInfo {
  id: number
  titulo: string
  duracao?: number
}

interface ModuleInfo {
  id: number
  titulo: string
  aulas: AulaInfo[]
}

interface CertificateBackProps {
  provider: string
  logoUrl?: string
  issueDate: string
  validity: string
  hashAuth: string
  qrUrl: string
  modules: ModuleInfo[]
  modulesCount: number
  aulasCount: number
  duration: string
  avatarUrl?: string
  studentName: string
  email?: string
}

export default function CertificateBack({
  provider,
  logoUrl,
  issueDate,
  validity,
  hashAuth,
  qrUrl,
  modules,
  modulesCount,
  aulasCount,
  duration,
  avatarUrl,
  studentName,
  email,
}: CertificateBackProps) {
  return (
    <div className="w-full h-full p-4 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-gray-800">
        {/* Card Esquerdo */}
        <div className="lg:col-span-4 bg-gray-50 rounded-lg shadow p-4 flex flex-col items-center text-sm space-y-4">
          {/* Logo */}
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-32 h-auto" />
          ) : (
            <div className="flex items-center gap-2 text-purple-700 text-xl font-bold">
              <Shield className="w-6 h-6" />
              {provider}
            </div>
          )}

          {/* Datas */}
          <div className="w-full border-t pt-4">
            <p className="font-semibold">Emissão</p>
            <p>{issueDate}</p>
          </div>
          <div className="w-full">
            <p className="font-semibold">Validade</p>
            <p>{validity}</p>
          </div>
          {/* Hash */}
          <div className="w-full">
            <p className="font-semibold">Hash de Autenticidade</p>
            <p className="break-all text-xs">{hashAuth}</p>
          </div>
          {/* QR */}
          <div className="w-full border-t pt-4 flex flex-col items-center">
            <p className="font-semibold mb-2">QR Code</p>
            <img src={qrUrl} alt="QR Code" className="w-28 h-28" />
          </div>
        </div>

        {/* Card Central */}
        <div className="lg:col-span-4 bg-white rounded-lg shadow p-4">
          <h2 className="text-2xl font-bold mb-4">Conteúdo do Curso</h2>
          <p className="mb-2 text-gray-700">Módulos: {modulesCount} • Aulas: {aulasCount} • Duração: {duration}</p>
          <div className="space-y-4 pr-2 max-h-[400px] overflow-y-auto">
            {modules.map((m, idx) => (
              <div key={m.id} className="">
                <p className="font-semibold mb-1 text-purple-700">Módulo {idx + 1}: {m.titulo}</p>
                <ul className="pl-4 list-disc space-y-1">
                  {m.aulas.map((a) => (
                    <li key={a.id} className="flex justify-between text-sm text-gray-700">
                      <span>{a.titulo}</span>
                      {a.duracao !== undefined && (
                        <span className="text-gray-500 ml-2">{a.duracao}m</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Card Direito */}
        <div className="lg:col-span-4 bg-gray-50 rounded-lg shadow p-4 flex flex-col items-center space-y-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar do aluno"
              className="w-28 h-28 rounded-full object-cover border"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A5.002 5.002 0 0110 15h4a5.002 5.002 0 014.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
          <div className="text-center">
            <p className="font-semibold">{studentName}</p>
          </div>
          {email && <p className="text-gray-600 text-sm">{email}</p>}
        </div>
      </div>
    </div>
  )
}
