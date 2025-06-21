"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createHash } from "crypto"

export interface CertificadoData {
  id: string
  numero_certificado: string
  nome_aluno: string
  titulo_curso: string
  descricao_curso: string
  carga_horaria: number
  data_inicio: string
  data_conclusao: string
  nota_final?: number
  hash_verificacao: string
  status: string
  emitido_em: string
  url_certificado?: string
  qr_code_url?: string
}

export interface CertificadoPublico {
  numero_certificado: string
  nome_aluno: string
  titulo_curso: string
  data_conclusao: string
  carga_horaria: number
  status: string
  hash_verificacao: string
}

// Função para gerar hash de verificação
function gerarHashVerificacao(
  numeroCertificado: string,
  alunoId: string,
  cursoId: string,
  dataConclusao: string,
): string {
  const dados = `${numeroCertificado}-${alunoId}-${cursoId}-${dataConclusao}-${Date.now()}`
  return createHash("sha256").update(dados).digest("hex")
}

// Função para gerar número único do certificado
function gerarNumeroCertificado(): string {
  const ano = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `CERT-${ano}-${timestamp}-${random}`
}

// Função para buscar certificado por ID (para visualização privada)
export async function buscarCertificadoPorId(certificadoId: string, userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: certificado, error } = await supabase
      .from("certificados")
      .select(`
        id,
        numero_certificado,
        nome_aluno,
        titulo_curso,
        descricao_curso,
        carga_horaria,
        data_inicio,
        data_conclusao,
        status,
        emitido_em,
        hash_verificacao,
        aluno_id
      `)
      .eq("id", certificadoId)
      .eq("aluno_id", userId) // Garantir que só o dono pode ver
      .single()

    if (error || !certificado) {
      return {
        success: false,
        message: "Certificado não encontrado ou sem permissão",
        data: null,
      }
    }

    return {
      success: true,
      data: certificado,
    }
  } catch (error) {
    console.error("Erro ao buscar certificado:", error)
    return {
      success: false,
      message: "Erro interno do servidor",
      data: null,
    }
  }
}

// Função para verificar se o aluno pode receber certificado
export async function verificarElegibilidadeCertificado(cursoId: string, alunoId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar se existe matrícula
    const { data: matricula, error: matriculaError } = await supabase
      .from("matriculas")
      .select("id, progresso_percentual, status, data_matricula")
      .eq("curso_id", cursoId)
      .eq("aluno_id", alunoId)
      .single()

    if (matriculaError || !matricula) {
      return { elegivel: false, motivo: "Matrícula não encontrada" }
    }

    // Verificar se o curso foi concluído (100%)
    if (matricula.progresso_percentual < 100) {
      return {
        elegivel: false,
        motivo: `Curso não concluído. Progresso atual: ${matricula.progresso_percentual}%`,
      }
    }

    // Verificar se já existe certificado
    const { data: certificadoExistente } = await supabase
      .from("certificados")
      .select("id, numero_certificado, status")
      .eq("curso_id", cursoId)
      .eq("aluno_id", alunoId)
      .single()

    if (certificadoExistente) {
      return {
        elegivel: false,
        motivo: "Certificado já emitido",
        certificado_existente: certificadoExistente,
      }
    }

    return {
      elegivel: true,
      matricula_data: matricula,
    }
  } catch (error) {
    console.error("Erro ao verificar elegibilidade:", error)
    return { elegivel: false, motivo: "Erro interno do servidor" }
  }
}

// Função para emitir certificado
export async function emitirCertificado(cursoId: string, alunoId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar elegibilidade
    const elegibilidade = await verificarElegibilidadeCertificado(cursoId, alunoId)
    if (!elegibilidade.elegivel) {
      return {
        success: false,
        message: elegibilidade.motivo,
        certificado_existente: elegibilidade.certificado_existente,
      }
    }

    // Buscar dados do aluno
    const { data: aluno, error: alunoError } = await supabase
      .from("users")
      .select("nome, email")
      .eq("uid", alunoId)
      .single()

    if (alunoError || !aluno) {
      return { success: false, message: "Dados do aluno não encontrados" }
    }

    // Buscar dados do curso
    const { data: curso, error: cursoError } = await supabase
      .from("cursos")
      .select("titulo, descricao, duracao_total, instrutor_id")
      .eq("id", cursoId)
      .single()

    if (cursoError || !curso) {
      return { success: false, message: "Dados do curso não encontrados" }
    }

    // Gerar número único do certificado
    const numeroCertificado = gerarNumeroCertificado()

    // Gerar hash de verificação
    const dataAtual = new Date().toISOString().split("T")[0]
    const hashVerificacao = gerarHashVerificacao(numeroCertificado, alunoId, cursoId, dataAtual)

    // Preparar dados do certificado
    const certificadoData = {
      numero_certificado: numeroCertificado,
      aluno_id: alunoId,
      curso_id: cursoId,
      instrutor_id: curso.instrutor_id,
      nome_aluno: aluno.nome,
      titulo_curso: curso.titulo,
      descricao_curso: curso.descricao || "",
      carga_horaria: curso.duracao_total || 0,
      data_inicio: elegibilidade.matricula_data?.data_matricula || dataAtual,
      data_conclusao: dataAtual,
      hash_verificacao: hashVerificacao,
      status: "ativo",
    }

    // Inserir certificado no banco
    const { data: certificado, error: insertError } = await supabase
      .from("certificados")
      .insert(certificadoData)
      .select()
      .single()

    if (insertError) {
      console.error("Erro ao inserir certificado:", insertError)
      return { success: false, message: "Erro ao salvar certificado" }
    }

    // TODO: Gerar QR Code e PDF do certificado
    // const qrCodeUrl = await generateQRCode(hashVerificacao)
    // const pdfUrl = await generateCertificatePDF(certificado)

    // Atualizar com URLs geradas
    // await supabase
    //   .from("certificados")
    //   .update({
    //     qr_code_url: qrCodeUrl,
    //     url_certificado: pdfUrl
    //   })
    //   .eq("id", certificado.id)

    return {
      success: true,
      message: "Certificado emitido com sucesso!",
      certificado: {
        id: certificado.id,
        numero_certificado: certificado.numero_certificado,
        hash_verificacao: certificado.hash_verificacao,
      },
    }
  } catch (error) {
    console.error("Erro ao emitir certificado:", error)
    return { success: false, message: "Erro interno do servidor" }
  }
}

