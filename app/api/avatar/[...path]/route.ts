import { NextRequest, NextResponse } from "next/server";
import { getMinioFileUrl } from "@/lib/minio-config";

// Redirects to MinIO URL for an avatar
// Usage: /api/avatar/<relative-path-do-arquivo>
export async function GET(req: NextRequest) {
  try {
    const prefix = "/api/avatar/";
    const relativePath = decodeURIComponent(
      req.nextUrl.pathname.replace(prefix, "")
    );

    console.log("📸 API Avatar: Gerando URL para:", relativePath)

    // Se não há relativePath, retornar erro
    if (!relativePath) {
      return NextResponse.json(
        { error: "Caminho do arquivo não fornecido" },
        { status: 400 }
      );
    }

    // Gerar URL do MinIO
    const avatarUrl = getMinioFileUrl(relativePath)
    
    console.log("✅ API Avatar: URL gerada:", avatarUrl)
    
    // Redirecionar para a URL do MinIO
    return NextResponse.redirect(avatarUrl, 302);
  } catch (error) {
    console.error("❌ API Avatar: Erro ao gerar URL:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
