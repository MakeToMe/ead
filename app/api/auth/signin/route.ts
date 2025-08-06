import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/auth-jwt";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  console.log("🔐 /api/auth/signin - Iniciando processo de login")
  
  try {
    const { email, password } = (await req.json()) as { email: string; password: string };
    console.log("📧 Email recebido:", email)

    if (!email || !password) {
      console.log("❌ Email ou senha não fornecidos")
      return NextResponse.json({ message: "Email e senha são obrigatórios" }, { status: 400 });
    }

    console.log("🔍 Conectando ao Supabase...")
    const supabase = createServerSupabaseClient();

    console.log("🔍 Buscando usuário por email...")
    const { data: user, error } = await supabase
      .from("users")
      .select("uid, email, senha, nome, perfis, criado_em, url_foto")
      .eq("email", email)
      .single();

    if (error) {
      console.log("❌ Erro do Supabase:", error.message, "Code:", error.code)
      return NextResponse.json({ 
        message: "Database connection error. Retrying the connection.",
        details: error.message 
      }, { status: 401 });
    }
    
    if (!user) {
      console.log("❌ Usuário não encontrado para email:", email)
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 401 });
    }
    
    console.log("✅ Usuário encontrado:", user.email)

    const isValid = await verifyPassword(password, user.senha);
    if (!isValid) {
            return NextResponse.json({ message: "Senha inválida" }, { status: 401 });
    }

    const { senha, ...userWithoutPassword } = user;

    // Gerar JWT e definir cookie HTTP-only
    const token = signJwt({ uid: user.uid });
    const res = NextResponse.json({ user: userWithoutPassword });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
