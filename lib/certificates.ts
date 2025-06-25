"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface CertificatePublic {
  numero_certificado: string;
  nome_aluno: string;
  titulo_curso: string;
  data_conclusao: string;
  carga_horaria: number;
  status: string;
  hash_verificacao: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  certificate?: CertificatePublic;
}

interface Params {
  type: "id" | "hash";
  value: string;
}

export async function validateCertificate({ type, value }: Params): Promise<ValidationResult> {
  if (!value) {
    return { valid: false, message: "Valor vazio." };
  }

  try {
    const supabase = createServerSupabaseClient();

    // Build dynamic filter
    const column = type === "hash" ? "hash_verificacao" : "numero_certificado";

    const { data, error } = await supabase
      .from("certificados")
      .select(
        `numero_certificado, nome_aluno, titulo_curso, data_conclusao, carga_horaria, status, hash_verificacao`
      )
      .eq(column, value)
      .single();

    if (error || !data) {
      return { valid: false, message: "CERTIFICADO INEXISTENTE OU INVÁLIDO" };
    }

    if (data.status !== "ativo") {
      return { valid: false, message: `Certificado ${data.status}` };
    }

    return {
      valid: true,
      message: "CERTIFICADO VÁLIDO ✓",
      certificate: data as CertificatePublic,
    };
  } catch (err) {
    console.error("Erro ao validar certificado:", err);
    return { valid: false, message: "Erro interno" };
  }
}
