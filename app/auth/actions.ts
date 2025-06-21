"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { hashPassword, verifyPassword, createSession } from "@/lib/auth"
import { redirect } from "next/navigation"

// Server Action para Login
export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, message: "Email e senha são obrigatórios.", user: null }
  }

  try {
    const supabase = createServerSupabaseClient()

    // Buscar usuário pelo email
    const { data: user, error } = await supabase
      .from("users")
      .select("uid, email, senha, nome, perfis, criado_em")
      .eq("email", email)
      .single()

    if (error || !user) {
      return {
        success: false,
        message: `Usuário não encontrado. Erro: ${error?.message || "Email não cadastrado"}`,
        user: null,
      }
    }

    // Verificar senha
    const isValidPassword = await verifyPassword(password, user.senha)

    if (!isValidPassword) {
      return { success: false, message: "Senha incorreta.", user: null }
    }

    // Criar sessão
    await createSession(user.uid)

    // Retornar sucesso com dados do usuário (sem a senha)
    const { senha, ...userWithoutPassword } = user
    return {
      success: true,
      message: "Login realizado com sucesso!",
      user: userWithoutPassword,
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro inesperado: ${error}`,
      user: null,
    }
  }
}

// Server Action para Cadastro
export async function signUp(prevState: any, formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!name || !email || !password || !confirmPassword) {
    return { success: false, message: "Todos os campos são obrigatórios.", user: null }
  }

  if (password !== confirmPassword) {
    return { success: false, message: "As senhas não coincidem.", user: null }
  }

  if (password.length < 6) {
    return { success: false, message: "A senha deve ter pelo menos 6 caracteres.", user: null }
  }

  const supabase = createServerSupabaseClient()

  // Verificar se email já existe
  const { data: existingUser } = await supabase.from("users").select("email").eq("email", email).single()

  if (existingUser) {
    return { success: false, message: "Este email já está em uso.", user: null }
  }

  // Hash da senha
  const hashedPassword = await hashPassword(password)

  // Inserir novo usuário
  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      nome: name,
      email: email,
      senha: hashedPassword,
      perfis: "aluno", // Default conforme especificado
    })
    .select("uid")
    .single()

  if (error || !newUser) {
    console.error("Erro ao criar usuário:", error)
    return { success: false, message: "Erro ao criar conta. Tente novamente.", user: null }
  }

  // Criar sessão para o novo usuário
  await createSession(newUser.uid)

  // Redirecionar para dashboard
  redirect("/dashboard")
}

// Server Action para Logout
export async function signOut() {
  const { destroySession } = await import("@/lib/auth")
  await destroySession()
  redirect("/")
}
