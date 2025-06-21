"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { registrarAtividade } from "./actions"

// Buscar estatísticas para admin/instrutor
export async function getAdminStats(userId: string, userProfile: string) {
  const supabase = createServerSupabaseClient()

  try {
    if (userProfile === "admin") {
      // Admin vê estatísticas globais
      const [cursosResult, aulasResult, alunosResult] = await Promise.all([
        supabase.from("cursos").select("*", { count: "exact", head: true }),
        supabase.from("aulas").select("*", { count: "exact", head: true }),
        supabase.from("matriculas").select("aluno_id", { count: "exact", head: true }).eq("status", "ativa"),
      ])

      // Contar alunos únicos
      const { data: alunosUnicos } = await supabase.from("matriculas").select("aluno_id").eq("status", "ativa")

      const alunosUnicosCount = new Set(alunosUnicos?.map((m) => m.aluno_id)).size

      return {
        cursosCount: cursosResult.count || 0,
        aulasCount: aulasResult.count || 0,
        alunosCount: alunosUnicosCount,
      }
    } else {
      // Instrutor vê apenas suas estatísticas
      const [cursosResult, aulasResult] = await Promise.all([
        supabase.from("cursos").select("*", { count: "exact", head: true }).eq("instrutor_id", userId),
        supabase
          .from("aulas")
          .select(
            `
            *,
            modulos!inner(
              curso_id,
              cursos!inner(instrutor_id)
            )
          `,
            { count: "exact", head: true },
          )
          .eq("modulos.cursos.instrutor_id", userId),
      ])

      // Buscar alunos únicos dos cursos do instrutor
      const { data: alunosData } = await supabase
        .from("matriculas")
        .select(`
          aluno_id,
          cursos!inner(instrutor_id)
        `)
        .eq("status", "ativa")
        .eq("cursos.instrutor_id", userId)

      const alunosUnicosCount = new Set(alunosData?.map((m) => m.aluno_id)).size

      return {
        cursosCount: cursosResult.count || 0,
        aulasCount: aulasResult.count || 0,
        alunosCount: alunosUnicosCount,
      }
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas admin:", error)
    return {
      cursosCount: 0,
      aulasCount: 0,
      alunosCount: 0,
    }
  }
}

// Buscar alunos com paginação e filtro
export async function getAlunos(userId: string, userProfile: string, page = 1, limit = 10, search = "") {
  const supabase = createServerSupabaseClient()
  const offset = (page - 1) * limit

  try {
    // Modificar a query para incluir data de matrícula e progresso
    let query = supabase
      .from("matriculas")
      .select(`
        aluno_id,
        criado_em,
        curso_id,
        users!inner(
          uid,
          nome,
          email,
          whatsapp,
          mail_valid,
          wpp_valid
        ),
        cursos!inner(
          id,
          titulo,
          instrutor_id
        )
      `)
      .eq("status", "ativa")

    // Filtrar por instrutor se não for admin
    if (userProfile !== "admin") {
      query = query.eq("cursos.instrutor_id", userId)
    }

    // Aplicar filtro de busca se fornecido
    if (search.trim()) {
      query = query.or(`users.nome.ilike.%${search}%,users.email.ilike.%${search}%`)
    }

    const { data: matriculas, error } = await query
      .order("criado_em", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Erro ao buscar alunos:", error)
      return { alunos: [], total: 0 }
    }

    // Agrupar por aluno e seus cursos
    const alunosMap = new Map()

    matriculas?.forEach((matricula: any) => {
      const alunoId = matricula.aluno_id

      if (!alunosMap.has(alunoId)) {
        alunosMap.set(alunoId, {
          uid: matricula.users.uid,
          nome: matricula.users.nome,
          email: matricula.users.email,
          whatsapp: matricula.users.whatsapp,
          email_verificado: matricula.users.mail_valid,
          whatsapp_verificado: matricula.users.wpp_valid,
          cursos: [],
          primeira_matricula: matricula.criado_em,
        })
      }

      const aluno = alunosMap.get(alunoId)
      aluno.cursos.push({
        id: matricula.cursos.id,
        titulo: matricula.cursos.titulo,
        matricula_id: matricula.id,
      })

      // Manter a data da primeira matrícula
      if (new Date(matricula.criado_em) < new Date(aluno.primeira_matricula)) {
        aluno.primeira_matricula = matricula.criado_em
      }
    })

    // Após buscar as matrículas, buscar o progresso de cada aluno
    const alunosComProgresso = await Promise.all(
      Array.from(alunosMap.values()).map(async (aluno) => {
        const cursosComProgresso = await Promise.all(
          aluno.cursos.map(async (curso) => {
            // Buscar total de aulas do curso
            const { count: totalAulas } = await supabase
              .from("aulas")
              .select("*", { count: "exact", head: true })
              .eq("modulos.curso_id", curso.id)

            // Buscar aulas assistidas pelo aluno
            const { count: aulasAssistidas } = await supabase
              .from("progresso_aulas")
              .select("*", { count: "exact", head: true })
              .eq("matricula_id", curso.matricula_id)
              .eq("assistida", true)

            const progresso = totalAulas > 0 ? Math.round((aulasAssistidas / totalAulas) * 100) : 0

            return {
              ...curso,
              progresso,
            }
          }),
        )

        return {
          ...aluno,
          cursos: cursosComProgresso,
        }
      }),
    )

    const alunos = alunosComProgresso

    // Buscar total para paginação
    let countQuery = supabase
      .from("matriculas")
      .select("aluno_id", { count: "exact", head: true })
      .eq("status", "ativa")

    if (userProfile !== "admin") {
      countQuery = countQuery.eq("cursos.instrutor_id", userId)
    }

    const { count } = await countQuery

    return {
      alunos,
      total: count || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar alunos:", error)
    return { alunos: [], total: 0 }
  }
}

// Buscar cursos disponíveis para matricular aluno
export async function getCursosDisponiveis(userId: string, userProfile: string, alunoId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Buscar cursos que o aluno NÃO está matriculado
    const { data: cursosMatriculados } = await supabase
      .from("matriculas")
      .select("curso_id")
      .eq("aluno_id", alunoId)
      .eq("status", "ativa")

    const cursosMatriculadosIds = cursosMatriculados?.map((m) => m.curso_id) || []

    let query = supabase.from("cursos").select("id, titulo, nivel, ativo").eq("ativo", true)

    // Filtrar por instrutor se não for admin
    if (userProfile !== "admin") {
      query = query.eq("instrutor_id", userId)
    }

    // Excluir cursos já matriculados
    if (cursosMatriculadosIds.length > 0) {
      query = query.not("id", "in", `(${cursosMatriculadosIds.join(",")})`)
    }

    const { data: cursos, error } = await query.order("titulo")

    if (error) {
      console.error("Erro ao buscar cursos disponíveis:", error)
      return []
    }

    return cursos || []
  } catch (error) {
    console.error("Erro ao buscar cursos disponíveis:", error)
    return []
  }
}

// Matricular aluno manualmente
export async function matricularAlunoManualmente(instrutorId: string, alunoId: string, cursoId: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Verificar se já existe matrícula
    const { data: matriculaExistente } = await supabase
      .from("matriculas")
      .select("id")
      .eq("aluno_id", alunoId)
      .eq("curso_id", cursoId)
      .single()

    if (matriculaExistente) {
      return { success: false, error: "Aluno já está matriculado neste curso" }
    }

    // Buscar dados do curso e aluno para o registro de atividade
    const [cursoResult, alunoResult] = await Promise.all([
      supabase.from("cursos").select("titulo").eq("id", cursoId).single(),
      supabase.from("users").select("nome").eq("uid", alunoId).single(),
    ])

    // Criar matrícula
    const { data: matricula, error } = await supabase
      .from("matriculas")
      .insert({
        aluno_id: alunoId,
        curso_id: cursoId,
        status: "ativa",
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar matrícula:", error)
      return { success: false, error: "Erro ao matricular aluno" }
    }

    // Registrar atividade NO PERFIL DO ALUNO (não do instrutor)
    if (cursoResult.data && alunoResult.data) {
      await registrarAtividade(
        alunoId, // <- MUDANÇA: registrar no perfil do aluno
        "foi_matriculado",
        "Foi matriculado em um curso",
        `Você foi matriculado no curso "${cursoResult.data.titulo}"`,
        "graduation-cap",
        "green",
        "matricula",
        matricula.id,
        `/trilha-aprendizado`,
        {
          curso_titulo: cursoResult.data.titulo,
          matriculado_por: instrutorId,
        },
      )
    }

    return { success: true, data: matricula }
  } catch (error) {
    console.error("Erro ao matricular aluno:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}
