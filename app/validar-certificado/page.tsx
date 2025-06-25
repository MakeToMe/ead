import clsx from "clsx";
import { redirect } from "next/navigation";
import { validateCertificate } from "@/lib/certificates";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Validação de Certificado | Saber365",
  description: "Verifique a autenticidade do seu certificado de conclusão.",
  robots: "noindex, nofollow",
};

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ValidationPage({ searchParams }: PageProps) {
  const type = (searchParams.type as string) ?? "id";
  const value = (searchParams.value as string) ?? "";

  let result: Awaited<ReturnType<typeof validateCertificate>> | null = null;
  if (value) {
    result = await validateCertificate({ type, value });
    if (result.valid && result.certificate) {
      // Redirect to public certificate display page using hash for consistency
      redirect(`/verificar-certificado?hash=${encodeURIComponent(result.certificate.hash_verificacao)}`);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white p-4">
      {/* Header */}
      <header className="flex flex-col items-center mb-12 text-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            {/* Shield icon emoji as placeholder */}
            <span className="text-2xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-extrabold leading-tight">SABER365</h1>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-2">
          Validação de Certificado
        </h2>
        <p className="text-sm sm:text-base text-white/80 max-w-md">
          Verifique a autenticidade do seu certificado de conclusão
        </p>
      </header>

      {/* Card */}
      <section className="w-full max-w-xl bg-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-8 shadow-2xl">
        {/* Tabs */}
        <div className="flex items-center justify-center gap-6 text-sm font-medium">
          {(["id", "hash"] as const).map((t) => (
            <a
              key={t}
              href={`?type=${t}`}
              className={clsx(
                "px-4 py-2 rounded-full flex items-center gap-2 border",
                type === t
                  ? "bg-white/20 border-white text-white"
                  : "border-transparent text-white/60 hover:text-white"
              )}
            >
              {t === "id" ? "Validar por ID" : "Validar por Hash"}
            </a>
          ))}
        </div>

        <form method="GET" className="space-y-6">
          <input type="hidden" name="type" value={type} />
          <div className="flex flex-col gap-2">
            <label htmlFor="value" className="text-sm font-semibold">
              {type === "id" ? "ID do Certificado" : "Hash do Certificado"}
            </label>
            <input
              id="value"
              name="value"
              defaultValue={value}
              placeholder={
                type === "id"
                  ? "a1b2c3d4e5f6789abcdef123456789"
                  : "9c3e1f4b..."
              }
              className="w-full rounded-lg border-none px-4 py-3 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            {type === "id" && (
              <p className="text-xs text-white/70">
                O ID está localizado no canto superior direito do certificado
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            🔍 Validar Certificado
          </button>
        </form>

        {/* Exibe mensagem de erro quando inválido */}
          {result && !result.valid && (
          <div className="space-y-6">
            <div
              className={clsx(
                "rounded-lg p-4 text-center font-semibold",
                result.valid ? "bg-green-600/40" : "bg-red-600/40"
              )}
            >
              {result.message}
            </div>

            {/* bloco removido pois redirecionamos em caso de sucesso */}
            {false && result.valid && result.certificate && (
              <div className="overflow-x-auto">
                {/* Render only front side of certificate for quick preview */}
                {/* Using client component in RSC via dynamic import to avoid hydration issues */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/certificado/preview?numero=${encodeURIComponent(
                    result.certificate.numero_certificado
                  )}`}
                  alt="Pré-visualização do certificado"
                  className="w-full h-auto rounded shadow-lg"
                />
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-white/60">
          Validação segura e criptografada
        </p>
      </section>

      <footer className="mt-12 text-xs text-white/60 text-center">
        © {new Date().getFullYear()} Saber365. Todos os direitos reservados.
      </footer>
    </main>
  );
}
