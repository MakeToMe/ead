"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface CursoData {
  titulo: string
  descricao: string
  nivel: "iniciante" | "intermediario" | "avancado"
  ativo: boolean
  imagem_url?: string
  duracao_total?: number // em minutos
  instrutor_id: string // Adicionado para passar o ID do instrutor
}

export async function criarCurso(cursoData: CursoData) {
  try {
    // Verificar se o instrutor_id foi fornecido
    if (!cursoData.instrutor_id) {
      return { success: false, message: "ID do instrutor é obrigatório" }
    }

    const supabase = createServerSupabaseClient()

    // Verificar se o usuário existe e tem permissão
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("uid, perfis")
      .eq("uid", cursoData.instrutor_id)
      .single()

    if (userError || !user) {
      console.error("Erro ao buscar usuário:", userError)
      return { success: false, message: "Usuário não encontrado" }
    }

    if (user.perfis !== "instrutor" && user.perfis !== "admin") {
      return { success: false, message: "Sem permissão para criar cursos" }
    }

    const { data, error } = await supabase
      .from("cursos")
      .insert({
        titulo: cursoData.titulo,
        descricao: cursoData.descricao,
        nivel: cursoData.nivel,
        ativo: cursoData.ativo,
        imagem_url: cursoData.imagem_url,
        duracao_total: cursoData.duracao_total,
        instrutor_id: cursoData.instrutor_id,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar curso:", error)
      return { success: false, message: "Erro ao criar curso" }
    }

    console.log("Curso criado com sucesso:", data)
    return { success: true, message: "Curso criado com sucesso!", data }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado ao criar curso" }
  }
}

export async function buscarCursosDoInstrutor(instrutorId: string, pagina = 1, itensPorPagina = 12) {
  try {
    const supabase = createServerSupabaseClient()

    // Calcular o offset para paginação
    const offset = (pagina - 1) * itensPorPagina

    // Buscar cursos com paginação
    const { data, error, count } = await supabase
      .from("cursos")
      .select("*", { count: "exact" })
      .eq("instrutor_id", instrutorId)
      .order("criado_em", { ascending: false })
      .range(offset, offset + itensPorPagina - 1)

    if (error) {
      console.error("Erro ao buscar cursos:", error)
      return { success: false, message: "Erro ao buscar cursos", data: [], totalCursos: 0 }
    }

    return { success: true, data: data || [], totalCursos: count || 0 }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado", data: [], totalCursos: 0 }
  }
}

export async function atualizarStatusCurso(cursoId: string, ativo: boolean, instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar se o curso pertence ao instrutor
    const { data: curso, error: cursoError } = await supabase
      .from("cursos")
      .select("instrutor_id")
      .eq("id", cursoId)
      .single()

    if (cursoError || !curso) {
      console.error("Erro ao buscar curso:", cursoError)
      return { success: false, message: "Curso não encontrado" }
    }

    if (curso.instrutor_id !== instrutorId) {
      return { success: false, message: "Sem permissão para atualizar este curso" }
    }

    // Atualizar o status do curso
    const { error } = await supabase.from("cursos").update({ ativo }).eq("id", cursoId)

    if (error) {
      console.error("Erro ao atualizar status do curso:", error)
      return { success: false, message: "Erro ao atualizar status do curso" }
    }

    return { success: true, message: "Status atualizado com sucesso!" }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado ao atualizar status" }
  }
}

