"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CertificadoPublico } from "@/app/certificados/actions";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

/*
Reusable cards for certificate display. These are extracted from the public
`/verificar-certificado` page so they can be reused elsewhere (e.g. logged preview).
Each component expects props minimal and self-contained so they can be used in
RSC or client components (declared as `use client`).
*/

export function CertificateStatusCard({
  valid,
  message,
}: {
  valid: boolean;
  message: string;
}) {
  const bg = valid
    ? "bg-gradient-to-br from-green-600/90 to-emerald-600/80 border-green-400/80"
    : "bg-gradient-to-br from-red-900/40 to-red-800/20 border-red-500/30";
  return (
    <Card
      className={`${bg} backdrop-blur-sm`}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              valid ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            {valid ? (
              <CheckCircle className="h-6 w-6 text-green-400" />
            ) : (
              <XCircle className="h-6 w-6 text-red-400" />
            )}
          </div>
          <div>
            <h3
              className={`text-lg font-semibold mb-1 ${
                valid ? "text-white" : "text-red-300"
              }`}
            >
              {valid ? "Certificado Válido ✓" : "Certificado Não Encontrado"}
            </h3>
            <p className={valid ? "text-white/90" : "text-red-200/80"}>{message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CertificateDetailsCard({
  certificado,
  transparentBg = false,
}: {
  certificado: CertificadoPublico;
  transparentBg?: boolean;
}) {
  const { numero_certificado, nome_aluno, titulo_curso, data_conclusao, carga_horaria, status } = certificado;
  const formatarData = (dataString: string) =>
    new Date(dataString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  const formatarCargaHoraria = (minutos: number) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h === 0) return `${m} minutos`;
    if (m === 0) return `${h} ${h === 1 ? "hora" : "horas"}`;
    return `${h}h ${m}min`;
  };

  const bgClass = transparentBg ? "bg-transparent backdrop-blur-sm border border-slate-700/50" : "bg-gradient-to-br from-slate-800/60 to-gray-900/60 backdrop-blur-sm border-slate-700/50";

  return (
    <Card className={bgClass}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Detalhes do Certificado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-400">Número do Certificado</label>
              <p className="text-white font-mono text-lg">{numero_certificado}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400">Nome do Aluno</label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <p className="text-white font-semibold">{nome_aluno}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400">Status</label>
              <div className="mt-1">
                <Badge
                  className={
                    status === "ativo"
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  {status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-400">Curso</label>
              <p className="text-white font-semibold">{titulo_curso}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400">Data de Conclusão</label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <p className="text-white">{formatarData(data_conclusao)}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-400">Carga Horária</label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <p className="text-white">{formatarCargaHoraria(carga_horaria)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CertificateInfoCard({
  certificado,
}: {
  certificado: CertificadoPublico;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(certificado.hash_verificacao);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "Código de verificação copiado para a área de transferência",
    });
  };
  return (
    <Card className="bg-gradient-to-br from-blue-600/80 to-indigo-600/70 backdrop-blur-sm border-blue-300/80">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white mb-2">Informações Importantes</h4>
            <ul className="text-white/90 text-sm space-y-1">
              <li>• Este certificado é válido e reconhecido pela Plataforma Saber365</li>
              <li>• A verificação foi realizada em {new Date().toLocaleString("pt-BR")}</li>
              <li>• Mantenha o código de verificação para futuras consultas</li>
              <li>• Em caso de dúvidas, entre em contato conosco</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={copy} className="bg-slate-700 hover:bg-slate-600 text-white">
                <Copy className="h-4 w-4" /> {copied ? "Copiado" : "Copiar Hash"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
