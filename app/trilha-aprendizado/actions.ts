"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface CursoDisponivel {
  id: string
  titulo: string
  descricao: string
  imagem_url: string | null
  instrutor_nome: string
  duracao_total: number
  total_aulas: number
  criado_em: string
  matriculado: boolean
}

export interface CursoMatriculado {
  id: string
  titulo: string
  descricao: string
  imagem_url: string | null
  instrutor_nome: string
  duracao_total: number
  total_aulas: number
  progresso_percentual: number
  status: string
  data_matricula: string
}

// Função helper para registrar atividade
async function registrarAtividade(
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
    console.log("=== REGISTRANDO ATIVIDADE ===")
    console.log("userId:", userId)
    console.log("tipo:", tipo)
    console.log("titulo:", titulo)
    console.log("descricao:", descricao)

    const atividadeData = {
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
    }

    console.log("Dados da atividade:", atividadeData)

    const { data, error } = await supabase.from("atividades_recentes").insert(atividadeData).select()

    if (error) {
      console.error("Erro ao registrar atividade:", error)
      return { success: false, error }
    }

    console.log("Atividade registrada com sucesso:", data)
    return { success: true, data }
  } catch (error) {
    console.error("Erro ao registrar atividade:", error)
    return { success: false, error }
  }
}