export async function uploadImagemMinio(
  file: File,
  userId: string,
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    console.log("🚀 UPLOAD IMAGEM NOVA ESTRUTURA - Iniciando upload:", {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      userId: userId,
      newStructure: true,
    })

    // Gerar nome único SEM UID (já está na estrutura da pasta)
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}-${cleanFileName}`

    // Importar funções da nova estrutura
    const { getMinioUserUploadUrl, getMinioUserFileUrl } = await import("@/lib/minio-config")

    // Usar nova estrutura baseada em UID: rarcursos/[uid]/imagens/[arquivo]
    const uploadUrl = getMinioUserUploadUrl(userId, "imagem", fileName)

    console.log("📤 Fazendo upload de imagem com nova estrutura:", {
      structure: `${userId}/imagens/${fileName}`,
      success: true
    })

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
      },
      body: file,
    })

    if (!response.ok) {
      console.error("Upload response:", response.status, response.statusText)
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    // URL final da imagem com nova estrutura
    const imageUrl = getMinioUserFileUrl(userId, "imagem", fileName)

    console.log("✅ Upload de imagem com nova estrutura bem-sucedido")

    return {
      success: true,
      url: imageUrl,
      message: "Upload realizado com sucesso",
    }
  } catch (error) {
    console.error("Erro no upload:", error)
    return {
      success: false,
      message: "Erro ao fazer upload da imagem. Verifique a conexão e tente novamente.",
    }
  }
}

// Função para upload de vídeos com nova estrutura
export async function uploadVideoMinio(
  file: File,
  userId: string,
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    console.log("🚀 UPLOAD VÍDEO NOVA ESTRUTURA - Iniciando upload:", {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      userId: userId,
      newStructure: true,
    })

    // Gerar nome único SEM UID (já está na estrutura da pasta)
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}-${cleanFileName}`

    // Importar funções da nova estrutura
    const { getMinioUserUploadUrl, getMinioUserFileUrl } = await import("@/lib/minio-config")

    // Usar nova estrutura baseada em UID: rarcursos/[uid]/videos/[arquivo]
    const uploadUrl = getMinioUserUploadUrl(userId, "video", fileName)

    console.log("📤 Fazendo upload de vídeo com nova estrutura:", {
      structure: `${userId}/videos/${fileName}`,
      success: true
    })

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
      },
      body: file,
    })

    if (!response.ok) {
      console.error("Upload response:", response.status, response.statusText)
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    // URL final do vídeo com nova estrutura
    const videoUrl = getMinioUserFileUrl(userId, "video", fileName)

    console.log("✅ Upload de vídeo com nova estrutura bem-sucedido")

    return {
      success: true,
      url: videoUrl,
      message: "Upload de vídeo realizado com sucesso",
    }
  } catch (error) {
    console.error("Erro no upload de vídeo:", error)
    return {
      success: false,
      message: "Erro ao fazer upload do vídeo. Verifique a conexão e tente novamente.",
    }
  }
}

export async function buscarCursoPorId(cursoId: string, instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("cursos")
      .select("*")
      .eq("id", cursoId)
      .eq("instrutor_id", instrutorId)
      .single()

    if (error) {
      console.error("Erro ao buscar curso:", error)
      return { success: false, message: "Curso não encontrado", data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado ao buscar curso", data: null }
  }
}

export async function editarCurso(cursoId: string, cursoData: CursoData) {
  try {
    // Verificar se o instrutor_id foi fornecido
    if (!cursoData.instrutor_id) {
      return { success: false, message: "ID do instrutor é obrigatório" }
    }

    const supabase = createServerSupabaseClient()

    // Verificar se o curso existe e pertence ao instrutor
    const { data: cursoExistente, error: cursoError } = await supabase
      .from("cursos")
      .select("instrutor_id")
      .eq("id", cursoId)
      .single()

    if (cursoError || !cursoExistente) {
      console.error("Erro ao buscar curso:", cursoError)
      return { success: false, message: "Curso não encontrado" }
    }

    if (cursoExistente.instrutor_id !== cursoData.instrutor_id) {
      return { success: false, message: "Sem permissão para editar este curso" }
    }

    // Verificar se o usuário existe e tem permissão
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("uid, perfis")
      .eq("uid", cursoData.instrutor_id)
      .single()

    if (userError || !user) {
      console.error("Erro ao buscar usuário:", userError)
      return { success: false, message: "Usuário não encontrado" }
    }

    if (user.perfis !== "instrutor" && user.perfis !== "admin") {
      return { success: false, message: "Sem permissão para editar cursos" }
    }

    const { data, error } = await supabase
      .from("cursos")
      .update({
        titulo: cursoData.titulo,
        descricao: cursoData.descricao,
        nivel: cursoData.nivel,
        ativo: cursoData.ativo,
        imagem_url: cursoData.imagem_url,
        duracao_total: cursoData.duracao_total,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", cursoId)
      .select()
      .single()

    if (error) {
      console.error("Erro ao editar curso:", error)
      return { success: false, message: "Erro ao editar curso" }
    }

    console.log("Curso editado com sucesso:", data)
    return { success: true, message: "Curso editado com sucesso!", data }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado ao editar curso" }
  }
}
