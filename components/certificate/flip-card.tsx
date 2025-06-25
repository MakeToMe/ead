"use client";

import { useState } from "react";
import { RotateCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CertificadoPublico } from "@/app/certificados/actions";

/*
  Simple reusable flip-card for certificates.
  It receives the certificate data and renders two faces (front / back).
  The container itself does NOT set fixed width/height or background so it
  fits flexibly inside existing layouts.
*/
export default function CertificateFlipCard({ certificado }: { certificado: CertificadoPublico }) {
  const [back, setBack] = useState(false);
  const toggle = () => setBack((p) => !p);

  return (
    <div className="relative">
      {/* flip container */}
      <div
        className={`relative transform-style-preserve-3d transition-transform duration-500 ${
          back ? "rotate-y-180" : ""
        }`}
      >
        {/* FRONT */}
        <div className="[backface-visibility:hidden]">
          {/* existing yellow template from page logada */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-12 text-center border-8 border-gradient-to-r from-amber-400 to-yellow-500 relative overflow-hidden">
            {/* decorations copy */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full translate-x-20 translate-y-20" />
            <div className="absolute top-1/2 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full translate-x-12 -translate-y-12" />

            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-gray-800 mb-2">CERTIFICADO</h2>
              <p className="text-lg text-gray-600 mb-8">de Participação</p>
              <p className="text-lg text-gray-700 mb-4">Certificamos que</p>
              <h3 className="text-3xl font-bold text-gray-800 mb-4 border-b-2 border-amber-400 pb-2 inline-block">
                {certificado.nome_aluno}
              </h3>
              <p className="text-lg text-gray-700">concluiu com êxito o curso</p>
              <h4 className="text-2xl font-bold text-gray-800 my-8">{certificado.titulo_curso}</h4>
              <p className="text-gray-600 mb-8">com carga horária de {certificado.carga_horaria} horas</p>
              <div className="flex justify-between items-end">
                <p className="text-sm text-gray-600">Emitido em {new Date(certificado.data_conclusao).toLocaleDateString("pt-BR")}</p>
                <div className="text-right">
                  <div className="w-32 h-px bg-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Assinatura Digital</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="[backface-visibility:hidden] rotate-y-180 absolute inset-0">
          <div className="h-full w-full rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 p-8 flex items-center justify-center text-white">
            <p className="text-2xl font-semibold">Verso do certificado aqui</p>
          </div>
        </div>
      </div>

      {/* flip button */}
      <Button
        size="icon"
        onClick={toggle}
        className="absolute bottom-4 right-4 bg-slate-800/70 hover:bg-slate-700 backdrop-blur-sm border border-slate-700 text-white"
      >
        {back ? <RotateCcw className="h-5 w-5" /> : <RotateCw className="h-5 w-5" />}
      </Button>
    </div>
  );
}
