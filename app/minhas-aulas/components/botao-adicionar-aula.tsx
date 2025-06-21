"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlayCircle } from "lucide-react"

export default function BotaoAdicionarAula() {
  const router = useRouter()

  const handleClick = () => {
    router.push("/minhas-aulas/adicionar")
  }

  return (
    <Button
      onClick={handleClick}
      className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
    >
      <PlayCircle className="w-4 h-4 mr-2" />
      Adicionar Aula
    </Button>
  )
}
