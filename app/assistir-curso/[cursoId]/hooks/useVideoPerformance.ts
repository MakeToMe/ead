import { useState, useEffect, useCallback, useRef, RefObject } from 'react'

interface UseVideoPerformanceProps {
  videoRef: RefObject<HTMLVideoElement>
  src: string
  preloadStrategy?: 'none' | 'metadata' | 'auto'
  bufferSize?: number
}

interface UseVideoPerformanceReturn {
  isBuffering: boolean
  bufferedRanges: TimeRanges | null
  networkSpeed: 'slow' | 'normal' | 'fast'
  preloadNext: () => void
  optimizeBuffer: () => void
  performanceMetrics: {
    loadTime: number
    bufferHealth: number
    errorCount: number
  }
}

export function useVideoPerformance({
  videoRef,
  src,
  preloadStrategy = 'metadata',
  bufferSize = 30
}: UseVideoPerformanceProps): UseVideoPerformanceReturn {
  const [isBuffering, setIsBuffering] = useState(false)
  const [bufferedRanges, setBufferedRanges] = useState<TimeRanges | null>(null)
  const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    bufferHealth: 0,
    errorCount: 0
  })

  const loadStartTime = useRef<number>(0)
  const bufferCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Detectar velocidade da rede
  const detectNetworkSpeed = useCallback(async () => {
    if (!src) return 'normal'

    const startTime = performance.now()
    
    try {
      // Fazer um pequeno request HEAD para medir latência
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(src, { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const endTime = performance.now()
      const responseTime = endTime - startTime

      if (response.ok) {
        if (responseTime < 200) return 'fast'
        if (responseTime < 800) return 'normal'
        return 'slow'
      }
      
      return 'slow'
    } catch (error) {
      console.warn('Network speed detection failed:', error)
      return 'slow'
    }
  }, [src])

  // Otimizar estratégia de preload baseada na velocidade da rede
  const getOptimalPreloadStrategy = useCallback((speed: string) => {
    switch (speed) {
      case 'slow': return 'metadata'
      case 'normal': return 'auto'
      case 'fast': return 'auto'
      default: return preloadStrategy
    }
  }, [preloadStrategy])

  // Monitorar buffer do vídeo
  const updateBufferInfo = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setBufferedRanges(video.buffered)
    
    // Calcular saúde do buffer
    const currentTime = video.currentTime
    const buffered = video.buffered
    let bufferAhead = 0

    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && buffered.end(i) > currentTime) {
        bufferAhead = buffered.end(i) - currentTime
        break
      }
    }

    const bufferHealth = Math.min(100, (bufferAhead / bufferSize) * 100)
    
    setPerformanceMetrics(prev => ({
      ...prev,
      bufferHealth
    }))

    // Determinar se está buffering
    const isCurrentlyBuffering = bufferAhead < 2 && !video.paused && !video.ended
    setIsBuffering(isCurrentlyBuffering)
  }, [bufferSize])

  // Otimizar buffer
  const optimizeBuffer = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const currentTime = video.currentTime
    const duration = video.duration
    
    if (!duration) return

    // Implementar lógica de limpeza de buffer desnecessário
    // Em browsers que suportam, podemos sugerir limpeza de buffer antigo
    try {
      // Esta é uma API experimental, usar com cuidado
      if ('setMediaKeys' in video && typeof (video as any).clearBuffer === 'function') {
        const bufferBehind = 60 // Manter apenas 60s atrás
        const clearBefore = Math.max(0, currentTime - bufferBehind)
        
        if (clearBefore > 0) {
          // Limpar buffer antigo se possível
          console.debug('Optimizing buffer, clearing before:', clearBefore)
        }
      }
    } catch (error) {
      console.debug('Buffer optimization not supported:', error)
    }
  }, [])

  // Preload próximo segmento
  const preloadNext = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const currentTime = video.currentTime
    const duration = video.duration
    
    if (!duration) return

    // Calcular próximo segmento para preload
    const segmentSize = Math.min(bufferSize, 30) // Máximo 30s
    const preloadStart = currentTime
    const preloadEnd = Math.min(duration, currentTime + segmentSize)

    console.debug('Preloading segment:', { preloadStart, preloadEnd })
    
    // Em implementações mais avançadas, poderíamos usar Media Source Extensions
    // Por enquanto, confiamos no preload nativo do browser
  }, [bufferSize])

  // Configurar video element com otimizações
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const setupVideoOptimizations = async () => {
      // Detectar velocidade da rede
      const speed = await detectNetworkSpeed()
      setNetworkSpeed(speed)

      // Configurar preload baseado na velocidade
      const optimalPreload = getOptimalPreloadStrategy(speed)
      video.preload = optimalPreload

      // Configurar outras otimizações
      video.crossOrigin = 'anonymous'
      
      // Habilitar hardware acceleration se disponível
      if ('requestVideoFrameCallback' in video) {
        console.debug('Hardware acceleration available')
      }
    }

    setupVideoOptimizations()
  }, [src, detectNetworkSpeed, getOptimalPreloadStrategy])

  // Event listeners para monitoramento
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadStart = () => {
      loadStartTime.current = performance.now()
    }

    const handleCanPlay = () => {
      const loadTime = performance.now() - loadStartTime.current
      setPerformanceMetrics(prev => ({
        ...prev,
        loadTime
      }))
      
      console.debug('Video load time:', loadTime, 'ms')
    }

    const handleWaiting = () => {
      setIsBuffering(true)
    }

    const handlePlaying = () => {
      setIsBuffering(false)
    }

    const handleProgress = () => {
      updateBufferInfo()
    }

    const handleError = () => {
      setPerformanceMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }))
    }

    // Adicionar event listeners
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('error', handleError)

    // Monitoramento contínuo do buffer
    bufferCheckInterval.current = setInterval(updateBufferInfo, 1000)

    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('error', handleError)
      
      if (bufferCheckInterval.current) {
        clearInterval(bufferCheckInterval.current)
      }
    }
  }, [updateBufferInfo])

  // Otimização automática do buffer
  useEffect(() => {
    const interval = setInterval(() => {
      optimizeBuffer()
    }, 30000) // Otimizar a cada 30 segundos

    return () => clearInterval(interval)
  }, [optimizeBuffer])

  return {
    isBuffering,
    bufferedRanges,
    networkSpeed,
    preloadNext,
    optimizeBuffer,
    performanceMetrics
  }
}