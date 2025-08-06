import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(_: NextRequest) {
  console.log("🧪 /api/test - Testando conexão com Supabase")
  
  try {
    console.log("🔧 Variáveis de ambiente:")
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL)
    console.log("SUPABASE_SCHEMA:", process.env.SUPABASE_SCHEMA)
    console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Definida" : "❌ Não definida")
    
    // Teste 1: Verificar se a URL responde
    console.log("🌐 Teste 1: Verificando conectividade básica...")
    try {
      const healthCheck = await fetch(`${process.env.SUPABASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      })
      console.log("🏥 Health check status:", healthCheck.status)
    } catch (healthError) {
      console.log("❌ Health check falhou:", healthError)
    }
    
    // Teste 2: Criar cliente Supabase
    console.log("🔧 Teste 2: Criando cliente Supabase...")
    const supabase = createServerSupabaseClient()
    
    // Teste 3: Query simples no schema correto
    console.log("🔍 Teste 3: Testando query no schema rarcursos...")
    const { data, error, count } = await supabase
      .from("users")
      .select("uid", { count: 'exact' })
      .limit(1)
    
    if (error) {
      console.log("❌ Erro na query:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error,
        hint: error.hint,
        code: error.code
      }, { status: 500 })
    }
    
    console.log("✅ Conexão bem-sucedida!")
    console.log("📊 Dados retornados:", { data, count })
    
    return NextResponse.json({ 
      success: true, 
      message: "Conexão com Supabase OK",
      data,
      count,
      config: {
        url: process.env.SUPABASE_URL,
        schema: process.env.SUPABASE_SCHEMA
      }
    })
    
  } catch (error) {
    console.error("❌ Erro crítico no teste:", error)
    return NextResponse.json({ 
      success: false,
      message: "Erro crítico",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}