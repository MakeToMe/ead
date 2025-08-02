# Implementation Plan

- [x] 1. Atualizar configuração central do MinIO




  - Modificar `lib/minio-config.ts` para suportar nova estrutura de pastas baseada em UID
  - Adicionar funções para gerar caminhos com estrutura de usuário
  - Implementar mapeamento de tipos (file → documentos)
  - Manter compatibilidade com estrutura antiga
  - _Requirements: 1.1, 2.1, 2.3, 3.1_


- [x] 2. Implementar funções de geração de caminhos


  - Criar função `getMinioUserPath()` para gerar caminho completo com UID
  - Criar função `getMinioUserFileUrl()` para URLs com nova estrutura
  - Criar função `getMinioUserUploadUrl()` para uploads com nova estrutura
  - Implementar detecção automática de estrutura antiga vs nova


  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2_

- [x] 3. Atualizar função principal de upload


  - Modificar `uploadArquivoMinio()` em `app/minhas-aulas/actions.ts`
  - Implementar nova estrutura de pastas: `rarcursos/[uid]/[tipo]/[arquivo]`
  - Atualizar mapeamento de tipos: video→videos, file→documentos, imagem→imagens
  - Remover UID do nome do arquivo (já está na estrutura da pasta)
  - Usar funções de configuração atualizadas
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4_

- [x] 4. Atualizar função de exclusão de arquivos


  - Modificar `excluirArquivoMinio()` em `app/minhas-aulas/actions.ts`
  - Implementar detecção de estrutura (antiga vs nova) baseada na URL
  - Atualizar extração de caminho para ambas as estruturas
  - Manter compatibilidade com URLs antigas
  - _Requirements: 3.1, 3.2, 4.3_

- [x] 5. Atualizar funções wrapper de upload


  - Verificar e atualizar `uploadVideoMinio()` se necessário
  - Verificar e atualizar `uploadPdfMinio()` se necessário  
  - Verificar e atualizar `uploadImagemMinio()` se necessário
  - Garantir que todas usam a função principal atualizada
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Atualizar funções de upload em outros módulos


  - Verificar e atualizar funções em `app/meus-cursos/actions.ts`
  - Garantir consistência na estrutura de pastas em todos os módulos
  - Atualizar importações se necessário
  - _Requirements: 2.1, 4.1, 4.2_

- [x] 7. Implementar testes para nova estrutura


  - Criar testes unitários para funções de geração de caminhos
  - Testar mapeamento de tipos (file → documentos)
  - Testar compatibilidade com estrutura antiga
  - Testar geração de URLs para ambas as estruturas
  - _Requirements: 3.1, 3.2, 4.1, 4.2_

- [x] 8. Validar integração completa


  - Testar upload de vídeo com nova estrutura
  - Testar upload de PDF com nova estrutura (documentos)
  - Testar upload de imagem com nova estrutura
  - Verificar se URLs antigas ainda funcionam
  - Testar exclusão de arquivos em ambas as estruturas
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4_

- [x] 9. Atualizar variáveis de ambiente


  - Documentar mudança do bucket de `rar` para `rarcursos`
  - Atualizar arquivos `.env` e `.env.local` com novo bucket
  - Verificar se todas as configurações estão corretas
  - _Requirements: 2.2_

- [x] 10. Documentar mudanças e criar guia de migração


  - Documentar nova estrutura de pastas
  - Criar guia para administradores sobre exclusão de usuários
  - Documentar compatibilidade com arquivos existentes
  - Criar exemplos de uso das novas funções
  - _Requirements: 2.1, 4.4_