"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signIn, signUp } from "@/app/auth/actions"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login")

  // useActionState para o formulário de Login
  const [loginState, loginAction] = useActionState(signIn, {
    success: false,
    message: "",
    user: null,
  })

  // useActionState para o formulário de Cadastro
  const [signupState, signupAction] = useActionState(signUp, {
    success: false,
    message: "",
    user: null,
  })

  const formVariants = {
    hidden: { opacity: 0, x: activeTab === "login" ? -20 : 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: activeTab === "login" ? 20 : -20, transition: { duration: 0.3 } },
  }

  // Se o login foi bem-sucedido, mostrar informações do usuário
  if (loginState.success && loginState.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-950">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Plataforma R$antos</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Login realizado com sucesso!</p>
          </div>

          <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200">✅ Autenticação Bem-sucedida</CardTitle>
              <CardDescription className="text-green-600 dark:text-green-300">
                Usuário logado com sucesso no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-green-700 dark:text-green-300">Nome:</Label>
                <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-200 dark:border-green-700">
                  <span className="text-green-800 dark:text-green-200 font-medium">{loginState.user.nome}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-green-700 dark:text-green-300">Email:</Label>
                <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-200 dark:border-green-700">
                  <span className="text-green-800 dark:text-green-200">{loginState.user.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-green-700 dark:text-green-300">Perfil:</Label>
                <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-200 dark:border-green-700">
                  <span className="text-green-800 dark:text-green-200 capitalize">{loginState.user.perfis}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-green-700 dark:text-green-300">UID:</Label>
                <div className="bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-200 dark:border-green-700">
                  <span className="text-green-800 dark:text-green-200 font-mono text-sm">{loginState.user.uid}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Voltar ao Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
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
                  <form action={loginAction}>
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
                      {loginState.message && (
                        <p className={`text-sm ${loginState.success ? "text-green-500" : "text-red-500"}`}>
                          {loginState.message}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" type="submit">
                        Entrar
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
                  <form action={signupAction}>
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
                      {signupState.message && (
                        <p className={`text-sm ${signupState.success ? "text-green-500" : "text-red-500"}`}>
                          {signupState.message}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" type="submit">
                        Criar Conta
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
