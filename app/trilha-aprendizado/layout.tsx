import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trilha de Aprendizado | R$antos",
  description: "Acompanhe seu progresso e descubra novos cursos",
}

export default function TrilhaAprendizadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
