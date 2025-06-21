/**
 * Extrai o nome original do arquivo a partir da URL do MinIO
 * Remove o UID do usuário e timestamp do nome do arquivo
 *
 * Formato esperado: uid_do_user-timestamp-nome_original.ext
 * Exemplo: "40d7-b049-1e55c364bf3e-1748832007500-NF 3591 AIR LIQUIDE -1.pdf"
 * Retorna: "NF 3591 AIR LIQUIDE -1.pdf"
 */
export function extrairNomeOriginal(url: string): string {
  try {
    // Extrair o nome do arquivo da URL
    const nomeCompleto = url.split("/").pop() || ""

    console.log("Nome completo do arquivo:", nomeCompleto)

    // Padrão: uid-timestamp-nome_original.ext
    // O UID tem formato: 8chars-4chars-4chars-4chars-12chars (36 chars + 4 hífens = 40 chars)
    // O timestamp tem 13 dígitos
    // Então precisamos pular: UID (40 chars) + hífen + timestamp (13 chars) + hífen = 54 chars

    // Método mais robusto: procurar pelo padrão timestamp-nome
    const regex = /^[a-f0-9-]+-(\d{13})-(.+)$/
    const match = nomeCompleto.match(regex)

    if (match && match[2]) {
      const nomeOriginal = match[2]
      console.log("Nome original extraído:", nomeOriginal)

      // Substituir underscores por espaços para melhor legibilidade
      return nomeOriginal.replace(/_/g, " ")
    }

    // Fallback: tentar método manual
    // Procurar pelo segundo hífen após um número de 13 dígitos
    const timestampMatch = nomeCompleto.match(/-(\d{13})-(.+)$/)
    if (timestampMatch && timestampMatch[2]) {
      const nomeOriginal = timestampMatch[2]
      console.log("Nome original extraído (fallback):", nomeOriginal)
      return nomeOriginal.replace(/_/g, " ")
    }

    // Se não conseguir extrair, retornar o nome completo
    console.log("Não foi possível extrair nome original, retornando nome completo")
    return nomeCompleto.replace(/_/g, " ")
  } catch (error) {
    console.error("Erro ao extrair nome original:", error)
    return "Arquivo"
  }
}

/**
 * Formatar tamanho do arquivo em formato legível
 */
export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
