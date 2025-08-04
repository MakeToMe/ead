"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { User as AuthUser } from "@/lib/auth-client"

export async function getUserFresh(email: string): Promise<AuthUser | null> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.schema("rarcursos").from("users").select("*").eq("email", email).single()

    if (error || !data) {
      console.error("Erro ao buscar usuário fresco:", error)
      return null
    }

    // console.debug("Dados frescos do usuário carregados:", data.nome)
    return data as AuthUser
  } catch (error) {
    console.error("Erro ao buscar usuário fresco:", error)
    return null
  }
}

export async function getSignedPhotoUrl(filePath: string) {
  try {
    console.log("📸 Sidebar: Gerando URL para foto:", filePath)

    // Se não há filePath, retornar null
    if (!filePath) {
      console.warn("⚠️ Sidebar: FilePath vazio para foto")
      return null
    }

    // Para MinIO, vamos usar a URL direta
    const { getMinioClientFileUrl } = await import("@/lib/minio-config")
    const photoUrl = getMinioClientFileUrl(filePath)
    
    console.log("✅ Sidebar: URL da foto gerada:", photoUrl)
    console.log("📋 Sidebar: Configuração MinIO:", {
      endpoint: process.env.NEXT_PUBLIC_MINIO_ENDPOINT,
      bucket: process.env.NEXT_PUBLIC_MINIO_BUCKET,
      filePath,
      fullUrl: photoUrl
    })
    
    // Vamos testar se a URL é válida
    if (photoUrl) {
      console.log("🔗 Sidebar: Testando URL:", photoUrl)
    }
    
    // Não vamos testar com HEAD por enquanto para evitar problemas de CORS
    // A URL será testada quando for carregada na imagem
    
    return photoUrl
  } catch (error) {
    console.error("❌ Sidebar: Erro ao gerar URL da foto:", error)
    return null
  }
}
