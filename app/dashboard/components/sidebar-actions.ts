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
  const supabase = createServerSupabaseClient()

  try {
    // console.debug("Tentando gerar URL assinada para:", filePath)

    // Se o filePath for uma URL completa, extrair apenas o caminho
    let cleanPath = filePath
    if (filePath.includes("storage/v1/object/public/ead/")) {
      cleanPath = filePath.split("storage/v1/object/public/ead/")[1]
      // console.debug("URL completa detectada, extraindo caminho:", cleanPath)
    }

    // Tentar gerar URL assinada
    const { data, error } = await supabase.storage.from("ead").createSignedUrl(cleanPath, 3600) // 1 hora

    if (error) {
      console.error("Erro ao gerar URL assinada:", error)
      // console.debug("Caminho que falhou:", cleanPath)
      return null
    }

    // console.debug("URL assinada gerada com sucesso para sidebar")
    return data.signedUrl
  } catch (error) {
    console.error("Erro na função getSignedPhotoUrl:", error)
    return null
  }
}
