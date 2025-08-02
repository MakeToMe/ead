# Design Document

## Overview

Esta funcionalidade visa implementar otimizações significativas de performance no componente VideoPlayer, focando em carregamento mais rápido, seek responsivo, controles fluidos e adaptação inteligente às condições de rede. As otimizações incluem preload inteligente, buffering otimizado, debouncing de eventos, lazy loading e gerenciamento eficiente de recursos.

## Architecture

### Componente Principal
- **VideoPlayer** (`app/assistir-curso/[cursoId]/components/video-player.tsx`)
- Implementação de hooks customizados para gerenciamento de performance
- Sistema de cache e preload inteligente
- Debouncing para eventos de seek e controles

### Novos Hooks Customizados
- **useVideoPerformance**: Gerenciamento de buffering e preload
- **useVideoSeek**: Otimização de navegação no vídeo
- **useVideoControls**: Debouncing de controles e estados

## Components and Interfaces

### VideoPlayer Component (Otimizado)

**Novas Props:**
```typescript
interface VideoPlayerProps {
  src: string
  title: string
  onProgress?: (currentTime: number, duration: number) => void
  onEnded?: () => void
  preloadStrategy?: 'none' | 'metadata' | 'auto' // Nova prop
  bufferSize?: number // Nova prop para controle de buffer
  seekDebounceMs?: number // Nova prop para debounce do seek
}
```

**Novos Estados:**
```typescript
const [bufferedRanges, setBufferedRanges] = useState<TimeRanges | null>(null)
const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')
const [isBuffering, setIsBuffering] = useState(false)
const [seekPosition, setSeekPosition] = useState<number | null>(null)
```

### Hook useVideoPerformance

```typescript
interface UseVideoPerformanceProps {
  videoRef: RefObject<HTMLVideoElement>
  src: string
  preloadStrategy: 'none' | 'metadata' | 'auto'
  bufferSize: number
}

interface UseVideoPerformanceReturn {
  isBuffering: boolean
  bufferedRanges: TimeRanges | null
  networkSpeed: 'slow' | 'normal' | 'fast'
  preloadNext: () => void
  optimizeBuffer: () => void
}
```

### Hook useVideoSeek

```typescript
interface UseVideoSeekProps {
  videoRef: RefObject<HTMLVideoElement>
  duration: number
  debounceMs: number
}

interface UseVideoSeekReturn {
  handleSeek: (value: number[]) => void
  isSeekingOptimized: boolean
  seekPosition: number | null
}
```

## Data Models

### Performance Metrics
```typescript
interface VideoPerformanceMetrics {
  loadTime: number
  seekTime: number
  bufferHealth: number
  networkQuality: 'slow' | 'normal' | 'fast'
  errorCount: number
}
```

### Buffer Management
```typescript
interface BufferState {
  bufferedRanges: TimeRanges | null
  currentBuffer: number
  targetBuffer: number
  isHealthy: boolean
}
```

## Error Handling

### Network Adaptation
- Detecção automática de velocidade de conexão
- Fallback para qualidades menores em conexões lentas
- Retry inteligente com backoff exponencial

### Buffer Management
- Monitoramento contínuo do buffer
- Preload adaptativo baseado na velocidade de conexão
- Limpeza automática de buffer desnecessário

### Seek Optimization
- Debouncing para evitar seeks excessivos
- Cache de posições frequentemente acessadas
- Preload de segmentos próximos ao seek

## Testing Strategy

### Performance Tests
1. **Teste de Carregamento:**
   - Medir tempo de carregamento inicial
   - Validar que carrega em menos de 3 segundos
   - Testar com diferentes tamanhos de vídeo

2. **Teste de Seek:**
   - Medir tempo de resposta ao seek
   - Validar que seek acontece em menos de 1 segundo
   - Testar navegação rápida entre pontos

3. **Teste de Controles:**
   - Validar mudanças instantâneas de velocidade
   - Testar responsividade dos controles
   - Verificar debouncing adequado

