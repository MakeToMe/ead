"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface ModuloData {
  curso_id: string
  titulo: string
  descricao: string
  ordem: number
  ativo: boolean
}

export interface AulaData {
  curso_id: string
  modulo_id: string
  titulo: string
  descricao: string
  tipo: "video" | "texto" | "quiz" | "projeto"
  conteudo: string
  media_url?: string
  duracao?: number // em minutos
  ativo: boolean
}

// MÓDULOS
export async function criarModulo(moduloData: ModuloData, instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar se o curso pertence ao instrutor
    const { data: curso, error: cursoError } = await supabase
      .from("cursos")
      .select("instrutor_id")
      .eq("id", moduloData.curso_id)
      .single()

    if (cursoError || !curso) {
      console.error("Erro ao buscar curso:", cursoError)
      return { success: false, message: "Curso não encontrado" }
    }

    if (curso.instrutor_id !== instrutorId) {
      return { success: false, message: "Sem permissão para criar módulos neste curso" }
    }

    const { data, error } = await supabase
      .from("modulos")
      .insert({
        curso_id: moduloData.curso_id,
        titulo: moduloData.titulo,
        descricao: moduloData.descricao,
        ordem: moduloData.ordem,
        ativo: moduloData.ativo,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar módulo:", error)
      return { success: false, message: "Erro ao criar módulo" }
    }

    console.log("Módulo criado com sucesso:", data)
    return { success: true, message: "Módulo criado com sucesso!", data }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado ao criar módulo" }
  }
}

