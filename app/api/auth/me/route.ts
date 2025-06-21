import { NextRequest, NextResponse } from "next/server"
import { verifyJwt } from "@/lib/auth-jwt"
import { cookies } from "next/headers"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(_: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
  }

  const payload = verifyJwt(token)
  if (!payload) {
    // invalid or expired, clear cookie
    await cookieStore.delete("session")
    return NextResponse.json({ message: "Invalid session" }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()
  const { data: user, error } = await supabase.from("users").select("uid, nome, email, perfis, criado_em, atualizado_em").eq("uid", payload.uid).single()
  if (error || !user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }
  return NextResponse.json({ user })
}
