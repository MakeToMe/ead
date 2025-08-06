import { NextRequest, NextResponse } from "next/server";
import { signJwt } from "@/lib/auth-jwt";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = (await req.json()) as {
      name: string;
      email: string;
      password: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Dados obrigatórios ausentes" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Verificar se email já existe
    const { data: existing, error: existingError } = await supabase.from("users").select("uid").eq("email", email).maybeSingle();
        if (existing) {
      return NextResponse.json({ message: "Email já cadastrado" }, { status: 409 });
    }

    const hashed = await hashPassword(password);

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({ nome: name, email, senha: hashed, perfis: "aluno" })
      .select("uid, nome, email, perfis, criado_em, url_foto")
      .single();

        if (error || !newUser) {
      return NextResponse.json({ message: error?.message || "Erro ao criar usuário" }, { status: 500 });
    }

    // Gerar JWT e definir cookie de sessão
    const token = signJwt({ uid: newUser.uid });
    const res = NextResponse.json({ user: newUser });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