export async function buscarModulosDoCurso(cursoId: string, instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar se o curso pertence ao instrutor
    const { data: curso, error: cursoError } = await supabase
      .from("cursos")
      .select("instrutor_id")
      .eq("id", cursoId)
      .single()

    if (cursoError || !curso || curso.instrutor_id !== instrutorId) {
      return { success: false, message: "Curso não encontrado ou sem permissão", data: [] }
    }

    const { data, error } = await supabase
      .from("modulos")
      .select("*")
      .eq("curso_id", cursoId)
      .order("ordem", { ascending: true })

    if (error) {
      console.error("Erro ao buscar módulos:", error)
      return { success: false, message: "Erro ao buscar módulos", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado", data: [] }
  }
}

// EDITAR NOME DO MÓDULO
export async function editarNomeModulo(moduloId: string, novoNome: string, instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar se o módulo existe e pertence ao instrutor
    const { data: modulo, error: moduloError } = await supabase
      .from("modulos")
      .select(`
        *,
        cursos!inner(instrutor_id)
      `)
      .eq("id", moduloId)
      .single()

    if (moduloError || !modulo) {
      console.error("Erro ao buscar módulo:", moduloError)
      return { success: false, message: "Módulo não encontrado" }
    }

    if (modulo.cursos.instrutor_id !== instrutorId) {
      return { success: false, message: "Sem permissão para editar este módulo" }
    }

    // Atualizar o nome do módulo
    const { data, error } = await supabase
      .from("modulos")
      .update({
        titulo: novoNome,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", moduloId)
      .select()
      .single()

    if (error) {
      console.error("Erro ao editar módulo:", error)
      return { success: false, message: "Erro ao editar nome do módulo" }
    }

    console.log("Nome do módulo editado com sucesso:", data)
    return { success: true, message: "Nome do módulo editado com sucesso!", data }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado ao editar nome do módulo" }
  }
}

// AULAS
export async function criarAula(aulaData: AulaData, instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar se o curso pertence ao instrutor
    const { data: curso, error: cursoError } = await supabase
      .from("cursos")
      .select("instrutor_id")
      .eq("id", aulaData.curso_id)
      .single()

    if (cursoError || !curso) {
      console.error("Erro ao buscar curso:", cursoError)
      return { success: false, message: "Curso não encontrado" }
    }

    if (curso.instrutor_id !== instrutorId) {
      return { success: false, message: "Sem permissão para criar aulas neste curso" }
    }

    // Verificar se o módulo pertence ao curso
    const { data: modulo, error: moduloError } = await supabase
      .from("modulos")
      .select("curso_id")
      .eq("id", aulaData.modulo_id)
      .single()

    if (moduloError || !modulo || modulo.curso_id !== aulaData.curso_id) {
      return { success: false, message: "Módulo não encontrado ou não pertence ao curso" }
    }

    const { data, error } = await supabase
      .from("aulas")
      .insert({
        curso_id: aulaData.curso_id,
        modulo_id: aulaData.modulo_id,
        titulo: aulaData.titulo,
        descricao: aulaData.descricao,
        tipo: aulaData.tipo,
        conteudo: aulaData.conteudo,
        media_url: aulaData.media_url,
        duracao: aulaData.duracao,
        ativo: aulaData.ativo,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar aula:", error)
      return { success: false, message: "Erro ao criar aula" }
    }

    // Atualizar duração total do curso
    await atualizarDuracaoCurso(aulaData.curso_id)
    await recalcularProgressoAlunos(aulaData.curso_id)

    console.log("Aula criada com sucesso:", data)
    return { success: true, message: "Aula criada com sucesso!", data }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado ao criar aula" }
  }
}

export async function buscarAulasDoInstrutor(instrutorId: string, pagina = 1, itensPorPagina = 6, cursoId?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Calcular o offset para paginação
    const offset = (pagina - 1) * itensPorPagina

    // Iniciar a query
    let query = supabase
      .from("aulas")
      .select(
        `
        *,
        cursos!inner(id, titulo, instrutor_id),
        modulos!inner(id, titulo)
      `,
        { count: "exact" },
      )
      .eq("cursos.instrutor_id", instrutorId)

    // Adicionar filtro por curso se especificado
    if (cursoId) {
      query = query.eq("curso_id", cursoId)
    }

    // Finalizar a query com ordenação por data de criação (mais recente primeiro) e paginação
    const { data, error, count } = await query
      .order("criado_em", { ascending: false })
      .range(offset, offset + itensPorPagina - 1)

    if (error) {
      console.error("Erro ao buscar aulas:", error)
      return { success: false, message: "Erro ao buscar aulas", data: [], totalAulas: 0 }
    }

    return { success: true, data: data || [], totalAulas: count || 0 }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado", data: [], totalAulas: 0 }
  }
}

export async function buscarCursosDoInstrutor(instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("cursos")
      .select("id, titulo")
      .eq("instrutor_id", instrutorId)
      .eq("ativo", true)
      .order("titulo", { ascending: true })

    if (error) {
      console.error("Erro ao buscar cursos:", error)
      return { success: false, message: "Erro ao buscar cursos", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado", data: [] }
  }
}

// Adicionar nova função para buscar cursos com contagem de aulas
export async function buscarCursosComAulas(instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Primeiro buscar todos os cursos do instrutor
    const { data: cursos, error: cursosError } = await supabase
      .from("cursos")
      .select("id, titulo")
      .eq("instrutor_id", instrutorId)
      .eq("ativo", true)
      .order("titulo", { ascending: true })

    if (cursosError) {
      console.error("Erro ao buscar cursos:", cursosError)
      return { success: false, message: "Erro ao buscar cursos", data: [] }
    }

    // Para cada curso, buscar a contagem de aulas
    const cursosComAulas = await Promise.all(
      cursos.map(async (curso) => {
        const { count, error: countError } = await supabase
          .from("aulas")
          .select("*", { count: "exact", head: true })
          .eq("curso_id", curso.id)

        if (countError) {
          console.error(`Erro ao contar aulas do curso ${curso.id}:`, countError)
          return { ...curso, totalAulas: 0 }
        }

        return { ...curso, totalAulas: count || 0 }
      }),
    )

    return { success: true, data: cursosComAulas || [] }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado", data: [] }
  }
}

// Função para atualizar duração total do curso
async function atualizarDuracaoCurso(cursoId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Somar durações de todas as aulas ativas do curso
    const { data, error } = await supabase.from("aulas").select("duracao").eq("curso_id", cursoId).eq("ativo", true)

    if (error) {
      console.error("Erro ao buscar durações das aulas:", error)
      return
    }

    const duracaoTotal = data?.reduce((total, aula) => total + (aula.duracao || 0), 0) || 0

    // Atualizar duração total do curso
    const { error: updateError } = await supabase
      .from("cursos")
      .update({ duracao_total: duracaoTotal })
      .eq("id", cursoId)

    if (updateError) {
      console.error("Erro ao atualizar duração do curso:", updateError)
    } else {
      console.log(`Duração do curso ${cursoId} atualizada para ${duracaoTotal} minutos`)
    }
  } catch (error) {
    console.error("Erro inesperado ao atualizar duração:", error)
  }
}

