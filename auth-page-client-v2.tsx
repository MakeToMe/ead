"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthV2 } from "@/contexts/auth-context-v2"

/**
 * AuthPageClient V2 - Página de login limpa e robusta
 * 
 * Características:
 * - Sem auto-login indesejado
 * - Error handling limpo
 * - Feedback visual apropriado
 * - Integração com AuthService V2
 */
export default function AuthPageClientV2() {
  // console.log('🔄 AuthPageClientV2: Componente renderizado')
  
  const [activeTab, setActiveTab] = useState("login")
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("error")
  const router = useRouter()
  const { signIn, signUp, isLoading, error, clearError } = useAuthV2()

  const formVariants = {
    hidden: { opacity: 0, x: activeTab === "login" ? -20 : 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: activeTab === "login" ? 20 : -20, transition: { duration: 0.3 } },
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    setMessage("")
    clearError()

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    
    // Validação básica
    if (!email || !password) {
      setMessage("Por favor, preencha todos os campos")
      setMessageType("error")
      return
    }

    try {
      const user = await signIn(email, password)
      setMessage(`Login bem-sucedido! Bem-vindo, ${user.nome}`)
      setMessageType("success")
      
      // Redirecionamento após sucesso
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : "Erro ao fazer login"
      setMessage(errorMessage)
      setMessageType("error")
      console.error('❌ AuthPageClientV2: Erro no login', authError)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    setMessage("")
    clearError()

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validações
    if (!name || !email || !password || !confirmPassword) {
      setMessage("Por favor, preencha todos os campos")
      setMessageType("error")
      return
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem")
      setMessageType("error")
      return
    }

    if (password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres")
      setMessageType("error")
      return
    }

    try {
      const user = await signUp(name, email, password)
      setMessage(`Cadastro realizado com sucesso! Bem-vindo, ${user.nome}`)
      setMessageType("success")

      console.log('✅ AuthPageClientV2: Cadastro bem-sucedido, redirecionando')
      
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : "Erro ao criar conta"
      setMessage(errorMessage)
      setMessageType("error")
      console.error('❌ AuthPageClientV2: Erro no cadastro', authError)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plataforma R$antos</h1>
          <p className="text-gray-600">Acesse sua conta ou crie uma nova para continuar.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>

          <Card className="overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "login" && (
                <motion.div key="login" initial="hidden" animate="visible" exit="exit" variants={formVariants}>
                  <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Entre com seu email e senha para acessar sua conta.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-login">Email</Label>
                        <Input 
                          id="email-login" 
                          name="email" 
                          type="email" 
                          placeholder="seu@email.com" 
                          required 
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-login">Senha</Label>
                        <Input 
                          id="password-login" 
                          name="password" 
                          type="password" 
                          required 
                          autoComplete="current-password"
                        />
                      </div>
                      <Link href="#" className="text-sm font-medium text-primary hover:underline" prefetch={false}>
                        Esqueceu a senha?
                      </Link>
                      {(message || error) && (
                        <div className={`p-3 rounded-md text-sm ${
                          messageType === "success" 
                            ? "bg-green-50 text-green-700 border border-green-200" 
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {message || error?.message}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        type="submit" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Entrando...
                          </div>
                        ) : (
                          "Entrar"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </motion.div>
              )}

              {activeTab === "signup" && (
                <motion.div key="signup" initial="hidden" animate="visible" exit="exit" variants={formVariants}>
                  <CardHeader>
                    <CardTitle>Criar Conta</CardTitle>
                    <CardDescription>Preencha os dados abaixo para criar sua conta.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name-signup">Nome Completo</Label>
                        <Input 
                          id="name-signup" 
                          name="name" 
                          type="text" 
                          placeholder="Seu nome completo" 
                          required 
                          autoComplete="name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-signup">Email</Label>
                        <Input 
                          id="email-signup" 
                          name="email" 
                          type="email" 
                          placeholder="seu@email.com" 
                          required 
                          autoComplete="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signup">Senha</Label>
                        <Input 
                          id="password-signup" 
                          name="password" 
                          type="password" 
                          placeholder="Mínimo 6 caracteres" 
                          required 
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password-signup">Confirmar Senha</Label>
                        <Input 
                          id="confirm-password-signup" 
                          name="confirmPassword" 
                          type="password" 
                          placeholder="Digite a senha novamente" 
                          required 
                          autoComplete="new-password"
                        />
                      </div>
                      {(message || error) && (
                        <div className={`p-3 rounded-md text-sm ${
                          messageType === "success" 
                            ? "bg-green-50 text-green-700 border border-green-200" 
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {message || error?.message}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        type="submit" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Criando conta...
                          </div>
                        ) : (
                          "Criar Conta"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}