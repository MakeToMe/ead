"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginacaoProps {
  paginaAtual: number
  totalPaginas: number
  onChangePagina: (novaPagina: number) => void
}

export default function Paginacao({ paginaAtual, totalPaginas, onChangePagina }: PaginacaoProps) {
  const [inputPagina, setInputPagina] = useState(paginaAtual.toString())

  const irParaPrimeiraPagina = () => {
    onChangePagina(1)
    setInputPagina("1")
  }

  const irParaUltimaPagina = () => {
    onChangePagina(totalPaginas)
    setInputPagina(totalPaginas.toString())
  }

  const irParaPaginaAnterior = () => {
    if (paginaAtual > 1) {
      onChangePagina(paginaAtual - 1)
      setInputPagina((paginaAtual - 1).toString())
    }
  }

  const irParaProximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      onChangePagina(paginaAtual + 1)
      setInputPagina((paginaAtual + 1).toString())
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPagina(e.target.value.replace(/[^0-9]/g, ""))
  }

  const handleInputBlur = () => {
    let pagina = Number.parseInt(inputPagina)
    if (isNaN(pagina) || pagina < 1) {
      pagina = 1
    } else if (pagina > totalPaginas) {
      pagina = totalPaginas
    }
    setInputPagina(pagina.toString())
    onChangePagina(pagina)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur()
    }
  }

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        onClick={irParaPrimeiraPagina}
        disabled={paginaAtual === 1}
        className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={irParaPaginaAnterior}
        disabled={paginaAtual === 1}
        className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center bg-slate-800/50 border border-slate-700 rounded-md px-2">
        <Input
          value={inputPagina}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-12 text-center border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <span className="text-slate-400 mx-1">de</span>
        <span className="text-slate-300">{totalPaginas}</span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={irParaProximaPagina}
        disabled={paginaAtual === totalPaginas}
        className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={irParaUltimaPagina}
        disabled={paginaAtual === totalPaginas}
        className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
