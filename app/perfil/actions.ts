"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function getUserFreshData(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    console.log("Buscando dados frescos do perfil para usuário:", userId)

    const { data: userData, error } = await supabase
      .schema("rarcursos")
      .from("users")
      .select("*")
      .eq("uid", userId)
      .single()

    if (error) {
      console.error("Erro ao buscar usuário no perfil:", error)
      throw error
    }

    console.log("Dados do perfil encontrados:", userData)
    return userData
  } catch (error) {
    console.error("Erro na função getUserFreshData do perfil:", error)
    return null
  }
}

export async function updateUserProfile(userId: string, profileData: any) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .schema("rarcursos")
      .from("users")
      .update(profileData)
      .eq("uid", userId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    return { success: false, error: error.message }
  }
}

export async function uploadProfilePhoto(userId: string, file: File) {
  const supabase = createServerSupabaseClient()

  try {
    console.log("Iniciando upload da foto para usuário:", userId)

    // Gerar nome único para o arquivo
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    console.log("Fazendo upload do arquivo:", filePath)

    // Upload do arquivo
    const { data: uploadData, error: uploadError } = await supabase.storage.from("ead").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (uploadError) {
      console.error("Erro no upload:", uploadError)
      throw uploadError
    }

    console.log("Upload realizado com sucesso:", uploadData)

    // Salvar apenas o caminho do arquivo (não a URL completa)
    const { data: userData, error: updateError } = await supabase
      .schema("rarcursos")
      .from("users")
      .update({ url_foto: filePath })
      .eq("uid", userId)
      .select()
      .single()

    if (updateError) {
      console.error("Erro ao atualizar URL da foto:", updateError)
      throw updateError
    }

    console.log("Caminho da foto atualizado com sucesso:", userData)

    return { success: true, url: filePath, data: userData }
  } catch (error) {
    console.error("Erro no upload da foto:", error)
    return { success: false, error: error.message }
  }
}

export async function getSignedPhotoUrl(filePath: string) {
  const supabase = createServerSupabaseClient()

  try {
    console.log("Tentando gerar URL assinada para:", filePath)

    // Se o filePath for uma URL completa, extrair apenas o caminho
    let cleanPath = filePath
    if (filePath.includes("storage/v1/object/public/ead/")) {
      cleanPath = filePath.split("storage/v1/object/public/ead/")[1]
      console.log("URL completa detectada, extraindo caminho:", cleanPath)
    }

    // Tentar gerar URL assinada
    const { data, error } = await supabase.storage.from("ead").createSignedUrl(cleanPath, 3600) // 1 hora

    if (error) {
      console.error("Erro ao gerar URL assinada:", error)
      console.log("Caminho que falhou:", cleanPath)
      return null
    }

    console.log("URL assinada gerada com sucesso:", data.signedUrl)
    return data.signedUrl
  } catch (error) {
    console.error("Erro na função getSignedPhotoUrl:", error)
    return null
  }
}

// Função para migrar URLs antigas para caminhos
export async function migratePhotoUrls() {
  const supabase = createServerSupabaseClient()

  try {
    console.log("Iniciando migração de URLs de fotos...")

    // Buscar todos os usuários com url_foto que contém URL completa
    const { data: users, error } = await supabase
      .schema("rarcursos")
      .from("users")
      .select("uid, url_foto")
      .like("url_foto", "%storage/v1/object/public/ead/%")

    if (error) {
      console.error("Erro ao buscar usuários para migração:", error)
      return { success: false, error: error.message }
    }

    console.log(`Encontrados ${users?.length || 0} usuários para migrar`)

    if (users && users.length > 0) {
      for (const user of users) {
        if (user.url_foto) {
          // Extrair apenas o caminho da URL
          const cleanPath = user.url_foto.split("storage/v1/object/public/ead/")[1]
          console.log(`Migrando usuário ${user.uid}: ${user.url_foto} -> ${cleanPath}`)

          // Atualizar no banco
          const { error: updateError } = await supabase
            .schema("rarcursos")
            .from("users")
            .update({ url_foto: cleanPath })
            .eq("uid", user.uid)

          if (updateError) {
            console.error(`Erro ao migrar usuário ${user.uid}:`, updateError)
          }
        }
      }
    }

    console.log("Migração concluída!")
    return { success: true, migrated: users?.length || 0 }
  } catch (error) {
    console.error("Erro na migração:", error)
    return { success: false, error: error.message }
  }
}

