import { NextRequest, NextResponse } from "next/server"
import { verifyJwt } from "@/lib/auth-jwt"
import { cookies } from "next/headers"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(_: NextRequest) {
  console.log("🔍 /api/auth/me - Iniciando verificação de sessão")
  
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    
    console.log("🍪 Token encontrado:", token ? "✅ Sim" : "❌ Não")
    
    if (!token) {
      console.log("❌ Token não encontrado, retornando 401")
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const payload = verifyJwt(token)
    console.log("🔐 JWT payload:", payload ? "✅ Válido" : "❌ Inválido")
    
    if (!payload) {
      console.log("❌ JWT inválido, limpando cookie")
      cookieStore.delete("session")
      return NextResponse.json({ message: "Invalid session" }, { status: 401 })
    }

    console.log("🔍 Buscando usuário no Supabase, UID:", payload.uid)
    const supabase = createServerSupabaseClient()
    const { data: user, error } = await supabase
      .from("users")
      .select("uid, nome, email, perfis, criado_em, atualizado_em, url_foto")
      .eq("uid", payload.uid)
      .single()
    
    if (error) {
      console.log("❌ Erro do Supabase:", error.message)
      return NextResponse.json({ message: "Database error: " + error.message }, { status: 500 })
    }
    
    if (!user) {
      console.log("❌ Usuário não encontrado")
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }
    
    console.log("✅ Usuário encontrado:", user.email)
    return NextResponse.json({ user })
    
  } catch (error) {
    console.error("❌ Erro crítico em /api/auth/me:", error)
    return NextResponse.json({ 
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
