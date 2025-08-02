# Design Document

## Overview

Este documento descreve o design para corrigir a grave inconsistência de dados do usuário identificada na aplicação, onde a sidebar mostra dados diferentes do conteúdo principal. A solução foca em garantir uma única fonte de verdade e sincronização perfeita entre todos os componentes.

## Architecture

### Problema Atual Identificado

```
┌─────────────────────────────────────────────────────────────────┐
│                    INCONSISTÊNCIA CRÍTICA                      │
├─────────────────────────────────────────────────────────────────┤
│ Sidebar:           │ Conteúdo Principal:                        │
│ - Flavio Guardia   │ - Flávio Marcelo Guardia                  │
│ - Admin            │ - Aluno                                    │
│ - Inicial "F"      │ - Foto real                               │
└─────────────────────────────────────────────────────────────────┘
```

### Possíveis Causas Identificadas

1. **UserStateManager não inicializado corretamente**
2. **AuthContext não está usando UserStateManager**
3. **DashboardSidebar ainda usa dados locais/cached**
4. **Múltiplas fontes de dados conflitantes**
5. **Falha na propagação de eventos**

### Solução Proposta

```
┌─────────────────────────────────────────────────────────────────┐
│                 DIAGNÓSTICO E CORREÇÃO                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Auditoria completa do fluxo de dados                        │
│ 2. Validação do UserStateManager                               │
│ 3. Verificação das subscriptions                               │
│ 4. Implementação de detecção de inconsistência                 │
│ 5. Auto-correção de dados conflitantes                         │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Data Consistency Validator (Novo)

**Responsabilidades:**
- Detectar inconsistências entre componentes
- Comparar dados da sidebar vs conteúdo principal
- Alertar sobre discrepâncias
- Forçar sincronização quando necessário

**Interface:**
```typescript
interface DataConsistencyValidator {
  // Verificar consistência entre componentes
  validateConsistency(): Promise<ConsistencyReport>
  
  // Detectar discrepâncias
  detectDiscrepancies(sidebarData: User, mainData: User): Discrepancy[]
  
  // Forçar sincronização
  forceSynchronization(): Promise<void>
  
  // Auto-correção
  autoCorrect(): Promise<boolean>
}

interface ConsistencyReport {
  isConsistent: boolean
  discrepancies: Discrepancy[]
  timestamp: number
  recommendation: 'sync' | 'reload' | 'manual_check'
}

interface Discrepancy {
  field: string
  sidebarValue: any
  mainValue: any
  severity: 'critical' | 'warning' | 'info'
}
```

### 2. Enhanced UserStateManager (Modificado)

**Novas funcionalidades:**
- Validação de dados na inicialização
- Detecção automática de inconsistências
- Logs detalhados para debug
- Health check periódico

**Novos métodos:**
```typescript
class UserStateManager {
  // Validar dados atuais
  validateCurrentData(): Promise<ValidationResult>
  
  // Comparar com dados do servidor
  compareWithServer(): Promise<ComparisonResult>
  
  // Forçar reload completo
  forceCompleteReload(): Promise<User | null>
  
  // Detectar e corrigir inconsistências
  detectAndFixInconsistencies(): Promise<FixResult>
  
  // Health check periódico
  startHealthCheck(intervalMs: number): void
  stopHealthCheck(): void
}
```

### 3. Debug Dashboard (Novo)

**Responsabilidades:**
- Mostrar estado atual de todos os componentes
- Comparar dados em tempo real
- Permitir ações de correção manual
- Exibir logs de sincronização

**Interface:**
```typescript
interface DebugDashboard {
  // Estado atual de todos os componentes
  getCurrentState(): ComponentsState
  
  // Comparação em tempo real
  startRealTimeComparison(): void
  
  // Ações de correção
  triggerManualSync(): Promise<void>
  clearAllCaches(): Promise<void>
  reloadFromServer(): Promise<void>
}

