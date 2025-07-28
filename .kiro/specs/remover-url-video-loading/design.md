# Design Document

## Overview

Esta funcionalidade visa remover a exibição da URL do vídeo durante o carregamento no componente VideoPlayer. Atualmente, quando um vídeo está carregando, a URL completa é exibida na tela através da variável `videoInfo`, expondo informações técnicas desnecessárias para o usuário final.

## Architecture

A solução envolve modificações no componente `VideoPlayer` localizado em `app/assistir-curso/[cursoId]/components/video-player.tsx`. O componente já possui um sistema de estados para controlar o carregamento e exibição de informações, precisamos apenas ajustar o que é mostrado durante o estado de loading.

## Components and Interfaces

### VideoPlayer Component

**Localização:** `app/assistir-curso/[cursoId]/components/video-player.tsx`

**Estados Relevantes:**
- `isLoading: boolean` - Controla se o vídeo está carregando
- `videoInfo: string` - Armazena informações sobre o vídeo (atualmente inclui URL)
- `error: string | null` - Controla mensagens de erro

**Interfaces Existentes:**
```typescript
interface VideoPlayerProps {
  src: string
  title: string
  onProgress?: (currentTime: number, duration: number) => void
  onEnded?: () => void
}
```

## Data Models

Não há necessidade de modificar modelos de dados existentes. As mudanças são apenas na apresentação visual.

## Error Handling

### Estados de Erro Existentes
- Manter o tratamento de erro atual
- Remover a exibição da URL nos estados de erro também
- Manter mensagens de erro genéricas e úteis para o usuário

### Novos Tratamentos
- Garantir que em caso de erro, apenas informações relevantes sejam exibidas
- Manter logs de debug no console para desenvolvedores, mas não na interface

## Testing Strategy

### Testes Manuais
1. **Teste de Carregamento Normal:**
   - Acessar uma aula com vídeo
   - Verificar que durante o carregamento não aparece a URL
   - Confirmar que apenas "Carregando vídeo..." é exibido

2. **Teste de Erro de Carregamento:**
   - Simular erro de rede ou URL inválida
   - Verificar que a mensagem de erro não expõe a URL
   - Confirmar que o botão "Tentar Novamente" funciona

3. **Teste de Diferentes Tipos de Vídeo:**
   - Testar com diferentes formatos e URLs
   - Verificar comportamento consistente

### Testes de Regressão
- Verificar que todas as funcionalidades do player continuam funcionando
- Confirmar que os controles de vídeo não foram afetados
- Testar que o progresso e callbacks continuam funcionando

## Implementation Details

### Modificações Necessárias

1. **Remoção da URL do videoInfo durante loading:**
   - Modificar o `handleLoadStart` para não incluir URL
   - Ajustar `handleLoadedMetadata` para mostrar apenas informações relevantes

2. **Ajuste da tela de carregamento:**
   - Remover a linha que exibe `videoInfo` durante o loading
   - Manter apenas a mensagem "Carregando vídeo..."

3. **Ajuste das telas de erro:**
   - Remover exibição da URL nas mensagens de erro
   - Manter apenas informações úteis para o usuário

### Estados de Exibição

**Durante Carregamento:**
```
- Spinner de loading
- Texto: "Carregando vídeo..."
- Sem informações técnicas
```

**Após Carregamento Bem-sucedido:**
```
- Player de vídeo normal
- Controles funcionais
- Sem alterações no comportamento
```

**Em Caso de Erro:**
```
- Ícone de erro
- Mensagem de erro genérica
- Botão "Tentar Novamente"
- Sem exposição da URL
```

### Logs de Debug

Manter logs no console para desenvolvedores:
- `console.log` para URL e detalhes técnicos
- Informações de debug apenas no console, não na UI
- Facilitar troubleshooting sem expor informações ao usuário

## Security Considerations

- **Ocultação de URLs:** Previne exposição de URLs internas ou tokens de acesso
- **Informações Sensíveis:** Remove qualquer informação que possa revelar estrutura interna
- **Experiência Profissional:** Melhora a percepção de segurança da plataforma

## Performance Impact

- **Impacto Mínimo:** Apenas remoção de strings da interface
- **Sem Overhead:** Não adiciona processamento extra
- **Melhoria Visual:** Interface mais limpa e profissional