"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { registrarAtividade } from "@/app/dashboard/actions"

export interface AnotacaoUsuario {
  id: string
  usuario_uid: string // UUID como string
  curso_id: string
  aula_id: string
  titulo?: string
  conteudo: string
  timestamp_video?: number
  tipo: "nota" | "duvida" | "importante" | "resumo"
  cor: "azul" | "verde" | "amarelo" | "vermelho" | "roxo"
  privada: boolean
  favorita: boolean
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

export interface CriarAnotacaoData {
  curso_id: string
  aula_id: string
  titulo?: string
  conteudo: string
  timestamp_video?: number
  tipo?: "nota" | "duvida" | "importante" | "resumo"
  cor?: "azul" | "verde" | "amarelo" | "vermelho" | "roxo"
  privada?: boolean
}

// Criar nova anotação
export async function criarAnotacao(data: CriarAnotacaoData, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const supabase = createServerSupabaseClient()

    const anotacaoData = {
      usuario_uid: userId,
      curso_id: data.curso_id,
      aula_id: data.aula_id,
      titulo: data.titulo || null,
      conteudo: data.conteudo,
      timestamp_video: data.timestamp_video || null,
      tipo: data.tipo || "nota",
      cor: data.cor || "azul",
      privada: data.privada ?? true,
      favorita: false,
      ativo: true,
    }

    const { data: anotacao, error } = await supabase.from("anotacoes_usuario").insert(anotacaoData).select().single()

    if (error) {
      console.error("Erro ao criar anotação:", error)
      return { success: false, error: "Erro ao criar anotação" }
    }

    // Registrar atividade
    await registrarAtividade(
      userId,
      "anotacao_criada",
      "Nova anotação criada",
      `Criou uma anotação do tipo "${data.tipo}" ${data.titulo ? `"${data.titulo}"` : ""}`,
      "FileText",
      "text-blue-400",
      "anotacao",
      anotacao.id,
      `/assistir-curso/${data.curso_id}`,
      {
        tipo: data.tipo,
        titulo: data.titulo,
        curso_id: data.curso_id,
        aula_id: data.aula_id,
      },
    )

    revalidatePath(`/assistir-curso/${data.curso_id}`)
    return { success: true, data: anotacao }
  } catch (error) {
    console.error("Erro ao criar anotação:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

// Buscar anotações de uma aula
export async function buscarAnotacoesAula(aulaId: string, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const supabase = createServerSupabaseClient()

    const { data: anotacoes, error } = await supabase
      .from("anotacoes_usuario")
      .select("*")
      .eq("aula_id", aulaId)
      .eq("usuario_uid", userId)
      .eq("ativo", true)
      .order("timestamp_video", { ascending: true, nullsFirst: false })
      .order("criado_em", { ascending: false })

    if (error) {
      console.error("Erro ao buscar anotações:", error)
      return { success: false, error: "Erro ao buscar anotações" }
    }

    return { success: true, data: anotacoes as AnotacaoUsuario[] }
  } catch (error) {
    console.error("Erro ao buscar anotações:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

// Buscar anotações de um curso
export async function buscarAnotacoesCurso(
  cursoId: string,
  userId: string,
  filtros?: {
    tipo?: string
    favoritas?: boolean
    busca?: string
  },
) {
  try {
    if (!userId) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const supabase = createServerSupabaseClient()

    let query = supabase
      .from("anotacoes_usuario")
      .select(`
        *,
        aulas:aula_id (
          titulo,
          ordem
        )
      `)
      .eq("curso_id", cursoId)
      .eq("usuario_uid", userId)
      .eq("ativo", true)

    // Aplicar filtros
    if (filtros?.tipo && filtros.tipo !== "todos") {
      query = query.eq("tipo", filtros.tipo)
    }

    if (filtros?.favoritas) {
      query = query.eq("favorita", true)
    }

    if (filtros?.busca) {
      query = query.or(`titulo.ilike.%${filtros.busca}%,conteudo.ilike.%${filtros.busca}%`)
    }

    const { data: anotacoes, error } = await query.order("criado_em", { ascending: false })

    if (error) {
      console.error("Erro ao buscar anotações do curso:", error)
      return { success: false, error: "Erro ao buscar anotações" }
    }

    return { success: true, data: anotacoes }
  } catch (error) {
    console.error("Erro ao buscar anotações do curso:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

// Atualizar anotação
export async function atualizarAnotacao(id: string, data: Partial<CriarAnotacaoData>, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const supabase = createServerSupabaseClient()

    const { data: anotacao, error } = await supabase
      .from("anotacoes_usuario")
      .update({
        ...data,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("usuario_uid", userId)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar anotação:", error)
      return { success: false, error: "Erro ao atualizar anotação" }
    }

    // Registrar atividade
    await registrarAtividade(
      userId,
      "anotacao_editada",
      "Anotação editada",
      `Editou uma anotação ${anotacao.titulo ? `"${anotacao.titulo}"` : ""}`,
      "Edit",
      "text-yellow-400",
      "anotacao",
      anotacao.id,
      `/assistir-curso/${anotacao.curso_id}`,
      {
        tipo: anotacao.tipo,
        titulo: anotacao.titulo,
      },
    )

    revalidatePath(`/assistir-curso/${anotacao.curso_id}`)
    return { success: true, data: anotacao }
  } catch (error) {
    console.error("Erro ao atualizar anotação:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

// Alternar favorito
export async function alternarFavorito(id: string, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const supabase = createServerSupabaseClient()

    // Buscar estado atual
    const { data: anotacaoAtual, error: errorBusca } = await supabase
      .from("anotacoes_usuario")
      .select("favorita, curso_id")
      .eq("id", id)
      .eq("usuario_uid", userId)
      .single()

    if (errorBusca) {
      return { success: false, error: "Anotação não encontrada" }
    }

    // Alternar favorito
    const { data: anotacao, error } = await supabase
      .from("anotacoes_usuario")
      .update({
        favorita: !anotacaoAtual.favorita,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("usuario_uid", userId)
      .select()
      .single()

    if (error) {
      console.error("Erro ao alternar favorito:", error)
      return { success: false, error: "Erro ao atualizar anotação" }
    }

    revalidatePath(`/assistir-curso/${anotacaoAtual.curso_id}`)
    return { success: true, data: anotacao }
  } catch (error) {
    console.error("Erro ao alternar favorito:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

// Excluir anotação (soft delete)
export async function excluirAnotacao(id: string, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const supabase = createServerSupabaseClient()

    // Buscar curso_id antes de excluir
    const { data: anotacaoAtual, error: errorBusca } = await supabase
      .from("anotacoes_usuario")
      .select("curso_id")
      .eq("id", id)
      .eq("usuario_uid", userId)
      .single()

    if (errorBusca) {
      return { success: false, error: "Anotação não encontrada" }
    }

    // Buscar dados da anotação antes de excluir para o registro de atividade
    const { data: anotacaoParaAtividade } = await supabase
      .from("anotacoes_usuario")
      .select("titulo, tipo")
      .eq("id", id)
      .eq("usuario_uid", userId)
      .single()

    // Soft delete
    const { error } = await supabase
      .from("anotacoes_usuario")
      .update({
        ativo: false,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("usuario_uid", userId)

    if (error) {
      console.error("Erro ao excluir anotação:", error)
      return { success: false, error: "Erro ao excluir anotação" }
    }

    // Registrar atividade
    await registrarAtividade(
      userId,
      "anotacao_excluida",
      "Anotação excluída",
      `Excluiu uma anotação ${anotacaoParaAtividade?.titulo ? `"${anotacaoParaAtividade.titulo}"` : ""}`,
      "Trash2",
      "text-red-400",
      "anotacao",
      id,
      `/assistir-curso/${anotacaoAtual.curso_id}`,
      {
        tipo: anotacaoParaAtividade?.tipo,
        titulo: anotacaoParaAtividade?.titulo,
      },
    )

    revalidatePath(`/assistir-curso/${anotacaoAtual.curso_id}`)
    return { success: true }
  } catch (error) {
    console.error("Erro ao excluir anotação:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}
