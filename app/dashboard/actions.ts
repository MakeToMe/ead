"use server"

import { signOut as authSignOut } from "@/app/auth/actions"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export { authSignOut as signOut }

export async function getUserFreshData(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    console.log("Buscando dados frescos para usuário:", userId)

    const { data: userData, error } = await supabase.from("users").select("*").eq("uid", userId).single()

    if (error) {
      console.error("Erro ao buscar usuário:", error)
      throw error
    }

    console.log("Dados do usuário encontrados:", userData)
    return userData
  } catch (error) {
    console.error("Erro na função getUserFreshData:", error)
    return null
  }
}

export async function getDashboardStats(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Buscar quantidade de cursos matriculados
    const { count: coursesCount, error: coursesError } = await supabase
      .from("matriculas")
      .select("*", { count: "exact", head: true })
      .eq("aluno_id", userId)
      .eq("status", "ativa")

    if (coursesError) {
      console.error("Erro ao buscar cursos matriculados:", coursesError)
    }

    // Buscar quantidade de certificados ativos emitidos para o usuário
    const { count: certificatesCount, error: certificatesError } = await supabase
      .from("certificados")
      .select("*", { count: "exact", head: true })
      .eq("aluno_id", userId)
      .eq("status", "ativo")

    if (certificatesError) {
      console.error("Erro ao buscar certificados:", certificatesError)
    }

    // Buscar atividades recentes
    const { data: recentActivities, error: activitiesError } = await supabase
      .from("atividades_recentes")
      .select("*")
      .eq("usuario_uid", userId)
      .eq("ativo", true)
      .order("criado_em", { ascending: false })
      .limit(5)

    if (activitiesError) {
      console.error("Erro ao buscar atividades recentes:", activitiesError)
    }

    return {
      coursesCount: coursesCount || 0,
      certificatesCount,
      recentActivities: recentActivities || [],
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return {
      coursesCount: 0,
      certificatesCount: 0,
      recentActivities: [],
    }
  }
}

// Função para registrar uma nova atividade
export async function registrarAtividade(
  userId: string,
  tipo: string,
  titulo: string,
  descricao: string,
  icone: string,
  corIcone: string,
  entidadeTipo: string,
  entidadeId: string,
  url: string,
  metadados: any = {},
) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("atividades_recentes")
      .insert({
        usuario_uid: userId,
        tipo_atividade: tipo,
        titulo,
        descricao,
        icone,
        cor_icone: corIcone,
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
        url,
        metadados,
      })
      .select()

    if (error) {
      console.error("Erro ao registrar atividade:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Erro ao registrar atividade:", error)
    return { success: false, error }
  }
}

// Função para marcar atividades como visualizadas
export async function marcarAtividadesComoVisualizadas(userId: string) {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("atividades_recentes")
      .update({ visualizada: true })
      .eq("usuario_uid", userId)
      .eq("visualizada", false)
      .select()

    if (error) {
      console.error("Erro ao marcar atividades como visualizadas:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Erro ao marcar atividades como visualizadas:", error)
    return { success: false, error }
  }
}
