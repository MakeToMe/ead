import { Suspense } from "react"
import CertificateCard from "@/components/certificate/certificate-card"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

/**
 * Carrega o certificado público pelo hash.
 */
async function getCertificadoPublico(hash: string) {
  const supabase = createServerSupabaseClient()
  const { data: certificado, error } = await supabase
    .from("certificados")
    .select(
      `id,
       numero_certificado,
       curso_id,
       aluno_id,
       nome_aluno,
       titulo_curso,
       descricao_curso,
       carga_horaria,
       status,
       emitido_em,
       social_visibility`
    )
    .eq("hash_verificacao", hash)
    .single()

  if (error || !certificado) return null
  return certificado
}

async function CertificadoPublicoContent({ hash }: { hash: string }) {
  const certificado = await getCertificadoPublico(hash)

  // Buscar lista de módulos
  const supabase = createServerSupabaseClient()
  const { data: modulos } = await supabase
    .from("modulos")
    .select("id, titulo, aulas(id, titulo, duracao)")
    .eq("curso_id", certificado?.curso_id)
    .order("ordem")

  // Buscar dados do aluno
  const { data: aluno } = await supabase
    .from("users")
    .select("email, url_foto, social_links")
    .eq("uid", certificado?.aluno_id)
    .single()

  let avatarUrl: string | undefined = aluno?.url_foto ?? undefined
  let socialLinks: Record<string,string> = aluno?.social_links ?? {}
  if (avatarUrl && !avatarUrl.startsWith("http")) {
    const relativePath = avatarUrl.replace(/^ead\//, "")
    avatarUrl = `/api/avatar/${encodeURIComponent(relativePath)}`
  }

  const modulesInfo = (modulos ?? []).map((m) => ({
    id: m.id,
    titulo: m.titulo,
    aulas: m.aulas ?? [],
  }))

  const modulesCount = modulesInfo.length
  const aulasCount = modulesInfo.reduce((acc, m) => acc + m.aulas.length, 0)
  const totalMinutes = modulesInfo.reduce(
    (acc, m) => acc + m.aulas.reduce((a, aula) => a + (aula.duracao ?? 0), 0),
    0
  )
  const durationTotal = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`

  const issueDateFormatted = certificado?.emitido_em
    ? new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(certificado.emitido_em))
    : "-"

  const validity = "Não expira"
  const hashAuth = hash
  const baseUrl = process.env.URL_BASE ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://saber365.app"
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/certificado/${hash}`)}`
  
  
  
  if (!certificado) notFound()
  if (certificado.status !== "ativo") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-orange-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Certificado {certificado.status}</h1>
          <p className="text-gray-600">Este certificado não está mais ativo.</p>
        </div>
      </div>
    )
  }

  return (
    <CertificateCard
      name={certificado.nome_aluno}
      course={certificado.titulo_curso}
      provider={"Saber365"}
      date={issueDateFormatted}
      description={certificado.descricao_curso ?? ""}
      logoUrl={undefined}
      issueDate={issueDateFormatted}
      validity={validity}
      hashAuth={hashAuth}
      qrUrl={qrUrl}
      modulesInfo={modulesInfo}
      modulesCount={modulesCount}
      aulasCount={aulasCount}
      duration={durationTotal}
      links={socialLinks}
      visibility={certificado.social_visibility ?? {}}
      avatarUrl={avatarUrl}
      email={aluno?.email ?? undefined}
      editable={false}
      certId={certificado?.id ?? undefined}
    />
  )
}

// Página server component wrapper
export default async function CertificadoPublicoPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Carregando…</div>}>
      <CertificadoPublicoContent hash={hash} />
    </Suspense>
  )
}