// Função para buscar certificados do aluno
export async function buscarCertificadosAluno(alunoId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: certificados, error } = await supabase
      .from("certificados")
      .select(`
        id,
        numero_certificado,
        titulo_curso,
        descricao_curso,
        carga_horaria,
        data_conclusao,
        status,
        emitido_em,
        url_certificado,
        hash_verificacao
      `)
      .eq("aluno_id", alunoId)
      .eq("status", "ativo")
      .order("emitido_em", { ascending: false })

    if (error) {
      console.error("Erro ao buscar certificados:", error)
      return { success: false, message: "Erro ao buscar certificados", data: [] }
    }

    return { success: true, data: certificados || [] }
  } catch (error) {
    console.error("Erro ao buscar certificados:", error)
    return { success: false, message: "Erro interno do servidor", data: [] }
  }
}

// Função para verificar certificado publicamente
export async function verificarCertificadoPublico(hash: string): Promise<{
  success: boolean
  message: string
  certificado?: CertificadoPublico
}> {
  try {
    const supabase = createServerSupabaseClient()

    const { data: certificado, error } = await supabase
      .from("certificados")
      .select(`
        numero_certificado,
        nome_aluno,
        titulo_curso,
        data_conclusao,
        carga_horaria,
        status,
        hash_verificacao
      `)
      .eq("hash_verificacao", hash)
      .single()

    if (error || !certificado) {
      return {
        success: false,
        message: "Certificado não encontrado ou hash inválido",
      }
    }

    if (certificado.status !== "ativo") {
      return {
        success: false,
        message: `Certificado ${certificado.status}`,
      }
    }

    return {
      success: true,
      message: "Certificado válido",
      certificado: certificado as CertificadoPublico,
    }
  } catch (error) {
    console.error("Erro ao verificar certificado:", error)
    return {
      success: false,
      message: "Erro interno do servidor",
    }
  }
}

// Função para buscar certificados emitidos pelo instrutor
export async function buscarCertificadosInstrutor(instrutorId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: certificados, error } = await supabase
      .from("certificados")
      .select(`
        id,
        numero_certificado,
        nome_aluno,
        titulo_curso,
        data_conclusao,
        status,
        emitido_em
      `)
      .eq("instrutor_id", instrutorId)
      .order("emitido_em", { ascending: false })

    if (error) {
      console.error("Erro ao buscar certificados do instrutor:", error)
      return { success: false, message: "Erro ao buscar certificados", data: [] }
    }

    return { success: true, data: certificados || [] }
  } catch (error) {
    console.error("Erro ao buscar certificados do instrutor:", error)
    return { success: false, message: "Erro interno do servidor", data: [] }
  }
}

// Função para revogar certificado (apenas admin/instrutor)
export async function revogarCertificado(certificadoId: string, motivo: string, userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Verificar permissões do usuário
    const { data: user, error: userError } = await supabase.from("users").select("perfis").eq("uid", userId).single()

    if (userError || !user || (user.perfis !== "admin" && user.perfis !== "instrutor")) {
      return { success: false, message: "Sem permissão para revogar certificados" }
    }

    // Atualizar status do certificado
    const { error: updateError } = await supabase
      .from("certificados")
      .update({
        status: "revogado",
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", certificadoId)

    if (updateError) {
      console.error("Erro ao revogar certificado:", updateError)
      return { success: false, message: "Erro ao revogar certificado" }
    }

    // TODO: Registrar log de revogação
    // await registrarLogRevogacao(certificadoId, userId, motivo)

    return { success: true, message: "Certificado revogado com sucesso" }
  } catch (error) {
    console.error("Erro ao revogar certificado:", error)
    return { success: false, message: "Erro interno do servidor" }
  }
}
