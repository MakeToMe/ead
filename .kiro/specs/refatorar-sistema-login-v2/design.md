# Design Document - Sistema de Login V2

## Overview

Esta refatoração implementa uma arquitetura limpa e robusta para autenticação, com separação clara entre servidor e cliente, gerenciamento de estado simplificado, e proteções contra os problemas identificados: auto-login, loops de CORS, erros de hidratação, e verificações excessivas.

## Architecture

### Princípios de Design

1. **Server-First**: Autenticação primária no servidor com cookies HTTP-only
2. **Client-Hydration-Safe**: Estados consistentes entre SSR e CSR
3. **Single Source of Truth**: Um único ponto de controle para estado de auth
4. **Graceful Degradation**: Falhas não causam loops ou travamentos
5. **Minimal Network Calls**: Verificações inteligentes com cache eficiente

### Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  AuthPage (Client)  │  AuthGuard (Client)  │  useAuth Hook  │
├─────────────────────────────────────────────────────────────┤
│                     BUSINESS LAYER                          │
├─────────────────────────────────────────────────────────────┤
│              AuthContext (Hydration-Safe)                   │
├─────────────────────────────────────────────────────────────┤
│                      SERVICE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  AuthService (Client)  │  AuthAPI (Server)  │  AuthUtils    │
├─────────────────────────────────────────────────────────────┤
│                       DATA LAYER                            │
├─────────────────────────────────────────────────────────────┤
│    HTTP Cookies    │    Supabase DB    │    Local Cache     │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. AuthService (Client-Side)

**Responsabilidades:**
- Gerenciar estado de autenticação no cliente
- Fazer chamadas para API de auth
- Cache inteligente com TTL
- Retry com backoff exponencial (sem loops)

```typescript
interface AuthService {
  // Estado
  getCurrentUser(): User | null
  isAuthenticated(): boolean
  isLoading(): boolean
  
  // Ações
  signIn(email: string, password: string): Promise<User>
  signOut(): Promise<void>
  
  // Verificação (com proteções anti-loop)
  checkSession(): Promise<User | null>
  
  // Observadores
  onAuthChange(callback: AuthChangeCallback): UnsubscribeFn
}
```

**Proteções Anti-Loop:**
- Debounce de verificações (min 5s entre calls)
- Detecção de erros CORS (não retry)
- Limite máximo de retries (3x)
- Circuit breaker para falhas consecutivas

### 2. AuthContext (Hydration-Safe)

**Responsabilidades:**
- Prover estado de auth para componentes
- Gerenciar hidratação SSR/CSR
- Sincronizar com AuthService

```typescript
interface AuthContextValue {
  // Estado (sempre consistente SSR/CSR)
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
  
  // Ações
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  clearError: () => void
}
```

**Estratégia de Hidratação:**
1. **SSR**: Estado inicial sempre `{ user: null, isLoading: true }`
2. **CSR**: Após hidratação, verificar sessão uma única vez
3. **Consistency**: Usar `useEffect` com `mounted` flag

### 3. AuthAPI (Server-Side)

**Endpoints:**
- `POST /api/auth/signin` - Login com credenciais
- `GET /api/auth/me` - Verificar sessão atual
- `POST /api/auth/signout` - Logout e limpar cookie

**Melhorias:**
- Headers CORS apropriados
- Rate limiting
- Logs estruturados
- Error handling consistente

### 4. AuthGuard (Client-Side)

**Responsabilidades:**
- Proteger rotas que precisam de autenticação
- Redirecionamento inteligente
- Loading states apropriados

```typescript
interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}
```

## Data Models

### User Model
```typescript
interface User {
  uid: string
  nome: string
  email: string
  perfis: string
  criado_em: string
  atualizado_em: string
}
```

### Auth State
```typescript
interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: AuthError | null
  lastChecked: number
  cacheExpiry: number
}
```

### Auth Error
```typescript
interface AuthError {
  type: 'network' | 'credentials' | 'session' | 'server'
  message: string
  code?: string
  retryable: boolean
}
```

## Error Handling

### Estratégia de Erro por Tipo

1. **Network Errors**
   - Retry com backoff exponencial (1s, 2s, 4s)
   - Máximo 3 tentativas
   - Fallback para cache se disponível

2. **CORS Errors**
   - Não fazer retry (evitar loops)
   - Log específico para debug
   - Limpar estado e parar verificações

3. **Credential Errors**
   - Mostrar erro imediatamente
   - Não fazer retry
   - Limpar formulário

4. **Session Errors**
   - Limpar estado local
   - Redirecionar para login
   - Não fazer retry automático

### Circuit Breaker Pattern

```typescript
interface CircuitBreaker {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  lastFailureTime: number
  timeout: number
}
```

- **CLOSED**: Funcionamento normal
- **OPEN**: Muitas falhas, parar tentativas
- **HALF_OPEN**: Tentar uma vez após timeout

## Testing Strategy

### Unit Tests
- AuthService: Todos os métodos e edge cases
- AuthContext: Hidratação e state management
- AuthGuard: Redirecionamentos e proteções
- Utilities: Validações e helpers

### Integration Tests
- Fluxo completo de login/logout
- Verificação de sessão após reload
- Proteção de rotas
- Error handling end-to-end

### E2E Tests
- Login com credenciais válidas/inválidas
- Navegação entre páginas protegidas
- Logout e redirecionamento
- Comportamento em diferentes browsers

## Implementation Plan

### Fase 1: Fundação Limpa
1. Criar novo AuthService simplificado
2. Implementar AuthContext hydration-safe
3. Criar endpoints de API robustos
4. Testes unitários básicos

### Fase 2: Integração
1. Integrar AuthGuard com novo sistema
2. Migrar página de login
3. Implementar error handling robusto
4. Testes de integração

### Fase 3: Otimização
1. Implementar cache inteligente
2. Adicionar circuit breaker
3. Otimizar performance
4. Testes E2E completos

### Fase 4: Cleanup
1. Remover sistema antigo
2. Documentação final
3. Monitoring e logs
4. Validação em produção

## Migration Strategy

### Abordagem Incremental
1. **Coexistência**: Novo sistema roda em paralelo
2. **Feature Flag**: Alternar entre sistemas
3. **Gradual**: Migrar páginas uma por vez
4. **Rollback**: Possibilidade de voltar se necessário

### Pontos de Atenção
- Manter compatibilidade de cookies durante transição
- Não quebrar sessões ativas de usuários
- Monitorar métricas de erro durante migração
- Ter plano de rollback testado