// Adicionar esta função para recalcular o progresso dos alunos após adicionar uma nova aula
// Adicionar após a função atualizarDuracaoCurso

// RECALCULAR PROGRESSO DOS ALUNOS
async function recalcularProgressoAlunos(cursoId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Buscar todos os alunos matriculados no curso
    const { data: matriculas, error: matriculasError } = await supabase
      .from("matriculas")
      .select("id, aluno_id")
      .eq("curso_id", cursoId)
      .eq("ativo", true)

    if (matriculasError || !matriculas) {
      console.error("Erro ao buscar matrículas:", matriculasError)
      return
    }

    // Buscar duração total de todas as aulas ativas do curso
    const { data: aulasAtivas, error: aulasError } = await supabase
      .from("aulas")
      .select("id, duracao")
      .eq("curso_id", cursoId)
      .eq("ativo", true)

    if (aulasError || !aulasAtivas) {
      console.error("Erro ao buscar aulas:", aulasError)
      return
    }

    const duracaoTotalCurso = aulasAtivas.reduce((total, aula) => total + (aula.duracao || 0), 0)

    if (duracaoTotalCurso === 0) {
      console.log("Curso sem duração definida, mantendo progresso atual")
      return
    }

    // Para cada aluno, recalcular o progresso baseado na duração
    for (const matricula of matriculas) {
      // Buscar aulas assistidas pelo aluno
      const { data: progressoAulas, error: progressoError } = await supabase
        .from("progresso_aulas")
        .select(`
          aula_id,
          aulas!inner(duracao)
        `)
        .eq("matricula_id", matricula.id)
        .eq("assistida", true)

      if (progressoError) {
        console.error("Erro ao buscar progresso:", progressoError)
        continue
      }

      // Calcular duração total assistida
      const duracaoAssistida = (progressoAulas || []).reduce((total, progresso) => {
        return total + (progresso.aulas.duracao || 0)
      }, 0)

      // Calcular novo percentual baseado na duração
      const novoPercentual = Math.round((duracaoAssistida / duracaoTotalCurso) * 100)

      // Atualizar progresso na tabela matriculas
      const { error: updateError } = await supabase
        .from("matriculas")
        .update({
          progresso_percentual: novoPercentual,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", matricula.id)

      if (updateError) {
        console.error("Erro ao atualizar progresso:", updateError)
      } else {
        console.log(
          `Progresso recalculado para usuário ${matricula.aluno_id}: ${novoPercentual}% (${duracaoAssistida}/${duracaoTotalCurso} min)`,
        )
      }
    }
  } catch (error) {
    console.error("Erro inesperado ao recalcular progresso:", error)
  }
}

// EXCLUSÃO DE ARQUIVOS DO MINIO
export async function excluirArquivoMinio(url: string): Promise<{ success: boolean; message?: string }> {
  try {
    if (!url) {
      return { success: true, message: "Nenhum arquivo para excluir" }
    }

    console.log("🗑️ Excluindo arquivo do MinIO (estrutura compatível):", url.replace(/\/[^\/]+$/, '/***'))

    // Importar funções de detecção e parsing
    const { detectStructureType, parseMinioUrl, getMinioConfig, getMinioUploadUrl, getMinioUserUploadUrl } = await import("@/lib/minio-config")
    const { MinioFileType } = await import("@/lib/minio-config")
    
    // Detectar tipo de estrutura
    const structureType = detectStructureType(url)
    const parsedUrl = parseMinioUrl(url)
    
    console.log("🔍 Estrutura detectada:", structureType, parsedUrl.structure)

    let deleteUrl: string

    if (structureType === 'new' && parsedUrl.userId && parsedUrl.tipo && parsedUrl.fileName) {
      // Nova estrutura: usar função específica para usuário
      const tipoMap: Record<string, MinioFileType> = {
        'videos': 'video',
        'documentos': 'file', 
        'imagens': 'imagem'
      }
      const minioFileType = tipoMap[parsedUrl.tipo] as MinioFileType
      deleteUrl = getMinioUserUploadUrl(parsedUrl.userId, minioFileType, parsedUrl.fileName)
      
      console.log("🗑️ Excluindo com nova estrutura:", {
        userId: parsedUrl.userId,
        tipo: parsedUrl.tipo,
        structure: 'new'
      })
    } else {
      // Estrutura antiga: usar método original
      const urlParts = url.split("/")
      const fileName = urlParts[urlParts.length - 1]
      const folder = urlParts[urlParts.length - 2]
      const filePath = `${folder}/${fileName}`
      
      deleteUrl = getMinioUploadUrl(filePath)
      
      console.log("🗑️ Excluindo com estrutura antiga:", {
        folder: folder,
        structure: 'old'
      })
    }

    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
      },
    })

    // MinIO retorna 204 para exclusão bem-sucedida ou 404 se arquivo não existe
    if (response.ok || response.status === 404) {
      console.log("✅ Arquivo excluído do MinIO:", {
        structure: structureType,
        success: true
      })
      return { success: true, message: "Arquivo excluído com sucesso" }
    } else {
      console.error("❌ Erro ao excluir arquivo:", response.status, response.statusText)
      return { success: false, message: `Erro ao excluir arquivo: ${response.statusText}` }
    }
  } catch (error) {
    console.error("💥 Erro inesperado ao excluir arquivo:", error)
    return { success: false, message: "Erro inesperado ao excluir arquivo" }
  }
}

