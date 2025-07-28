"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Settings, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  src: string
  title: string
  onProgress?: (currentTime: number, duration: number) => void
  onEnded?: () => void
}

export function VideoPlayer({ src, title, onProgress, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<string>("")
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  // Performance states
  const [isBuffering, setIsBuffering] = useState(false)
  const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')
  const [bufferedRanges, setBufferedRanges] = useState<TimeRanges | null>(null)
  const [preloadProgress, setPreloadProgress] = useState(0)
  const [isPreloading, setIsPreloading] = useState(false)

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadStartTime = useRef<number>(0)
  const preloadIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const aggressivePreloadRef = useRef<HTMLVideoElement | null>(null)

  // Detectar velocidade da rede
  const detectNetworkSpeed = useCallback(async () => {
    if (!src) return 'normal'

    const startTime = performance.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

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
      return 'slow'
    }
  }, [src])

  // Seek otimizado com debounce
  const debouncedSeek = useMemo(() => {
    let timeout: NodeJS.Timeout | null = null

    return (value: number[]) => {
      if (timeout) clearTimeout(timeout)

      // Atualizar UI imediatamente
      const newTime = (value[0] / 100) * duration
      setCurrentTime(newTime)

      // Aplicar seek com debounce
      timeout = setTimeout(() => {
        const video = videoRef.current
        if (!video) return

        const seekStartTime = performance.now()
        video.currentTime = newTime

        // Medir performance do seek
        const handleSeeked = () => {
          const seekTime = performance.now() - seekStartTime
          console.debug('Seek completed in:', seekTime, 'ms')
          video.removeEventListener('seeked', handleSeeked)
        }

        video.addEventListener('seeked', handleSeeked)
      }, 150)
    }
  }, [duration])

  // Sistema de preload híbrido ultra otimizado
  const startAggressivePreload = useCallback(() => {
    const video = videoRef.current
    if (!video || !duration || isPreloading) return

    setIsPreloading(true)
    console.log('🚀 Iniciando sistema de preload HÍBRIDO ultra otimizado...')

    // Estratégia 1: Configurar vídeo principal para máximo preload
    video.preload = 'auto'
    video.setAttribute('preload', 'auto')

    // Estratégia 2: Múltiplos elementos de vídeo para preload paralelo
    const preloadVideos: HTMLVideoElement[] = []
    const segments = 8 // Otimizado para 8 segmentos paralelos

    const createPreloadElement = (index: number) => {
      const preloadVideo = document.createElement('video')
      preloadVideo.src = src
      preloadVideo.preload = 'auto'
      preloadVideo.muted = true
      preloadVideo.volume = 0
      preloadVideo.style.cssText = `
        position: absolute !important;
        top: -9999px !important;
        left: -9999px !important;
        width: 1px !important;
        height: 1px !important;
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: -9999 !important;
      `

      // Configurações para máximo preload
      preloadVideo.setAttribute('preload', 'auto')
      preloadVideo.setAttribute('crossorigin', 'anonymous')

      document.body.appendChild(preloadVideo)
      return preloadVideo
    }

    // Estratégia 3: Range requests simulados através de seeks inteligentes
    const forceCompleteDownload = async () => {
      try {
        console.log('🔄 Iniciando download paralelo em segmentos...')

        // Criar elementos de preload
        for (let i = 0; i < segments; i++) {
          const preloadVideo = createPreloadElement(i)
          preloadVideos.push(preloadVideo)
        }

        // Aguardar um pouco para os elementos carregarem
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Processar segmentos em paralelo
        const segmentPromises = preloadVideos.map(async (preloadVideo, index) => {
          try {
            // Aguardar metadados
            await new Promise((resolve) => {
              if (preloadVideo.readyState >= 1) {
                resolve(true)
              } else {
                preloadVideo.addEventListener('loadedmetadata', () => resolve(true), { once: true })
                // Timeout de segurança
                setTimeout(() => resolve(true), 3000)
              }
            })

            const segmentDuration = duration / segments
            const segmentStart = index * segmentDuration
            const segmentEnd = Math.min((index + 1) * segmentDuration, duration)

            console.log(`📥 Processando segmento ${index + 1}/${segments}: ${segmentStart.toFixed(1)}s - ${segmentEnd.toFixed(1)}s`)

            // Fazer seeks MUITO densos no segmento para forçar download completo
            const seekInterval = 2 // A cada 2 segundos (mais agressivo)
            for (let seekTime = segmentStart; seekTime < segmentEnd; seekTime += seekInterval) {
              preloadVideo.currentTime = Math.min(seekTime, duration - 0.1)

              // Aguardar seek ser processado com timeout menor
              await new Promise(resolve => {
                const onSeeked = () => {
                  preloadVideo.removeEventListener('seeked', onSeeked)
                  resolve(true)
                }
                preloadVideo.addEventListener('seeked', onSeeked)
                setTimeout(() => {
                  preloadVideo.removeEventListener('seeked', onSeeked)
                  resolve(true)
                }, 200) // Reduzir timeout
              })

              // Pausa menor para ser mais agressivo
              await new Promise(resolve => setTimeout(resolve, 30))
            }

            // Estratégia adicional: Fazer seeks reversos para garantir download completo
            for (let seekTime = segmentEnd - seekInterval; seekTime >= segmentStart; seekTime -= seekInterval) {
              preloadVideo.currentTime = Math.max(seekTime, 0)
              await new Promise(resolve => setTimeout(resolve, 30))
            }

            console.log(`✅ Segmento ${index + 1} concluído`)
            return true

          } catch (error) {
            console.warn(`❌ Erro no segmento ${index + 1}:`, error)
            return false
          }
        })

        // Aguardar todos os segmentos
        const results = await Promise.allSettled(segmentPromises)
        const successCount = results.filter(r => r.status === 'fulfilled').length

        console.log(`📊 Preload concluído: ${successCount}/${segments} segmentos processados`)

        // Atualizar progresso final
        setPreloadProgress(100)
        setIsPreloading(false)

        // Manter elementos por mais tempo para cache
        setTimeout(() => {
          preloadVideos.forEach(video => {
            if (video.parentNode) {
              document.body.removeChild(video)
            }
          })
          console.log('🧹 Cache de preload limpo')
        }, 180000) // 3 minutos

      } catch (error) {
        console.error('❌ Erro crítico no preload:', error)
        setIsPreloading(false)

        // Limpar elementos em caso de erro
        preloadVideos.forEach(video => {
          if (video.parentNode) {
            document.body.removeChild(video)
          }
        })
      }
    }

    // Estratégia 4: Iniciar após delay otimizado
    setTimeout(forceCompleteDownload, 800)

  }, [src, duration, isPreloading])

  // Monitorar buffer
  const updateBufferInfo = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setBufferedRanges(video.buffered)

    // Detectar buffering
    const currentTime = video.currentTime
    const buffered = video.buffered
    let bufferAhead = 0
    let totalBuffered = 0

    // Calcular total buffered
    for (let i = 0; i < buffered.length; i++) {
      totalBuffered += buffered.end(i) - buffered.start(i)

      if (buffered.start(i) <= currentTime && buffered.end(i) > currentTime) {
        bufferAhead = buffered.end(i) - currentTime
      }
    }

    // Calcular porcentagem do vídeo já carregada
    const bufferPercentage = duration > 0 ? (totalBuffered / duration) * 100 : 0

    const isCurrentlyBuffering = bufferAhead < 2 && !video.paused && !video.ended
    setIsBuffering(isCurrentlyBuffering)

    // Se menos de 80% está carregado e não estamos fazendo preload, iniciar preload agressivo
    if (bufferPercentage < 80 && !isPreloading && duration > 0) {
      startAggressivePreload()
    }

    console.debug('Buffer info:', {
      bufferAhead: Math.round(bufferAhead),
      totalBuffered: Math.round(totalBuffered),
      bufferPercentage: Math.round(bufferPercentage),
      isBuffering: isCurrentlyBuffering
    })
  }, [duration, isPreloading, startAggressivePreload])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Log da URL para debug
    console.log("Tentando carregar vídeo:", src)
    setVideoInfo("")

    // Detectar velocidade da rede e otimizar preload
    detectNetworkSpeed().then(speed => {
      setNetworkSpeed(speed)

      // Otimizar preload baseado na velocidade
      switch (speed) {
        case 'slow':
          video.preload = 'metadata'
          break
        case 'normal':
          video.preload = 'auto'
          break
        case 'fast':
          video.preload = 'auto'
          break
      }

      console.debug('Network speed detected:', speed, 'preload:', video.preload)
    })

    const handleLoadStart = () => {
      loadStartTime.current = performance.now()
      setIsLoading(true)
      setError(null)
    }

    const handleLoadedMetadata = () => {
      /* console.log("Metadados carregados:", {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      }) */
      setDuration(video.duration)
      setIsLoading(false)
      setVideoInfo(`Duração: ${Math.round(video.duration)}s | ${video.videoWidth}x${video.videoHeight}`)

      // Calcular aspect ratio
      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight)
      }

      // Iniciar preload agressivo imediatamente após metadados carregarem
      setTimeout(() => {
        startAggressivePreload()
      }, 500) // Reduzir para 500ms para iniciar mais cedo
    }

    const handleCanPlay = () => {
      // // console.debug("Vídeo pronto para reproduzir")
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onProgress?.(video.currentTime, video.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    const handleError = (e: Event) => {
      console.error("Erro no vídeo:", e)
      console.error("Detalhes do erro:", {
        error: video.error,
        networkState: video.networkState,
        readyState: video.readyState,
        src: video.src,
      })

      let errorMessage = "Erro desconhecido ao carregar o vídeo"

      if (video.error) {
        switch (video.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = "Carregamento do vídeo foi interrompido"
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = "Erro de rede ao carregar o vídeo"
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = "Erro ao decodificar o vídeo"
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = "Formato de vídeo não suportado"
            break
          default:
            errorMessage = `Erro no vídeo (código: ${video.error.code})`
        }
      }

      setError(errorMessage)
      setIsLoading(false)
    }

    const handleWaiting = () => {
      // // console.debug("Vídeo aguardando dados...")
      setIsLoading(true)
    }

    const handlePlaying = () => {
      // // console.debug("Vídeo reproduzindo")
      setIsLoading(false)
    }

    // Event listeners
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("error", handleError)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("playing", handlePlaying)
    video.addEventListener("progress", updateBufferInfo)

    return () => {
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("error", handleError)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
      video.removeEventListener("progress", updateBufferInfo)
    }
  }, [src, onProgress, onEnded, detectNetworkSpeed, updateBufferInfo])

  // Monitorar mudanças no estado de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (isPlaying) {
        video.pause()
        setIsPlaying(false)
      } else {
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true)
            })
            .catch((error) => {
              console.error("Erro ao reproduzir:", error)
              setError("Erro ao iniciar reprodução. Tente novamente.")
            })
        }
      }
    } catch (error) {
      console.error("Erro ao reproduzir vídeo:", error)
      setError("Erro ao reproduzir o vídeo")
    }
  }

  const handleSeek = debouncedSeek

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0] / 100
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const changePlaybackRate = () => {
    const video = videoRef.current
    if (!video) return

    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextRate = rates[(currentIndex + 1) % rates.length]

    video.playbackRate = nextRate
    setPlaybackRate(nextRate)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }

  const retryLoad = () => {
    const video = videoRef.current
    if (!video) return

    setError(null)
    setIsLoading(true)
    video.load()
  }

  // Verificar se a URL é válida
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Prevenir propagação do clique nos controles
  const handleControlClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!src || !isValidUrl(src)) {
    return (
      <Card className="w-full bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white mb-2">URL de vídeo inválida</h3>
          <p className="text-slate-400 mb-4">A URL do vídeo não é válida ou está vazia.</p>
          <div className="text-xs text-slate-500 bg-slate-700/50 p-2 rounded">Verifique se o vídeo está disponível</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <RotateCcw className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Erro ao carregar vídeo</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <div className="space-y-3">
            <Button onClick={retryLoad} variant="outline" className="border-slate-600 text-slate-300">
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <div className="text-xs text-slate-500 bg-slate-700/50 p-2 rounded">
              <div>Erro técnico detectado. Verifique sua conexão.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Estilo para manter a proporção do vídeo
  const videoContainerStyle = aspectRatio ? { maxWidth: "100%", margin: "0 auto" } : {}

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden group mx-auto"
      style={videoContainerStyle}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center z-20">
          <div className="text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto mb-4"></div>
            <p>Carregando vídeo...</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={src}
        className="w-full h-auto object-contain relative z-0"
        onClick={togglePlay}
        crossOrigin="anonymous"
        preload="metadata"
      />

      {/* Controles do vídeo */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 z-30",
          showControls ? "opacity-100" : "opacity-0",
        )}
        onClick={handleControlClick}
      >
        {/* Barra de progresso */}
        <div className="mb-4" onClick={handleControlClick}>
          <Slider
            value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between" onClick={handleControlClick}>
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:bg-white/20 z-40 relative"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 z-40 relative"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div className="w-20 z-40 relative">
                <Slider value={[isMuted ? 0 : volume * 100]} onValueChange={handleVolumeChange} max={100} step={1} />
              </div>
            </div>

            {/* Tempo */}
            <span className="text-white text-sm z-40 relative">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Velocidade */}
            <Button
              variant="ghost"
              size="sm"
              onClick={changePlaybackRate}
              className="text-white hover:bg-white/20 text-xs z-40 relative"
            >
              {playbackRate}x
            </Button>

            {/* Configurações */}
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 z-40 relative">
              <Settings className="w-4 h-4" />
            </Button>

            {/* Tela cheia */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 z-40 relative"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay de play central */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Button
            onClick={togglePlay}
            size="lg"
            className="bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-full w-16 h-16"
          >
            <Play className="w-8 h-8 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
