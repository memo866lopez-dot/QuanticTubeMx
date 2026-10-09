import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Camera,
  PenTool,
  MessageSquarePlus,
  Languages,
  RotateCcw,
  Sparkles,
  Flame,
  Heart,
  Share2,
  Check,
  X,
  Hand,
  Move
} from 'lucide-react';
import { VideoItem, CommentPin } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { computeClothDeformation } from './ClothPhysics';
import { resolveVideoUrl, getSafeVideoUrl, FALLBACK_VIDEOS, getNextFallbackVideo } from '../services/videoBlobService';
import { useVideoErrorRecovery, VideoErrorRecoveryOverlay } from './VideoErrorRecovery';
import { isKnownBrokenUrl } from '../utils/videoErrorRecovery';

interface VideoPlayerProps {
  video: VideoItem;
  onAddPin?: (pin: CommentPin) => void;
  onLike?: () => void;
  compact?: boolean;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  nextVideo?: VideoItem;
  prevVideo?: VideoItem;
  selectTrigger?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  icon: string;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  rotation: number;
  rotSpeed: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onAddPin,
  onLike,
  compact = false,
  onNextVideo,
  onPrevVideo,
  nextVideo,
  prevVideo,
  selectTrigger
}) => {
  const { t, language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reactionCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadedThumbImgRef = useRef<HTMLImageElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoStarting, setIsAutoStarting] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 180);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flashOsd, setFlashOsd] = useState<'play' | 'pause' | null>(null);
  const [loadedNotification, setLoadedNotification] = useState<string | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);
  const loadedNotificationTimerRef = useRef<number | null>(null);
  // Priority 1: In-memory live blob URL (if user uploaded a file)
  // Priority 2: video.videoUrl
  // Priority 3: Fallback
  const effectiveSrc = useMemo(() => {
    return getSafeVideoUrl(video.videoUrl, video.format, video.id);
  }, [video.videoUrl, video.format, video.id]);

  const [resolvedSrc, setResolvedSrc] = useState<string>(() => effectiveSrc);

  // Asynchronously resolve persistent blob from IndexedDB if initial URL is missing, stale, or a blob
  useEffect(() => {
    let isMounted = true;
    const isBlob = effectiveSrc?.startsWith('blob:') || video.videoUrl?.startsWith('blob:');
    if (!effectiveSrc || isBlob || isKnownBrokenUrl(effectiveSrc)) {
      resolveVideoUrl(video.videoUrl, video.format, video.title, video.id).then((resolved) => {
        if (isMounted && resolved) {
          setResolvedSrc(resolved);
        }
      });
    } else {
      setResolvedSrc(effectiveSrc);
    }
    return () => {
      isMounted = false;
    };
  }, [video.id, video.videoUrl, effectiveSrc]);

  const {
    currentSrc,
    isRecovering,
    retryCount,
    hasFailedPermanently,
    handleVideoError,
    manualRetry,
    forceFallback
  } = useVideoErrorRecovery({
    videoRef,
    initialSrc: resolvedSrc,
    videoId: video.id,
    format: video.format,
    title: video.title
  });

  function getEmbedUrl(rawUrl: string | undefined): string | null {
    if (!rawUrl) return null;
    const url = rawUrl.trim();

    // YouTube: standard, shorts, embed, mobile, share, nocookie
    const ytMatch = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&enablejsapi=1&rel=0`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    // Google Drive
    const gdriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([-\w]+)/i);
    if (gdriveMatch && gdriveMatch[1]) {
      return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
    }

    // DailyMotion
    const dmMatch = url.match(/dailymotion\.com\/(?:video\/|embed\/video\/)([a-zA-Z0-9]+)/i);
    if (dmMatch && dmMatch[1]) {
      return `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1`;
    }

    return null;
  }

  const embedUrl = useMemo(() => {
    return getEmbedUrl(video.videoUrl) || getEmbedUrl(currentSrc);
  }, [video.videoUrl, currentSrc]);

  // Track active video ID to prevent stale or cancelled state race conditions
  const activeVideoIdRef = useRef(video.id);
  activeVideoIdRef.current = video.id;

  // Sync state and automatically load and play newly selected video
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const currentVideoId = video.id;
    setIsAutoStarting(true);
    setCurrentTime(0);
    setLoadedNotification(video.title);

    if (loadedNotificationTimerRef.current) clearTimeout(loadedNotificationTimerRef.current);
    loadedNotificationTimerRef.current = window.setTimeout(() => {
      setLoadedNotification(null);
    }, 3000);

    const targetSrc = currentSrc || resolvedSrc || effectiveSrc;
    if (targetSrc) {
      const isDifferentSrc = !vid.src || (!vid.src.endsWith(targetSrc) && vid.src !== targetSrc);
      if (isDifferentSrc) {
        vid.src = targetSrc;
        try {
          vid.currentTime = 0;
        } catch {}
        vid.load();
      } else {
        try {
          vid.currentTime = 0;
        } catch {}
      }
    }

    let isCancelled = false;

    const playVideo = async () => {
      if (!vid || isCancelled || activeVideoIdRef.current !== currentVideoId) return;
      vid.playsInline = true;

      // Ensure element has valid source attribute before calling play()
      if (!vid.src && !vid.currentSrc) return;

      // If media metadata is not loaded yet, wait for canplay/loadedmetadata event
      if (vid.readyState < HTMLMediaElement.HAVE_METADATA) {
        return;
      }

      // 1. First attempt: If sound is enabled and allowed by browser, play unmuted
      if (!isMuted) {
        try {
          vid.muted = false;
          const p = vid.play();
          if (p !== undefined) {
            await p;
          }
          if (!isCancelled && activeVideoIdRef.current === currentVideoId) {
            setIsPlaying(true);
            setIsAutoStarting(false);
          }
          return;
        } catch (err: any) {
          // If browser policy restricted unmuted playback, switch seamlessly to muted
          if (err && (err.name === 'NotAllowedError' || String(err).includes('NotAllowedError'))) {
            // Proceed to step 2 muted autoplay
          } else {
            // Buffer loading or aborted by subsequent selection; wait for canplay event
            return;
          }
        }
      }

      // 2. Guaranteed fallback: Muted autoplay (100% permitted across all browsers)
      if (!vid || isCancelled || activeVideoIdRef.current !== currentVideoId) return;
      try {
        vid.defaultMuted = true;
        vid.muted = true;
        setIsMuted(true);
        const mutedPromise = vid.play();
        if (mutedPromise !== undefined) {
          await mutedPromise;
        }
        if (!isCancelled && activeVideoIdRef.current === currentVideoId) {
          setIsPlaying(true);
          setIsAutoStarting(false);
        }
      } catch (_mutedErr) {
        // Playback will begin as soon as canplay fires
      }
    };

    // If media is already buffered/ready, initiate playback; otherwise onCanPlay will trigger
    if (vid.readyState >= HTMLMediaElement.HAVE_METADATA) {
      playVideo();
    }

    // Additional listeners when browser buffers enough video data
    const onCanPlay = () => {
      if (!isCancelled && vid.paused && activeVideoIdRef.current === currentVideoId) {
        playVideo();
      }
    };
    vid.addEventListener('canplay', onCanPlay);
    vid.addEventListener('loadeddata', onCanPlay);
    vid.addEventListener('loadedmetadata', onCanPlay);

    const autoStartTimer = window.setTimeout(() => {
      if (!isCancelled && activeVideoIdRef.current === currentVideoId) {
        setIsAutoStarting(false);
        if (vid.paused && (vid.src || vid.currentSrc)) {
          vid.defaultMuted = true;
          vid.muted = true;
          vid.play().then(() => {
            if (!isCancelled) setIsPlaying(true);
          }).catch(() => {});
        }
      }
    }, 1200);

    return () => {
      isCancelled = true;
      clearTimeout(autoStartTimer);
      vid.removeEventListener('canplay', onCanPlay);
      vid.removeEventListener('loadeddata', onCanPlay);
      vid.removeEventListener('loadedmetadata', onCanPlay);
    };
  }, [video.id, currentSrc, effectiveSrc, selectTrigger]);

  const triggerOsd = (type: 'play' | 'pause') => {
    setFlashOsd(type);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = window.setTimeout(() => {
      setFlashOsd(null);
    }, 650);
  };

  // Sync video source & volume when video prop changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [video.videoUrl, volume, isMuted, playbackSpeed]);

  // Handle Play / Pause Toggle with OSD Flash
  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused || vid.ended) {
      vid.play()
        .then(() => {
          setIsPlaying(true);
          triggerOsd('play');
        })
        .catch(() => {
          vid.defaultMuted = true;
          vid.muted = true;
          setIsMuted(true);
          vid.play()
            .then(() => {
              setIsPlaying(true);
              triggerOsd('play');
            })
            .catch(() => {});
        });
    } else {
      vid.pause();
      setIsPlaying(false);
      triggerOsd('pause');
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  }, [isMuted]);

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    setVolume(newVol);
    videoRef.current.volume = newVol;
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    setPlaybackSpeed(speed);
    videoRef.current.playbackRate = speed;
  };

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Keyboard controls (Space, K, M, F, Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, videoRef.current.duration || duration);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, duration]);

  // --- CLOTH / PAÑUELO DRAG PHYSICS (OPTION B) ---
  const [isDraggingCloth, setIsDraggingCloth] = useState(false);
  const [clothDrag, setClothDrag] = useState({
    dx: 0,
    dy: 0,
    originX: 50,
    originY: 50,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    skewX: 0,
    skewY: 0,
    scale: 1
  });
  const [isFlingingOut, setIsFlingingOut] = useState(false);
  const [flingDirection, setFlingDirection] = useState<'up' | 'down' | null>(null);
  const [isRebounding, setIsRebounding] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const containerRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const dragMovedRef = useRef<boolean>(false);
  const isSwitchingRef = useRef<boolean>(false);

  const handleClothPointerDown = (e: React.PointerEvent) => {
    if (isDrawingMode || isPinMode || pendingPinCoords || isSwitchingRef.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const originX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const originY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    containerRectRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };

    isSwitchingRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY, originX, originY };
    dragMovedRef.current = false;

    const onGlobalMove = (moveEv: PointerEvent) => {
      if (!dragStartRef.current || isSwitchingRef.current) return;
      const dx = moveEv.clientX - dragStartRef.current.x;
      const dy = moveEv.clientY - dragStartRef.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 10) {
        dragMovedRef.current = true;
        setIsDraggingCloth(true);
        setIsRebounding(false);

        // 3D Matrix & realistic silk cloth physics calculations across full screen
        const rotX = Math.max(-35, Math.min(35, -dy * 0.08));
        const rotY = Math.max(-35, Math.min(35, dx * 0.06));
        const rotZ = Math.max(-25, Math.min(25, dx * 0.03));
        const skewX = Math.max(-14, Math.min(14, dx * 0.025));
        const skewY = Math.max(-14, Math.min(14, dy * 0.035));
        const scale = Math.max(0.82, 1 - dist * 0.00015);

        setClothDrag({
          dx,
          dy,
          originX: dragStartRef.current.originX,
          originY: dragStartRef.current.originY,
          rotX,
          rotY,
          rotZ,
          skewX,
          skewY,
          scale
        });

        // Detect reaching top or bottom boundary of screen
        // "que cuando lo jalaras hacia la parte de arriba pusieras al siguiente video en su lugar y al que jalaste lo hagas desaparecer, y que cuando lo jales hacia abajo se ponga el anterior y desaparezca en que jalaste y en su lugar se ponga el anterior"
        const currentTop = containerRectRef.current ? containerRectRef.current.top + dy : moveEv.clientY;
        const currentBottom = containerRectRef.current
          ? containerRectRef.current.top + containerRectRef.current.height + dy
          : moveEv.clientY;

        const hitsTop = dy <= -110 || moveEv.clientY <= 60 || currentTop <= 35;
        const hitsBottom = dy >= 110 || moveEv.clientY >= window.innerHeight - 60 || currentBottom >= window.innerHeight - 35;

        if (hitsTop) {
          isSwitchingRef.current = true;
          dragStartRef.current = null;
          window.removeEventListener('pointermove', onGlobalMove);
          window.removeEventListener('pointerup', onGlobalUp);
          setIsFlingingOut(true);
          setFlingDirection('up');

          setTimeout(() => {
            if (onNextVideo) onNextVideo();
            setIsFlingingOut(false);
            setIsDraggingCloth(false);
            setFlingDirection(null);
            isSwitchingRef.current = false;
            setClothDrag({
              dx: 0,
              dy: 0,
              originX: 50,
              originY: 50,
              rotX: 0,
              rotY: 0,
              rotZ: 0,
              skewX: 0,
              skewY: 0,
              scale: 1
            });
          }, 240);
          return;
        }

        if (hitsBottom) {
          isSwitchingRef.current = true;
          dragStartRef.current = null;
          window.removeEventListener('pointermove', onGlobalMove);
          window.removeEventListener('pointerup', onGlobalUp);
          setIsFlingingOut(true);
          setFlingDirection('down');

          setTimeout(() => {
            if (onPrevVideo) onPrevVideo();
            setIsFlingingOut(false);
            setIsDraggingCloth(false);
            setFlingDirection(null);
            isSwitchingRef.current = false;
            setClothDrag({
              dx: 0,
              dy: 0,
              originX: 50,
              originY: 50,
              rotX: 0,
              rotY: 0,
              rotZ: 0,
              skewX: 0,
              skewY: 0,
              scale: 1
            });
          }, 240);
          return;
        }
      }
    };

    const onGlobalUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointermove', onGlobalMove);
      window.removeEventListener('pointerup', onGlobalUp);

      if (isSwitchingRef.current) return;
      if (!dragStartRef.current) return;

      if (dragMovedRef.current) {
        const totalDy = upEv.clientY - dragStartRef.current.y;
        // If released pulled upwards (or dy <= -45): switch to NEXT video
        if (clothDrag.dy <= -45 || totalDy <= -45) {
          isSwitchingRef.current = true;
          setIsFlingingOut(true);
          setFlingDirection('up');
          setTimeout(() => {
            if (onNextVideo) onNextVideo();
            setIsFlingingOut(false);
            setIsDraggingCloth(false);
            setFlingDirection(null);
            isSwitchingRef.current = false;
            setClothDrag({
              dx: 0,
              dy: 0,
              originX: 50,
              originY: 50,
              rotX: 0,
              rotY: 0,
              rotZ: 0,
              skewX: 0,
              skewY: 0,
              scale: 1
            });
          }, 240);
          dragStartRef.current = null;
          return;
        }

        // If released pulled downwards (or dy >= 45): switch to PREVIOUS video
        if (clothDrag.dy >= 45 || totalDy >= 45) {
          isSwitchingRef.current = true;
          setIsFlingingOut(true);
          setFlingDirection('down');
          setTimeout(() => {
            if (onPrevVideo) onPrevVideo();
            setIsFlingingOut(false);
            setIsDraggingCloth(false);
            setFlingDirection(null);
            isSwitchingRef.current = false;
            setClothDrag({
              dx: 0,
              dy: 0,
              originX: 50,
              originY: 50,
              rotX: 0,
              rotY: 0,
              rotZ: 0,
              skewX: 0,
              skewY: 0,
              scale: 1
            });
          }, 240);
          dragStartRef.current = null;
          return;
        }

        // Soltar en cualquier otro lugar de la pantalla: vuelve suavemente a su posición y tamaño original
        setIsRebounding(true);
        setClothDrag({
          dx: 0,
          dy: 0,
          originX: 50,
          originY: 50,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          skewX: 0,
          skewY: 0,
          scale: 1
        });
        setTimeout(() => {
          setIsDraggingCloth(false);
          setIsRebounding(false);
          setFlingDirection(null);
        }, 320);
      } else {
        togglePlay();
      }

      dragStartRef.current = null;
    };

    window.addEventListener('pointermove', onGlobalMove);
    window.addEventListener('pointerup', onGlobalUp);
  };

  // Overlay features
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#00ff88');
  const [brushSize, setBrushSize] = useState(4);
  const [isPinMode, setIsPinMode] = useState(false);
  const [pendingPinCoords, setPendingPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [pinText, setPinText] = useState('');
  const [hoveredPin, setHoveredPin] = useState<CommentPin | null>(null);

  // Subtitles & AI Translation
  const [showCaptions, setShowCaptions] = useState(true);
  const [captionLang, setCaptionLang] = useState<'es' | 'en' | 'nah' | 'ja'>('es');
  const [activeCaption, setActiveCaption] = useState('QuanticTube: Bienvenido a la transmisión cuántica.');

  // Particles / Reactions
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Drawing state
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Trigger floating reaction particles
  const triggerReaction = (icon: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x: rect.width * 0.85 + (Math.random() - 0.5) * 60,
        y: rect.height * 0.85,
        icon,
        size: Math.random() * 14 + 20,
        speedY: Math.random() * 3 + 2.5,
        speedX: (Math.random() - 0.5) * 2,
        opacity: 1,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }

    if (onLike) onLike();
  };

  // Particle animation loop
  useEffect(() => {
    const canvas = reactionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const loop = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.y -= p.speedY;
        p.x += p.speedX;
        p.opacity -= 0.012;
        p.rotation += p.rotSpeed;

        if (p.opacity <= 0 || p.y < 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.font = `${p.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.icon, 0, 0);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Update canvas size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (canvasRef.current) {
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
        }
        if (reactionCanvasRef.current) {
          reactionCanvasRef.current.width = rect.width;
          reactionCanvasRef.current.height = rect.height;
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Sync video time & dynamic simulated captions
  const handleTimeUpdate = (overrideTime?: number) => {
    const t = typeof overrideTime === 'number' ? overrideTime : (videoRef.current?.currentTime || currentTime);
    if (typeof overrideTime !== 'number') {
      setCurrentTime(t);
    }

    // Dynamic AI Subtitles simulation based on video timeline
    const captionsData: Record<string, Record<'es' | 'en' | 'nah' | 'ja', string>> = {
      p1: {
        es: `Iniciando conexión con el nodo cuántico ${new Date().getFullYear()}...`,
        en: `Establishing uplink with quantum node ${new Date().getFullYear()}...`,
        nah: `Tlazohcamati: Pehua tlen QuanticTube ${new Date().getFullYear()}...`,
        ja: `QuanticTube ${new Date().getFullYear()} ノードとの通信を開始しています...`
      },
      p2: {
        es: 'Sincronizando flujos de video con motor de renderizado cuántico.',
        en: 'Synchronizing video streams with quantum neural rendering.',
        nah: 'Tlayehyecoliztli: Ipan QuanticTube tlanextli.',
        ja: '量子ニューラルレンダリングと映像ストリームを同期中。'
      },
      p3: {
        es: 'QuanticTube: ¡Deja tus comentarios espaciales sobre la pantalla!',
        en: 'QuanticTube: Pin your spatial comments directly on screen!',
        nah: 'QuanticTube: Xik tlalili moyolotl ipan tlahtolli!',
        ja: 'QuanticTube：画面上のどこにでも空間コメントをピン留めできます！'
      }
    };

    if (t < 4) {
      setActiveCaption(captionsData.p1[captionLang]);
    } else if (t < 9) {
      setActiveCaption(captionsData.p2[captionLang]);
    } else {
      setActiveCaption(captionsData.p3[captionLang]);
    }
  };

  // Pre-load thumbnail image for preview
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = video.thumbnailUrl;
    img.onload = () => {
      loadedThumbImgRef.current = img;
    };
    loadedThumbImgRef.current = img;
  }, [video.thumbnailUrl]);

  // Snapshot Capture (Captura de Fotograma 4K)
  const takeSnapshot = () => {
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 1920;
    snapCanvas.height = 1080;
    const ctx = snapCanvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame from native video element
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
    }

    // If there is drawing on the overlay, draw it on top
    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
    }

    // Add QuanticTube watermark
    ctx.font = 'bold 32px Orbitron, sans-serif';
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.fillText(`⚡ QUANTICTUBE ${new Date().getFullYear()} • SNAPSHOT 4K`, 40, snapCanvas.height - 40);

    const dataUrl = snapCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `QuanticTube_Snapshot_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Drawing handlers on the live canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;
    isDrawing.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    lastPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !isDrawing.current || !canvasRef.current || !lastPos.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = brushColor;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastPos.current = { x: currentX, y: currentY };
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const clearDrawing = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Spatial Pin Placement
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPinMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingPinCoords({ x, y });
  };

  const submitCommentPin = () => {
    if (!pendingPinCoords || !pinText.trim()) return;
    const newPin: CommentPin = {
      id: `pin-${Date.now()}`,
      xPercent: pendingPinCoords.x,
      yPercent: pendingPinCoords.y,
      timeSeconds: Math.floor(currentTime),
      author: 'Comandante_Quantic',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      text: pinText.trim(),
      createdAt: 'Ahora'
    };

    if (onAddPin) {
      onAddPin(newPin);
    }
    setPendingPinCoords(null);
    setPinText('');
    setIsPinMode(false);
  };

  const hasCrossedThreshold = Math.abs(clothDrag.dx) > 90 || Math.abs(clothDrag.dy) > 80;
  const clothAngle = Math.round((Math.atan2(clothDrag.dy, clothDrag.dx) * 180) / Math.PI);

  // High-fidelity cloth physics deformation calculation
  const clothDeformation = useMemo(() => {
    const w = containerRef.current?.clientWidth || 800;
    const h = containerRef.current?.clientHeight || 450;
    return computeClothDeformation(
      clothDrag.dx,
      clothDrag.dy,
      clothDrag.originX,
      clothDrag.originY,
      w,
      h,
      isFlingingOut
    );
  }, [clothDrag.dx, clothDrag.dy, clothDrag.originX, clothDrag.originY, isFlingingOut]);

  const clothTransformStyle: React.CSSProperties = isFlingingOut
    ? {
        transform:
          flingDirection === 'up'
            ? `perspective(1400px) translate3d(${clothDrag.dx}px, -1400px, -250px) rotateX(45deg) scale(0.35)`
            : `perspective(1400px) translate3d(${clothDrag.dx}px, 1400px, -250px) rotateX(-45deg) scale(0.35)`,
        opacity: 0,
        transition: 'transform 0.24s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease-in',
        transformOrigin: `${clothDrag.originX}% ${clothDrag.originY}%`,
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        pointerEvents: 'none'
      }
    : isDraggingCloth
    ? {
        transform: `perspective(1400px) translate3d(${clothDrag.dx}px, ${clothDrag.dy}px, 0) rotateX(${clothDeformation.rotX}deg) rotateY(${clothDeformation.rotY}deg) rotateZ(${clothDeformation.rotZ}deg) scale(${clothDeformation.scale})`,
        transformOrigin: `${clothDrag.originX}% ${clothDrag.originY}%`,
        transition: isRebounding ? 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d'
      }
    : {
        transform: 'none',
        transition: 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden'
      };

  return (
    <>
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className={`relative group bg-[#060810] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl transition-all select-none ${
          compact ? 'aspect-video' : video.format === '9:16' ? 'max-w-sm mx-auto aspect-[9/16]' : 'w-full aspect-video'
        }`}
      >
        {/* 0. INCOMING VIDEO SITTING IN PLACE: Revealed right in its spot as the active video is pulled away */}
        {(isDraggingCloth || isFlingingOut) && (nextVideo || prevVideo) && (
          <div className="absolute inset-0 z-0 bg-[#060912] flex items-center justify-center overflow-hidden pointer-events-none animate-in fade-in">
            <img
              src={(clothDrag.dy < 0 ? nextVideo : prevVideo)?.thumbnailUrl || nextVideo?.thumbnailUrl}
              alt="Incoming Video in place"
              className="w-full h-full object-cover opacity-100 filter-none"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#00ff88]/30 border border-[#00ff88] text-[#00ff88] text-[11px] font-mono font-bold shadow-lg shadow-[#00ff88]/20 flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3 h-3 text-[#00ff88]" />
                  {clothDrag.dy < 0 ? 'SIGUIENTE VIDEO PREPARADO EN SU LUGAR' : 'VIDEO ANTERIOR PREPARADO EN SU LUGAR'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-black/60 px-2 py-0.5 rounded-md border border-emerald-500/40">
                  16:9 ULTRA HD NÍTIDO
                </span>
              </div>
              <h3 className="font-orbitron font-bold text-base sm:text-lg text-white truncate drop-shadow-md">
                {(clothDrag.dy < 0 ? nextVideo : prevVideo)?.title || nextVideo?.title}
              </h3>
              <p className="text-xs text-cyan-300 font-mono font-semibold">
                {(clothDrag.dy < 0 ? nextVideo : prevVideo)?.creator.name || nextVideo?.creator.name}
              </p>
            </div>
          </div>
        )}

        {/* 1. CLOTH SHEET WRAPPER (In-place video & controls when not floating) */}
        <div
          onPointerDown={handleClothPointerDown}
          className={`relative w-full h-full z-10 touch-none cursor-grab active:cursor-grabbing transition-opacity ${
            isDraggingCloth || isFlingingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
        {/* Live Ultra-HD Video Element or Embedded Video (YouTube/Vimeo/Drive/DailyMotion) */}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={currentSrc || effectiveSrc}
            poster={video.thumbnailUrl}
            playsInline
            autoPlay
            muted={isMuted}
            loop
            preload="auto"
            onLoadedMetadata={() => {
              if (videoRef.current && videoRef.current.duration) {
                setDuration(videoRef.current.duration);
              }
            }}
            onTimeUpdate={() => {
              if (videoRef.current) {
                const cur = videoRef.current.currentTime;
                setCurrentTime(cur);
                handleTimeUpdate(cur);
              }
            }}
            onPlay={() => {
              setIsPlaying(true);
              setIsAutoStarting(false);
            }}
            onPlaying={() => {
              setIsPlaying(true);
              setIsAutoStarting(false);
            }}
            onPause={() => {
              if (videoRef.current && !videoRef.current.seeking) {
                setIsPlaying(false);
              }
            }}
            onError={handleVideoError}
            className="w-full h-full object-cover select-none"
          />
        )}

        {/* Video Error Recovery Overlay */}
        <VideoErrorRecoveryOverlay
          isRecovering={isRecovering}
          retryCount={retryCount}
          hasFailedPermanently={hasFailedPermanently}
          onRetry={manualRetry}
          onFallback={forceFallback}
        />

        {/* Video Switch Notification Badge */}
        {loadedNotification && !isRecovering && (
          <div className="absolute top-4 right-4 z-40 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-[#00ff88] text-[#00ff88] text-xs font-mono font-bold shadow-xl backdrop-blur-md flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
            <span className="truncate max-w-[240px] sm:max-w-sm">▶ {loadedNotification}</span>
          </div>
        )}

        {/* Subtle Autoplay Loading Indicator when starting */}
        {isAutoStarting && !isPlaying && !hasFailedPermanently && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-[1px] pointer-events-none animate-in fade-in duration-150">
            <div className="px-4 py-2 rounded-2xl bg-black/85 border border-[#00ff88]/60 shadow-[0_0_25px_rgba(0,255,136,0.3)] backdrop-blur-md flex items-center gap-2.5 text-[#00ff88] text-xs font-mono font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping" />
              <span>{language === 'es' ? 'INICIANDO REPRODUCCIÓN AUTOMÁTICA...' : 'STARTING AUTOPLAY...'}</span>
            </div>
          </div>
        )}

        {/* Floating Quick Unmute Banner when playing muted due to browser policy */}
        {isMuted && isPlaying && !isDraggingCloth && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="absolute top-4 left-4 z-40 px-3 py-1.5 rounded-full bg-black/90 hover:bg-[#00ff88] border border-[#00ff88] text-[#00ff88] hover:text-black text-xs font-mono font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer animate-pulse pointer-events-auto"
            title="Hacer clic para activar audio"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>🔊 ACTIVAR SONIDO</span>
          </button>
        )}

        {/* Big Center Play Indicator Button when paused */}
        {!isPlaying && !isAutoStarting && !isDraggingCloth && !hasFailedPermanently && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/45 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-200">
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                togglePlay();
              }}
              aria-label="Reproducir video"
              className="group/btn relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black/90 border-2 border-[#00ff88] text-[#00ff88] flex items-center justify-center shadow-[0_0_40px_rgba(0,255,136,0.6)] hover:scale-110 active:scale-95 hover:bg-[#00ff88] hover:text-black transition-all cursor-pointer pointer-events-auto"
            >
              {/* Outer pulsing ring */}
              <span className="absolute -inset-2 rounded-full border border-[#00ff88]/50 animate-ping pointer-events-none opacity-75" />
              <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-current ml-1.5 transition-transform group-hover/btn:scale-110" />
            </button>
            <span className="mt-3 px-3 py-1 rounded-full bg-black/80 border border-[#00ff88]/40 text-[#00ff88] text-[11px] font-orbitron font-bold tracking-wider shadow-lg flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#00ff88]" />
              CLIC PARA REPRODUCIR (ESPACIO / K)
            </span>
          </div>
        )}

        {/* Ephemeral HUD Flash OSD Banner (▶ REPRODUCIENDO / ⏸ PAUSA) */}
        {flashOsd && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none animate-in zoom-in-75 fade-in duration-150">
            <div className={`px-5 py-3 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center gap-3 font-orbitron font-black text-sm sm:text-base border ${
              flashOsd === 'play'
                ? 'bg-black/90 text-[#00ff88] border-[#00ff88] shadow-[#00ff88]/60'
                : 'bg-black/90 text-amber-400 border-amber-400 shadow-amber-500/50'
            }`}>
              {flashOsd === 'play' ? (
                <>
                  <div className="p-2 rounded-xl bg-[#00ff88]/20 border border-[#00ff88]">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <span>▶ EN REPRODUCCIÓN (60 FPS)</span>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400">
                    <Pause className="w-5 h-5 fill-current" />
                  </div>
                  <span>⏸ EN PAUSA</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Transparent Drawing Canvas Overlay */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`absolute inset-0 w-full h-full z-20 ${
            isDrawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
          }`}
        />

        {/* Floating Reaction Particles Canvas */}
        <canvas
          ref={reactionCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-30"
        />

        {/* Spatial Comment Pins Layer */}
        <div className="absolute inset-0 pointer-events-none z-20">
          {video.pins.map((pin) => (
            <div
              key={pin.id}
              style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group/pin cursor-pointer transition-transform hover:scale-125"
              onMouseEnter={() => setHoveredPin(pin)}
              onMouseLeave={() => setHoveredPin(null)}
            >
              <div className="relative">
                <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-r from-[#00ff88] via-white to-[#ff0055] shadow-lg shadow-[#00ff88]/40 animate-pulse">
                  <img
                    src={pin.avatar}
                    alt={pin.author}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00ff88] rounded-full border border-black flex items-center justify-center text-[7px] font-bold text-black">
                  {pin.timeSeconds}s
                </div>
              </div>

              {/* Pin popover tooltip */}
              {hoveredPin?.id === pin.id && (
                <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl bg-slate-900/95 border border-[#00ff88]/50 shadow-2xl backdrop-blur-md text-xs text-slate-100 z-50">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-[#00ff88]">{pin.author}</span>
                    <span>@{pin.timeSeconds}s</span>
                  </div>
                  <p className="text-slate-200">{pin.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pending Pin Modal Input */}
        {pendingPinCoords && (
          <div
            style={{
              left: `${Math.min(80, Math.max(20, pendingPinCoords.x))}%`,
              top: `${Math.min(75, Math.max(20, pendingPinCoords.y))}%`
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-40 w-64 p-3 bg-slate-900/95 border border-[#00ff88] rounded-xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 pointer-events-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-orbitron text-[#00ff88] flex items-center gap-1">
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Pin en {Math.floor(currentTime)}s
              </span>
              <button
                onClick={() => setPendingPinCoords(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={pinText}
              onChange={(e) => setPinText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitCommentPin()}
              placeholder="Escribe tu comentario espacial..."
              autoFocus
              className="w-full px-2.5 py-1.5 bg-black/70 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#00ff88] mb-2"
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setPendingPinCoords(null)}
                className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={submitCommentPin}
                className="px-2.5 py-1 text-[11px] font-bold rounded bg-[#00ff88] text-black hover:bg-emerald-400 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Fijar Pin
              </button>
            </div>
          </div>
        )}

        {/* AI Subtitles / Captions Banner */}
        {showCaptions && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-1.5 max-w-[90%] rounded-xl bg-black/75 backdrop-blur-md border border-slate-700/50 text-center z-20 pointer-events-none animate-in fade-in">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mb-0.5 font-rajdhani">
              <Languages className="w-3 h-3 text-[#00ff88]" />
              <span className="uppercase tracking-wider">
                Subtítulos IA ({captionLang === 'es' ? 'Español' : captionLang === 'en' ? 'English' : captionLang === 'nah' ? 'Náhuatl Cyber' : '日本語'})
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-white drop-shadow-md">
              {activeCaption}
            </p>
          </div>
        )}

        {/* Dynamic High-Definition Cloth Creases, Silk Hem & Folds Overlay (Visible while dragging or flinging) */}
        {(isDraggingCloth || isFlingingOut) && (
          <svg
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible"
          >
            {/* Stitched Silk Hem along the dynamic draped perimeter */}
            <path
              d={clothDeformation.hemPath}
              fill="none"
              stroke="#00ff88"
              strokeWidth="0.005"
              strokeDasharray="0.02 0.01"
              opacity="0.85"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={clothDeformation.hemPath}
              fill="none"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="0.002"
              vectorEffect="non-scaling-stroke"
            />

            {/* Dynamic Silk Folds & Tension Wrinkles radiating from finger grip */}
            {clothDeformation.folds.map((fold, idx) => (
              <g key={idx} opacity={fold.opacity}>
                {/* Soft shadow groove */}
                <path
                  d={fold.shadowD}
                  fill="none"
                  stroke="rgba(0, 0, 0, 0.45)"
                  strokeWidth="0.016"
                  strokeLinecap="round"
                />
                {/* Specular highlight crest */}
                <path
                  d={fold.d}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.45)"
                  strokeWidth="0.007"
                  strokeLinecap="round"
                />
              </g>
            ))}

            {/* Tactile Concentric Gather Rings at the finger grab point */}
            <circle
              cx={clothDeformation.pinchPoint.x}
              cy={clothDeformation.pinchPoint.y}
              r="0.03"
              fill="none"
              stroke="#00ff88"
              strokeWidth="0.004"
              opacity="0.9"
              strokeDasharray="0.01 0.008"
            />
            <circle
              cx={clothDeformation.pinchPoint.x}
              cy={clothDeformation.pinchPoint.y}
              r="0.015"
              fill="#00ff88"
              opacity="0.75"
            />
          </svg>
        )}

        {/* Drag Feedback Indicator Badge */}
        {isDraggingCloth && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-in fade-in zoom-in-95">
            <div
              className={`px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-2xl flex items-center gap-2.5 font-orbitron font-bold text-xs transition-all ${
                hasCrossedThreshold
                  ? 'bg-[#00ff88] text-black shadow-[#00ff88]/50 scale-110'
                  : 'bg-black/85 text-white border border-[#00ff88]/60 shadow-black'
              }`}
            >
              <Hand className="w-4 h-4 animate-bounce" />
              <span>
                {clothDrag.dy <= -75
                  ? '¡TOPE SUPERIOR ALCANZADO! SUELTA PARA EL SIGUIENTE'
                  : clothDrag.dy >= 75
                  ? '¡TOPE INFERIOR ALCANZADO! SUELTA PARA EL ANTERIOR'
                  : clothDrag.dy < 0
                  ? 'DESLIZANDO HACIA ARRIBA (Llega al tope para el siguiente)'
                  : 'DESLIZANDO HACIA ABAJO (Llega al tope para el anterior)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Reaction Quick Bar on the Right */}
      <div className="absolute right-3 bottom-20 flex flex-col gap-2 z-30 pointer-events-auto">
        <button
          onClick={() => triggerReaction('❤️')}
          title="Corazón Neón"
          className="w-10 h-10 rounded-full bg-slate-900/80 hover:bg-[#ff0055]/30 border border-slate-700 hover:border-[#ff0055] text-white flex items-center justify-center text-lg shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          ❤️
        </button>
        <button
          onClick={() => triggerReaction('🔥')}
          title="Fuego Azteca"
          className="w-10 h-10 rounded-full bg-slate-900/80 hover:bg-amber-500/30 border border-slate-700 hover:border-amber-400 text-white flex items-center justify-center text-lg shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          🔥
        </button>
        <button
          onClick={() => triggerReaction('🌮')}
          title="Taco Neón"
          className="w-10 h-10 rounded-full bg-slate-900/80 hover:bg-[#00ff88]/30 border border-slate-700 hover:border-[#00ff88] text-white flex items-center justify-center text-lg shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          🌮
        </button>
        <button
          onClick={() => triggerReaction('💀')}
          title="Calavera Cyber"
          className="w-10 h-10 rounded-full bg-slate-900/80 hover:bg-cyan-500/30 border border-slate-700 hover:border-cyan-400 text-white flex items-center justify-center text-lg shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          💀
        </button>
        <button
          onClick={() => triggerReaction('🌹')}
          title="Rosa Neón"
          className="w-10 h-10 rounded-full bg-slate-900/80 hover:bg-rose-500/30 border border-slate-700 hover:border-rose-400 text-white flex items-center justify-center text-lg shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          🌹
        </button>
      </div>

      {/* Top Bar Overlay Tools (Drawing, Pins, Captions, Snapshot) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-30 opacity-90 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-md">
          {/* Drawing Tool */}
          <button
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            title="Lienzo de dibujo en vivo"
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
              isDrawingMode
                ? 'bg-[#00ff88] text-black font-bold shadow-md shadow-[#00ff88]/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dibujar</span>
          </button>

          {/* Pin Tool */}
          <button
            onClick={() => setIsPinMode(!isPinMode)}
            title="Fijar comentario espacial en X,Y"
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
              isPinMode
                ? 'bg-[#ff0055] text-white font-bold shadow-md shadow-[#ff0055]/40 animate-pulse'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fijar Pin</span>
          </button>

          {/* Subtitles toggle */}
          <button
            onClick={() => setShowCaptions(!showCaptions)}
            title="Subtítulos e IA"
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
              showCaptions
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
          </button>

          {showCaptions && (
            <select
              value={captionLang}
              onChange={(e) => setCaptionLang(e.target.value as 'es' | 'en' | 'nah' | 'ja')}
              className="bg-slate-900 border border-slate-700 text-[10px] text-cyan-300 rounded px-1.5 py-0.5 focus:outline-none"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="nah">Náhuatl</option>
              <option value="ja">日本語</option>
            </select>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 backdrop-blur-md">
          {/* 3D Cloth Physics Badge */}
          <div
            title="Efecto Pañuelo 3D: Haz clic y jala el video como tela en cualquier dirección para cambiar de video"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono cursor-grab"
          >
            <Hand className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden md:inline">Jala como Pañuelo</span>
          </div>

          {/* Snapshot 4K button */}
          <button
            onClick={takeSnapshot}
            title="Captura de fotograma 4K"
            className="p-1.5 rounded-lg text-slate-300 hover:text-[#00ff88] hover:bg-slate-800 transition-all flex items-center gap-1 text-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">4K Snapshot</span>
          </button>
        </div>
      </div>

      {/* Floating Drawing Palette (When Drawing Mode is Active) */}
      {isDrawingMode && (
        <div className="absolute top-14 left-3 p-2 rounded-xl bg-slate-950/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-2 z-40">
          <div className="flex items-center gap-1">
            {['#00ff88', '#ffffff', '#ff0055', '#00f5ff', '#ffd700'].map((c) => (
              <button
                key={c}
                onClick={() => setBrushColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full border ${
                  brushColor === c ? 'border-white scale-125 shadow-md' : 'border-transparent opacity-80'
                } transition-all`}
              />
            ))}
          </div>

          <div className="w-[1px] h-4 bg-slate-700" />

          {/* Size slider */}
          <input
            type="range"
            min="2"
            max="16"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-16 accent-[#00ff88]"
          />

          <button
            onClick={clearDrawing}
            title="Limpiar trazos"
            className="p-1 rounded bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-8 z-30 transition-opacity">
        {/* Timeline Progress Bar */}
        <div className="relative mb-2 flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              const newTime = Number(e.target.value);
              setCurrentTime(newTime);
              if (videoRef.current) videoRef.current.currentTime = newTime;
            }}
            className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-[#00ff88]"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-[#00ff88] hover:text-black transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="text-slate-300 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00ff88]"
              />
            </div>

            <span className="text-[11px] font-mono text-slate-300">
              {Math.floor(currentTime / 60)}:{('0' + Math.floor(currentTime % 60)).slice(-2)} /{' '}
              {Math.floor(duration / 60)}:{('0' + Math.floor(duration % 60)).slice(-2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed selector */}
            <div className="flex items-center gap-1 text-[11px] bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700">
              {[1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-1 py-0.5 rounded ${
                    playbackSpeed === spd ? 'text-[#00ff88] font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* 2. DETACHED FULL-SCREEN FLOATING CLOTH PORTAL (Wandering freely across the ENTIRE viewport) */}
    {(isDraggingCloth || isFlingingOut || isRebounding) &&
      containerRectRef.current &&
      typeof document !== 'undefined' &&
      createPortal(
        <div
          style={{
            position: 'fixed',
            left: `${containerRectRef.current.left}px`,
            top: `${containerRectRef.current.top}px`,
            width: `${containerRectRef.current.width}px`,
            height: `${containerRectRef.current.height}px`,
            zIndex: 999999,
            pointerEvents: 'none',
            ...clothTransformStyle
          }}
        >
          {/* Dynamic SVG Defs for organic silk catenary clipping */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <clipPath id="quantic-floating-cloth-clip" clipPathUnits="objectBoundingBox">
                <path d={clothDeformation.svgPath} />
              </clipPath>
            </defs>
          </svg>

          <div
            className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-2 border-[#00ff88]/60 bg-black/95 select-none"
            style={{
              clipPath: 'url(#quantic-floating-cloth-clip)',
              boxShadow:
                '0 35px 80px -15px rgba(0, 255, 136, 0.4), 0 50px 100px 0 rgba(0, 0, 0, 0.95)'
            }}
          >
            {/* Ultra HD Crisp Frame (100% sharp rendering without blur) */}
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover filter-none"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />

            {/* Dynamic Silk Stitched Hem & Tension Creases */}
            <svg
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
            >
              <path
                d={clothDeformation.hemPath}
                fill="none"
                stroke="#00ff88"
                strokeWidth="0.005"
                strokeDasharray="0.02 0.01"
                opacity="0.95"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={clothDeformation.hemPath}
                fill="none"
                stroke="rgba(255, 255, 255, 0.7)"
                strokeWidth="0.002"
                vectorEffect="non-scaling-stroke"
              />

              {clothDeformation.folds.map((fold, idx) => (
                <g key={idx} opacity={fold.opacity}>
                  <path
                    d={fold.shadowD}
                    fill="none"
                    stroke="rgba(0, 0, 0, 0.55)"
                    strokeWidth="0.018"
                    strokeLinecap="round"
                  />
                  <path
                    d={fold.d}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.55)"
                    strokeWidth="0.008"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              <circle
                cx={clothDeformation.pinchPoint.x}
                cy={clothDeformation.pinchPoint.y}
                r="0.035"
                fill="none"
                stroke="#00ff88"
                strokeWidth="0.004"
                opacity="0.95"
                strokeDasharray="0.01 0.008"
              />
              <circle
                cx={clothDeformation.pinchPoint.x}
                cy={clothDeformation.pinchPoint.y}
                r="0.018"
                fill="#00ff88"
                opacity="0.9"
              />
            </svg>

            {/* Floating Info Overlay on moving handkerchief */}
            <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex items-end justify-between pointer-events-none z-30">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#00ff88]/30 border border-[#00ff88] text-[#00ff88] text-[11px] font-mono font-bold flex items-center gap-1.5 w-fit shadow-lg shadow-[#00ff88]/30">
                  <Hand className="w-3.5 h-3.5 text-[#00ff88] animate-pulse" />
                  PASEANDO POR LA PANTALLA COMPLETA
                </span>
                <h4 className="font-orbitron font-bold text-base sm:text-lg text-white drop-shadow truncate max-w-sm">
                  {video.title}
                </h4>
                <p className="text-xs text-cyan-300 font-mono font-semibold">
                  {video.creator.name}
                </p>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono font-bold bg-black/80 px-2.5 py-1 rounded-lg border border-emerald-500/50 shadow-md">
                16:9 ULTRA NÍTIDO
              </span>
            </div>
          </div>

          {/* Helper Guide Badge floating directly over the dragged handkerchief */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-40 animate-in fade-in">
            <div
              className={`px-4 py-2 rounded-2xl text-xs font-orbitron font-bold backdrop-blur-md shadow-2xl flex items-center gap-2 transition-all ${
                clothDrag.dy < -120
                  ? 'bg-[#00ff88] text-black shadow-[#00ff88]/60 scale-110'
                  : clothDrag.dy > 120
                  ? 'bg-amber-400 text-black shadow-amber-400/60 scale-110'
                  : 'bg-black/90 text-white border border-[#00ff88]/60'
              }`}
            >
              <Hand className="w-4 h-4 animate-bounce" />
              <span>
                {clothDrag.dy < -120
                  ? '¡LLEVA AL TOPE SUPERIOR PARA EL SIGUIENTE VIDEO!'
                  : clothDrag.dy > 120
                  ? '¡LLEVA AL TOPE INFERIOR PARA EL ANTERIOR VIDEO!'
                  : 'PASEANDO LIBREMENTE • SUBE AL TOPE (SIGUIENTE) O BAJA AL TOPE (ANTERIOR)'}
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
