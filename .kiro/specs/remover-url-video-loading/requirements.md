# Requirements Document

## Introduction

Esta funcionalidade visa melhorar a experiência do usuário na página de assistir curso, removendo a exibição da URL do vídeo que aparece durante o carregamento. Atualmente, quando um vídeo está carregando, a URL completa do arquivo de vídeo é exibida na tela, expondo informações técnicas desnecessárias e potencialmente sensíveis para o usuário final.

## Requirements

### Requirement 1

**User Story:** Como um estudante assistindo a um curso, eu quero que a tela de carregamento do vídeo não mostre a URL do arquivo, para que eu tenha uma experiência mais limpa e profissional.

#### Acceptance Criteria

1. WHEN um vídeo está carregando na página /assistir-curso/[id] THEN o sistema SHALL ocultar completamente a URL do vídeo
2. WHEN um vídeo está carregando THEN o sistema SHALL exibir apenas a mensagem "Carregando vídeo..." sem informações técnicas adicionais
3. WHEN o vídeo terminar de carregar THEN o sistema SHALL exibir o player de vídeo normalmente sem mostrar a URL

### Requirement 2

**User Story:** Como um administrador do sistema, eu quero que as URLs dos vídeos não sejam expostas visualmente, para manter a segurança e privacidade dos recursos de mídia.

#### Acceptance Criteria

1. WHEN qualquer usuário acessa a página de assistir curso THEN o sistema SHALL garantir que nenhuma URL de vídeo seja visível na interface
2. IF existe algum componente de debug ou desenvolvimento mostrando URLs THEN o sistema SHALL remover ou ocultar essas informações em produção
3. WHEN o vídeo falha ao carregar THEN o sistema SHALL exibir uma mensagem de erro genérica sem expor a URL

### Requirement 3

**User Story:** Como um usuário final, eu quero uma interface de carregamento consistente e profissional, para que eu tenha confiança na qualidade da plataforma.

#### Acceptance Criteria

1. WHEN um vídeo está carregando THEN o sistema SHALL exibir um indicador de carregamento visual (spinner ou similar)
2. WHEN um vídeo está carregando THEN o sistema SHALL manter o layout consistente com o resto da aplicação
3. WHEN múltiplos vídeos são carregados em sequência THEN o sistema SHALL aplicar o mesmo comportamento de ocultação de URL para todos