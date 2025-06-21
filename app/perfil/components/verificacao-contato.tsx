"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Phone, Check, Clock, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  sendVerificationRequest,
  verifyToken,
  updateEmailAfterVerification,
  updateWhatsAppAfterVerification,
} from "../actions"

interface VerificacaoContatoProps {
  user: any
  type: "email" | "whatsapp"
  onSuccess: () => void
}

export default function VerificacaoContato({ user, type, onSuccess }: VerificacaoContatoProps) {
  const [estado, setEstado] = useState<"inicial" | "editando" | "aguardando_token">("inicial")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [tentativas, setTentativas] = useState(0)
  const [timeoutReenvio, setTimeoutReenvio] = useState(0)
  const [valorContato, setValorContato] = useState("")
  const [token, setToken] = useState("")

  const isEmail = type === "email"
  const isVerificado = isEmail ? user.mail_valid : user.wpp_valid
  const valorAtual = isEmail ? user.email : user.whatsapp
  const icone = isEmail ? Mail : Phone
  const titulo = isEmail ? "Verificação de Email" : "Verificação de WhatsApp"
  const placeholder = isEmail ? "seu@email.com" : "(00) 00000-0000"

  // Timer para reenvio
  useEffect(() => {
    if (timeoutReenvio > 0) {
      const timer = setTimeout(() => setTimeoutReenvio(timeoutReenvio - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeoutReenvio])

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (erro || sucesso) {
      const timer = setTimeout(() => {
        setErro("")
        setSucesso("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [erro, sucesso])

  const iniciarVerificacao = () => {
    setValorContato(valorAtual || "")
    setEstado("editando")
    setErro("")
    setSucesso("")
  }

  const enviarToken = async () => {
    if (!valorContato.trim()) {
      setErro(`${isEmail ? "Email" : "WhatsApp"} é obrigatório`)
      return
    }

    if (isEmail && !valorContato.includes("@")) {
      setErro("Email inválido")
      return
    }

    setLoading(true)
    setErro("")

    try {
      const resultado = await sendVerificationRequest(
        user.uid,
        isEmail ? "confirmar_email" : "confirmar_whatsapp",
        valorContato,
      )

      if (resultado.success) {
        setEstado("aguardando_token")
        setTentativas(0)
        setTimeoutReenvio(60)
        setSucesso("Token enviado! Verifique seu " + (isEmail ? "email" : "WhatsApp"))
      } else {
        setErro(resultado.error || "Erro ao enviar token")
      }
    } catch (error) {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const confirmarToken = async () => {
    if (token.length !== 6) {
      setErro("Token deve ter 6 dígitos")
      return
    }

    if (tentativas >= 3) {
      setErro("Máximo de tentativas excedido. Solicite um novo token.")
      return
    }

    setLoading(true)
    setErro("")

    try {
      let resultado

      if (isEmail && valorContato !== user.email) {
        // Alterando email - usar função específica
        resultado = await updateEmailAfterVerification(user.uid, valorContato, token)
      } else if (!isEmail && valorContato !== user.whatsapp) {
        // Alterando WhatsApp - usar função específica
        resultado = await updateWhatsAppAfterVerification(user.uid, valorContato, token)
      } else {
        // Apenas verificando - usar função de verificação
        resultado = await verifyToken(user.uid, token, type)
      }

      if (resultado.success) {
        setSucesso(`${isEmail ? "Email" : "WhatsApp"} verificado com sucesso!`)
        setEstado("inicial")
        setToken("")
        setTentativas(0)
        onSuccess()
      } else {
        const novasTentativas = tentativas + 1
        setTentativas(novasTentativas)

        if (novasTentativas >= 3) {
          setErro("Máximo de tentativas excedido. Solicite um novo token.")
          setEstado("inicial")
          setToken("")
        } else {
          setErro(`Token incorreto. Tentativa ${novasTentativas}/3`)
        }
      }
    } catch (error) {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const cancelar = () => {
    setEstado("inicial")
    setValorContato("")
    setToken("")
    setErro("")
    setSucesso("")
    setTentativas(0)
  }

  const reenviarToken = () => {
    if (timeoutReenvio > 0) return
    enviarToken()
  }

  const Icon = icone

  return (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {titulo}
          </h3>
          <p className="text-slate-400 text-sm">
            {isVerificado
              ? `${isEmail ? "Email" : "WhatsApp"} verificado e seguro`
              : `Verifique seu ${isEmail ? "email" : "WhatsApp"} para maior segurança`}
          </p>
        </div>

        {estado === "inicial" && (
          <Button
            onClick={iniciarVerificacao}
            disabled={loading}
            className={`${
              isVerificado
                ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            } text-white`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Icon className="mr-2 h-4 w-4" />
            )}
            {isVerificado ? `Alterar ${isEmail ? "Email" : "WhatsApp"}` : `Verificar ${isEmail ? "Email" : "WhatsApp"}`}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Estado: Editando contato */}
        {estado === "editando" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="text-slate-300 text-sm mb-2 block">
                {isVerificado
                  ? `Novo ${isEmail ? "Email" : "WhatsApp"}`
                  : `Confirme seu ${isEmail ? "Email" : "WhatsApp"}`}
              </label>
              <Input
                type={isEmail ? "email" : "text"}
                value={valorContato}
                onChange={(e) => setValorContato(e.target.value)}
                placeholder={placeholder}
                className="bg-slate-700/50 border-slate-600 focus:border-indigo-500/50 text-white"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={enviarToken}
                disabled={loading || !valorContato.trim()}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white flex-1"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Enviar Token
              </Button>
              <Button
                onClick={cancelar}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Estado: Aguardando token */}
        {estado === "aguardando_token" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="text-slate-300 text-sm mb-2 block">
                Digite o código de 6 dígitos enviado para {valorContato}
              </label>
              <Input
                type="text"
                value={token}
                onChange={(e) => {
                  const valor = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setToken(valor)
                }}
                placeholder="000000"
                className="bg-slate-700/50 border-slate-600 focus:border-indigo-500/50 text-white text-center text-2xl tracking-widest"
                disabled={loading}
                maxLength={6}
              />
              <p className="text-slate-500 text-xs mt-1">Tentativas: {tentativas}/3</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={confirmarToken}
                disabled={loading || token.length !== 6 || tentativas >= 3}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white flex-1"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Confirmar
              </Button>
              <Button
                onClick={reenviarToken}
                variant="outline"
                disabled={timeoutReenvio > 0 || loading}
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
              >
                {timeoutReenvio > 0 ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    {timeoutReenvio}s
                  </>
                ) : (
                  "Reenviar"
                )}
              </Button>
              <Button
                onClick={cancelar}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensagens de erro e sucesso */}
      <AnimatePresence>
        {erro && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{erro}</span>
          </motion.div>
        )}

        {sucesso && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400"
          >
            <Check className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{sucesso}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
