"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { verificarCertificadoPublico, type CertificadoPublico } from "../certificados/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  Clock,
  User,
  BookOpen,
  AlertTriangle,
  Copy,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function VerificarCertificadoPage() {
  const [hash, setHash] = useState("")
  const [loading, setLoading] = useState(false)
  const [certificado, setCertificado] = useState<CertificadoPublico | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Verificar se há hash na URL
  useEffect(() => {
    const hashFromUrl = searchParams.get("hash")
    if (hashFromUrl) {
      setHash(hashFromUrl)
      verificarCertificado(hashFromUrl)
    }
  }, [searchParams])

  const verificarCertificado = async (hashToVerify?: string) => {
    const hashParaVerificar = hashToVerify || hash

    if (!hashParaVerificar.trim()) {
      setErro("Por favor, insira o código de verificação")
      return
    }

    setLoading(true)
    setErro(null)
    setCertificado(null)

    try {
      const result = await verificarCertificadoPublico(hashParaVerificar.trim())

      if (result.success && result.certificado) {
        setCertificado(result.certificado)
      } else {
        setErro(result.message)
      }
    } catch (error) {
      console.error("Erro ao verificar certificado:", error)
      setErro("Erro interno do servidor")
    } finally {
      setLoading(false)
    }
  }

  const copiarHash = () => {
    if (certificado?.hash_verificacao) {
      navigator.clipboard.writeText(certificado.hash_verificacao)
      toast({
        title: "Copiado!",
        description: "Código de verificação copiado para a área de transferência",
      })
    }
  }

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const formatarCargaHoraria = (minutos: number) => {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60

    if (horas === 0) return `${mins} minutos`
    if (mins === 0) return `${horas} ${horas === 1 ? "hora" : "horas"}`
    return `${horas}h ${mins}min`
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
              Verifique a autenticidade de certificados emitidos pela Plataforma R$antos
            </p>
          </div>

          {/* Formulário de Verificação */}
          <Card className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm border-slate-700/50 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5" />
                Verificar Certificado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="hash" className="block text-sm font-medium text-slate-300 mb-2">
                  Código de Verificação
                </label>
                <div className="flex gap-2">
                  <Input
                    id="hash"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    placeholder="Cole aqui o código de verificação do certificado..."
                    className="bg-slate-800/50 border-slate-700 focus:border-green-500/50 text-white"
                    onKeyPress={(e) => e.key === "Enter" && verificarCertificado()}
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
                <p className="text-xs text-slate-500 mt-2">
                  O código de verificação está localizado no certificado ou pode ser obtido através do QR Code
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resultado da Verificação */}
          <AnimatePresence>
            {erro && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-8"
              >
                <Card className="bg-gradient-to-br from-red-900/40 to-red-800/20 backdrop-blur-sm border-red-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-red-300 mb-1">Certificado Não Encontrado</h3>
                        <p className="text-red-200/80">{erro}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {certificado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Status de Verificação */}
                <Card className="bg-gradient-to-br from-green-900/40 to-emerald-800/20 backdrop-blur-sm border-green-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-300 mb-1">Certificado Válido ✓</h3>
                        <p className="text-green-200/80">
                          Este certificado é autêntico e foi emitido pela Plataforma R$antos
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detalhes do Certificado */}
                <Card className="bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Detalhes do Certificado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-slate-400">Número do Certificado</label>
                          <p className="text-white font-mono text-lg">{certificado.numero_certificado}</p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-400">Nome do Aluno</label>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <p className="text-white font-semibold">{certificado.nome_aluno}</p>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-400">Status</label>
                          <div className="mt-1">
                            <Badge
                              className={`${
                                certificado.status === "ativo"
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : "bg-red-500/20 text-red-400 border-red-500/30"
                              }`}
                            >
                              {certificado.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-slate-400">Curso</label>
                          <p className="text-white font-semibold">{certificado.titulo_curso}</p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-400">Data de Conclusão</label>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <p className="text-white">{formatarData(certificado.data_conclusao)}</p>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-400">Carga Horária</label>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <p className="text-white">{formatarCargaHoraria(certificado.carga_horaria)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Código de Verificação */}
                    <div className="pt-4 border-t border-slate-700/50">
                      <label className="text-sm font-medium text-slate-400">Código de Verificação</label>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="flex-1 bg-slate-800/50 px-3 py-2 rounded text-xs text-slate-300 font-mono break-all">
                          {certificado.hash_verificacao}
                        </code>
                        <Button size="sm" onClick={copiarHash} className="bg-slate-700 hover:bg-slate-600 text-white">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações Adicionais */}
                <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-800/10 backdrop-blur-sm border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-300 mb-2">Informações Importantes</h4>
                        <ul className="text-blue-200/80 text-sm space-y-1">
                          <li>• Este certificado é válido e reconhecido pela Plataforma R$antos</li>
                          <li>• A verificação foi realizada em {new Date().toLocaleString("pt-BR")}</li>
                          <li>• Mantenha o código de verificação para futuras consultas</li>
                          <li>• Em caso de dúvidas, entre em contato conosco</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm">Sistema de Verificação de Certificados - Plataforma R$antos</p>
            <p className="text-slate-500 text-xs mt-1">
              Todos os certificados são protegidos por criptografia e validação digital
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