// Buscar cursos disponíveis para matrícula (apenas com aulas)
export async function buscarCursosDisponiveis(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "ID do usuário é obrigatório" }
    }

    const supabase = createServerSupabaseClient()

    // Buscar todos os cursos ativos
    const { data: cursos, error: cursosError } = await supabase
      .from("cursos")
      .select(`
        id,
        titulo,
        descricao,
        imagem_url,
        duracao_total,
        criado_em,
        instrutor_id
      `)
      .eq("ativo", true)
      .order("criado_em", { ascending: false })

    if (cursosError) {
      console.error("Erro ao buscar cursos:", cursosError)
      return { success: false, error: "Erro ao buscar cursos" }
    }

    if (!cursos || cursos.length === 0) {
      return { success: true, data: [] }
    }

    // Buscar nomes dos instrutores
    const instrutorIds = [...new Set(cursos.map((c) => c.instrutor_id))]
    const { data: instrutores } = await supabase.from("users").select("uid, nome").in("uid", instrutorIds)

    const instrutoresMap = new Map(instrutores?.map((i) => [i.uid, i.nome]) || [])

    // Buscar matrículas do usuário
    const { data: matriculas, error: matriculasError } = await supabase
      .from("matriculas")
      .select("curso_id")
      .eq("aluno_id", userId)

    if (matriculasError) {
      console.error("Erro ao buscar matrículas:", matriculasError)
      return { success: false, error: "Erro ao buscar matrículas" }
    }

    const cursosMatriculados = new Set(matriculas?.map((m) => m.curso_id) || [])

    // Buscar contagem de aulas por curso e filtrar apenas cursos com aulas
    const cursosComAulas = []

    for (const curso of cursos) {
      const { count } = await supabase
        .from("aulas")
        .select("*", { count: "exact", head: true })
        .eq("curso_id", curso.id)

      // Só adiciona se o curso tem aulas
      if (count && count > 0) {
        cursosComAulas.push({
          id: curso.id,
          titulo: curso.titulo,
          descricao: curso.descricao || "",
          imagem_url: curso.imagem_url,
          instrutor_nome: instrutoresMap.get(curso.instrutor_id) || "Instrutor",
          duracao_total: curso.duracao_total || 0,
          total_aulas: count,
          criado_em: curso.criado_em,
          matriculado: cursosMatriculados.has(curso.id),
        })
      }
    }

    return { success: true, data: cursosComAulas }
  } catch (error) {
    console.error("Erro ao buscar cursos disponíveis:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

// Buscar cursos matriculados do usuário (apenas com aulas)
export async function buscarCursosMatriculados(userId: string) {
  console.log("=== DEBUG buscarCursosMatriculados ===")
  console.log("userId:", userId)
  try {
    if (!userId) {
      return { success: false, error: "ID do usuário é obrigatório" }
    }

    const supabase = createServerSupabaseClient()

    // Buscar matrículas do usuário
    const { data: matriculas, error: matriculasError } = await supabase
      .from("matriculas")
      .select(`
        id,
        progresso_percentual,
        status,
        data_matricula,
        curso_id
      `)
      .eq("aluno_id", userId)
      .order("data_matricula", { ascending: false })

    if (matriculasError) {
      console.error("Erro ao buscar matrículas:", matriculasError)
      return { success: false, error: "Erro ao buscar matrículas" }
    }

    if (!matriculas || matriculas.length === 0) {
      return { success: true, data: [] }
    }

    console.log("Matrículas encontradas:", matriculas?.length)
    console.log("Matrículas:", matriculas)

    // Buscar dados dos cursos matriculados
    const cursoIds = matriculas.map((m) => m.curso_id)
    const { data: cursos, error: cursosError } = await supabase
      .from("cursos")
      .select(`
        id,
        titulo,
        descricao,
        imagem_url,
        duracao_total,
        instrutor_id
      `)
      .in("id", cursoIds)

    if (cursosError) {
      console.error("Erro ao buscar cursos:", cursosError)
      return { success: false, error: "Erro ao buscar cursos" }
    }

    if (!cursos || cursos.length === 0) {
      return { success: true, data: [] }
    }

    console.log("Cursos encontrados:", cursos?.length)
    console.log("Cursos:", cursos)

    // Buscar nomes dos instrutores
    const instrutorIds = [...new Set(cursos.map((c) => c.instrutor_id))]
    const { data: instrutores } = await supabase.from("users").select("uid, nome").in("uid", instrutorIds)

    const instrutoresMap = new Map(instrutores?.map((i) => [i.uid, i.nome]) || [])
    const cursosMap = new Map(cursos.map((c) => [c.id, c]) || [])

    // Processar cada matrícula e verificar se o curso tem aulas
    const cursosMatriculadosComAulas = []

    for (const matricula of matriculas) {
      const curso = cursosMap.get(matricula.curso_id)
      if (!curso) continue

      // Verificar se o curso tem aulas
      const { count } = await supabase
        .from("aulas")
        .select("*", { count: "exact", head: true })
        .eq("curso_id", curso.id)

      // Só adiciona se o curso tem aulas
      // if (count && count > 0) {
      //   cursosMatriculadosComAulas.push({
      //     id: curso.id,
      //     titulo: curso.titulo,
      //     descricao: curso.descricao || "",
      //     imagem_url: curso.imagem_url,
      //     instrutor_nome: instrutoresMap.get(curso.instrutor_id) || "Instrutor",
      //     duracao_total: curso.duracao_total || 0,
      //     total_aulas: count,
      //     progresso_percentual: matricula.progresso_percentual,
      //     status: matricula.status,
      //     data_matricula: matricula.data_matricula,
      //   })
      // }

      cursosMatriculadosComAulas.push({
        id: curso.id,
        titulo: curso.titulo,
        descricao: curso.descricao || "",
        imagem_url: curso.imagem_url,
        instrutor_nome: instrutoresMap.get(curso.instrutor_id) || "Instrutor",
        duracao_total: curso.duracao_total || 0,
        total_aulas: count || 0,
        progresso_percentual: matricula.progresso_percentual,
        status: matricula.status,
        data_matricula: matricula.data_matricula,
      })
    }

    return { success: true, data: cursosMatriculadosComAulas }
  } catch (error) {
    console.error("Erro ao buscar cursos matriculados:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

// Fazer matrícula em um curso (com validação de aulas)
export async function matricularEmCurso(cursoId: string, userId: string) {
  try {
    console.log("=== INICIANDO MATRÍCULA ===")
    console.log("cursoId:", cursoId)
    console.log("userId:", userId)

    if (!userId || !cursoId) {
      return { success: false, error: "Dados obrigatórios não fornecidos" }
    }

    const supabase = createServerSupabaseClient()

    // Verificar se o curso existe, está ativo e tem aulas
    const { data: curso, error: cursoError } = await supabase
      .from("cursos")
      .select("id, titulo, ativo")
      .eq("id", cursoId)
      .single()

    if (cursoError || !curso) {
      return { success: false, error: "Curso não encontrado" }
    }

    if (!curso.ativo) {
      return { success: false, error: "Este curso não está mais disponível" }
    }

    // Verificar se o curso tem aulas
    const { count: totalAulas } = await supabase
      .from("aulas")
      .select("*", { count: "exact", head: true })
      .eq("curso_id", cursoId)

    if (!totalAulas || totalAulas === 0) {
      return { success: false, error: "Este curso ainda não possui aulas disponíveis" }
    }

    // Verificar se já está matriculado
    const { data: matriculaExistente } = await supabase
      .from("matriculas")
      .select("id")
      .eq("aluno_id", userId)
      .eq("curso_id", cursoId)
      .single()

    if (matriculaExistente) {
      return { success: false, error: "Você já está matriculado neste curso" }
    }

    // Criar matrícula
    const { error: matriculaError } = await supabase.from("matriculas").insert({
      aluno_id: userId,
      curso_id: cursoId,
      status: "ativa",
      progresso_percentual: 0,
    })

    if (matriculaError) {
      console.error("Erro ao criar matrícula:", matriculaError)
      return { success: false, error: "Erro ao fazer matrícula" }
    }

    console.log("Matrícula criada com sucesso!")

    // Registrar atividade de matrícula
    const resultadoAtividade = await registrarAtividade(
      userId,
      "matricula_curso",
      "Nova matrícula realizada",
      `Você se matriculou no curso "${curso.titulo}"`,
      "book-open",
      "indigo",
      "curso",
      cursoId,
      `/assistir-curso/${cursoId}`,
      {
        curso_titulo: curso.titulo,
        total_aulas: totalAulas,
      },
    )

    if (!resultadoAtividade.success) {
      console.error("Erro ao registrar atividade:", resultadoAtividade.error)
    }

    return { success: true, message: `Matrícula realizada com sucesso no curso "${curso.titulo}"!` }
  } catch (error) {
    console.error("Erro ao matricular em curso:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}
