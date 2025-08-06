"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuthV2 as useAuth } from "@/contexts/auth-context-v2"
import { buscarCertificadosAluno } from "./actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Download, Eye, Calendar, CheckCircle, Loader2 } from "lucide-react"

export default function CertificadosPage() {
  const { user } = useAuth()
  const [certificados, setCertificados] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const result = await buscarCertificadosAluno(user.uid)
        if (result.success) {
          setCertificados(result.data || [])
        }
      } catch (error) {
        console.error("Erro ao carregar certificados:", error)
      } finally {
        setCarregando(false)
      }
    }
    if (user?.uid) {
      carregarDados()
    } else {
      setCarregando(false)
    }
  }, [user?.uid])

  const SimplePreloader = () => (
    <div
      data-page="certificados"
      className="flex flex-col items-center justify-center min-h-screen"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        color: "#ffffff",
      }}
    >
      <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
      <p className="text-lg text-slate-400">Carregando...</p>
    </div>
  )

  // NÃO renderiza nada até estar montado no cliente
  if (!isMounted) {
    return null
  }

  // Só depois de montado, mostra o preloader se necessário
  if (carregando) {
    return <SimplePreloader />
  }

  // Conteúdo principal com fundo escuro garantido por estilo inline
  return (
    <div
      data-page="certificados"
      className="p-4 md:p-8 min-h-screen"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        color: "#ffffff",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Meus Certificados</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Visualize e gerencie seus certificados de conclusão
          </p>
        </div>

        <section className="space-y-6 mb-8">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Estatísticas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-amber-400" />
                  </div>
                  Total de Certificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{certificados.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  Certificados Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {certificados.filter((c) => c.status === "ativo").length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  Este Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {
                    certificados.filter(
                      (c) =>
                        new Date(c.emitido_em).getMonth() === new Date().getMonth() &&
                        new Date(c.emitido_em).getFullYear() === new Date().getFullYear(),
                    ).length
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Seus Certificados</h2>
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              {certificados.length}
            </Badge>
          </div>
          {certificados.length === 0 ? (
            <Card className="bg-slate-800/30 border-slate-700/50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum certificado ainda</h3>
                <p className="text-slate-400 mb-6 max-w-md">
                  Complete seus cursos para receber certificados de conclusão
                </p>
                <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                  Ver Meus Cursos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificados.map((certificado) => (
                <Card
                  key={certificado.id}
                  className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200 h-full overflow-hidden"
                >
                  <CardHeader className="space-y-3">
                    <CardTitle className="text-white text-lg leading-tight">{certificado.titulo_curso}</CardTitle>
                    <p className="text-slate-400 text-sm">
                      Emitido em {new Date(certificado.emitido_em).toLocaleDateString("pt-BR")}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${certificado.status === "ativo" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                      >
                        {certificado.status}
                      </Badge>
                      <span className="text-xs text-slate-500">#{certificado.numero_certificado}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 flex-1"
                      >
                        <Link href={`/certificados/visualizar/${certificado.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white border-amber-600 flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