// UPLOAD DIRETO PARA MINIO - NOVA IMPLEMENTAÇÃO
export async function uploadArquivoMinio(
  file: File,
  userId: string,
  tipo: "video" | "file" | "imagem",
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    console.log(`🚀 UPLOAD NOVA ESTRUTURA MINIO - Iniciando upload de ${tipo}:`, {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type,
      userId: userId,
      newStructure: true,
    })

    // Gerar nome único SEM UID (já está na estrutura da pasta)
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}-${cleanFileName}`

    // Importar funções da nova estrutura
    const { getMinioUserUploadUrl, getMinioUserFileUrl } = await import("@/lib/minio-config")
    const { MinioFileType } = await import("@/lib/minio-config")

    // Usar nova estrutura baseada em UID: rarcursos/[uid]/[tipo]/[arquivo]
    const uploadUrl = getMinioUserUploadUrl(userId, tipo as MinioFileType, fileName)

    console.log("📤 Fazendo upload com nova estrutura para MinIO:", {
      structure: `${userId}/${tipo === 'file' ? 'documentos' : tipo === 'video' ? 'videos' : 'imagens'}/${fileName}`,
      uploadUrl: uploadUrl.replace(/\/[^\/]+$/, '/***') // Ocultar nome do arquivo no log
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
      console.error("❌ Upload response:", response.status, response.statusText)
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    // URL final do arquivo com nova estrutura
    const fileUrl = getMinioUserFileUrl(userId, tipo as MinioFileType, fileName)

    console.log("✅ Upload com nova estrutura bem-sucedido:", {
      structure: `${userId}/${tipo === 'file' ? 'documentos' : tipo === 'video' ? 'videos' : 'imagens'}/`,
      success: true
    })

    return {
      success: true,
      url: fileUrl,
      message: "Arquivo enviado com sucesso",
    }
  } catch (error) {
    console.error("💥 Erro no upload com nova estrutura:", error)
    return {
      success: false,
      message: "Erro ao enviar arquivo. Tente novamente.",
    }
  }
}

// Manter compatibilidade com código existente
export async function uploadImagemMinio(
  file: File,
  userId: string,
): Promise<{ success: boolean; url?: string; message?: string }> {
  return uploadArquivoMinio(file, userId, "imagem")
}

export async function uploadVideoMinio(
  file: File,
  userId: string,
): Promise<{ success: boolean; url?: string; message?: string }> {
  return uploadArquivoMinio(file, userId, "video")
}

export async function uploadPdfMinio(
  file: File,
  userId: string,
): Promise<{ success: boolean; url?: string; message?: string }> {
  return uploadArquivoMinio(file, userId, "file")
}

// EDITAR AULA
export async function editarAula(aulaId: string, aulaData: AulaData, instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar se a aula existe e pertence ao instrutor
    const { data: aulaExistente, error: aulaError } = await supabase
      .from("aulas")
      .select(`
        *,
        cursos!inner(instrutor_id)
      `)
      .eq("id", aulaId)
      .single()

    if (aulaError || !aulaExistente) {
      console.error("Erro ao buscar aula:", aulaError)
      return { success: false, message: "Aula não encontrada" }
    }

    if (aulaExistente.cursos.instrutor_id !== instrutorId) {
      return { success: false, message: "Sem permissão para editar esta aula" }
    }

    // Verificar se o módulo pertence ao curso
    const { data: modulo, error: moduloError } = await supabase
      .from("modulos")
      .select("curso_id")
      .eq("id", aulaData.modulo_id)
      .single()

    if (moduloError || !modulo || modulo.curso_id !== aulaData.curso_id) {
      return { success: false, message: "Módulo não encontrado ou não pertence ao curso" }
    }

    // Se há uma nova URL de mídia e é diferente da atual, excluir arquivo antigo
    if (aulaData.media_url && aulaData.media_url !== aulaExistente.media_url && aulaExistente.media_url) {
      console.log("🔄 Substituindo arquivo antigo por novo")
      await excluirArquivoMinio(aulaExistente.media_url)
    }

    // Atualizar a aula
    const { data, error } = await supabase
      .from("aulas")
      .update({
        curso_id: aulaData.curso_id,
        modulo_id: aulaData.modulo_id,
        titulo: aulaData.titulo,
        descricao: aulaData.descricao,
        tipo: aulaData.tipo,
        conteudo: aulaData.conteudo,
        media_url: aulaData.media_url,
        duracao: aulaData.duracao,
        ativo: aulaData.ativo,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", aulaId)
      .select()
      .single()

    if (error) {
      console.error("Erro ao editar aula:", error)
      return { success: false, message: "Erro ao editar aula" }
    }

    // Atualizar duração total do curso
    await atualizarDuracaoCurso(aulaData.curso_id)

    console.log("Aula editada com sucesso:", data)
    return { success: true, message: "Aula editada com sucesso!", data }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado ao editar aula" }
  }
}

// EXCLUIR AULA
export async function excluirAula(aulaId: string, instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar se a aula existe e pertence ao instrutor
    const { data: aulaExistente, error: aulaError } = await supabase
      .from("aulas")
      .select(`
        *,
        cursos!inner(instrutor_id)
      `)
      .eq("id", aulaId)
      .single()

    if (aulaError || !aulaExistente) {
      console.error("Erro ao buscar aula:", aulaError)
      return { success: false, message: "Aula não encontrada" }
    }

    if (aulaExistente.cursos.instrutor_id !== instrutorId) {
      return { success: false, message: "Sem permissão para excluir esta aula" }
    }

    // Excluir arquivo do MinIO se existir
    if (aulaExistente.media_url) {
      console.log("🗑️ Excluindo arquivo da aula do MinIO")
      await excluirArquivoMinio(aulaExistente.media_url)
    }

    // Excluir a aula
    const { error } = await supabase.from("aulas").delete().eq("id", aulaId)

    if (error) {
      console.error("Erro ao excluir aula:", error)
      return { success: false, message: "Erro ao excluir aula" }
    }

    // Atualizar duração total do curso
    await atualizarDuracaoCurso(aulaExistente.curso_id)

    console.log("Aula excluída com sucesso:", aulaId)
    return { success: true, message: "Aula excluída com sucesso!" }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado ao excluir aula" }
  }
}

// BUSCAR AULA POR ID
export async function buscarAulaPorId(aulaId: string, instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Buscar a aula e verificar se pertence ao instrutor
    const { data: aula, error } = await supabase
      .from("aulas")
      .select(`
        *,
        cursos!inner(instrutor_id)
      `)
      .eq("id", aulaId)
      .single()

    if (error || !aula) {
      console.error("Erro ao buscar aula:", error)
      return { success: false, message: "Aula não encontrada", data: null }
    }

    if (aula.cursos.instrutor_id !== instrutorId) {
      return { success: false, message: "Sem permissão para acessar esta aula", data: null }
    }

    return { success: true, data: aula }
  } catch (error) {
    console.error("Erro inesperado:", error)
    return { success: false, message: "Erro inesperado ao buscar aula", data: null }
  }
}
