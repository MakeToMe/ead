"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Obtém o mapa de visibilidade das redes sociais de um certificado.
 * Retorna objeto vazio caso a coluna esteja nula.
 */
export async function getSocialVisibility(
  certId: string
): Promise<Record<string, boolean>> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("certificados")
    .select("social_visibility")
    .eq("id", certId)
    .single();

  if (error) throw new Error("Erro ao buscar visibilidade de redes sociais");
  return (data?.social_visibility ?? {}) as Record<string, boolean>;
}

interface ToggleParams {
  certId: string;
  key: string;
  visible: boolean;
}

/**
 * Mescla o novo valor de visibilidade na coluna jsonb `social_visibility`.
 */
export async function toggleSocialVisibility({
  certId,
  key,
  visible,
}: ToggleParams) {
  const supabase = createServerSupabaseClient();

  // Valor atual
  const { data, error: fetchErr } = await supabase
    .from("certificados")
    .select("social_visibility")
    .eq("id", certId)
    .single();
  if (fetchErr) throw new Error("Falha ao buscar visibilidade atual");

  const current = (data?.social_visibility ?? {}) as Record<string, boolean>;
  const newVis = { ...current, [key]: visible };

  // Persistir
  const { error } = await supabase
    .from("certificados")
    .update({ social_visibility: newVis })
    .eq("id", certId);
  if (error) throw new Error("Não foi possível atualizar visibilidade");

  return { success: true } as const;
}