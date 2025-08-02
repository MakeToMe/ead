"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getCertificadosDisponiveis } from "@/firebase/certificados"
import type { Certificado } from "@/types/types"
import Link from "next/link"

const CertificadosDisponiveis = () => {
  const { user } = useAuth()
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCertificados = async () => {
      if (user) {
        try {
          const certificadosData = await getCertificadosDisponiveis(user.uid)
          setCertificados(certificadosData)
          setLoading(false)
        } catch (e: any) {
          setError(e.message)
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    fetchCertificados()
  }, [user])

  if (loading) {
    return <p>Carregando certificados...</p>
  }

  if (error) {
    return <p>Erro ao carregar certificados: {error}</p>
  }

  if (!user) {
    return <p>Por favor, faça login para ver os certificados disponíveis.</p>
  }

  if (certificados.length === 0) {
    return <p>Nenhum certificado disponível no momento.</p>
  }

  return (
    <div>
      <h2>Certificados Disponíveis</h2>
      <ul>
        {certificados.map((certificado) => (
          <li key={certificado.id}>
            <Link href={`/dashboard/certificado/${certificado.id}`}>
              {certificado.nome} - {certificado.descricao}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default CertificadosDisponiveis
