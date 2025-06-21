import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/auth-jwt";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ message: "Email e senha são obrigatórios" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("uid, email, senha, nome, perfis, criado_em")
      .eq("email", email)
      .single();

    
        if (error || !user) {
      return NextResponse.json({ message: error?.message || "Usuário não encontrado" }, { status: 401 });
    }

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
