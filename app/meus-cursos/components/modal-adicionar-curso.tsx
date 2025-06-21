"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

interface ModalAdicionarCursoProps {
  onCursoAdicionado: () => void
}

export default function ModalAdicionarCurso({ onCursoAdicionado }: ModalAdicionarCursoProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push("/meus-cursos/adicionar")
  }

  return (
    <Button
      onClick={handleClick}
      className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
    >
      <PlusCircle className="w-4 h-4 mr-2" />
      Adicionar Curso
    </Button>
  )
}
