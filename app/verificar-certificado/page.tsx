"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { verificarCertificadoPublico, type CertificadoPublico } from "../certificados/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Search, XCircle } from "lucide-react"
import { CertificateStatusCard, CertificateDetailsCard, CertificateInfoCard } from "@/components/certificate/public-cards"

export default function VerificarCertificadoPage() {
  const [hash, setHash] = useState("")
  const [loading, setLoading] = useState(false)
  const [certificado, setCertificado] = useState<CertificadoPublico | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Carrega hash da querystring se presente
  useEffect(() => {
    const hashFromUrl = searchParams.get("hash")
    if (hashFromUrl) {
      setHash(hashFromUrl)
      verificarCertificado(hashFromUrl)
    }
  }, [searchParams])

  const verificarCertificado = async (hashToVerify?: string) => {
    const codigo = (hashToVerify ?? hash).trim()
    if (!codigo) {
      setErro("Por favor, insira o código de verificação")
      return
    }

    setLoading(true)
    setErro(null)
    setCertificado(null)

    try {
      const result = await verificarCertificadoPublico(codigo)
      if (result.success && result.certificado) {
        setCertificado(result.certificado)
      } else {
        setErro(result.message)
      }
    } catch (e) {
      console.error(e)
      setErro("Erro interno do servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent mb-2">
              Verificação de Certificado
            </h1>
            <p className="text-slate-400 text-lg">
              Verifique a autenticidade de certificados emitidos pela Plataforma Saber365
            </p>
          </div>

          {/* Formulário */}
          <Card className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm border-slate-700/50 mb-8">
            <CardContent className="space-y-4">
              <label htmlFor="hash" className="block text-sm font-medium text-slate-300">
                Código de Verificação
              </label>
              <div className="flex gap-2">
                <Input
                  id="hash"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="Cole aqui o código de verificação..."
                  className="bg-slate-800/50 border-slate-700 focus:border-green-500/50 text-white"
                  onKeyDown={(e) => e.key === "Enter" && verificarCertificado()}
                />
                <Button
                  onClick={() => verificarCertificado()}
                  disabled={loading || !hash.trim()}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                O código de verificação está localizado no certificado ou pode ser obtido via QR Code
              </p>
            </CardContent>
          </Card>

          {/* Resultado */}
          <AnimatePresence>
            {erro && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-8"
              >
                <CertificateStatusCard valid={false} message={erro} />
              </motion.div>
            )}

            {certificado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <CertificateStatusCard valid={true} message="Este certificado é autêntico e foi emitido pela Plataforma Saber365" />
                <CertificateDetailsCard certificado={certificado} />
                <CertificateInfoCard certificado={certificado} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm">Sistema de Verificação de Certificados - Plataforma Saber365</p>
            <p className="text-slate-500 text-xs mt-1">Todos os certificados são protegidos por criptografia e validação digital</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
