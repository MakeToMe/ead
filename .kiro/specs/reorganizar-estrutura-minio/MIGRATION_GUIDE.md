# Guia de Migração - Nova Estrutura MinIO

## 📋 Resumo das Mudanças

A estrutura de pastas do MinIO foi reorganizada para facilitar a gestão de usuários e permitir exclusão completa de dados por usuário.

### Estrutura Anterior vs Nova Estrutura

**Estrutura Anterior:**
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

## 🔧 Mudanças Técnicas Implementadas

### 1. Configuração Central (`lib/minio-config.ts`)

**Novas funções adicionadas:**
- `getMinioUserPath()` - Gera caminho com estrutura de usuário
- `getMinioUserFileUrl()` - URL completa com nova estrutura
- `getMinioUserUploadUrl()` - URL de upload com nova estrutura
- `detectStructureType()` - Detecta estrutura antiga vs nova
- `parseMinioUrl()` - Extrai informações da URL

**Mapeamento de tipos:**
- `video` → `videos/`
- `file` → `documentos/` (mudança importante!)
- `imagem` → `imagens/`

### 2. Funções de Upload Atualizadas

**Arquivos modificados:**
- `app/minhas-aulas/actions.ts`
- `app/meus-cursos/actions.ts`

**Mudanças principais:**
- Nome do arquivo não inclui mais o UID (já está na pasta)
- Estrutura: `rarcursos/[uid]/[tipo]/timestamp-arquivo.ext`
- Compatibilidade mantida com estrutura antiga

### 3. Função de Exclusão Atualizada

**Detecção automática:**
- Sistema detecta automaticamente se URL é da estrutura antiga ou nova
- Processa exclusão corretamente para ambos os casos
- Mantém compatibilidade total

## 🚀 Benefícios da Nova Estrutura

### 1. Gestão de Usuários Simplificada
```bash
# Para excluir todos os arquivos de um usuário:
# Basta excluir a pasta: rarcursos/[uid_do_user]/
```

### 2. Organização Melhorada
- Separação clara por usuário
- Estrutura hierárquica lógica
- Facilita backup e manutenção

### 3. Escalabilidade
- Melhor distribuição de arquivos
- Reduz conflitos de nomes
- Performance otimizada

## 📝 Variáveis de Ambiente

### Atualizações Necessárias

**Antes:**
```env
MINIO_BUCKET=rar
NEXT_PUBLIC_MINIO_BUCKET=rar
```

**Depois:**
```env
MINIO_BUCKET=rarcursos
NEXT_PUBLIC_MINIO_BUCKET=rarcursos
```

### Configuração Completa

```env
# MinIO credentials (server-side)
MINIO_ENDPOINT=https://seu-endpoint.com
MINIO_BUCKET=rarcursos
MINIO_ACCESS_KEY=sua-access-key
MINIO_SECRET_KEY=sua-secret-key

# MinIO credentials (client-side)
NEXT_PUBLIC_MINIO_ENDPOINT=https://seu-endpoint.com
NEXT_PUBLIC_MINIO_BUCKET=rarcursos
```

## 🔄 Compatibilidade e Migração

### Compatibilidade Automática

✅ **URLs antigas continuam funcionando**
- Sistema detecta automaticamente o tipo de estrutura
- Processa corretamente ambos os formatos
- Não há quebra de funcionalidade

✅ **Novos uploads usam nova estrutura**
- Todos os novos arquivos seguem o padrão novo
- Organização automática por usuário
- Nomes de arquivo simplificados

### Processo de Migração

**Fase 1: Implementação (✅ Concluída)**
- Nova estrutura implementada
- Compatibilidade com estrutura antiga mantida
- Testes validados

**Fase 2: Transição (Automática)**
- Novos uploads usam nova estrutura
- Arquivos antigos permanecem acessíveis
- Sem interrupção de serviço

**Fase 3: Migração Opcional (Futuro)**
- Ferramenta para migrar arquivos antigos
- Processo gradual e controlado
- Validação de integridade

## 👨‍💼 Guia para Administradores

### Como Excluir Todos os Arquivos de um Usuário

**Estrutura Nova:**
```bash
# Excluir pasta completa do usuário
aws s3 rm s3://rarcursos/[uid_do_user]/ --recursive
```

**Estrutura Antiga (ainda necessário):**
```bash
# Buscar e excluir arquivos por padrão
aws s3 rm s3://rar/videos/ --recursive --exclude "*" --include "[uid_do_user]-*"
aws s3 rm s3://rar/files/ --recursive --exclude "*" --include "[uid_do_user]-*"
aws s3 rm s3://rar/imagens/ --recursive --exclude "*" --include "[uid_do_user]-*"
```

### Monitoramento de Uso

**Por usuário:**
```bash
# Ver uso de espaço por usuário
aws s3 ls s3://rarcursos/[uid_do_user]/ --recursive --human-readable --summarize
```

**Por tipo de arquivo:**
```bash
# Ver arquivos de vídeo de um usuário
aws s3 ls s3://rarcursos/[uid_do_user]/videos/ --human-readable
```

## 🧪 Validação e Testes

### Testes Implementados

**Testes unitários criados:**
- `lib/__tests__/minio-config.test.ts`
- Validação de geração de caminhos
- Teste de detecção de estrutura
- Verificação de compatibilidade

**Validações realizadas:**
- ✅ Build bem-sucedido
- ✅ Funções de upload atualizadas
- ✅ Função de exclusão compatível
- ✅ Variáveis de ambiente atualizadas

### Como Testar

**1. Upload de arquivo:**
```javascript
// Deve gerar estrutura: rarcursos/[uid]/videos/timestamp-arquivo.mp4
await uploadVideoMinio(file, userId)
```

**2. Verificar URL gerada:**
```javascript
// URL deve seguir padrão: https://endpoint/rarcursos/[uid]/videos/arquivo.mp4
console.log(result.url)
```

**3. Testar exclusão:**
```javascript
// Deve funcionar para URLs antigas e novas
await excluirArquivoMinio(url)
```

## 🚨 Pontos de Atenção

### 1. Mudança de Bucket
- **Importante:** Bucket mudou de `rar` para `rarcursos`
- Verificar se o bucket existe no MinIO
- Atualizar permissões se necessário

### 2. Mapeamento de Tipos
- **Atenção:** `file` agora mapeia para `documentos/`
- URLs antigas com `/files/` continuam funcionando
- Novas URLs usam `/documentos/`

### 3. Estrutura de Nomes
- **Mudança:** UID removido do nome do arquivo
- Agora: `timestamp-arquivo.ext`
- Antes: `uid-timestamp-arquivo.ext`

## 📞 Suporte

Em caso de problemas:

1. **Verificar variáveis de ambiente**
2. **Confirmar existência do bucket `rarcursos`**
3. **Validar permissões do MinIO**
4. **Verificar logs de upload/exclusão**

## 🎯 Próximos Passos

1. **Monitorar uploads** - Verificar se nova estrutura está funcionando
2. **Validar exclusões** - Testar remoção de arquivos
3. **Planejar migração** - Definir estratégia para arquivos antigos
4. **Otimizar performance** - Ajustar configurações conforme necessário