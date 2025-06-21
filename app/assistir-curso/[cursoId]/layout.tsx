import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Assistir Curso",
  description: "Assista às aulas do curso",
}

export default function AssistirCursoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
