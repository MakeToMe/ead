"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
  Clock,
  BookOpen,
  FileText,
  Video,
  Maximize,
  Menu,
  X,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import {
  buscarCursoCompleto,
  marcarAulaAssistida,
  type CursoCompleto,
  type ProgressoUsuario,
  type AulaDetalhada,
} from "./actions"
import { ContentViewer } from "./components/content-viewer"
import { PainelAnotacoes } from "./components/painel-anotacoes"

export default function AssistirCursoPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const cursoId = params.cursoId as string

  const [curso, setCurso] = useState<CursoCompleto | null>(null)
  const [progresso, setProgresso] = useState<ProgressoUsuario | null>(null)
  const [aulaAtual, setAulaAtual] = useState<AulaDetalhada | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [sidebarAberta, setSidebarAberta] = useState(true)
  const [painelInfoAberto, setPainelInfoAberto] = useState(true)
  const [modulosExpandidos, setModulosExpandidos] = useState<Set<string>>(new Set())
  const [modoFoco, setModoFoco] = useState(false)
  const [currentVideoTime, setCurrentVideoTime] = useState<number | undefined>(undefined)

  // Injetar CSS para scrollbar personalizado
  useEffect(() => {
    // Garantir que o CSS seja aplicado após a renderização
    const styleElement = document.createElement("style")
    styleElement.textContent = `
      /* Scrollbar personalizado com tema indigo/azul */
      .content-area::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .content-area::-webkit-scrollbar-track {
        background: rgba(30, 41, 59, 0.4);
        border-radius: 4px;
      }
      
      .content-area::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.7), rgba(79, 70, 229, 0.7));
        border-radius: 4px;
        border: 1px solid rgba(30, 41, 59, 0.2);
      }
      
      .content-area::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(79, 70, 229, 0.9));
      }
      
      /* Firefox */
      .content-area {
        scrollbar-width: thin;
        scrollbar-color: rgba(99, 102, 241, 0.7) rgba(30, 41, 59, 0.4);
      }
      
      /* Sidebar scrollbar */
      .sidebar-area::-webkit-scrollbar {
        width: 6px;
      }
      
      .sidebar-area::-webkit-scrollbar-track {
        background: rgba(30, 41, 59, 0.4);
      }
      
      .sidebar-area::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.6), rgba(79, 70, 229, 0.6));
        border-radius: 3px;
      }
      
      /* Firefox */
      .sidebar-area {
        scrollbar-width: thin;
        scrollbar-color: rgba(99, 102, 241, 0.6) rgba(30, 41, 59, 0.4);
      }
    `
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Carregar dados do curso
  useEffect(() => {
    const carregarCurso = async () => {
      if (!user?.uid || !cursoId) return

      try {
        const resultado = await buscarCursoCompleto(cursoId, user.uid)
        if (resultado.success && resultado.data) {
          setCurso(resultado.data.curso)
          setProgresso(resultado.data.progresso)

          // Definir primeira aula como atual
          const primeiraAula = resultado.data.curso.modulos[0]?.aulas[0]
          if (primeiraAula) {
            setAulaAtual(primeiraAula)
            // Expandir primeiro módulo
            setModulosExpandidos(new Set([resultado.data.curso.modulos[0].id]))
          }
        } else {
          toast({
            variant: "destructive",
            title: "Erro",
            description: resultado.error,
          })
          router.push("/trilha-aprendizado")
        }
      } catch (error) {
        console.error("Erro ao carregar curso:", error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar curso",
        })
      } finally {
        setCarregando(false)
      }
    }

    carregarCurso()
  }, [user?.uid, cursoId, router, toast])

  const toggleModulo = (moduloId: string) => {
    const novosExpandidos = new Set(modulosExpandidos)
    if (novosExpandidos.has(moduloId)) {
      novosExpandidos.delete(moduloId)
    } else {
      novosExpandidos.add(moduloId)
    }
    setModulosExpandidos(novosExpandidos)
  }

  const selecionarAula = (aula: AulaDetalhada) => {
    setAulaAtual(aula)
    // Resetar o tempo do vídeo quando mudar de aula
    setCurrentVideoTime(undefined)
  }

  const marcarComoAssistida = async () => {
    if (!aulaAtual || !user?.uid) return

    try {
      const resultado = await marcarAulaAssistida(aulaAtual.id, cursoId, user.uid)
      if (resultado.success) {
        toast({
          variant: "success",
          title: "Sucesso!",
          description: "Aula marcada como assistida",
        })

        // Atualizar progresso local
        if (progresso && resultado.progresso !== undefined) {
          setProgresso({
            ...progresso,
            progresso_percentual: resultado.progresso,
            aulas_assistidas: [...progresso.aulas_assistidas, aulaAtual.id],
          })
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: resultado.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao marcar aula como assistida",
      })
    }
  }

  const navegarAula = (direcao: "anterior" | "proxima") => {
    if (!curso || !aulaAtual) return

    const todasAulas: AulaDetalhada[] = []
    curso.modulos.forEach((modulo) => {
      todasAulas.push(...modulo.aulas)
    })

    const indiceAtual = todasAulas.findIndex((aula) => aula.id === aulaAtual.id)

    if (direcao === "anterior" && indiceAtual > 0) {
      setAulaAtual(todasAulas[indiceAtual - 1])
      // Resetar o tempo do vídeo quando mudar de aula
      setCurrentVideoTime(undefined)
    } else if (direcao === "proxima" && indiceAtual < todasAulas.length - 1) {
      setAulaAtual(todasAulas[indiceAtual + 1])
      // Resetar o tempo do vídeo quando mudar de aula
      setCurrentVideoTime(undefined)
    }
  }

  const formatarDuracao = (minutos: number) => {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    if (horas > 0) {
      return `${horas}h ${mins}min`
    }
    return `${mins}min`
  }

  const getIconeAula = (tipo: string) => {
    switch (tipo) {
      case "video":
        return <Video className="w-4 h-4" />
      case "pdf":
        return <FileText className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const aulaAssistida = (aulaId: string) => {
    return progresso?.aulas_assistidas.includes(aulaId) || false
  }

  const handleContentProgress = (currentTime?: number, duration?: number) => {
    // Atualizar o tempo atual do vídeo para as anotações
    if (currentTime !== undefined) {
      setCurrentVideoTime(currentTime)
    }

    // Aqui podemos implementar lógica para salvar progresso do vídeo
    // console.debug("Progresso do conteúdo:", { currentTime, duration })
  }

  const handleContentCompleted = () => {
    // Marcar automaticamente como assistida quando completar
    marcarComoAssistida()
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Carregando curso...</p>
        </div>
      </div>
    )
  }

  if (!curso || !aulaAtual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Curso não encontrado</h2>
          <Button onClick={() => router.push("/trilha-aprendizado")} variant="outline">
            Voltar à Trilha
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700/50 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/trilha-aprendizado")}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <Home className="w-4 h-4 mr-2" />
              Trilha
            </Button>
            <div className="text-sm text-slate-400">
              {curso.titulo} • {aulaAtual.modulo_titulo} • {aulaAtual.titulo}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModoFoco(!modoFoco)}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <Maximize className="w-4 h-4" />
              {modoFoco ? "Sair do Foco" : "Modo Foco"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarAberta(!sidebarAberta)}
              className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Área Principal */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Módulos e Aulas */}
        <AnimatePresence>
          {sidebarAberta && !modoFoco && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-80 bg-slate-800/30 border-r border-slate-700/50 flex-shrink-0 overflow-hidden"
            >
              <div className="h-full overflow-y-auto sidebar-area">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Conteúdo do Curso</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarAberta(false)}
                      className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700/50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {curso.modulos.map((modulo) => (
                      <div key={modulo.id} className="space-y-1">
                        <Button
                          variant="ghost"
                          onClick={() => toggleModulo(modulo.id)}
                          className="w-full justify-between text-left p-3 h-auto text-slate-300 hover:text-white hover:bg-slate-700/50"
                        >
                          <span className="font-medium">{modulo.titulo}</span>
                          {modulosExpandidos.has(modulo.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>

                        <AnimatePresence>
                          {modulosExpandidos.has(modulo.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 space-y-1">
                                {modulo.aulas.map((aula) => (
                                  <Button
                                    key={aula.id}
                                    variant="ghost"
                                    onClick={() => selecionarAula(aula)}
                                    className={cn(
                                      "w-full justify-start text-left p-3 h-auto text-sm",
                                      aulaAtual.id === aula.id
                                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 hover:text-indigo-300"
                                        : "text-slate-400 hover:text-white hover:bg-slate-700/30",
                                    )}
                                  >
                                    <div className="flex items-center gap-3 w-full">
                                      <div className="flex items-center gap-2">
                                        {aulaAssistida(aula.id) ? (
                                          <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                          <Circle className="w-4 h-4" />
                                        )}
                                        {getIconeAula(aula.tipo)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="truncate">{aula.titulo}</div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                          <Clock className="w-3 h-3" />
                                          {formatarDuracao(aula.duracao)}
                                        </div>
                                      </div>
                                    </div>
                                  </Button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Área Central Escrolável */}
        <div className="flex-1 flex min-w-0">
          <div className="flex-1 bg-black/20 overflow-y-auto content-area">
            <div className="p-4 space-y-6">
              {/* Player/Visualizador */}
              <div className="w-full max-w-5xl mx-auto">
                <ContentViewer
                  aula={aulaAtual}
                  onProgress={handleContentProgress}
                  onCompleted={handleContentCompleted}
                />
              </div>

              {/* Controles de Navegação */}
              <div className="w-full max-w-5xl mx-auto">
                <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4">
                  {/* Primeira linha: Navegação e Progresso */}
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      onClick={() => navegarAula("anterior")}
                      disabled={!curso.modulos[0]?.aulas[0] || aulaAtual.id === curso.modulos[0].aulas[0].id}
                      className="border-slate-600/50 bg-slate-800/30 text-slate-300 hover:text-white hover:bg-slate-700/50 hover:border-slate-500"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Anterior
                    </Button>

                    <div className="flex-1 mx-8">
                      <div className="text-center mb-2">
                        <span className="text-sm text-slate-400">
                          Progresso do Curso: {progresso?.progresso_percentual || 0}%
                        </span>
                      </div>
                      <Progress value={progresso?.progresso_percentual || 0} className="h-2" />
                    </div>

                    <Button
                      onClick={() => navegarAula("proxima")}
                      className="bg-indigo-600/80 hover:bg-indigo-600 text-white border-0"
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {/* Segunda linha: Marcar como Concluída */}
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={marcarComoAssistida}
                      className="border-green-600/50 bg-green-900/20 text-green-400 hover:bg-green-600/20 hover:text-green-300 hover:border-green-500"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Concluída
                    </Button>
                  </div>
                </div>
              </div>

              {/* Seção de Informações da Aula */}
              <div className="w-full max-w-5xl mx-auto">
                <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-3">Sobre esta aula</h3>

                      <div className="flex flex-wrap items-center gap-6 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">Módulo:</span>
                          <span className="text-slate-400">{aulaAtual.modulo_titulo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">Duração:</span>
                          <span className="text-slate-400">{formatarDuracao(aulaAtual.duracao)}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-700/50 pt-4">
                        <h4 className="font-medium text-white mb-3">Resumo</h4>
                        {aulaAtual.resumo ? (
                          <div
                            className="text-slate-300 leading-relaxed [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h3]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:space-y-1 [&_li]:text-slate-300 [&_a]:text-blue-400 [&_a]:underline [&_a]:hover:text-blue-300"
                            dangerouslySetInnerHTML={{ __html: aulaAtual.resumo }}
                          />
                        ) : (
                          <p className="text-slate-300 leading-relaxed">Nenhum resumo disponível para esta aula.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Painel de Informações Lateral */}
          <AnimatePresence>
            {painelInfoAberto && !modoFoco && (
              <motion.aside
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-80 bg-slate-800/30 border-l border-slate-700/50 flex-shrink-0 overflow-hidden"
              >
                <div className="h-full overflow-y-auto sidebar-area">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">Recursos</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPainelInfoAberto(false)}
                        className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <Tabs defaultValue="anotacoes" className="h-full">
                      <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                        <TabsTrigger value="anotacoes" className="text-xs">
                          Anotações
                        </TabsTrigger>
                        <TabsTrigger value="materiais" className="text-xs">
                          Materiais
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="anotacoes" className="mt-0 h-full">
                        {aulaAtual && (
                          <PainelAnotacoes aulaId={aulaAtual.id} cursoId={cursoId} currentTime={currentVideoTime} />
                        )}
                      </TabsContent>

                      <TabsContent value="materiais" className="mt-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-white">Materiais Complementares</h4>
                          <div className="text-sm text-slate-400">
                            <p>Nenhum material adicional disponível para esta aula.</p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Botões para reabrir painéis quando fechados */}
      {!sidebarAberta && !modoFoco && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarAberta(true)}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-600/50"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      {!painelInfoAberto && !modoFoco && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPainelInfoAberto(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-600/50"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
