/**
 * Testes para as funções de configuração do MinIO
 * Validam a nova estrutura baseada em UID do usuário
 */

import {
  getMinioUserPath,
  getMinioUserFileUrl,
  getMinioUserUploadUrl,
  detectStructureType,
  parseMinioUrl,
  FILE_TYPE_MAPPING,
  type MinioFileType
} from '../minio-config'

// Mock das variáveis de ambiente
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    MINIO_ENDPOINT: 'https://test.minio.com',
    MINIO_BUCKET: 'rarcursos',
    MINIO_ACCESS_KEY: 'test-access-key',
    MINIO_SECRET_KEY: 'test-secret-key'
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('MinIO Configuration - Nova Estrutura', () => {
  const testUserId = '123e4567-e89b-12d3-a456-426614174000'
  const testFileName = '1234567890-test-file.mp4'

  describe('getMinioUserPath', () => {
    test('deve gerar caminho correto para vídeo', () => {
      const path = getMinioUserPath(testUserId, 'video', testFileName)
      expect(path).toBe(`${testUserId}/videos/${testFileName}`)
    })

    test('deve gerar caminho correto para documento (file)', () => {
      const path = getMinioUserPath(testUserId, 'file', 'test-doc.pdf')
      expect(path).toBe(`${testUserId}/documentos/test-doc.pdf`)
    })

    test('deve gerar caminho correto para imagem', () => {
      const path = getMinioUserPath(testUserId, 'imagem', 'test-image.jpg')
      expect(path).toBe(`${testUserId}/imagens/test-image.jpg`)
    })
  })

  describe('FILE_TYPE_MAPPING', () => {
    test('deve mapear tipos corretamente', () => {
      expect(FILE_TYPE_MAPPING.video).toBe('videos')
      expect(FILE_TYPE_MAPPING.file).toBe('documentos')
      expect(FILE_TYPE_MAPPING.imagem).toBe('imagens')
    })
  })

  describe('getMinioUserFileUrl', () => {
    test('deve gerar URL completa correta', () => {
      const url = getMinioUserFileUrl(testUserId, 'video', testFileName)
      expect(url).toBe(`https://test.minio.com/rarcursos/${testUserId}/videos/${testFileName}`)
    })

    test('deve gerar URL para documento', () => {
      const url = getMinioUserFileUrl(testUserId, 'file', 'doc.pdf')
      expect(url).toBe(`https://test.minio.com/rarcursos/${testUserId}/documentos/doc.pdf`)
    })
  })

  describe('detectStructureType', () => {
    test('deve detectar nova estrutura', () => {
      const newUrl = `https://test.minio.com/rarcursos/${testUserId}/videos/test.mp4`
      expect(detectStructureType(newUrl)).toBe('new')
    })

    test('deve detectar estrutura antiga', () => {
      const oldUrl = 'https://test.minio.com/rar/videos/user123-1234567890-test.mp4'
      expect(detectStructureType(oldUrl)).toBe('old')
    })

    test('deve detectar nova estrutura com documentos', () => {
      const newUrl = `https://test.minio.com/rarcursos/${testUserId}/documentos/test.pdf`
      expect(detectStructureType(newUrl)).toBe('new')
    })

    test('deve detectar nova estrutura com imagens', () => {
      const newUrl = `https://test.minio.com/rarcursos/${testUserId}/imagens/test.jpg`
      expect(detectStructureType(newUrl)).toBe('new')
    })

    test('deve retornar old para URL vazia', () => {
      expect(detectStructureType('')).toBe('old')
    })
  })

  describe('parseMinioUrl', () => {
    test('deve parsear URL da nova estrutura corretamente', () => {
      const url = `https://test.minio.com/rarcursos/${testUserId}/videos/test.mp4`
      const parsed = parseMinioUrl(url)
      
      expect(parsed.structure).toBe('new')
      expect(parsed.userId).toBe(testUserId)
      expect(parsed.tipo).toBe('videos')
      expect(parsed.fileName).toBe('test.mp4')
    })

    test('deve parsear URL da estrutura antiga', () => {
      const url = 'https://test.minio.com/rar/videos/user123-1234567890-test.mp4'
      const parsed = parseMinioUrl(url)
      
      expect(parsed.structure).toBe('old')
      expect(parsed.tipo).toBe('videos')
      expect(parsed.fileName).toBe('user123-1234567890-test.mp4')
      expect(parsed.userId).toBeUndefined()
    })

    test('deve mapear files para documentos na estrutura antiga', () => {
      const url = 'https://test.minio.com/rar/files/user123-1234567890-test.pdf'
      const parsed = parseMinioUrl(url)
      
      expect(parsed.structure).toBe('old')
      expect(parsed.tipo).toBe('documentos')
      expect(parsed.fileName).toBe('user123-1234567890-test.pdf')
    })

    test('deve parsear URL com documentos na nova estrutura', () => {
      const url = `https://test.minio.com/rarcursos/${testUserId}/documentos/test.pdf`
      const parsed = parseMinioUrl(url)
      
      expect(parsed.structure).toBe('new')
      expect(parsed.userId).toBe(testUserId)
      expect(parsed.tipo).toBe('documentos')
      expect(parsed.fileName).toBe('test.pdf')
    })

    test('deve retornar estrutura para URL inválida', () => {
      const parsed = parseMinioUrl('invalid-url')
      expect(parsed.structure).toBe('old')
      expect(parsed.userId).toBeUndefined()
      expect(parsed.tipo).toBeUndefined()
      expect(parsed.fileName).toBeUndefined()
    })
  })
})

describe('Compatibilidade entre Estruturas', () => {
  test('deve manter compatibilidade com URLs antigas', () => {
    const oldUrls = [
      'https://test.minio.com/rar/videos/user123-1234567890-video.mp4',
      'https://test.minio.com/rar/files/user123-1234567890-doc.pdf',
      'https://test.minio.com/rar/imagens/user123-1234567890-image.jpg'
    ]

    oldUrls.forEach(url => {
      expect(detectStructureType(url)).toBe('old')
      const parsed = parseMinioUrl(url)
      expect(parsed.structure).toBe('old')
      expect(parsed.tipo).toBeDefined()
      expect(parsed.fileName).toBeDefined()
    })
  })

  test('deve processar corretamente URLs da nova estrutura', () => {
    const testUserId = '123e4567-e89b-12d3-a456-426614174000'
    const newUrls = [
      `https://test.minio.com/rarcursos/${testUserId}/videos/1234567890-video.mp4`,
      `https://test.minio.com/rarcursos/${testUserId}/documentos/1234567890-doc.pdf`,
      `https://test.minio.com/rarcursos/${testUserId}/imagens/1234567890-image.jpg`
    ]

    newUrls.forEach(url => {
      expect(detectStructureType(url)).toBe('new')
      const parsed = parseMinioUrl(url)
      expect(parsed.structure).toBe('new')
      expect(parsed.userId).toBe(testUserId)
      expect(parsed.tipo).toBeDefined()
      expect(parsed.fileName).toBeDefined()
    })
  })
})