interface ComponentsState {
  userStateManager: UserState
  authContext: User | null
  dashboardSidebar: SidebarState
  mainContent: User | null
  lastSync: number
  inconsistencies: Discrepancy[]
}
```

## Data Models

### Enhanced User State

```typescript
interface EnhancedUserState {
  user: User | null
  isLoading: boolean
  lastUpdated: number
  cacheValid: boolean
  source: 'server' | 'cache' | 'unknown'
  validationStatus: 'valid' | 'invalid' | 'pending'
  inconsistencyCount: number
  lastHealthCheck: number
}
```

### Consistency Tracking

```typescript
interface ConsistencyTracker {
  componentStates: Map<string, ComponentState>
  lastConsistencyCheck: number
  inconsistencyHistory: InconsistencyRecord[]
  autoFixEnabled: boolean
}

interface ComponentState {
  componentName: string
  userData: User | null
  lastUpdate: number
  source: string
  isHealthy: boolean
}
```

## Error Handling

### Inconsistency Detection

1. **Automatic Detection:**
   - Comparar dados entre componentes a cada 30 segundos
   - Detectar discrepâncias em campos críticos (nome, perfil, foto)
   - Alertar quando inconsistências são encontradas

2. **Manual Validation:**
   - Comando de console para verificar consistência
   - Interface de debug para comparação visual
   - Relatórios detalhados de discrepâncias

### Auto-Correction Strategies

1. **Priority System:**
   - Dados do servidor têm prioridade máxima
   - Dados mais recentes têm prioridade sobre antigos
   - Dados validados têm prioridade sobre não validados

2. **Correction Actions:**
   - Invalidar cache inconsistente
   - Forçar reload do servidor
   - Notificar todos os subscribers
   - Registrar correção nos logs

## Testing Strategy

### Consistency Tests

1. **Unit Tests:**
   - Validação de dados do UserStateManager
   - Detecção de inconsistências
   - Auto-correção de discrepâncias

2. **Integration Tests:**
   - Sincronização entre componentes
   - Propagação de mudanças
   - Recovery após falhas

3. **End-to-End Tests:**
   - Cenário completo de inconsistência
   - Correção automática
   - Validação visual

### Test Scenarios

1. **Inconsistency Simulation:**
   - Forçar dados diferentes na sidebar vs conteúdo
   - Verificar detecção automática
   - Validar correção

2. **Network Failure:**
   - Simular falha de rede durante sync
   - Verificar recovery
   - Validar fallback para cache

3. **Concurrent Updates:**
   - Múltiplas atualizações simultâneas
   - Verificar consistência final
   - Validar ordem de precedência

## Implementation Plan

### Fase 1: Diagnóstico Completo
- Auditoria do fluxo atual de dados
- Identificação de todas as fontes de dados
- Mapeamento de inconsistências

### Fase 2: Data Consistency Validator
- Implementar detector de inconsistências
- Criar sistema de comparação
- Adicionar alertas automáticos

### Fase 3: Enhanced UserStateManager
- Adicionar validação de dados
- Implementar health check
- Melhorar logs de debug

### Fase 4: Debug Tools
- Criar dashboard de debug
- Implementar comandos de console
- Adicionar relatórios de consistência

### Fase 5: Auto-Correction
- Implementar correção automática
- Adicionar sistema de prioridades
- Criar recovery automático

### Fase 6: Monitoring
- Implementar monitoramento contínuo
- Adicionar métricas de consistência
- Criar alertas para inconsistências

## Debug Tools

### Console Commands

```javascript
// Verificar consistência atual
window.debugUser.checkConsistency()

// Comparar dados entre componentes
window.debugUser.compareComponents()

// Forçar sincronização
window.debugUser.forceSync()

// Ver histórico de inconsistências
window.debugUser.getInconsistencyHistory()

// Auto-correção
window.debugUser.autoFix()
```

### Visual Debug Interface

- Dashboard mostrando estado de todos os componentes
- Comparação lado a lado dos dados
- Botões para ações de correção
- Timeline de mudanças e sincronizações

## Success Metrics

1. **Consistency Rate:** > 99.9% de consistência entre componentes
2. **Detection Time:** < 5 segundos para detectar inconsistências
3. **Auto-Fix Rate:** > 95% de correções automáticas bem-sucedidas
4. **User Impact:** 0 casos de usuários vendo dados inconsistentes

## Rollback Plan

1. **Immediate Rollback:** Desabilitar auto-correção se causar problemas
2. **Gradual Rollback:** Voltar para sistema anterior por componente
3. **Data Recovery:** Restaurar dados consistentes do backup
4. **User Notification:** Informar usuários sobre problemas temporários