# Design Document

## Overview

Este documento descreve o design para reorganizar a estrutura de pastas do MinIO, implementando uma organização baseada no UID do usuário. A solução manterá compatibilidade com arquivos existentes enquanto implementa a nova estrutura para novos uploads.

## Architecture

### Estrutura Atual vs Nova Estrutura

**Estrutura Atual:**
```
rar/
├── videos/
│   └── userId-timestamp-arquivo.mp4
├── files/
│   └── userId-timestamp-arquivo.pdf
└── imagens/
    └── userId-timestamp-arquivo.jpg
```

**Nova Estrutura:**
```
rarcursos/
└── [uid_do_user]/
    ├── videos/
    │   └── timestamp-arquivo.mp4
    ├── documentos/
    │   └── timestamp-arquivo.pdf
    └── imagens/
        └── timestamp-arquivo.jpg
```

### Benefícios da Nova Estrutura

1. **Gestão de Usuários:** Exclusão completa de dados por usuário
2. **Organização:** Separação clara por usuário
3. **Escalabilidade:** Melhor distribuição de arquivos
4. **Manutenção:** Facilita backup e limpeza por usuário

## Components and Interfaces

### 1. Configuração Centralizada (`lib/minio-config.ts`)

**Funções a serem atualizadas:**
- `getMinioFileUrl(filePath: string, userId: string): string`
- `getMinioUploadUrl(filePath: string, userId: string): string`
- Novas funções para gerar estrutura de pastas

**Novas funções:**
```typescript
// Gerar caminho completo com estrutura de usuário
function getMinioUserPath(userId: string, tipo: 'videos' | 'documentos' | 'imagens', fileName: string): string

// Gerar URL completa com nova estrutura
function getMinioUserFileUrl(userId: string, tipo: string, fileName: string): string

// Gerar URL de upload com nova estrutura
function getMinioUserUploadUrl(userId: string, tipo: string, fileName: string): string
```

### 2. Funções de Upload (`app/minhas-aulas/actions.ts`)

**Função principal a ser atualizada:**
```typescript
export async function uploadArquivoMinio(
  file: File,
  userId: string,
  tipo: "video" | "file" | "imagem",
): Promise<{ success: boolean; url?: string; message?: string }>
```

**Mudanças:**
- Usar nova estrutura de pastas baseada em UID
- Remover UID do nome do arquivo (já está na pasta)
- Atualizar mapeamento de tipos: `file` → `documentos`

### 3. Funções de Exclusão

**Atualizar função:**
```typescript
export async function excluirArquivoMinio(url: string): Promise<{ success: boolean; message?: string }>
```

**Mudanças:**
- Detectar se URL usa estrutura antiga ou nova
- Extrair caminho correto baseado na estrutura

## Data Models

### Mapeamento de Tipos

```typescript
interface TipoMapeamento {
  video: 'videos'
  file: 'documentos'  // Mudança: file → documentos
  imagem: 'imagens'
}
```

### Estrutura de Configuração

```typescript
interface MinioPathConfig {
  bucket: string
  userBasePath: (userId: string) => string
  getTypePath: (tipo: string) => string
  generateFileName: (originalName: string) => string
}
```

## Error Handling

### Cenários de Erro

1. **UID não fornecido:** Retornar erro claro
2. **Tipo inválido:** Mapear para tipo padrão ou retornar erro
3. **Estrutura antiga:** Detectar e processar corretamente
4. **Falha na criação de pastas:** Log detalhado para debug

### Estratégias de Fallback

1. **Compatibilidade:** Manter suporte a URLs antigas
2. **Migração gradual:** Novos uploads usam nova estrutura
3. **Detecção automática:** Identificar estrutura pela URL

## Testing Strategy

### Testes Unitários

1. **Geração de caminhos:** Verificar estrutura correta
2. **Mapeamento de tipos:** Validar conversões
3. **Compatibilidade:** Testar URLs antigas e novas
4. **Validação de UID:** Verificar tratamento de UIDs inválidos

### Testes de Integração

1. **Upload completo:** Testar fluxo end-to-end
2. **Exclusão:** Verificar remoção correta
3. **Acesso:** Validar URLs geradas
4. **Migração:** Testar coexistência de estruturas

### Testes de Cenários

1. **Usuário novo:** Primeira pasta criada
2. **Usuário existente:** Adição a pasta existente
3. **Exclusão de usuário:** Remoção completa da pasta
4. **Tipos diferentes:** Vídeos, documentos, imagens

## Implementation Plan

### Fase 1: Atualizar Configuração Central
- Modificar `lib/minio-config.ts`
- Adicionar funções para nova estrutura
- Manter compatibilidade com estrutura antiga

### Fase 2: Atualizar Funções de Upload
- Modificar `uploadArquivoMinio`
- Atualizar mapeamento de tipos
- Implementar nova geração de caminhos

### Fase 3: Atualizar Funções de Exclusão
- Modificar `excluirArquivoMinio`
- Adicionar detecção de estrutura
- Implementar lógica de compatibilidade

### Fase 4: Atualizar Outras Funções
- Revisar todas as chamadas para funções MinIO
- Atualizar onde necessário
- Verificar consistência

### Fase 5: Testes e Validação
- Executar testes unitários
- Validar uploads em ambiente de desenvolvimento
- Verificar compatibilidade com arquivos existentes

## Migration Strategy

### Abordagem Gradual

1. **Novos uploads:** Usar nova estrutura imediatamente
2. **Arquivos existentes:** Manter URLs antigas funcionando
3. **Migração opcional:** Ferramenta para migrar arquivos antigos (futuro)

### Detecção de Estrutura

```typescript
function detectStructureType(url: string): 'old' | 'new' {
  // Detectar baseado no padrão da URL
  // Antiga: /rar/videos/userId-timestamp-file.ext
  // Nova: /rarcursos/userId/videos/timestamp-file.ext
}
```

### Compatibilidade

- URLs antigas continuam funcionando
- Novas URLs seguem nova estrutura
- Sistema detecta automaticamente o tipo