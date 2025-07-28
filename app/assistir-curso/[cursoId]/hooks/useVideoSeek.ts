import { useState, useCallback, useRef, RefObject, useMemo } from 'react'

interface UseVideoSeekProps {
  videoRef: RefObject<HTMLVideoElement>
  duration: number
  debounceMs?: number
  onSeek?: (time: number) => void
}

interface UseVideoSeekReturn {
  handleSeek: (value: number[]) => void
  isSeekingOptimized: boolean
  seekPosition: number | null
  preloadSeekSegment: (targetTime: number) => void
  getSeekPreview: (time: number) => string
}

// Utility function para debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function useVideoSeek({
  videoRef,
  duration,
  debounceMs = 150,
  onSeek
}: UseVideoSeekProps): UseVideoSeekReturn {
  const [isSeekingOptimized, setIsSeekingOptimized] = useState(false)
  const [seekPosition, setSeekPosition] = useState<number | null>(null)
  
  const seekCache = useRef<Map<number, boolean>>(new Map())
  const preloadedSegments = useRef<Set<number>>(new Set())
  const seekStartTime = useRef<number>(0)

  // Cache de posições frequentemente acessadas
  const addToSeekCache = useCallback((time: number) => {
    const roundedTime = Math.floor(time / 10) * 10 // Cache em intervalos de 10s
    seekCache.current.set(roundedTime, true)
    
    // Limitar tamanho do cache
    if (seekCache.current.size > 50) {
      const firstKey = seekCache.current.keys().next().value
      seekCache.current.delete(firstKey)
    }
  }, [])

  // Preload de segmento próximo ao seek
  const preloadSeekSegment = useCallback((targetTime: number) => {
    const video = videoRef.current
    if (!video || !duration) return

    const segmentSize = 15 // 15 segundos de segmento
    const segmentIndex = Math.floor(targetTime / segmentSize)
    
    // Evitar preload duplicado
    if (preloadedSegments.current.has(segmentIndex)) return
    
    const startTime = Math.max(0, targetTime - segmentSize / 2)
    const endTime = Math.min(duration, targetTime + segmentSize / 2)
    
    console.debug('Preloading seek segment:', { 
      targetTime, 
      startTime, 
      endTime, 
      segmentIndex 
    })
    
    // Marcar como preloaded
    preloadedSegments.current.add(segmentIndex)
    
    // Em uma implementação mais avançada, poderíamos usar:
    // - Media Source Extensions para preload específico
    // - Service Worker para cache inteligente
    // - Range requests para carregar apenas o segmento necessário
    
    // Por enquanto, usamos uma abordagem mais simples
    try {
      // Criar um elemento de vídeo temporário para preload
      const tempVideo = document.createElement('video')
      tempVideo.preload = 'metadata'
      tempVideo.src = video.src
      tempVideo.currentTime = startTime
      
      // Limpar após um tempo
      setTimeout(() => {
        tempVideo.remove()
      }, 5000)
    } catch (error) {
      console.debug('Seek preload failed:', error)
    }
  }, [duration])

  // Função otimizada de seek com debounce
  const optimizedSeek = useCallback((targetTime: number) => {
    const video = videoRef.current
    if (!video) return

    setIsSeekingOptimized(true)
    seekStartTime.current = performance.now()
    
    // Preload do segmento antes de fazer o seek
    preloadSeekSegment(targetTime)
    
    // Fazer o seek
    video.currentTime = targetTime
    
    // Adicionar ao cache
    addToSeekCache(targetTime)
    
    // Callback opcional
    onSeek?.(targetTime)
    
    // Medir performance do seek
    const seekCompleteHandler = () => {
      const seekTime = performance.now() - seekStartTime.current
      console.debug('Seek completed in:', seekTime, 'ms')
      
      setIsSeekingOptimized(false)
      video.removeEventListener('seeked', seekCompleteHandler)
    }
    
    video.addEventListener('seeked', seekCompleteHandler)
  }, [preloadSeekSegment, addToSeekCache, onSeek])

  // Debounced seek handler
  const debouncedSeek = useMemo(
    () => debounce((value: number[]) => {
      if (!duration) return
      
      const targetTime = (value[0] / 100) * duration
      setSeekPosition(targetTime)
      optimizedSeek(targetTime)
    }, debounceMs),
    [duration, debounceMs, optimizedSeek]
  )

  // Handler principal para seek
  const handleSeek = useCallback((value: number[]) => {
    if (!duration) return
    
    const targetTime = (value[0] / 100) * duration
    
    // Atualizar posição imediatamente para feedback visual
    setSeekPosition(targetTime)
    
    // Fazer o seek com debounce
    debouncedSeek(value)
  }, [duration, debouncedSeek])

  // Gerar preview do seek (timestamp formatado)
  const getSeekPreview = useCallback((time: number): string => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  // Preload inteligente baseado em padrões de uso
  const intelligentPreload = useCallback(() => {
    const video = videoRef.current
    if (!video || !duration) return

    const currentTime = video.currentTime
    
    // Preload baseado em posições do cache
    seekCache.current.forEach((_, cachedTime) => {
      const timeDiff = Math.abs(cachedTime - currentTime)
      
      // Se há uma posição cached próxima, preload ela
      if (timeDiff > 10 && timeDiff < 60) {
        preloadSeekSegment(cachedTime)
      }
    })
  }, [duration, preloadSeekSegment])

  // Executar preload inteligente periodicamente
  const startIntelligentPreload = useCallback(() => {
    const interval = setInterval(intelligentPreload, 10000) // A cada 10s
    
    return () => clearInterval(interval)
  }, [intelligentPreload])

  // Limpar cache quando necessário
  const clearSeekCache = useCallback(() => {
    seekCache.current.clear()
    preloadedSegments.current.clear()
  }, [])

  return {
    handleSeek,
    isSeekingOptimized,
    seekPosition,
    preloadSeekSegment,
    getSeekPreview
  }
}