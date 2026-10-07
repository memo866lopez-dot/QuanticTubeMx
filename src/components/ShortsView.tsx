import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  MessageCircle,
  Share2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
  Zap,
  Music,
  Hand,
  Flame,
  Layers,
  ArrowUp,
  ArrowDown,
  Upload,
  CheckCircle,
  Film,
  Trash2
} from 'lucide-react';
import { VideoItem, ShareItemData } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { computeClothDeformation } from './ClothPhysics';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { resolveVideoUrl, getSafeVideoUrl, registerVideoBlob, FALLBACK_VIDEOS, getNextFallbackVideo } from '../services/videoBlobService';
import { useVideoErrorRecovery, VideoErrorRecoveryOverlay } from './VideoErrorRecovery';

interface ShortsViewProps {
  videos: VideoItem[];
  activeVideoId?: string;
  onSelectShort?: (videoId: string) => void;
  onLikeVideo: (videoId: string) => void;
  onOpenShareModal: (item: ShareItemData) => void;
  onOpenCreateModal: () => void;
  onAddVideo?: (video: VideoItem) => void;
  onDeleteVideo?: (videoId: string) => void;
}

export const ShortsView: React.FC<ShortsViewProps> = ({
  videos,
  activeVideoId,
  onSelectShort,
  onLikeVideo,
  onOpenShareModal,
  onOpenCreateModal,
  onAddVideo,
  onDeleteVideo
}) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const [localSearch, setLocalSearch] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const shortVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedShortThumbRef = useRef<HTMLImageElement | null>(null);
  const [shortCurrentTime, setShortCurrentTime] = useState(0);
  const [shortFlashOsd, setShortFlashOsd] = useState<'play' | 'pause' | null>(null);
  const shortFlashTimeoutRef = useRef<number | null>(null);

  const [isUploadingShort, setIsUploadingShort] = useState(false);
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const [shortToDelete, setShortToDelete] = useState<VideoItem | null>(null);
  const [isDragOverPlayer, setIsDragOverPlayer] = useState(false);
  const [localResolvedSrc, setLocalResolvedSrc] = useState<string>('');

  const handleConfirmDeleteShort = (videoId: string) => {
    if (onDeleteVideo) {
      onDeleteVideo(videoId);
      setDeleteToast(
        language === 'es'
          ? 'Short eliminado correctamente de tu lista'
          : 'Short successfully deleted from your list'
      );
      setTimeout(() => setDeleteToast(null), 4000);
    }
  };

  const triggerShortOsd = (type: 'play' | 'pause') => {
    setShortFlashOsd(type);
    if (shortFlashTimeoutRef.current) clearTimeout(shortFlashTimeoutRef.current);
    shortFlashTimeoutRef.current = window.setTimeout(() => {
      setShortFlashOsd(null);
    }, 650);
  };

  // Filter 9:16 Short videos
  const shortVideos = useMemo(() => {
    const directShorts = videos.filter((v) => v.format === '9:16');
    return directShorts.length > 0 ? directShorts : videos;
  }, [videos]);

  const filteredShorts = useMemo(() => {
    return shortVideos.filter((v) =>
      v.title.toLowerCase().includes(localSearch.toLowerCase()) ||
      v.description.toLowerCase().includes(localSearch.toLowerCase()) ||
      v.creator.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      v.tags.some((t) => t.toLowerCase().includes(localSearch.toLowerCase()))
    );
  }, [shortVideos, localSearch]);

  // Synchronize activeVideoId with currentIndex when activeVideoId changes
  useEffect(() => {
    if (activeVideoId) {
      const idx = filteredShorts.findIndex((s) => s.id === activeVideoId);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
      }
    }
  }, [activeVideoId, filteredShorts]);

  // Ensure currentIndex stays within bounds when items are deleted
  useEffect(() => {
    if (filteredShorts.length > 0 && currentIndex >= filteredShorts.length) {
      setCurrentIndex(Math.max(0, filteredShorts.length - 1));
    }
  }, [filteredShorts.length, currentIndex]);

  const activeShort = filteredShorts[currentIndex] || filteredShorts[0] || videos[0];

  // Resolve persistent blob from IndexedDB for user uploaded shorts across refreshes
  useEffect(() => {
    let isMounted = true;
    if (activeShort) {
      resolveVideoUrl(activeShort.videoUrl, '9:16', activeShort.title, activeShort.id).then((resolved) => {
        if (isMounted && resolved) {
          setLocalResolvedSrc(resolved);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [activeShort?.id, activeShort?.videoUrl]);

  const effectiveShortSrc = useMemo(() => {
    if (localResolvedSrc) return localResolvedSrc;
    return activeShort ? getSafeVideoUrl(activeShort.videoUrl, activeShort.format, activeShort.id) : '';
  }, [localResolvedSrc, activeShort?.videoUrl, activeShort?.format, activeShort?.id]);

  const {
    currentSrc: shortVideoSrc,
    isRecovering: isShortRecovering,
    retryCount: shortRetryCount,
    hasFailedPermanently: shortHasFailedPermanently,
    handleVideoError: handleShortVideoError,
    manualRetry: manualRetryShort,
    forceFallback: forceFallbackShort
  } = useVideoErrorRecovery({
    videoRef: shortVideoRef,
    initialSrc: effectiveShortSrc,
    videoId: activeShort?.id,
    format: '9:16',
    title: activeShort?.title
  });

  // Ensure video element loads and plays reliably on short change or source resolution
  useEffect(() => {
    const vid = shortVideoRef.current;
    if (!vid) return;

    vid.currentTime = 0;
    vid.load();

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.info('Autoplay unmuted blocked by browser policy, muting to play smoothly:', err);
          vid.muted = true;
          setIsMuted(true);
          vid.play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        });
    }
  }, [activeShort?.id, localResolvedSrc, shortVideoSrc]);

  // Direct short video upload handler
  const handleUploadShortFile = async (file: File) => {
    if (!file || !file.type.startsWith('video/')) return;
    setIsUploadingShort(true);

    try {
      const newShortId = `vid-short-${Date.now()}`;
      const liveBlobUrl = registerVideoBlob(newShortId, file);

      // Auto-extract real video frame thumbnail using canvas
      let generatedThumb = '';
      try {
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.src = liveBlobUrl;
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        await new Promise<void>((resolve) => {
          tempVideo.onloadeddata = () => {
            tempVideo.currentTime = Math.min(1, (tempVideo.duration || 2) * 0.2);
          };
          tempVideo.onseeked = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = tempVideo.videoWidth || 720;
              canvas.height = tempVideo.videoHeight || 1280;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                generatedThumb = canvas.toDataURL('image/jpeg', 0.85);
              }
            } catch {}
            resolve();
          };
          tempVideo.onerror = () => resolve();
          setTimeout(resolve, 1500);
        });
      } catch {}

      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const newShortItem: VideoItem = {
        id: newShortId,
        title: cleanTitle,
        description: 'Short vertical 9:16 publicado y guardado en QuanticTube.',
        videoUrl: liveBlobUrl,
        thumbnailUrl: generatedThumb || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        format: '9:16',
        creator: {
          name: currentUser?.name || 'Memo Lopez',
          username: currentUser?.username || '@memolopez',
          avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          verified: true,
          followers: '14.2K'
        },
        metrics: { views: 1, likes: 1, comments: 0, shares: 0 },
        tags: ['#Shorts', '#QuanticTube', '#Viral', '#916'],
        duration: 30,
        publishedAt: language === 'es' ? 'Recién publicado' : 'Just published',
        pins: []
      };

      if (onAddVideo) {
        onAddVideo(newShortItem);
      }
      if (onSelectShort) {
        onSelectShort(newShortId);
      }
      setCurrentIndex(0);
      setLocalResolvedSrc(liveBlobUrl);

      setUploadToast(
        language === 'es'
          ? `¡Short "${cleanTitle}" subido y listo para reproducir!`
          : `Short "${cleanTitle}" uploaded and ready to play!`
      );
      setTimeout(() => setUploadToast(null), 4500);
    } catch (err) {
      console.warn('Error uploading short:', err);
    } finally {
      setIsUploadingShort(false);
    }
  };

  // Pre-load thumbnail for shorts preview
  React.useEffect(() => {
    if (activeShort?.thumbnailUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activeShort.thumbnailUrl;
      img.onload = () => {
        loadedShortThumbRef.current = img;
      };
      loadedShortThumbRef.current = img;
    }
  }, [activeShort?.thumbnailUrl]);

  const togglePlay = useCallback(() => {
    const vid = shortVideoRef.current;
    if (!vid) return;

    if (vid.paused || vid.ended) {
      vid.play()
        .then(() => {
          setIsPlaying(true);
          triggerShortOsd('play');
        })
        .catch((err) => {
          console.warn('Short play with audio blocked, attempting muted:', err);
          vid.muted = true;
          setIsMuted(true);
          vid.play()
            .then(() => {
              setIsPlaying(true);
              triggerShortOsd('play');
            })
            .catch(() => {});
        });
    } else {
      vid.pause();
      setIsPlaying(false);
      triggerShortOsd('pause');
    }
  }, []);

  const nextShort = filteredShorts.length > 1
    ? filteredShorts[(currentIndex + 1) % filteredShorts.length]
    : undefined;
  const prevShort = filteredShorts.length > 1
    ? filteredShorts[(currentIndex - 1 + filteredShorts.length) % filteredShorts.length]
    : undefined;

  const handleNext = () => {
    if (currentIndex < filteredShorts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(filteredShorts.length - 1);
    }
  };

  // 3D Cloth Physics for Shorts
  const containerRef = useRef<HTMLDivElement>(null);
  const containerRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const dragMovedRef = useRef<boolean>(false);
  const isSwitchingRef = useRef<boolean>(false);

  const [isDraggingCloth, setIsDraggingCloth] = useState(false);
  const [isFlingingOut, setIsFlingingOut] = useState(false);
  const [flingDirection, setFlingDirection] = useState<'up' | 'down' | null>(null);
  const [isRebounding, setIsRebounding] = useState(false);

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

  const handleClothPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) return;
    if (!containerRef.current || isSwitchingRef.current) return;

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

        // 3D silk cloth physics calculations for vertical format
        const rotX = Math.max(-36, Math.min(36, -dy * 0.1));
        const rotY = Math.max(-30, Math.min(30, dx * 0.09));
        const rotZ = Math.max(-24, Math.min(24, dx * 0.04));
        const skewX = Math.max(-12, Math.min(12, dx * 0.035));
        const skewY = Math.max(-14, Math.min(14, dy * 0.045));
        const scale = Math.max(0.82, 1 - dist * 0.00025);

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

        // Top or bottom boundary detection for Shorts
        const currentTop = containerRectRef.current ? containerRectRef.current.top + dy : moveEv.clientY;
        const currentBottom = containerRectRef.current
          ? containerRectRef.current.top + containerRectRef.current.height + dy
          : moveEv.clientY;

        const hitsTop = moveEv.clientY <= 55 || currentTop <= 30;
        const hitsBottom = moveEv.clientY >= window.innerHeight - 55 || currentBottom >= window.innerHeight - 30;

        if (hitsTop) {
          isSwitchingRef.current = true;
          dragStartRef.current = null;
          window.removeEventListener('pointermove', onGlobalMove);
          window.removeEventListener('pointerup', onGlobalUp);
          setIsFlingingOut(true);
          setFlingDirection('up');

          setTimeout(() => {
            handleNext();
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
            handlePrev();
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
        // Release near top or strong upward drag
        if (upEv.clientY <= 110 || clothDrag.dy <= -140) {
          isSwitchingRef.current = true;
          setIsFlingingOut(true);
          setFlingDirection('up');
          setTimeout(() => {
            handleNext();
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

        // Release near bottom or strong downward drag
        if (upEv.clientY >= window.innerHeight - 110 || clothDrag.dy >= 140) {
          isSwitchingRef.current = true;
          setIsFlingingOut(true);
          setFlingDirection('down');
          setTimeout(() => {
            handlePrev();
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

        // Snap back smoothly to original slot
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

  const clothDeformation = useMemo(() => {
    const w = containerRectRef.current?.width || 360;
    const h = containerRectRef.current?.height || 640;
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
    <div className="space-y-6">
      {/* Dedicated Search Header for Shorts */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0d18] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#ff0055] to-[#ff00aa] text-white shadow-lg shadow-[#ff0055]/30">
              <Play className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white flex items-center gap-2">
                {t('shorts.title', 'VIDEOS CORTOS')} <span className="bg-gradient-to-r from-[#ff0055] via-[#ff5500] to-[#00f0ff] bg-clip-text text-transparent font-black">{t('shorts.sub', 'SHORTS 9:16 EN 3D')}</span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {t('shorts.desc', 'Física de pañuelo 3D orgánico, alta nitidez, colores vivos y audio espacial')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff0055]/20 via-pink-500/20 to-cyan-500/20 border border-[#ff0055]/40 text-pink-300 text-xs font-mono shadow-md">
              <Hand className="w-4 h-4 text-[#ff0055] animate-pulse" />
              <span className="font-bold">¡Jala como Pañuelo 3D! (Arriba = Siguiente / Abajo = Anterior)</span>
            </div>

            {/* Direct Quick Upload Button for Shorts */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadShortFile(file);
                  e.target.value = '';
                }
              }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingShort}
              className="px-4 py-2 rounded-xl bg-[#00ff88] hover:bg-[#00e67a] text-black font-orbitron font-bold text-xs flex items-center gap-2 shadow-md shadow-[#00ff88]/30 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              title={language === 'es' ? 'Subir archivo de video directo (MP4, WebM)' : 'Upload video file directly (MP4, WebM)'}
            >
              <Upload className="w-4 h-4" />
              <span>{isUploadingShort ? (language === 'es' ? 'Guardando Short...' : 'Saving Short...') : (language === 'es' ? 'Subir Video Short (MP4)' : 'Upload Short (MP4)')}</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff0055] via-[#ff00aa] to-[#00f0ff] text-white font-orbitron font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-md shadow-[#ff0055]/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {t('shorts.publishBtn', 'Publicar Short 9:16')}
            </button>
          </div>
        </div>

        {/* Upload Success Toast Alert */}
        {uploadToast && (
          <div className="p-3 rounded-2xl bg-[#00ff88]/20 border border-[#00ff88]/60 text-[#00ff88] flex items-center gap-2 text-xs font-mono font-bold animate-in fade-in slide-in-from-top-2 shadow-lg shadow-[#00ff88]/20">
            <CheckCircle className="w-4 h-4 text-[#00ff88] shrink-0" />
            <span>{uploadToast}</span>
          </div>
        )}

        {/* Dedicated Search Bar for Shorts */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ff0055]" />
          <input
            type="text"
            placeholder={t('shorts.searchPlaceholder', 'Buscar en Shorts 9:16 (ej. Mariachi, IA, Viral, Baile, Beat)...')}
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setCurrentIndex(0);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#ff0055] transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* Main Shorts Container */}
      {activeShort ? (
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 py-2">
          {/* Vertical Short Player Container */}
          <div
            ref={containerRef}
            onPointerDown={handleClothPointerDown}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOverPlayer(true);
            }}
            onDragLeave={() => setIsDragOverPlayer(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOverPlayer(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleUploadShortFile(file);
            }}
            className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl shadow-[#ff0055]/25 bg-black group select-none touch-none cursor-grab active:cursor-grabbing"
          >
            {/* 0. INCOMING SHORT SITTING IN PLACE: Revealed as active short is pulled away */}
            {(isDraggingCloth || isFlingingOut) && (nextShort || prevShort) && (
              <div className="absolute inset-0 z-0 bg-[#060912] flex items-center justify-center overflow-hidden pointer-events-none animate-in fade-in">
                <img
                  src={(clothDrag.dy < 0 ? nextShort : prevShort)?.thumbnailUrl || nextShort?.thumbnailUrl}
                  alt="Incoming Short in place"
                  className="w-full h-full object-cover filter-none"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg border animate-pulse ${
                      clothDrag.dy < 0 
                        ? 'bg-[#ff0055]/30 border-[#ff0055] text-white shadow-[#ff0055]/40' 
                        : 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-amber-500/40'
                    }`}>
                      <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
                      {clothDrag.dy < 0 ? '🟢 SIGUIENTE SHORT PREPARADO' : '🟡 SHORT ANTERIOR PREPARADO'}
                    </span>
                  </div>
                  <h3 className="font-orbitron font-bold text-base text-white truncate drop-shadow-lg">
                    {(clothDrag.dy < 0 ? nextShort : prevShort)?.title || nextShort?.title}
                  </h3>
                  <p className="text-xs text-cyan-300 font-mono font-semibold">
                    {(clothDrag.dy < 0 ? nextShort : prevShort)?.creator.name || nextShort?.creator.name}
                  </p>
                </div>
              </div>
            )}

            {/* In-place short video (visible when not dragging) */}
            <div
              className={`relative w-full h-full z-10 transition-opacity ${
                isDraggingCloth || isFlingingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              {/* Native Shorts Video Element */}
              <video
                ref={shortVideoRef}
                src={localResolvedSrc || shortVideoSrc || effectiveShortSrc}
                poster={activeShort.thumbnailUrl}
                playsInline
                loop
                muted={isMuted}
                onPlay={() => {
                  setIsPlaying(true);
                }}
                onPause={() => {
                  setIsPlaying(false);
                }}
                onError={handleShortVideoError}
                onTimeUpdate={() => {
                  if (shortVideoRef.current) {
                    setShortCurrentTime(shortVideoRef.current.currentTime);
                  }
                }}
                className="w-full h-full object-cover select-none"
              />

              {/* Video Error Recovery Overlay */}
              <VideoErrorRecoveryOverlay
                isRecovering={isShortRecovering}
                retryCount={shortRetryCount}
                hasFailedPermanently={shortHasFailedPermanently}
                onRetry={manualRetryShort}
                onFallback={forceFallbackShort}
              />

              {/* Unmute Floating Banner if browser muted autoplay */}
              {isMuted && isPlaying && !shortHasFailedPermanently && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(false);
                    if (shortVideoRef.current) {
                      shortVideoRef.current.muted = false;
                    }
                  }}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#ff0055] to-[#ff00aa] text-white text-[11px] font-orbitron font-bold shadow-xl shadow-[#ff0055]/50 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? '🔊 ACTIVAR SONIDO' : '🔊 UNMUTE AUDIO'}</span>
                </button>
              )}

              {/* Drag over file indicator */}
              {isDragOverPlayer && (
                <div className="absolute inset-0 z-50 bg-[#ff0055]/40 border-4 border-dashed border-[#00ff88] backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                  <Upload className="w-12 h-12 text-[#00ff88] animate-bounce mb-3" />
                  <p className="font-orbitron font-bold text-white text-sm">
                    {language === 'es' ? '¡SUELTA TU VIDEO SHORT AQUÍ!' : 'DROP YOUR SHORT VIDEO HERE!'}
                  </p>
                  <p className="text-[10px] font-mono text-pink-200 mt-1">
                    {language === 'es' ? 'Se guardará en IndexedDB y se reproducirá al instante' : 'Will be saved in IndexedDB and played instantly'}
                  </p>
                </div>
              )}

              {/* Bottom Seekable Progress Bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-20 cursor-pointer hover:h-2.5 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  const vid = shortVideoRef.current;
                  if (vid && vid.duration) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    vid.currentTime = pos * vid.duration;
                    setShortCurrentTime(vid.currentTime);
                  }
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-[#ff0055] via-[#ff00aa] to-[#00f0ff]"
                  style={{
                    width: `${
                      shortVideoRef.current && shortVideoRef.current.duration
                        ? (shortCurrentTime / shortVideoRef.current.duration) * 100
                        : 0
                    }%`
                  }}
                />
              </div>

              {/* Big Center Play Indicator when paused */}
              {!isPlaying && !isDraggingCloth && !shortHasFailedPermanently && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/45 backdrop-blur-[2px] pointer-events-none animate-in fade-in duration-200">
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      togglePlay();
                    }}
                    aria-label="Reproducir Short"
                    className="group/btn relative w-20 h-20 rounded-full bg-black/90 border-2 border-[#ff0055] text-[#ff0055] flex items-center justify-center shadow-[0_0_35px_rgba(255,0,85,0.6)] hover:scale-110 active:scale-95 hover:bg-[#ff0055] hover:text-white transition-all cursor-pointer pointer-events-auto"
                  >
                    <span className="absolute -inset-2 rounded-full border border-[#ff0055]/50 animate-ping pointer-events-none opacity-75" />
                    <Play className="w-10 h-10 fill-current ml-1 transition-transform group-hover/btn:scale-110" />
                  </button>
                  <span className="mt-3 px-3 py-1 rounded-full bg-black/80 border border-[#ff0055]/40 text-[#ff0055] text-[10px] font-orbitron font-bold tracking-wider shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#ff0055]" />
                    CLIC PARA REPRODUCIR
                  </span>
                </div>
              )}

              {/* Ephemeral HUD Flash OSD Banner for Shorts */}
              {shortFlashOsd && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none animate-in zoom-in-75 fade-in duration-150">
                  <div className={`px-4 py-2.5 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center gap-2.5 font-orbitron font-black text-xs border ${
                    shortFlashOsd === 'play'
                      ? 'bg-black/90 text-[#ff0055] border-[#ff0055] shadow-[#ff0055]/60'
                      : 'bg-black/90 text-amber-400 border-amber-400 shadow-amber-500/50'
                  }`}>
                    {shortFlashOsd === 'play' ? (
                      <>
                        <div className="p-1.5 rounded-xl bg-[#ff0055]/20 border border-[#ff0055]">
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                        <span>▶ REPRODUCIENDO</span>
                      </>
                    ) : (
                      <>
                        <div className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-400">
                          <Pause className="w-4 h-4 fill-current" />
                        </div>
                        <span>⏸ EN PAUSA</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

              {/* Top Bar Controls */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <span className="px-2.5 py-1 rounded-full bg-black/70 border border-[#ff0055]/60 text-[10px] font-orbitron font-bold text-white flex items-center gap-1.5 backdrop-blur-md shadow-lg shadow-[#ff0055]/30">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff0055] animate-spin-slow" />
                  {t('shorts.badge', 'SHORT 3D CUÁNTICO')}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-2 rounded-full bg-black/70 border border-slate-700 text-white backdrop-blur-md hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-md"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00ff88]" />}
                </button>
              </div>

              {/* Right Action Sidebar (Likes, Comments, Share) */}
              <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 z-10">
                {/* Creator Avatar */}
                <div className="relative">
                  <img
                    src={activeShort.creator.avatar}
                    alt={activeShort.creator.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#ff0055] shadow-lg shadow-[#ff0055]/40"
                  />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#ff0055] text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                    +
                  </span>
                </div>

                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLikeVideo(activeShort.id);
                  }}
                  className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="p-3 rounded-full bg-black/70 border border-slate-700 hover:border-[#ff0055] hover:text-[#ff0055] backdrop-blur-md shadow-md">
                    <Heart className="w-5 h-5 text-[#ff0055] fill-[#ff0055]/40" />
                  </div>
                  <span className="text-[10px] font-mono font-bold">
                    {activeShort.metrics.likes.toLocaleString()}
                  </span>
                </button>

                {/* Comments Pin Indicator */}
                <div className="flex flex-col items-center gap-1 text-white">
                  <div className="p-3 rounded-full bg-black/70 border border-slate-700 backdrop-blur-md shadow-md">
                    <MessageCircle className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-mono font-bold">
                    {activeShort.pins?.length || activeShort.metrics.comments}
                  </span>
                </div>

                {/* Share Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShareModal({
                      type: 'short',
                      id: activeShort.id,
                      title: activeShort.title,
                      url: activeShort.videoUrl,
                      previewImage: activeShort.thumbnailUrl,
                      description: activeShort.description,
                      author: activeShort.creator.name
                    });
                  }}
                  className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="p-3 rounded-full bg-black/70 border border-slate-700 hover:border-[#00ff88] text-[#00ff88] backdrop-blur-md shadow-md">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold">{t('player.share', 'Compartir')}</span>
                </button>

                {/* Delete Short Button */}
                {onDeleteVideo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShortToDelete(activeShort);
                    }}
                    className="flex flex-col items-center gap-1 text-white hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title={language === 'es' ? 'Eliminar este Short' : 'Delete this Short'}
                  >
                    <div className="p-3 rounded-full bg-black/75 border border-slate-700 hover:border-rose-500 text-rose-400 backdrop-blur-md shadow-md hover:bg-rose-950/60">
                      <Trash2 className="w-5 h-5 text-rose-400" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-rose-400">
                      {language === 'es' ? 'Borrar' : 'Delete'}
                    </span>
                  </button>
                )}
              </div>

              {/* Bottom Details Overlay */}
              <div className="absolute bottom-4 left-4 right-16 space-y-1.5 z-10 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white drop-shadow-md">
                    {activeShort.creator.name}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    {activeShort.creator.username}
                  </span>
                </div>
                <p className="text-xs text-slate-100 font-medium line-clamp-2 drop-shadow">
                  {activeShort.title}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-mono text-[#00ff88]">
                  <Music className="w-3 h-3 animate-spin" />
                  <span className="truncate">{t('shorts.audioTrack', 'Audio Original Cuántico')} • {activeShort.tags[0] || '#Viral'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls and Shorts List Selector */}
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {/* Prev / Next Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="flex-1 py-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-white font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg hover:bg-slate-800"
              >
                <ChevronUp className="w-4 h-4 text-amber-400" /> {t('shorts.prev', 'Anterior Short')}
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#ff0055] via-[#ff00aa] to-[#00f0ff] text-white font-orbitron font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#ff0055]/30 hover:opacity-95 transition-all cursor-pointer"
              >
                {t('shorts.next', 'Siguiente Short')} <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Shorts Feed Mini Grid */}
            <div className="p-4 rounded-3xl bg-[#0a0d18] border border-slate-800 space-y-2.5 shadow-xl">
              <span className="font-orbitron font-bold text-xs text-slate-300 flex items-center justify-between">
                <span>{t('shorts.trending', 'MÁS SHORTS EN TENDENCIA')}</span>
                <span className="text-[10px] font-mono text-[#ff0055]">({filteredShorts.length})</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                {filteredShorts.map((short, idx) => {
                  const isUserUploaded = short.id.startsWith('vid-short-') || (short.id.startsWith('vid-') && !['vid-1','vid-2','vid-3','vid-4','vid-5','vid-6'].includes(short.id));
                  return (
                    <div
                      key={short.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        if (onSelectShort) onSelectShort(short.id);
                      }}
                      className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                        currentIndex === idx
                          ? 'border-[#ff0055] shadow-lg shadow-[#ff0055]/50 scale-105 ring-2 ring-[#ff00aa]/60 z-10'
                          : 'border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={short.thumbnailUrl}
                        alt={short.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                      {isUserUploaded && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-[#00ff88] text-black font-mono font-bold text-[8px] shadow flex items-center gap-0.5">
                          <span>TÚ</span>
                        </span>
                      )}
                      {onDeleteVideo && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShortToDelete(short);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-md bg-black/80 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors z-20 cursor-pointer opacity-70 hover:opacity-100"
                          title={language === 'es' ? 'Eliminar Short' : 'Delete Short'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-[9px] text-white font-bold truncate drop-shadow">
                          {short.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 bg-[#0b0e17] rounded-3xl border border-slate-800">
          {t('shorts.none', 'No se encontraron Shorts')} {localSearch ? `("${localSearch}")` : ''}.
        </div>
      )}

      {/* Floating 3D Cloth Portal for Shorts wandering across the full screen */}
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
            {/* SVG Defs for organic silk catenary clipping */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <clipPath id="quantic-short-cloth-clip" clipPathUnits="objectBoundingBox">
                  <path d={clothDeformation.svgPath} />
                </clipPath>
              </defs>
            </svg>

            <div
              className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-black select-none border-2 border-[#ff0055]"
              style={{
                clipPath: 'url(#quantic-short-cloth-clip)',
                boxShadow:
                  '0 35px 80px -15px rgba(255, 0, 128, 0.6), 0 0 50px rgba(0, 240, 255, 0.4), 0 50px 100px 0 rgba(0, 0, 0, 0.95)'
              }}
            >
              {/* Ultra HD Crisp Short Poster with Vivid Color Enhancement */}
              <img
                src={activeShort.thumbnailUrl}
                alt={activeShort.title}
                className="w-full h-full object-cover filter-none saturate-110 contrast-105"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />

              {/* Dynamic 3D Silk Specular Shine Gradient Layer */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-60 mix-blend-overlay"
                style={{
                  background: `radial-gradient(circle at ${clothDrag.originX}% ${clothDrag.originY}%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 0, 128, 0.4) 40%, rgba(0, 240, 255, 0.2) 70%, transparent 100%)`
                }}
              />

              {/* Dynamic Silk Stitched Hem & Vivid Creases */}
              <svg
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
              >
                {/* Exterior Neon Hem Glow */}
                <path
                  d={clothDeformation.hemPath}
                  fill="none"
                  stroke="#ff007f"
                  strokeWidth="0.008"
                  strokeDasharray="0.02 0.01"
                  opacity="1"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={clothDeformation.hemPath}
                  fill="none"
                  stroke="#00ffff"
                  strokeWidth="0.004"
                  opacity="0.9"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={clothDeformation.hemPath}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.002"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Fabric Tension Creases */}
                {clothDeformation.folds.map((fold, idx) => (
                  <g key={idx} opacity={fold.opacity}>
                    <path
                      d={fold.shadowD}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.7)"
                      strokeWidth="0.022"
                      strokeLinecap="round"
                    />
                    <path
                      d={fold.d}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.85)"
                      strokeWidth="0.01"
                      strokeLinecap="round"
                    />
                  </g>
                ))}

                {/* Pulsing Finger Pinch Point on the Silk */}
                <circle
                  cx={clothDeformation.pinchPoint.x}
                  cy={clothDeformation.pinchPoint.y}
                  r="0.045"
                  fill="none"
                  stroke="#00ffff"
                  strokeWidth="0.006"
                  opacity="0.95"
                  strokeDasharray="0.015 0.01"
                />
                <circle
                  cx={clothDeformation.pinchPoint.x}
                  cy={clothDeformation.pinchPoint.y}
                  r="0.025"
                  fill="#ff0055"
                  opacity="0.95"
                />
                <circle
                  cx={clothDeformation.pinchPoint.x}
                  cy={clothDeformation.pinchPoint.y}
                  r="0.01"
                  fill="#ffffff"
                  opacity="1"
                />
              </svg>

              {/* Floating Short Details Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-end justify-between pointer-events-none z-30">
                <div className="space-y-1">
                  <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#ff0055] to-purple-600 text-white text-[10px] font-mono font-bold flex items-center gap-1.5 w-fit shadow-lg shadow-[#ff0055]/50 border border-white/30">
                    <Hand className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                    PAÑUELO 3D EN MANO
                  </span>
                  <h4 className="font-orbitron font-bold text-sm text-white drop-shadow-md truncate max-w-[200px]">
                    {activeShort.title}
                  </h4>
                  <p className="text-xs text-pink-300 font-mono font-semibold">
                    {activeShort.creator.name}
                  </p>
                </div>
                <span className="text-[10px] text-cyan-300 font-mono font-bold bg-black/80 px-2.5 py-1 rounded-lg border border-cyan-400/60 shadow-md">
                  9:16 ULTRA HD
                </span>
              </div>
            </div>

            {/* Helper Guide Badge floating directly over the dragged Short */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-40 animate-in fade-in">
              <div
                className={`px-4 py-2 rounded-2xl text-xs font-orbitron font-bold backdrop-blur-md shadow-2xl flex items-center gap-2 transition-all border ${
                  clothDrag.dy < -90
                    ? 'bg-gradient-to-r from-[#ff0055] to-[#ff00aa] text-white shadow-[#ff0055]/70 scale-110 border-white'
                    : clothDrag.dy > 90
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-amber-400/70 scale-110 border-white'
                    : 'bg-black/90 text-white border-[#ff0055]/70 shadow-lg shadow-black/80'
                }`}
              >
                <Hand className="w-4 h-4 animate-bounce" />
                <span>
                  {clothDrag.dy < -90
                    ? '⚡ ¡LLEVA AL TOPE SUPERIOR PARA EL SIGUIENTE SHORT!'
                    : clothDrag.dy > 90
                    ? '⚡ ¡LLEVA AL TOPE INFERIOR PARA EL ANTERIOR SHORT!'
                    : 'PASEANDO PAÑUELO • SUBE (SIGUIENTE) O BAJA (ANTERIOR)'}
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
      {/* Delete Confirmation Modal */}
    <DeleteConfirmModal
      isOpen={!!shortToDelete}
      video={shortToDelete}
      onClose={() => setShortToDelete(null)}
      onConfirm={handleConfirmDeleteShort}
      isShort={true}
      language={language}
    />

    {/* Floating Deletion Toast */}
    {deleteToast && (
      <div className="fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-white shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-fadeIn">
        <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="text-xs font-mono font-bold">{deleteToast}</span>
      </div>
    )}
  </div>
  );
};
