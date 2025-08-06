import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Teste simples de conectividade
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        status: "❌ Erro de conexão",
        error: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      status: "✅ Conexão OK",
      message: "Supabase conectado com sucesso",
      schema: process.env.SUPABASE_SCHEMA || "public"
    })
    
  } catch (error) {
    return NextResponse.json({ 
      status: "❌ Erro crítico",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 })
  }
}