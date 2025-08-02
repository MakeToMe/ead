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
import { useAuth } from "@/contexts/auth-context"

export default function AuthPageClient() {
  const [activeTab, setActiveTab] = useState("login")
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error">("error")
  const router = useRouter()
  const { signIn, signUp, isLoading, error, clearError } = useAuth()

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

    try {
      const user = await signIn(email, password)
      setMessage(`Login bem-sucedido! Bem-vindo, ${user.nome}`)
      setMessageType("success")

      console.log('✅ AuthPageClient: Login bem-sucedido, redirecionando para dashboard')
      
      // Redirecionamento imediato - AuthService já gerencia tudo
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : "Erro ao fazer login"
      setMessage(errorMessage)
      setMessageType("error")
      console.error('❌ AuthPageClient: Erro no login', authError)
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

    // Validações no cliente
    if (!name || !email || !password || !confirmPassword) {
      setMessage("Todos os campos são obrigatórios.")
      setMessageType("error")
      return
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.")
      setMessageType("error")
      return
    }

    if (password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.")
      setMessageType("error")
      return
    }

    try {
      const user = await signUp(name, email, password)
      setMessage(`Conta criada com sucesso! Bem-vindo, ${user.nome}`)
      setMessageType("success")

      console.log('✅ AuthPageClient: Cadastro bem-sucedido, redirecionando para dashboard')
      
      // Redirecionamento imediato - AuthService já gerencia tudo
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : "Erro ao criar conta"
      setMessage(errorMessage)
      setMessageType("error")
      console.error('❌ AuthPageClient: Erro no cadastro', authError)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Plataforma R$antos</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Acesse sua conta ou crie uma nova para continuar.
          </p>
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
                        <Input id="email-login" name="email" type="email" placeholder="m@example.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-login">Senha</Label>
                        <Input id="password-login" name="password" type="password" required />
                      </div>
                      <Link href="#" className="text-sm font-medium text-primary hover:underline" prefetch={false}>
                        Esqueceu a senha?
                      </Link>
                      {(message || error) && (
                        <p className={`text-sm ${messageType === "success" ? "text-green-500" : "text-red-500"}`}>
                          {message || error?.message}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? "Entrando..." : "Entrar"}
                      </Button>
                    </CardFooter>
                  </form>
                </motion.div>
              )}

              {activeTab === "signup" && (
                <motion.div key="signup" initial="hidden" animate="visible" exit="exit" variants={formVariants}>
                  <CardHeader>
                    <CardTitle>Criar Conta</CardTitle>
                    <CardDescription>Preencha seus dados para criar uma nova conta.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name-signup">Nome Completo</Label>
                        <Input id="name-signup" name="name" type="text" placeholder="Seu Nome" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-signup">Email</Label>
                        <Input id="email-signup" name="email" type="email" placeholder="m@example.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signup">Senha</Label>
                        <Input id="password-signup" name="password" type="password" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password-signup">Confirmar Senha</Label>
                        <Input id="confirm-password-signup" name="confirmPassword" type="password" required />
                      </div>
                      {(message || error) && (
                        <p className={`text-sm ${messageType === "success" ? "text-green-500" : "text-red-500"}`}>
                          {message || error?.message}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? "Criando..." : "Criar Conta"}
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
