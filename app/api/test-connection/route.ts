import { NextRequest, NextResponse } from "next/server"

export async function GET(_: NextRequest) {
  console.log("🌐 /api/test-connection - Testando conectividade básica")
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log("🔧 Configuração:")
    console.log("URL:", supabaseUrl)
    console.log("Service Key:", serviceKey ? "✅ Presente" : "❌ Ausente")
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        success: false,
        error: "Configuração incompleta",
        missing: {
          url: !supabaseUrl,
          serviceKey: !serviceKey
        }
      }, { status: 500 })
    }
    
    // Teste 1: Ping básico
    console.log("🏓 Teste 1: Ping básico para", supabaseUrl)
    try {
      const pingResponse = await fetch(supabaseUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'EAD-Platform-Test'
        }
      })
      console.log("🏓 Ping status:", pingResponse.status)
      console.log("🏓 Ping headers:", Object.fromEntries(pingResponse.headers.entries()))
    } catch (pingError) {
      console.log("❌ Ping falhou:", pingError)
    }
    
    // Teste 2: Endpoint REST API
    console.log("🔍 Teste 2: Testando endpoint REST API")
    const restUrl = `${supabaseUrl}/rest/v1/users?select=uid&limit=1`
    console.log("🔗 URL da query:", restUrl)
    
    const response = await fetch(restUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
    
    console.log("📡 Response status:", response.status)
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log("❌ Response body:", errorText)
      
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}`,
        details: errorText,
        url: restUrl
      }, { status: 500 })
    }
    
    const data = await response.json()
    console.log("✅ Dados recebidos:", data)
    
    return NextResponse.json({
      success: true,
      message: "Conexão OK",
      data,
      config: {
        url: supabaseUrl,
        schema: process.env.SUPABASE_SCHEMA
      }
    })
    
  } catch (error) {
    console.error("❌ Erro crítico:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}