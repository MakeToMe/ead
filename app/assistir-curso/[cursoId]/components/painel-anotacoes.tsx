"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Star, Clock, MessageSquare, AlertCircle, FileText, Search, BookOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  criarAnotacao,
  buscarAnotacoesAula,
  atualizarAnotacao,
  excluirAnotacao,
  alternarFavorito,
  type AnotacaoUsuario,
  type CriarAnotacaoData,
} from "../anotacoes-actions"

interface PainelAnotacoesProps {
  aulaId: string
  cursoId: string
  currentTime?: number // Tempo atual do vídeo em segundos
}

const tipoIcons = {
  nota: MessageSquare,
  duvida: AlertCircle,
  importante: Star,
  resumo: FileText,
}

const tipoColors = {
  nota: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  duvida: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  importante: "bg-red-500/20 text-red-400 border-red-500/30",
  resumo: "bg-green-500/20 text-green-400 border-green-500/30",
}

const corBadges = {
  azul: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  verde: "bg-green-500/20 text-green-400 border-green-500/30",
  amarelo: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  vermelho: "bg-red-500/20 text-red-400 border-red-500/30",
  roxo: "bg-purple-500/20 text-purple-400 border-purple-500/30",
}

export function PainelAnotacoes({ aulaId, cursoId, currentTime }: PainelAnotacoesProps) {
  const { user } = useAuth()
  const [anotacoes, setAnotacoes] = useState<AnotacaoUsuario[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editandoAnotacao, setEditandoAnotacao] = useState<AnotacaoUsuario | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [busca, setBusca] = useState("")
  const { toast } = useToast()

  const [formData, setFormData] = useState<Partial<CriarAnotacaoData>>({
    titulo: "",
    conteudo: "",
    tipo: "nota",
    cor: "azul",
    privada: true,
  })

  useEffect(() => {
    if (aulaId && user?.uid) {
      carregarAnotacoes()
    }
  }, [aulaId, user?.uid])

  const carregarAnotacoes = async () => {
    if (!aulaId || !user?.uid) return

    setLoading(true)
    try {
      const result = await buscarAnotacoesAula(aulaId, user.uid)
      if (result.success) {
        setAnotacoes(result.data)
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar anotações:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar anotações",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSalvarAnotacao = async () => {
    if (!user?.uid) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você precisa estar logado para criar anotações",
      })
      return
    }

    if (!formData.conteudo?.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O conteúdo da anotação é obrigatório",
      })
      return
    }

    try {
      const dadosAnotacao: CriarAnotacaoData = {
        curso_id: cursoId,
        aula_id: aulaId,
        titulo: formData.titulo,
        conteudo: formData.conteudo,
        timestamp_video: currentTime ? Math.floor(currentTime) : undefined,
        tipo: formData.tipo as any,
        cor: formData.cor as any,
        privada: formData.privada,
      }

      let result
      if (editandoAnotacao) {
        result = await atualizarAnotacao(editandoAnotacao.id, dadosAnotacao, user.uid)
      } else {
        result = await criarAnotacao(dadosAnotacao, user.uid)
      }

      if (result.success) {
        toast({
          variant: "success",
          title: "Sucesso!",
          description: editandoAnotacao ? "Anotação atualizada" : "Anotação criada",
        })
        setDialogAberto(false)
        setEditandoAnotacao(null)
        setFormData({
          titulo: "",
          conteudo: "",
          tipo: "nota",
          cor: "azul",
          privada: true,
        })
        carregarAnotacoes()
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error,
        })
      }
    } catch (error) {
      console.error("Erro ao salvar anotação:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao salvar a anotação",
      })
    }
  }

  const handleEditarAnotacao = (anotacao: AnotacaoUsuario) => {
    setEditandoAnotacao(anotacao)
    setFormData({
      titulo: anotacao.titulo || "",
      conteudo: anotacao.conteudo,
      tipo: anotacao.tipo,
      cor: anotacao.cor,
      privada: anotacao.privada,
    })
    setDialogAberto(true)
  }

  const handleExcluirAnotacao = async (anotacaoId: string) => {
    if (!user?.uid) return
    if (!confirm("Tem certeza que deseja excluir esta anotação?")) return

    try {
      const result = await excluirAnotacao(anotacaoId, user.uid)
      if (result.success) {
        toast({
          variant: "success",
          title: "Anotação excluída",
        })
        carregarAnotacoes()
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error,
        })
      }
    } catch (error) {
      console.error("Erro ao excluir anotação:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao excluir a anotação",
      })
    }
  }

  const handleToggleFavorito = async (anotacaoId: string) => {
    if (!user?.uid) return

    try {
      const result = await alternarFavorito(anotacaoId, user.uid)
      if (result.success) {
        carregarAnotacoes()
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error,
        })
      }
    } catch (error) {
      console.error("Erro ao alternar favorito:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao marcar como favorito",
      })
    }
  }

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60

    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`
    }
    return `${minutos}:${segs.toString().padStart(2, "0")}`
  }

  const anotacoesFiltradas = anotacoes.filter((anotacao) => {
    const matchTipo = filtroTipo === "todos" || anotacao.tipo === filtroTipo
    const matchBusca =
      busca === "" ||
      anotacao.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
      (anotacao.titulo && anotacao.titulo.toLowerCase().includes(busca.toLowerCase()))

    return matchTipo && matchBusca
  })

  // Se o usuário não estiver logado, mostra mensagem
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">Você precisa estar logado para ver suas anotações</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Minhas Anotações</h3>
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  setEditandoAnotacao(null)
                  setFormData({
                    titulo: "",
                    conteudo: "",
                    tipo: "nota",
                    cor: "azul",
                    privada: true,
                  })
                }}
                className="bg-indigo-600/80 hover:bg-indigo-600/90 text-white transition-all duration-200 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-1" /> Nova
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border border-slate-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editandoAnotacao ? "Editar Anotação" : "Nova Anotação"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Título (opcional)</Label>
                  <Input
                    value={formData.titulo || ""}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Título da anotação"
                    className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700/70 hover:border-slate-500 focus:bg-slate-700/80 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Conteúdo *</Label>
                  <Textarea
                    value={formData.conteudo || ""}
                    onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                    placeholder="Escreva sua anotação..."
                    className="bg-slate-700/50 border-slate-600 text-white min-h-[100px] hover:bg-slate-700/70 hover:border-slate-500 focus:bg-slate-700/80 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tipo</Label>
                    <Select
                      value={formData.tipo || "nota"}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value as any })}
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700/70 hover:border-slate-500 focus:border-indigo-500 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem
                          value="nota"
                          className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
                        >
                          📝 Nota
                        </SelectItem>
                        <SelectItem
                          value="duvida"
                          className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
                        >
                          ❓ Dúvida
                        </SelectItem>
                        <SelectItem
                          value="importante"
                          className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
                        >
                          ⭐ Importante
                        </SelectItem>
                        <SelectItem
                          value="resumo"
                          className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
                        >
                          📄 Resumo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Cor</Label>
                    <Select
                      value={formData.cor || "azul"}
                      onValueChange={(value) => setFormData({ ...formData, cor: value as any })}
                    >
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700/70 hover:border-slate-500 focus:border-indigo-500 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem
                          value="azul"
                          className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
                        >
                          🔵 Azul
                        </SelectItem>
                        <SelectItem
                          value="verde"
                          className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
                        >
                          🟢 Verde
                        </SelectItem>
                        <SelectItem
                          value="amarelo"
                          className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
                        >
                          🟡 Amarelo
                        </SelectItem>
                        <SelectItem
                          value="vermelho"
                          className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
                        >
                          🔴 Vermelho
                        </SelectItem>
                        <SelectItem
                          value="roxo"
                          className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
                        >
                          🟣 Roxo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.privada}
                    onCheckedChange={(checked) => setFormData({ ...formData, privada: checked })}
                    id="privada"
                  />
                  <Label htmlFor="privada" className="text-slate-300">
                    Anotação privada
                  </Label>
                </div>

                {currentTime !== undefined && (
                  <div className="text-sm text-slate-400">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Tempo atual: {formatarTempo(Math.floor(currentTime))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogAberto(false)}
                  className="flex-1 bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700/70 hover:border-slate-500 hover:text-white transition-all duration-200"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSalvarAnotacao}
                  disabled={!formData.conteudo?.trim()}
                  className="flex-1 bg-indigo-600/80 hover:bg-indigo-600/90 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-200"
                >
                  {editandoAnotacao ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar anotações..."
              className="pl-10 bg-slate-700/50 border-slate-600 text-white text-sm hover:bg-slate-700/70 hover:border-slate-500 focus:bg-slate-700/80 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white text-sm hover:bg-slate-700/70 hover:border-slate-500 transition-all duration-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem
                value="todos"
                className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
              >
                Todos os tipos
              </SelectItem>
              <SelectItem
                value="nota"
                className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
              >
                📝 Notas
              </SelectItem>
              <SelectItem
                value="duvida"
                className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
              >
                ❓ Dúvidas
              </SelectItem>
              <SelectItem
                value="importante"
                className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
              >
                ⭐ Importantes
              </SelectItem>
              <SelectItem
                value="resumo"
                className="hover:bg-slate-700/70 focus:bg-slate-700/70 data-[highlighted]:bg-slate-700/70 data-[highlighted]:text-white"
              >
                📄 Resumos
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Anotações */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando anotações...</p>
          </div>
        ) : anotacoesFiltradas.length === 0 ? (
          <div className="text-center py-8">
            {busca || filtroTipo !== "todos" ? (
              <div>
                <Search className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Nenhuma anotação encontrada com estes filtros</p>
              </div>
            ) : (
              <div>
                <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Você ainda não tem anotações para esta aula</p>
                <p className="text-slate-500 text-sm mt-1">Clique em "Nova" para criar sua primeira anotação</p>
              </div>
            )}
          </div>
        ) : (
          anotacoesFiltradas.map((anotacao) => {
            const IconeTipo = tipoIcons[anotacao.tipo]
            return (
              <Card
                key={anotacao.id}
                className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 hover:border-slate-600/70 transition-all duration-200"
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconeTipo className="w-4 h-4 text-slate-400" />
                      <Badge className={tipoColors[anotacao.tipo]} variant="outline">
                        {anotacao.tipo === "nota"
                          ? "Nota"
                          : anotacao.tipo === "duvida"
                            ? "Dúvida"
                            : anotacao.tipo === "importante"
                              ? "Importante"
                              : "Resumo"}
                      </Badge>
                      {anotacao.cor !== "azul" && (
                        <Badge className={corBadges[anotacao.cor]} variant="outline">
                          {anotacao.cor.charAt(0).toUpperCase() + anotacao.cor.slice(1)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleFavorito(anotacao.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all duration-200"
                      >
                        {anotacao.favorita ? (
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <Star className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditarAnotacao(anotacao)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-all duration-200"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExcluirAnotacao(anotacao.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {anotacao.titulo && <h4 className="font-medium text-white text-sm mb-1">{anotacao.titulo}</h4>}

                  <p className="text-slate-300 text-sm mb-2 leading-relaxed whitespace-pre-wrap">{anotacao.conteudo}</p>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(anotacao.criado_em).toLocaleDateString()}</span>
                    {anotacao.timestamp_video && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatarTempo(anotacao.timestamp_video)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