// Função para enviar solicitação de verificação
export async function sendVerificationRequest(
  userId: string,
  action: "confirmar_email" | "confirmar_whatsapp",
  contact: string,
) {
  try {
    console.log(`Enviando solicitação de verificação: ${action} para usuário ${userId}`)

    const response = await fetch("https://rarwhk.rardevops.com/webhook/confirmar-dados", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        acao: action,
        user: userId,
        [action === "confirmar_email" ? "email" : "whatsapp"]: contact,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }

    console.log("Solicitação de verificação enviada com sucesso")
    return { success: true }
  } catch (error) {
    console.error("Erro ao enviar solicitação de verificação:", error)
    return { success: false, error: error.message }
  }
}

// Função para verificar token
export async function verifyToken(userId: string, token: string, type: "email" | "whatsapp") {
  const supabase = createServerSupabaseClient()

  try {
    console.log(`Verificando token ${type} para usuário ${userId}`)

    // Buscar usuário atual
    const { data: userData, error: fetchError } = await supabase
      .schema("rarcursos")
      .from("users")
      .select("mail_token, wpp_token")
      .eq("uid", userId)
      .single()

    if (fetchError) {
      console.error("Erro ao buscar dados do usuário:", fetchError)
      return { success: false, error: "Erro ao verificar token" }
    }

    const storedToken = type === "email" ? userData.mail_token : userData.wpp_token

    if (!storedToken) {
      return { success: false, error: "Token não encontrado. Solicite um novo token." }
    }

    if (storedToken !== token) {
      return { success: false, error: "Token incorreto. Tente novamente." }
    }

    // Token correto - atualizar status de validação
    const updateData = type === "email" ? { mail_valid: true, mail_token: null } : { wpp_valid: true, wpp_token: null }

    const { error: updateError } = await supabase.schema("rarcursos").from("users").update(updateData).eq("uid", userId)

    if (updateError) {
      console.error("Erro ao atualizar status de validação:", updateError)
      return { success: false, error: "Erro ao validar" }
    }

    console.log(`${type} validado com sucesso para usuário ${userId}`)
    return { success: true }
  } catch (error) {
    console.error("Erro na verificação do token:", error)
    return { success: false, error: error.message }
  }
}

// Função para atualizar email após verificação
export async function updateEmailAfterVerification(userId: string, newEmail: string, token: string) {
  const supabase = createServerSupabaseClient()

  try {
    console.log(`Atualizando email para usuário ${userId}`)

    // Primeiro verificar o token
    const { data: userData, error: fetchError } = await supabase
      .schema("rarcursos")
      .from("users")
      .select("mail_token")
      .eq("uid", userId)
      .single()

    if (fetchError || !userData.mail_token || userData.mail_token !== token) {
      return { success: false, error: "Token inválido" }
    }

    // Token válido - atualizar email e marcar como validado
    const { error: updateError } = await supabase
      .schema("rarcursos")
      .from("users")
      .update({
        email: newEmail,
        mail_valid: true,
        mail_token: null,
      })
      .eq("uid", userId)

    if (updateError) {
      console.error("Erro ao atualizar email:", updateError)
      return { success: false, error: "Erro ao atualizar email" }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar email:", error)
    return { success: false, error: error.message }
  }
}

// Função para atualizar WhatsApp após verificação
export async function updateWhatsAppAfterVerification(userId: string, newWhatsApp: string, token: string) {
  const supabase = createServerSupabaseClient()

  try {
    console.log(`Atualizando WhatsApp para usuário ${userId}`)

    // Primeiro verificar o token
    const { data: userData, error: fetchError } = await supabase
      .schema("rarcursos")
      .from("users")
      .select("wpp_token")
      .eq("uid", userId)
      .single()

    if (fetchError || !userData.wpp_token || userData.wpp_token !== token) {
      return { success: false, error: "Token inválido" }
    }

    // Token válido - atualizar WhatsApp e marcar como validado
    const { error: updateError } = await supabase
      .schema("rarcursos")
      .from("users")
      .update({
        whatsapp: newWhatsApp,
        wpp_valid: true,
        wpp_token: null,
      })
      .eq("uid", userId)

    if (updateError) {
      console.error("Erro ao atualizar WhatsApp:", updateError)
      return { success: false, error: "Erro ao atualizar WhatsApp" }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar WhatsApp:", error)
    return { success: false, error: error.message }
  }
}
