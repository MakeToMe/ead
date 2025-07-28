import { useState, useCallback, useRef, RefObject, useMemo } from 'react'

interface UseVideoControlsProps {
  videoRef: RefObject<HTMLVideoElement>
  debounceMs?: number
}

interface UseVideoControlsReturn {
  // Playback controls
  togglePlay: () => Promise<void>
  changePlaybackRate: (rate?: number) => void
  optimizedPlaybackRate: number
  
  // Volume controls
  handleVolumeChange: (value: number[]) => void
  toggleMute: () => void
  optimizedVolume: number
  optimizedIsMuted: boolean
  
  // Control states
  isControlsResponsive: boolean
  lastControlAction: string | null
  
  // Performance metrics
  controlMetrics: {
    playbackRateChanges: number
    volumeChanges: number
    averageResponseTime: number
  }
}

// Debounce utility
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

export function useVideoControls({
  videoRef,
  debounceMs = 50
}: UseVideoControlsProps): UseVideoControlsReturn {
  const [optimizedPlaybackRate, setOptimizedPlaybackRate] = useState(1)
  const [optimizedVolume, setOptimizedVolume] = useState(1)
  const [optimizedIsMuted, setOptimizedIsMuted] = useState(false)
  const [isControlsResponsive, setIsControlsResponsive] = useState(true)
  const [lastControlAction, setLastControlAction] = useState<string | null>(null)
  const [controlMetrics, setControlMetrics] = useState({
    playbackRateChanges: 0,
    volumeChanges: 0,
    averageResponseTime: 0
  })

  const responseTimeRef = useRef<number[]>([])
  const lastVolumeRef = useRef<number>(1)
  const volumeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Medir tempo de resposta dos controles
  const measureResponseTime = useCallback((action: string, startTime: number) => {
    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    responseTimeRef.current.push(responseTime)
    
    // Manter apenas os últimos 10 tempos de resposta
    if (responseTimeRef.current.length > 10) {
      responseTimeRef.current.shift()
    }
    
    // Calcular média
    const averageResponseTime = responseTimeRef.current.reduce((a, b) => a + b, 0) / responseTimeRef.current.length
    
    setControlMetrics(prev => ({
      ...prev,
      averageResponseTime
    }))
    
    console.debug(`Control ${action} response time:`, responseTime, 'ms')
    setLastControlAction(`${action} (${Math.round(responseTime)}ms)`)
  }, [])

  // Toggle play otimizado
  const togglePlay = useCallback(async (): Promise<void> => {
    const video = videoRef.current
    if (!video) return

    const startTime = performance.now()
    setIsControlsResponsive(false)
    
    try {
      if (video.paused) {
        const playPromise = video.play()
        if (playPromise !== undefined) {
          await playPromise
        }
      } else {
        video.pause()
      }
      
      measureResponseTime('play/pause', startTime)
    } catch (error) {
      console.error('Error toggling play:', error)
    } finally {
      setIsControlsResponsive(true)
    }
  }, [measureResponseTime])

  // Mudança de velocidade otimizada
  const changePlaybackRate = useCallback((rate?: number) => {
    const video = videoRef.current
    if (!video) return

    const startTime = performance.now()
    
    let newRate: number
    
    if (rate !== undefined) {
      newRate = rate
    } else {
      // Ciclar entre velocidades comuns
      const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
      const currentIndex = rates.indexOf(optimizedPlaybackRate)
      newRate = rates[(currentIndex + 1) % rates.length]
    }
    
    // Aplicar mudança instantaneamente
    video.playbackRate = newRate
    setOptimizedPlaybackRate(newRate)
    
    // Atualizar métricas
    setControlMetrics(prev => ({
      ...prev,
      playbackRateChanges: prev.playbackRateChanges + 1
    }))
    
    measureResponseTime('playback-rate', startTime)
  }, [optimizedPlaybackRate, measureResponseTime])

  // Volume change com debounce otimizado
  const debouncedVolumeChange = useMemo(
    () => debounce((volume: number) => {
      const video = videoRef.current
      if (!video) return

      const startTime = performance.now()
      
      video.volume = volume
      setOptimizedVolume(volume)
      setOptimizedIsMuted(volume === 0)
      
      // Atualizar métricas apenas se houve mudança significativa
      if (Math.abs(volume - lastVolumeRef.current) > 0.05) {
        setControlMetrics(prev => ({
          ...prev,
          volumeChanges: prev.volumeChanges + 1
        }))
        
        measureResponseTime('volume', startTime)
        lastVolumeRef.current = volume
      }
    }, debounceMs),
    [debounceMs, measureResponseTime]
  )

  // Handler de mudança de volume
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0] / 100
    
    // Atualizar estado imediatamente para feedback visual
    setOptimizedVolume(newVolume)
    setOptimizedIsMuted(newVolume === 0)
    
    // Aplicar mudança com debounce
    debouncedVolumeChange(newVolume)
  }, [debouncedVolumeChange])

  // Toggle mute otimizado
  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const startTime = performance.now()
    
    if (optimizedIsMuted) {
      // Restaurar volume anterior
      const volumeToRestore = lastVolumeRef.current > 0 ? lastVolumeRef.current : 1
      video.volume = volumeToRestore
      setOptimizedVolume(volumeToRestore)
      setOptimizedIsMuted(false)
    } else {
      // Salvar volume atual e mutar
      lastVolumeRef.current = optimizedVolume
      video.volume = 0
      setOptimizedVolume(0)
      setOptimizedIsMuted(true)
    }
    
    measureResponseTime('mute/unmute', startTime)
  }, [optimizedIsMuted, optimizedVolume, measureResponseTime])

  // Sincronizar estados com o elemento de vídeo
  const syncWithVideoElement = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    // Sincronizar apenas se houver diferenças significativas
    if (Math.abs(video.playbackRate - optimizedPlaybackRate) > 0.01) {
      setOptimizedPlaybackRate(video.playbackRate)
    }
    
    if (Math.abs(video.volume - optimizedVolume) > 0.01) {
      setOptimizedVolume(video.volume)
    }
    
    if (video.muted !== optimizedIsMuted) {
      setOptimizedIsMuted(video.muted)
    }
  }, [optimizedPlaybackRate, optimizedVolume, optimizedIsMuted])

  // Otimizações de performance para controles
  const optimizeControlsPerformance = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    // Verificar se os controles estão responsivos
    const avgResponseTime = controlMetrics.averageResponseTime
    const isResponsive = avgResponseTime < 100 // Menos de 100ms é considerado responsivo
    
    setIsControlsResponsive(isResponsive)
    
    // Se não está responsivo, aplicar otimizações
    if (!isResponsive) {
      console.warn('Controls not responsive, applying optimizations')
      
      // Reduzir frequência de updates
      // Limpar timeouts desnecessários
      if (volumeChangeTimeoutRef.current) {
        clearTimeout(volumeChangeTimeoutRef.current)
      }
    }
  }, [controlMetrics.averageResponseTime])

  // Cleanup e otimizações
  const cleanup = useCallback(() => {
    if (volumeChangeTimeoutRef.current) {
      clearTimeout(volumeChangeTimeoutRef.current)
    }
    
    // Limpar métricas antigas
    responseTimeRef.current = []
    
    setControlMetrics({
      playbackRateChanges: 0,
      volumeChanges: 0,
      averageResponseTime: 0
    })
  }, [])

  return {
    // Playback controls
    togglePlay,
    changePlaybackRate,
    optimizedPlaybackRate,
    
    // Volume controls
    handleVolumeChange,
    toggleMute,
    optimizedVolume,
    optimizedIsMuted,
    
    // Control states
    isControlsResponsive,
    lastControlAction,
    
    // Performance metrics
    controlMetrics
  }
}