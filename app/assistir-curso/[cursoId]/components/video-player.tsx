"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Log da URL para debug
    // console.log("Tentando carregar vídeo:", src)
    setVideoInfo(`URL: ${src}`)

    const handleLoadStart = () => {
      // console.log("Iniciando carregamento do vídeo")
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

    return () => {
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("error", handleError)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
    }
  }, [src, onProgress, onEnded])

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

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newTime = (value[0] / 100) * duration
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

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
          <div className="text-xs text-slate-500 bg-slate-700/50 p-2 rounded">URL: {src || "Não fornecida"}</div>
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
              <div>URL: {src}</div>
              <div className="mt-1">{videoInfo}</div>
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
            <div className="text-xs mt-2 opacity-70">{videoInfo}</div>
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
