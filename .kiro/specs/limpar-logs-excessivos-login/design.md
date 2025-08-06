# Design Document

## Overview

O design foca em implementar um sistema de logging inteligente que diferencia entre ambientes de desenvolvimento e produção, fornecendo controle granular sobre os níveis de log e componentes. A solução manterá a funcionalidade de debug existente mas a tornará mais discreta e controlável.

## Architecture

### Log Level Management
- **SILENT**: Nenhum log (produção padrão)
- **ERROR**: Apenas erros críticos
- **WARN**: Avisos importantes
- **INFO**: Informações essenciais
- **DEBUG**: Logs detalhados de desenvolvimento
- **VERBOSE**: Todos os logs incluindo trace

### Environment Detection
- Detecção automática do ambiente (development/production)
- Configuração padrão baseada no ambiente
- Override manual via localStorage ou variáveis de ambiente

### Component-Based Logging
- Cada componente terá seu próprio logger
- Controle individual por componente
- Herança de configurações globais

## Components and Interfaces

### LogManager
```typescript
interface LogManager {
  setGlobalLevel(level: LogLevel): void
  setComponentLevel(component: string, level: LogLevel): void
  getEffectiveLevel(component: string): LogLevel
  isEnabled(component: string, level: LogLevel): boolean
}
```

### Enhanced Logger Updates
```typescript
interface EnhancedLoggerConfig {
  globalLevel: LogLevel
  componentLevels: Record<string, LogLevel>
  enabledInProduction: boolean
  persistConfig: boolean
}
```

### Console Commands Updates
```typescript
interface LoggingCommands {
  setLogLevel(level: LogLevel): void
  setComponentLevel(component: string, level: LogLevel): void
  showLogConfig(): void
  enableQuietMode(): void
  enableDebugMode(): void
}
```

## Data Models

### Log Configuration
```typescript
interface LogConfig {
  environment: 'development' | 'production'
  globalLevel: LogLevel
  componentLevels: Record<string, LogLevel>
  quietMode: boolean
  debugMode: boolean
  persistSettings: boolean
}
```

### Component Registry
```typescript
interface ComponentRegistry {
  [componentName: string]: {
    defaultLevel: LogLevel
    currentLevel: LogLevel
    description: string
  }
}
```

## Error Handling

### Graceful Degradation
- Se o sistema de logging falhar, não deve afetar a funcionalidade principal
- Fallback para console.log/error nativo em caso de problemas
- Validação de configurações com valores padrão seguros

### Error Reporting
- Erros do sistema de logging devem ser reportados de forma mínima
- Não criar loops de logging de erros
- Manter funcionalidade mesmo com configurações inválidas

## Testing Strategy

### Unit Tests
- Testes para cada nível de log
- Testes de configuração por ambiente
- Testes de configuração por componente
- Testes de persistência de configurações

### Integration Tests
- Testes de integração com componentes existentes
- Verificação de comportamento em diferentes ambientes
- Testes de performance com logging desabilitado

### Manual Testing
- Verificação visual da redução de logs
- Testes de usabilidade dos comandos de debug
- Validação em ambiente de produção simulado

## Implementation Details

### Phase 1: Core Infrastructure
- Implementar LogManager central
- Atualizar EnhancedLogger com controles de nível
- Configurar detecção de ambiente

### Phase 2: Component Integration
- Atualizar todos os componentes para usar o novo sistema
- Implementar configurações padrão por componente
- Adicionar controles de logging específicos

### Phase 3: User Interface
- Atualizar comandos de console
- Implementar controles no debug dashboard
- Adicionar persistência de configurações

### Phase 4: Production Optimization
- Configurar níveis de produção
- Implementar tree-shaking de logs em build
- Otimizar performance com logging desabilitado

## Migration Strategy

### Backward Compatibility
- Manter APIs existentes funcionando
- Migração gradual de componentes
- Configurações padrão que não quebram funcionalidade existente

### Rollout Plan
1. Implementar infraestrutura base
2. Migrar componentes críticos (auth, user-state)
3. Migrar ferramentas de debug
4. Configurar produção
5. Limpeza final de logs desnecessários