### Network Tests
- Simular conexões lentas
- Testar adaptação automática de qualidade
- Validar retry em caso de falhas

### Memory Tests
- Verificar limpeza de recursos
- Testar múltiplas instâncias
- Validar garbage collection

## Implementation Details

### 1. Preload Inteligente

**Estratégia Adaptativa:**
```typescript
const getOptimalPreloadStrategy = (networkSpeed: string) => {
  switch (networkSpeed) {
    case 'slow': return 'metadata'
    case 'normal': return 'auto'
    case 'fast': return 'auto'
    default: return 'metadata'
  }
}
```

**Buffer Management:**
```typescript
const optimizeBuffer = useCallback(() => {
  const video = videoRef.current
  if (!video) return
  
  const buffered = video.buffered
  const currentTime = video.currentTime
  
  // Manter buffer de 30s à frente e 10s atrás
  const targetAhead = 30
  const targetBehind = 10
  
  // Implementar lógica de limpeza de buffer
}, [])
```

### 2. Seek Otimizado

**Debouncing Implementation:**
```typescript
const debouncedSeek = useMemo(
  () => debounce((value: number[]) => {
    const video = videoRef.current
    if (!video) return
    
    const newTime = (value[0] / 100) * duration
    video.currentTime = newTime
    setCurrentTime(newTime)
  }, seekDebounceMs),
  [duration, seekDebounceMs]
)
```

**Preload de Segmentos:**
```typescript
const preloadSeekSegment = useCallback((targetTime: number) => {
  // Preload do segmento próximo ao seek
  const segmentSize = 10 // 10 segundos
  const startTime = Math.max(0, targetTime - segmentSize/2)
  const endTime = Math.min(duration, targetTime + segmentSize/2)
  
  // Implementar preload do segmento
}, [duration])
```

### 3. Network Adaptation

**Detecção de Velocidade:**
```typescript
const detectNetworkSpeed = useCallback(async () => {
  const startTime = performance.now()
  
  try {
    // Fazer pequeno request para medir velocidade
    const response = await fetch(src, { 
      method: 'HEAD',
      cache: 'no-cache'
    })
    
    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    if (responseTime < 100) return 'fast'
    if (responseTime < 500) return 'normal'
    return 'slow'
  } catch {
    return 'slow'
  }
}, [src])
```

### 4. Resource Management

**Cleanup Otimizado:**
```typescript
useEffect(() => {
  return () => {
    // Limpar timeouts
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    // Limpar event listeners
    const video = videoRef.current
    if (video) {
      video.removeEventListener('loadstart', handleLoadStart)
      // ... outros listeners
    }
    
    // Limpar cache se necessário
    clearVideoCache()
  }
}, [])
```

### 5. Performance Monitoring

**Métricas em Tempo Real:**
```typescript
const trackPerformance = useCallback((metric: string, value: number) => {
  // Log apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log(`Video Performance - ${metric}:`, value)
  }
  
  // Enviar métricas para analytics se necessário
}, [])
```

## Security Considerations

- Manter logs de performance apenas em desenvolvimento
- Não expor informações sensíveis sobre a rede
- Validar todas as URLs antes do preload
- Implementar rate limiting para requests de preload

## Performance Impact

### Melhorias Esperadas
- **Carregamento:** Redução de 40-60% no tempo de carregamento inicial
- **Seek:** Redução de 70-80% no tempo de resposta ao seek
- **Controles:** Resposta instantânea (< 100ms)
- **Memória:** Redução de 30% no uso de memória

### Monitoramento
- Métricas de performance em tempo real
- Alertas para degradação de performance
- Dashboard de métricas (desenvolvimento)

## Browser Compatibility

- Suporte para todos os browsers modernos
- Fallbacks para browsers mais antigos
- Detecção de capacidades do browser
- Graceful degradation quando necessário