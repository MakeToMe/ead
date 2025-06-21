"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSignedPhotoUrl } from "@/app/perfil/actions"

export async function getAllUsers(page = 1, limit = 20, search = "", currentUserEmail = "") {
  const supabase = createServerSupabaseClient()
  const offset = (page - 1) * limit

  try {
    let query = supabase.schema("rarcursos").from("users").select("*")

    // Excluir o próprio usuário logado
    if (currentUserEmail) {
      query = query.neq("email", currentUserEmail)
    }

    // Aplicar filtro de busca se fornecido
    if (search.trim()) {
      query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`)
    }

    const { data: users, error } = await query
      .order("criado_em", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Erro ao buscar usuários:", error)
      return { users: [], total: 0 }
    }

    // Buscar total para paginação (também excluindo o próprio usuário)
    let countQuery = supabase.schema("rarcursos").from("users").select("*", { count: "exact", head: true })

    if (currentUserEmail) {
      countQuery = countQuery.neq("email", currentUserEmail)
    }

    if (search.trim()) {
      countQuery = countQuery.or(`nome.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`)
    }

    const { count } = await countQuery

    // Processar URLs das fotos
    const usersWithPhotos = await Promise.all(
      users.map(async (user) => {
        let photoUrl = null
        if (user.url_foto) {
          photoUrl = await getSignedPhotoUrl(user.url_foto)
        }
        return {
          ...user,
          photoUrl,
        }
      }),
    )

    return {
      users: usersWithPhotos,
      total: count || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return { users: [], total: 0 }
  }
}

export async function updateUserProfile(userId: string, newProfile: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .schema("rarcursos")
      .from("users")
      .update({ perfis: newProfile })
      .eq("uid", userId)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar perfil:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    return { success: false, error: error.message }
  }
}
