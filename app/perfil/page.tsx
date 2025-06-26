"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { getCurrentClientUser, type User as AuthUser } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Mail,
  Phone,
  Save,
  Lock,
  User,
  Camera,
  Check,
  AlertCircle,
  X,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { getUserFreshData, updateUserProfile, getSignedPhotoUrl } from "./actions"
import ModalUploadFoto from "./components/modal-upload-foto"
import VerificacaoContato from "./components/verificacao-contato"
import SocialLinksCard from "./components/social-links-card"

export default function PerfilPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    bio: "",
  })

  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro"
    texto: string
  } | null>(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  const handleDeleteAccount = async () => {
    if (!user?.uid || confirmText !== "EXCLUIR") return

    try {
      setMensagem({
        tipo: "erro",
        texto: "Funcionalidade em desenvolvimento. Entre em contato com o suporte.",
      })
      setShowDeleteModal(false)
      setConfirmText("")
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao processar solicitação. Tente novamente.",
      })
    }
  }

  // Carregar dados básicos primeiro
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      // Buscar dados do usuário atual
      const currentUser = getCurrentClientUser()
      console.log("Usuário atual no perfil:", currentUser)

      if (currentUser?.uid) {
        // Buscar dados frescos do banco
        const freshUserData = await getUserFreshData(currentUser.uid)
        console.log("Dados frescos do perfil:", freshUserData)

        if (freshUserData) {
          setUser(freshUserData)
          setFormData({
            nome: freshUserData.nome || "",
            email: freshUserData.email || "",
            whatsapp: freshUserData.whatsapp || "",
            bio: freshUserData.bio || "",
          })

          // Se tem foto, gerar URL assinada
          if (freshUserData.url_foto) {
            const signedUrl = await getSignedPhotoUrl(freshUserData.url_foto)
            setPhotoUrl(signedUrl)
          }
        }
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (mensagem) {
      const timer = setTimeout(() => {
        setMensagem(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [mensagem])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.uid) return

    // Mostrar loading se necessário
    setLoading(true)

    const result = await updateUserProfile(user.uid, {
      nome: formData.nome,
      whatsapp: formData.whatsapp,
      bio: formData.bio,
    })

    setLoading(false)

    if (result.success) {
      setIsEditing(false)

      // Definir mensagem de sucesso
      setMensagem({
        tipo: "sucesso",
        texto: "Perfil atualizado com sucesso!",
      })

      // Recarregar dados após atualização
      const loadFreshData = async (uid: string) => {
        const freshUserData = await getUserFreshData(uid)
        if (freshUserData) {
          setUser(freshUserData)
          setFormData({
            nome: freshUserData.nome || "",
            email: freshUserData.email || "",
            whatsapp: freshUserData.whatsapp || "",
            bio: freshUserData.bio || "",
          })

          // Disparar evento para atualizar sidebar
          window.dispatchEvent(new CustomEvent("profileUpdated"))
        }
      }
      await loadFreshData(user.uid)
    } else {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao atualizar perfil: " + result.error,
      })
    }
  }

  const handlePhotoSuccess = async (filePath: string) => {
    // Atualizar o estado do usuário com o novo caminho da foto
    if (user) {
      setUser({ ...user, url_foto: filePath })
      // Gerar nova URL assinada
      const signedUrl = await getSignedPhotoUrl(filePath)
      setPhotoUrl(signedUrl)
    }
  }

  const handleVerificationSuccess = async () => {
    // Recarregar dados do usuário após verificação bem-sucedida
    if (user?.uid) {
      const freshUserData = await getUserFreshData(user.uid)
      if (freshUserData) {
        setUser(freshUserData)
        setFormData({
          nome: freshUserData.nome || "",
          email: freshUserData.email || "",
          whatsapp: freshUserData.whatsapp || "",
          bio: freshUserData.bio || "",
        })
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Nenhum usuário encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div className="p-4 md:p-8" initial="hidden" animate="visible" variants={cardVariants}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-slate-300 to-blue-400 bg-clip-text text-transparent mb-2">
            Meu Perfil
          </h1>
          <p className="text-slate-400 text-lg">Gerencie suas informações pessoais</p>
        </div>

        <motion.div
          className="bg-gradient-to-br from-slate-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl overflow-hidden"
          variants={cardVariants}
        >
          {/* Header do perfil */}
          <div className="bg-gradient-to-r from-slate-700/60 to-slate-600/40 p-6 md:p-8 border-b border-slate-700/50">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <motion.div
                className="relative group cursor-pointer"
                variants={itemVariants}
                onClick={() => setIsModalOpen(true)}
              >
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-slate-700 rounded-full flex items-center justify-center shadow-xl overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl || "/placeholder.svg"}
                      alt={user.nome}
                      className="w-full h-full object-cover"
                      onError={() => setPhotoUrl(null)}
                    />
                  ) : (
                    <span className="text-white font-bold text-3xl">{user.nome.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="flex-1">
                <h2 className="text-2xl font-bold text-white text-center md:text-left">{user.nome}</h2>
                <p className="text-slate-400 capitalize text-center md:text-left">{user.perfis}</p>
                <div className="flex justify-center md:justify-start mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Membro desde {new Date(user.criado_em).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0"
                >
                  {isEditing ? "Cancelar" : "Editar Perfil"}
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Conteúdo do perfil */}
          <div className="p-6 md:p-8">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div className="space-y-3" variants={itemVariants}>
                    <Label htmlFor="nome" className="text-slate-300">
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                      <Input
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        className="pl-10 bg-slate-800/50 border-slate-700 focus:border-indigo-500/50 text-white"
                      />
                    </div>
                  </motion.div>

                  <motion.div className="space-y-3" variants={itemVariants}>
                    <Label htmlFor="email" className="text-slate-300">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 bg-slate-800/50 border-slate-700 focus:border-indigo-500/50 text-white opacity-60"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-slate-500">O email não pode ser alterado aqui</p>
                  </motion.div>

                  <motion.div className="space-y-3" variants={itemVariants}>
                    <Label htmlFor="whatsapp" className="text-slate-300">
                      WhatsApp
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        className="pl-10 bg-slate-800/50 border-slate-700 focus:border-indigo-500/50 text-white"
                      />
                    </div>
                  </motion.div>

                  <motion.div className="space-y-3 md:col-span-2" variants={itemVariants}>
                    <Label htmlFor="bio" className="text-slate-300">
                      Biografia
                    </Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Conte um pouco sobre você..."
                      className="min-h-[120px] bg-slate-800/50 border-slate-700 focus:border-indigo-500/50 text-white"
                    />
                  </motion.div>
                </div>

                <motion.div className="mt-8 flex justify-end" variants={itemVariants}>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </motion.div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div className="space-y-4" variants={itemVariants}>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Nome Completo</h3>
                    <div className="bg-gradient-to-r from-slate-800/60 to-gray-800/60 rounded-lg px-4 py-3 text-white border border-slate-700/50 flex items-center gap-3">
                      <User className="text-slate-400 h-4 w-4" />
                      <span>{user.nome}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Email</h3>
                    <div className="bg-gradient-to-r from-slate-800/60 to-gray-800/60 rounded-lg px-4 py-3 text-white border border-slate-700/50 flex items-center gap-3">
                      <Mail className="text-slate-400 h-4 w-4" />
                      <span>{user.email}</span>
                      {user.mail_valid && (
                        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                          Verificado
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">WhatsApp</h3>
                    <div className="bg-gradient-to-r from-slate-800/60 to-gray-800/60 rounded-lg px-4 py-3 text-white border border-slate-700/50 flex items-center gap-3">
                      <Phone className="text-slate-400 h-4 w-4" />
                      <span>{user.whatsapp || "Não informado"}</span>
                      {user.wpp_valid && user.whatsapp && (
                        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                          Verificado
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div className="space-y-4" variants={itemVariants}>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Perfil</h3>
                    <div className="bg-gradient-to-r from-slate-800/60 to-gray-800/60 rounded-lg px-4 py-3 text-white border border-slate-700/50 capitalize">
                      {user.perfis}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Membro desde</h3>
                    <div className="bg-gradient-to-r from-slate-800/60 to-gray-800/60 rounded-lg px-4 py-3 text-white border border-slate-700/50 flex items-center gap-3">
                      <Calendar className="text-slate-400 h-4 w-4" />
                      <span>{new Date(user.criado_em).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Biografia</h3>
                    <div className="bg-gradient-to-r from-slate-800/60 to-gray-800/60 rounded-lg px-4 py-3 text-white border border-slate-700/50 min-h-[80px]">
                      {user.bio || "Nenhuma biografia informada"}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Card Redes Sociais */}
        {user && (
          <SocialLinksCard userId={user.uid} initialLinks={(user as any).social_links ?? {}} />
        )}

        {/* Seção de configurações adicionais */}
        <motion.div
          className="mt-8 bg-gradient-to-br from-slate-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-xl p-6 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-white mb-6">Configurações Adicionais</h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div>
                <h3 className="text-white font-medium">Alterar Senha</h3>
                <p className="text-slate-400 text-sm">Atualize sua senha para manter sua conta segura</p>
              </div>
              <Button
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white opacity-60"
                disabled
              >
                <Lock className="mr-2 h-4 w-4" />
                Em breve
              </Button>
            </div>

            {/* Verificação de Email */}
            <VerificacaoContato user={user} type="email" onSuccess={handleVerificationSuccess} />

            {/* Verificação de WhatsApp */}
            <VerificacaoContato user={user} type="whatsapp" onSuccess={handleVerificationSuccess} />
          </div>

          {/* Danger Zone */}
          <div className="mt-8 p-6 bg-gradient-to-br from-red-900/20 to-red-800/10 backdrop-blur-sm rounded-xl border border-red-500/30 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-xl font-semibold text-red-300">Danger Zone</h3>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-red-900/20 rounded-lg border border-red-500/20">
                <div className="mb-4 md:mb-0">
                  <h4 className="text-red-200 font-medium mb-1">Encerrar Conta</h4>
                  <p className="text-red-300/70 text-sm">
                    Esta ação é irreversível. Todos os seus dados, cursos e progresso serão permanentemente removidos.
                  </p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border border-red-500/50 hover:border-red-400/50 transition-all duration-200"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Encerrar Conta
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-red-500/30 shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Confirmar Exclusão</h3>
                  <p className="text-slate-400 text-sm">Esta ação não pode ser desfeita</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-slate-300 mb-4">
                  Tem certeza que deseja encerrar sua conta? Todos os seus dados serão permanentemente removidos:
                </p>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    Perfil e informações pessoais
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    Progresso em cursos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    Anotações e comentários
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    Histórico de atividades
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="confirmText" className="text-slate-300 text-sm">
                    Digite "EXCLUIR" para confirmar:
                  </Label>
                  <Input
                    id="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="EXCLUIR"
                    className="mt-2 bg-slate-800/50 border-slate-700 focus:border-red-500/50 text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setConfirmText("")
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={confirmText !== "EXCLUIR"}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Conta
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Upload de Foto */}
      <ModalUploadFoto
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={user.uid}
        onSuccess={handlePhotoSuccess}
      />

      {/* Mensagens de feedback - mover para o final do componente, fora de outros containers */}
      <AnimatePresence>
        {mensagem && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-6 right-6 z-[9999] max-w-md"
          >
            <div
              className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-3 ${
                mensagem.tipo === "sucesso"
                  ? "bg-green-500/20 border-green-500/40 text-green-300"
                  : "bg-red-500/20 border-red-500/40 text-red-300"
              }`}
            >
              {mensagem.tipo === "sucesso" ? (
                <Check className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{mensagem.texto}</span>
              <button
                onClick={() => setMensagem(null)}
                className="ml-auto text-current hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
