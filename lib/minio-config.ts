/**
 * Configuração centralizada do MinIO
 * Utiliza variáveis de ambiente para evitar hardcoding
 */

export interface MinioConfig {
  endpoint: string
  bucket: string
  accessKey: string
  secretKey: string
}

/**
 * Tipos de arquivo suportados e seus mapeamentos para pastas
 */
export type MinioFileType = 'video' | 'file' | 'imagem'
export type MinioFolderType = 'videos' | 'documentos' | 'imagens'

/**
 * Mapeamento de tipos de arquivo para pastas
 */
export const FILE_TYPE_MAPPING: Record<MinioFileType, MinioFolderType> = {
  video: 'videos',
  file: 'documentos',  // Mudança: file → documentos
  imagem: 'imagens'
}

/**
 * Configuração para uso no servidor (server-side)
 */
export function getMinioConfig(): MinioConfig {
  const endpoint = process.env.MINIO_ENDPOINT
  const bucket = process.env.MINIO_BUCKET
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY

  if (!endpoint || !bucket || !accessKey || !secretKey) {
    throw new Error(
      'Configurações do MinIO não encontradas. Verifique as variáveis de ambiente: MINIO_ENDPOINT, MINIO_BUCKET, MINIO_ACCESS_KEY, MINIO_SECRET_KEY'
    )
  }

  return {
    endpoint,
    bucket,
    accessKey,
    secretKey,
  }
}

/**
 * Configuração básica para uso no cliente (client-side)
 * Apenas endpoint e bucket são necessários para URLs públicas
 */
export function getMinioClientConfig() {
  // Valores padrão para o cliente - podem ser sobrescritos via API se necessário
  return {
    endpoint: process.env.NEXT_PUBLIC_MINIO_ENDPOINT || "https://avs3.guardia.work",
    bucket: process.env.NEXT_PUBLIC_MINIO_BUCKET || "rar",
  }
}

/**
 * Gera a URL completa do arquivo no MinIO (server-side)
 */
export function getMinioFileUrl(filePath: string): string {
  const config = getMinioConfig()
  return `${config.endpoint}/${config.bucket}/${filePath}`
}

/**
 * Gera a URL completa do arquivo no MinIO (client-side)
 */
export function getMinioClientFileUrl(filePath: string): string {
  const config = getMinioClientConfig()
  return `${config.endpoint}/${config.bucket}/${filePath}`
}

/**
 * Gera a URL de upload para o MinIO (server-side)
 */
export function getMinioUploadUrl(filePath: string): string {
  return getMinioFileUrl(filePath)
}

/**
 * URL da imagem padrão do sistema (server-side)
 */
export function getDefaultImageUrl(): string {
  const config = getMinioConfig()
  return `${config.endpoint}/${config.bucket}/DM011730_copy-removebg-preview.png`
}

/**
 * URL da imagem padrão do sistema (client-side)
 */
export function getDefaultImageUrlClient(): string {
  const config = getMinioClientConfig()
  return `${config.endpoint}/${config.bucket}/DM011730_copy-removebg-preview.png`
}

/**
 * NOVA ESTRUTURA - Funções para estrutura baseada em UID do usuário
 */

/**
 * Gera o caminho completo do arquivo com estrutura de usuário
 * Formato: [uid_do_user]/[tipo]/[arquivo]
 */
export function getMinioUserPath(userId: string, tipo: MinioFileType, fileName: string): string {
  const folderType = FILE_TYPE_MAPPING[tipo]
  return `${userId}/${folderType}/${fileName}`
}

/**
 * Gera a URL completa do arquivo com nova estrutura (server-side)
 * Formato: https://endpoint/bucket/[uid]/[tipo]/[arquivo]
 */
export function getMinioUserFileUrl(userId: string, tipo: MinioFileType, fileName: string): string {
  const config = getMinioConfig()
  const filePath = getMinioUserPath(userId, tipo, fileName)
  return `${config.endpoint}/${config.bucket}/${filePath}`
}

/**
 * Gera a URL de upload com nova estrutura (server-side)
 */
export function getMinioUserUploadUrl(userId: string, tipo: MinioFileType, fileName: string): string {
  return getMinioUserFileUrl(userId, tipo, fileName)
}

/**
 * Gera a URL completa do arquivo com nova estrutura (client-side)
 */
export function getMinioUserFileUrlClient(userId: string, tipo: MinioFileType, fileName: string): string {
  const config = getMinioClientConfig()
  const filePath = getMinioUserPath(userId, tipo, fileName)
  return `${config.endpoint}/${config.bucket}/${filePath}`
}

/**
 * Detecta o tipo de estrutura baseado na URL
 * @param url URL do arquivo
 * @returns 'old' para estrutura antiga, 'new' para nova estrutura
 */
export function detectStructureType(url: string): 'old' | 'new' {
  // Estrutura antiga: /rar/videos/userId-timestamp-file.ext
  // Nova estrutura: /rarcursos/userId/videos/timestamp-file.ext
  
  if (!url) return 'old'
  
  // Se contém um padrão como /userId/videos/ ou /userId/documentos/ ou /userId/imagens/
  // onde userId é um UUID, então é nova estrutura
  const newStructurePattern = /\/[a-f0-9-]{36}\/(videos|documentos|imagens)\//i
  
  return newStructurePattern.test(url) ? 'new' : 'old'
}

/**
 * Extrai informações do arquivo baseado na estrutura da URL
 */
export function parseMinioUrl(url: string): {
  userId?: string
  tipo?: MinioFolderType
  fileName?: string
  structure: 'old' | 'new'
} {
  const structure = detectStructureType(url)
  
  if (structure === 'new') {
    // Nova estrutura: /bucket/userId/tipo/fileName
    const match = url.match(/\/([a-f0-9-]{36})\/(videos|documentos|imagens)\/(.+)$/i)
    if (match) {
      return {
        userId: match[1],
        tipo: match[2] as MinioFolderType,
        fileName: match[3],
        structure: 'new'
      }
    }
  } else {
    // Estrutura antiga: /bucket/tipo/userId-timestamp-fileName
    const match = url.match(/\/(videos|files|imagens)\/(.+)$/i)
    if (match) {
      const folderType = match[1] === 'files' ? 'documentos' : match[1] as MinioFolderType
      return {
        tipo: folderType,
        fileName: match[2],
        structure: 'old'
      }
    }
  }
  
  return { structure }
}