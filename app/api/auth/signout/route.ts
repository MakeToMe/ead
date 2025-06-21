import { NextRequest, NextResponse } from "next/server"
export async function POST(_: NextRequest) {
  const res = NextResponse.json({ message: "Signed out" })
  res.cookies.set("session", "", { path: "/", maxAge: 0 })
  return res
}
