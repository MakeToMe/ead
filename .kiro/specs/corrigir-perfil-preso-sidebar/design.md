# Design Document

## Overview

Este documento descreve o design para corrigir o problema de perfil "preso" na sidebar, implementando um sistema unificado de gerenciamento de estado do usuário com propagação reativa de mudanças.

## Architecture

### Problema Atual

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   auth-client   │    │   AuthContext    │    │ DashboardSidebar│
│   (cache global)│    │   (cache local)  │    │  (estado local) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
   Não sincroniza          Não atualiza           Faz refresh próprio
```

### Solução Proposta

```
┌─────────────────────────────────────────────────────────────┐
│                    UserStateManager                        │
│  - Single source of truth                                  │
│  - Event-driven updates                                    │
│  - Automatic cache invalidation                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   auth-client   │◄───┤   AuthContext    │◄───┤ DashboardSidebar│
│   (subscriber)  │    │   (subscriber)   │    │  (subscriber)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. UserStateManager (Novo)

**Responsabilidades:**
- Gerenciar estado global do usuário
- Notificar subscribers sobre mudanças
- Invalidar caches quando necessário
- Coordenar atualizações entre componentes

**Interface:**
```typescript
interface UserStateManager {
  // Estado atual
  getCurrentUser(): User | null
  
  // Atualizações
  updateUser(user: User): void
  refreshUser(): Promise<User | null>
  
  // Subscribers
  subscribe(callback: (user: User | null) => void): () => void
  
  // Cache management
  invalidateCache(): void
  clearAll(): void
}
```

### 2. AuthContext (Modificado)

**Mudanças:**
- Remover estado local próprio
- Usar UserStateManager como fonte única
- Reagir a eventos do UserStateManager

**Nova implementação:**
```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Subscribe to UserStateManager
    const unsubscribe = userStateManager.subscribe((newUser) => {
      setUser(newUser)
      setIsLoading(false)
    })
    
    // Initial load
    userStateManager.refreshUser()
    
    return unsubscribe
  }, [])
}
```

### 3. DashboardSidebar (Modificado)

**Mudanças:**
- Remover estado local do usuário
- Remover refresh manual
- Usar apenas dados do AuthContext
- Reagir automaticamente a mudanças

**Nova implementação:**
```typescript
export default function DashboardSidebar() {
  const { user } = useAuth() // Sempre atualizado via UserStateManager
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  
  // Apenas gerenciar foto, não dados do usuário
  useEffect(() => {
    if (user?.url_foto) {
      loadPhoto(user.url_foto)
    }
  }, [user?.url_foto])
}
```

### 4. Profile Update Handler (Novo)

**Responsabilidades:**
- Interceptar mudanças de perfil na administração
- Notificar UserStateManager sobre mudanças
- Garantir propagação para todos os componentes

```typescript
export async function updateUserProfile(userId: string, newProfile: string) {
  // Atualizar no banco
  const result = await updateProfileInDatabase(userId, newProfile)
  
  if (result.success) {
    // Notificar UserStateManager para invalidar cache
    userStateManager.invalidateUserCache(userId)
    
    // Se é o usuário atual, forçar refresh
    const currentUser = userStateManager.getCurrentUser()
    if (currentUser?.uid === userId) {
      await userStateManager.refreshUser()
    }
  }
  
  return result
}
```

## Data Models

### UserState

```typescript
interface UserState {
  user: User | null
  isLoading: boolean
  lastUpdated: number
  cacheValid: boolean
}
```

### UserEvent

```typescript
interface UserEvent {
  type: 'USER_UPDATED' | 'USER_LOGGED_OUT' | 'CACHE_INVALIDATED'
  user?: User | null
  timestamp: number
}
```

## Error Handling

### Cenários de Erro

1. **Falha na atualização:** Reverter para estado anterior
2. **Perda de sincronização:** Forçar refresh completo
3. **Múltiplas atualizações simultâneas:** Usar debounce
4. **Falha de rede:** Retry com backoff exponencial

### Estratégias de Recovery

1. **Auto-recovery:** Tentar novamente automaticamente
2. **Fallback:** Usar dados em cache se disponíveis
3. **User notification:** Informar sobre problemas de sincronização
4. **Manual refresh:** Botão para forçar atualização

## Testing Strategy

### Testes Unitários

1. **UserStateManager:** Testar subscribe/unsubscribe
2. **Event propagation:** Verificar notificações
3. **Cache invalidation:** Validar limpeza de cache
4. **Error handling:** Testar cenários de falha

### Testes de Integração

1. **Profile update flow:** Testar fluxo completo
2. **Multi-component sync:** Verificar sincronização
3. **Navigation consistency:** Testar entre páginas
4. **Logout cleanup:** Validar limpeza completa

### Testes de Cenários

1. **Admin altera perfil:** Verificar propagação imediata
2. **Usuário navega:** Manter consistência
3. **Múltiplas abas:** Sincronizar entre abas
4. **Reconexão:** Recuperar estado após falha

## Implementation Plan

### Fase 1: Criar UserStateManager
- Implementar classe de gerenciamento de estado
- Adicionar sistema de eventos
- Implementar cache management

### Fase 2: Refatorar AuthContext
- Remover estado local
- Integrar com UserStateManager
- Manter compatibilidade com componentes existentes

### Fase 3: Atualizar DashboardSidebar
- Remover estado local do usuário
- Usar apenas AuthContext
- Simplificar lógica de atualização

### Fase 4: Implementar Profile Update Handler
- Interceptar mudanças na administração
- Notificar UserStateManager
- Garantir propagação imediata

### Fase 5: Testes e Validação
- Testar cenários de mudança de perfil
- Validar sincronização entre componentes
- Verificar cleanup no logout

## Migration Strategy

### Compatibilidade

- Manter interfaces existentes durante transição
- Implementar gradualmente por componente
- Garantir que não há breaking changes

### Rollback Plan

- Manter código antigo comentado
- Implementar feature flags se necessário
- Ter plano de reversão rápida se houver problemas