"use client"
import { useState } from "react"
import { Rotate3D } from "lucide-react"
import CertificateTemplate, { CertificateProps } from "./certificate-template"
import CertificateBack from "./certificate-back"

interface AulaInfo { id: number; titulo: string; duracao?: number }
interface ModuleInfo { id: number; titulo: string; aulas: AulaInfo[] }

interface CertificateCardProps extends CertificateProps {
  logoUrl?: string
  issueDate: string
  validity: string
  hashAuth: string
  qrUrl: string
  modulesInfo: ModuleInfo[]
  modulesCount: number
  aulasCount: number
  duration: string
  date: string
  avatarUrl?: string
  email?: string
}

export default function CertificateCard({
  name,
  course,
  date,
  provider,
  description,
  logoUrl,
  issueDate,
  validity,
  hashAuth,
  qrUrl,
  modulesInfo,
  modulesCount,
  aulasCount,
  duration,
  avatarUrl,
  email,
}: CertificateCardProps) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 px-4 py-8 flex items-center justify-center">
      <div className="relative w-full max-w-[1280px] mx-auto overflow-visible perspective-[1000px]">
        <div
          className={`transition-transform duration-700 [transform-style:preserve-3d] w-full ${
            flipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div className="w-full [backface-visibility:hidden]">
            <CertificateTemplate
              name={name}
              course={course}
              date={date}
              provider={provider}
              description={description}
              avatarUrl={avatarUrl}
            />
          </div>
          {/* Back */}
          <div className="absolute inset-0 w-full h-full rotate-y-180 [backface-visibility:hidden]">
            <CertificateBack
              provider={provider}
              logoUrl={logoUrl}
              issueDate={issueDate}
              validity={validity}
              hashAuth={hashAuth}
              qrUrl={qrUrl}
              modules={modulesInfo}
              modulesCount={modulesCount}
              aulasCount={aulasCount}
              duration={duration}
              avatarUrl={avatarUrl}
              studentName={name}
              email={email}
            />
          </div>
        </div>
        {/* Toggle button */}
        <button
          onClick={() => setFlipped(!flipped)}
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 md:bottom-4 md:right-4 md:left-auto md:translate-x-0 z-20 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-pressed={flipped}
          aria-label="Virar certificado"
        >
          <Rotate3D className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
