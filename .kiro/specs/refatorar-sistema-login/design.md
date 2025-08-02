# Design Document - Refatoração Completa do Sistema de Login

## Overview

Este documento descreve o design para uma refatoração completa do sistema de autenticação, substituindo a arquitetura atual complexa e instável por uma solução simples, confiável e performática.

## Análise do Sistema Atual

### Problemas Identificados

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA ATUAL (PROBLEMÁTICO)                │
├─────────────────────────────────────────────────────────────────┤
│ auth-client.ts ←→ UserStateManager ←→ AuthContext ←→ Components │
│       ↓                ↓                 ↓                     │
│   Cache Local    Health Checks    React Context               │
│       ↓                ↓                 ↓                     │
│ Verificações    Monitoramento    Estado Duplicado             │
│  Redundantes      Excessivo       Inconsistente               │
└─────────────────────────────────────────────────────────────────┘
```

### Causas Raiz dos Problemas

1. **Múltiplas Fontes de Verdade**: auth-client, UserStateManager e AuthContext
2. **Verificações Redundantes**: Cada camada faz suas próprias verificações
3. **Cache Complexo**: Múltiplos níveis de cache que podem ficar desalinhados
4. **Monitoramento Excessivo**: Health checks e consistency checks desnecessários
5. **Estado Duplicado**: Dados do usuário armazenados em múltiplos lugares

## Arquitetura Proposta

### Solução Simplificada

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOVA ARQUITETURA (SIMPLES)                  │
├─────────────────────────────────────────────────────────────────┤
│                    AuthService (Única Fonte)                   │
│                           ↓                                     │
│                    AuthContext (React)                         │
│                           ↓                                     │
│                     Components                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. AuthService (Novo - Substitui tudo)

**Responsabilidades:**
- Única fonte de verdade para autenticação
- Gerenciamento de sessão simplificado
- Cache inteligente com TTL
- Verificação de sessão otimizada

**Interface:**
```typescript
class AuthService {
  // Estado atual
  getCurrentUser(): User | null
  isAuthenticated(): boolean
  isLoading(): boolean
  
  // Autenticação
  signIn(email: string, password: string): Promise<User>
  signUp(name: string, email: string, password: string): Promise<User>
  signOut(): Promise<void>
  
  // Sessão
  checkSession(): Promise<User | null>
  refreshSession(): Promise<User | null>
  
  // Eventos
  onAuthChange(callback: (user: User | null) => void): () => void
  
  // Utilitários
  clearCache(): void
  getDebugInfo(): object
}
```

### 2. AuthContext Simplificado (Modificado)

**Responsabilidades:**
- Interface React para AuthService
- Estado reativo para componentes
- Hooks para autenticação

**Interface:**
```typescript
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<User>
  signUp: (name: string, email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
}
```

### 3. useAuth Hook (Novo)

**Responsabilidades:**
- Hook principal para componentes
- Acesso simplificado ao estado de auth
- Métodos de autenticação

**Interface:**
```typescript
function useAuth(): AuthContextType
```

### 4. AuthGuard Component (Novo)

**Responsabilidades:**
- Proteção de rotas
- Redirecionamento automático
- Loading states

**Interface:**
```typescript
interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}
```

## Data Models

### User Model Simplificado

```typescript
interface User {
  uid: string
  nome: string
  email: string
  perfis: 'admin' | 'instrutor' | 'aluno'
  url_foto?: string
  criado_em: string
  atualizado_em: string
}
```

### Session State

```typescript
interface SessionState {
  user: User | null
  isLoading: boolean
  lastChecked: number
  expiresAt: number
}
```

## Fluxo de Autenticação

### 1. Login Flow

```
1. User submits credentials
2. AuthService.signIn() called
3. API call to /api/auth/signin
4. Session cookie set by server
5. User data cached in AuthService
6. AuthContext updated
7. Components re-render
8. Redirect to dashboard
```

### 2. Session Check Flow

```
1. App loads
2. AuthService checks for session cookie
3. If cookie exists, call /api/auth/me
4. If valid, cache user data
5. If invalid, clear session
6. Update AuthContext
7. Components render accordingly
```

### 3. Logout Flow

```
1. User clicks logout
2. AuthService.signOut() called
3. API call to /api/auth/signout
4. Clear all caches
5. Clear session cookie
6. Update AuthContext (user = null)
7. Redirect to login
```

## Implementação por Fases

### Fase 1: Criar AuthService
- Implementar AuthService como única fonte de verdade
- Migrar lógica de auth-client para AuthService
- Implementar cache simples com TTL

### Fase 2: Simplificar AuthContext
- Refatorar AuthContext para usar apenas AuthService
- Remover lógica complexa de UserStateManager
- Implementar hooks simples

### Fase 3: Criar AuthGuard
- Implementar componente de proteção de rotas
- Substituir lógica de redirecionamento em DashboardLayout
- Adicionar loading states apropriados

### Fase 4: Migrar Componentes
- Atualizar componentes para usar useAuth hook
- Remover dependências de UserStateManager
- Simplificar lógica de autenticação

### Fase 5: Cleanup
- Remover UserStateManager
- Remover DataConsistencyValidator
- Remover debug tools desnecessários
- Limpar imports e dependências

## Error Handling

### Estratégias de Erro

1. **Network Errors**: Retry automático com backoff
2. **Session Expired**: Redirect para login com mensagem
3. **Invalid Credentials**: Mostrar erro no formulário
4. **Server Errors**: Fallback para cache se disponível

### Error States

```typescript
interface AuthError {
  type: 'network' | 'credentials' | 'session' | 'server'
  message: string
  code?: string
  retryable: boolean
}
```

## Performance Optimizations

### 1. Cache Strategy
- Cache user data por 5 minutos
- Verificação de sessão apenas quando necessário
- Lazy loading de dados não críticos

### 2. Request Optimization
- Debounce de verificações de sessão
- Cancelamento de requests desnecessários
- Reuso de requests em andamento

### 3. Component Optimization
- Memoização de componentes auth
- Lazy loading de rotas protegidas
- Otimização de re-renders

## Security Considerations

### 1. Session Management
- HTTPOnly cookies para tokens
- Secure cookies em produção
- SameSite protection

### 2. Token Handling
- JWT com expiração apropriada
- Refresh token rotation
- Invalidação no logout

### 3. Client Security
- Não armazenar dados sensíveis no localStorage
- Validação de dados no cliente
- Sanitização de inputs

## Migration Strategy

### Backward Compatibility
- Manter APIs existentes durante migração
- Gradual replacement de componentes
- Feature flags para rollback

### Data Migration
- Preservar sessões existentes
- Migrar dados de cache gradualmente
- Validar integridade durante migração

## Testing Strategy

### Unit Tests
- AuthService methods
- AuthContext behavior
- Hook functionality

### Integration Tests
- Login/logout flows
- Session persistence
- Error handling

### E2E Tests
- Complete authentication flows
- Cross-browser compatibility
- Performance benchmarks

## Success Metrics

1. **Reliability**: 99.9% de login success rate
2. **Performance**: < 1s para verificação de sessão
3. **User Experience**: Zero logouts inesperados
4. **Developer Experience**: 50% menos código de auth

## Rollback Plan

1. **Immediate**: Feature flag para voltar ao sistema antigo
2. **Gradual**: Rollback por componente
3. **Data**: Restore de sessões do backup
4. **Communication**: Notificar usuários sobre problemas temporários