import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Redirects to a short-lived signed URL for an avatar stored in Supabase Storage
// Usage: /api/avatar/<relative-path-do-arquivo>
export async function GET(req: NextRequest) {
  const prefix = "/api/avatar/";
  const relativePath = decodeURIComponent(
    req.nextUrl.pathname.replace(prefix, "")
  );

  const supabase = createServerSupabaseClient();
  // Gera URL válida por 1 hora (ajuste se necessário)
  const { data, error } = await supabase
    .storage
    .from("ead")
    .createSignedUrl(relativePath, 60 * 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao gerar URL assinada" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(data.signedUrl, 302);
}
