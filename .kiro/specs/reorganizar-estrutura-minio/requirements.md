# Requirements Document

## Introduction

Este documento define os requisitos para reorganizar a estrutura de pastas do MinIO, implementando uma organização baseada no UID do usuário. A nova estrutura facilitará a gestão de arquivos por usuário, permitindo exclusão completa de dados quando um usuário for removido do sistema.

## Requirements

### Requirement 1

**User Story:** Como administrador do sistema, eu quero que os arquivos sejam organizados por UID do usuário no MinIO, para que eu possa facilmente gerenciar e excluir todos os arquivos de um usuário específico.

#### Acceptance Criteria

1. WHEN um arquivo é enviado THEN o sistema SHALL criar a estrutura de pastas `rarcursos/[uid_do_user]/[tipo]/[arquivo]`
2. WHEN um vídeo é enviado THEN o sistema SHALL armazenar em `rarcursos/[uid_do_user]/videos/[arquivo]`
3. WHEN um documento PDF é enviado THEN o sistema SHALL armazenar em `rarcursos/[uid_do_user]/documentos/[arquivo]`
4. WHEN uma imagem é enviada THEN o sistema SHALL armazenar em `rarcursos/[uid_do_user]/imagens/[arquivo]`

### Requirement 2

**User Story:** Como desenvolvedor, eu quero que a estrutura de pastas seja configurável e centralizada, para que mudanças futuras sejam fáceis de implementar.

#### Acceptance Criteria

1. WHEN a estrutura de pastas é definida THEN o sistema SHALL usar uma configuração centralizada
2. WHEN o bucket é alterado THEN apenas as variáveis de ambiente SHALL precisar ser atualizadas
3. WHEN a estrutura de pastas é alterada THEN apenas a configuração centralizada SHALL precisar ser modificada

### Requirement 3

**User Story:** Como administrador, eu quero manter compatibilidade com arquivos existentes, para que o sistema continue funcionando durante a transição.

#### Acceptance Criteria

1. WHEN arquivos antigos existem THEN o sistema SHALL continuar acessando URLs antigas corretamente
2. WHEN novos arquivos são enviados THEN o sistema SHALL usar a nova estrutura
3. WHEN URLs são geradas THEN o sistema SHALL usar a estrutura correta baseada no contexto

### Requirement 4

**User Story:** Como usuário do sistema, eu quero que o upload e acesso aos arquivos continue funcionando normalmente, para que não haja interrupção no serviço.

#### Acceptance Criteria

1. WHEN um arquivo é enviado THEN o upload SHALL funcionar com a nova estrutura
2. WHEN um arquivo é acessado THEN a URL SHALL ser gerada corretamente
3. WHEN um arquivo é excluído THEN o sistema SHALL localizar e remover o arquivo na estrutura correta
4. WHEN um usuário é excluído THEN todos os seus arquivos SHALL poder ser removidos excluindo sua pasta UID

### Requirement 5

**User Story:** Como desenvolvedor, eu quero que as funções de upload sejam atualizadas para usar a nova estrutura, para que todos os pontos de entrada usem o padrão correto.

#### Acceptance Criteria

1. WHEN `uploadVideoMinio` é chamada THEN o arquivo SHALL ser salvo em `rarcursos/[uid]/videos/`
2. WHEN `uploadPdfMinio` é chamada THEN o arquivo SHALL ser salvo em `rarcursos/[uid]/documentos/`
3. WHEN `uploadImagemMinio` é chamada THEN o arquivo SHALL ser salvo em `rarcursos/[uid]/imagens/`
4. WHEN qualquer função de upload é chamada THEN o UID do usuário SHALL ser usado na estrutura de pastas