import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Search,
  Video,
  Layers,
  Heart,
  Eye,
  Share2,
  Sparkles,
  Flame,
  Filter,
  Film,
  Plus,
  Clock,
  CheckCircle,
  Bell,
  ChevronDown,
  ChevronUp,
  Radio,
  Tag,
  Trash2
} from 'lucide-react';
import { VideoItem, CommentPin, ShareItemData } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { ConnectedUsersPanel } from './ConnectedUsersPanel';
import { VideoCommentsSection } from './VideoCommentsSection';
import { ClothThumbnailCard } from './ClothThumbnailCard';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { useLanguage } from '../context/LanguageContext';
import { computeClothDeformation } from './ClothPhysics';
import { registerVideoBlob } from '../services/videoBlobService';

interface DraggingClothState {
  video: VideoItem;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  originXPercent: number;
  originYPercent: number;
  startRect: { left: number; top: number; width: number; height: number };
  isOverPlayer: boolean;
  isReturning: boolean;
}

interface LongVideosViewProps {
  videos: VideoItem[];
  activeVideoId: string;
  onSelectVideo: (id: string) => void;
  onAddVideoToFeed?: (video: VideoItem) => void;
  onDeleteVideo?: (videoId: string) => void;
  onAddPin: (videoId: string, pin: CommentPin) => void;
  onLikeVideo: (videoId: string) => void;
  onOpenShareModal: (item: ShareItemData) => void;
  onOpenCreateModal: () => void;
}

export const LongVideosView: React.FC<LongVideosViewProps> = ({
  videos,
  activeVideoId,
  onSelectVideo,
  onAddVideoToFeed,
  onDeleteVideo,
  onAddPin,
  onLikeVideo,
  onOpenShareModal,
  onOpenCreateModal
}) => {
  const { language, t } = useLanguage();
  const [localSearch, setLocalSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('todos');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);

  // Filter 16:9 Long Videos and user uploaded videos
  const longVideos = videos.filter(
    (v) => v.format === '16:9' || !v.format || v.id.startsWith('vid-') || v.id.startsWith('temp-')
  );
  const filteredVideos = longVideos.filter((v) => {
    const q = localSearch.toLowerCase();
    const matchesSearch =
      !q ||
      v.title.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q) ||
      v.creator.name.toLowerCase().includes(q) ||
      v.tags.some((t) => t.toLowerCase().includes(q));

    if (selectedTag === 'ai') return matchesSearch && v.isAIGenerated;
    if (selectedTag === 'cyberpunk') return matchesSearch && v.tags.some((t) => t.toLowerCase().includes('cyber'));
    if (selectedTag === 'synthwave') return matchesSearch && v.tags.some((t) => t.toLowerCase().includes('synth'));
    return matchesSearch;
  });

  const activeVideo =
    videos.find((v) => v.id === activeVideoId) ||
    longVideos.find((v) => v.id === activeVideoId) ||
    longVideos[0] ||
    videos[0];

  // Other videos to display in the left playlist (all filtered videos or all long videos)
  const playlistVideos = filteredVideos.length > 0 ? filteredVideos : longVideos;

  // Next & Previous videos for 3D Cloth / Pañuelo pull physics
  const currentIndex = playlistVideos.findIndex((v) => v.id === activeVideo?.id);
  const nextVideo = playlistVideos.length > 1
    ? playlistVideos[(currentIndex + 1) % playlistVideos.length]
    : undefined;
  const prevVideo = playlistVideos.length > 1
    ? playlistVideos[(currentIndex - 1 + playlistVideos.length) % playlistVideos.length]
    : undefined;

  const [draggingClothVideo, setDraggingClothVideo] = useState<DraggingClothState | null>(null);
  const [isNativeDragOver, setIsNativeDragOver] = useState(false);
  const [selectTrigger, setSelectTrigger] = useState(0);
  const mainPlayerWrapperRef = useRef<HTMLDivElement>(null);
  const dragEnterCountRef = useRef(0);
  const lastSelectedVideoRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const handleSelectVideoWithForce = (id: string) => {
    lastSelectedVideoRef.current = { id, time: Date.now() };
    onSelectVideo(id);
    setSelectTrigger((prev) => prev + 1);
  };

  // Window-level drop listener for direct file drops from desktop
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = Array.from(e.dataTransfer.files).find(
          (f) => f.type.startsWith('video/') || f.name.match(/\.(mp4|webm|mov|mkv|m4v|avi|ogv)$/i)
        );
        if (file) {
          e.preventDefault();
          const newId = `vid-file-${Date.now()}`;
          const blobUrl = registerVideoBlob(newId, file);
          const newVideoItem: VideoItem = {
            id: newId,
            title: file.name.replace(/\.[^/.]+$/, ''),
            description: 'Video cargado directamente arrastrando desde tu equipo.',
            videoUrl: blobUrl,
            thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
            format: '16:9',
            creator: {
              name: 'Tú (Subido)',
              username: '@tu_video',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
              verified: true,
              followers: '1'
            },
            metrics: { views: 1, likes: 1, comments: 0, shares: 0 },
            tags: ['#MiVideo', '#ArchivoLocal', '#QuanticTube'],
            duration: 180,
            publishedAt: 'Recién subido',
            pins: []
          };
          if (onAddVideoToFeed) onAddVideoToFeed(newVideoItem);
          handleSelectVideoWithForce(newId);
        }
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const handleNextVideo = () => {
    if (nextVideo) handleSelectVideoWithForce(nextVideo.id);
  };

  const handlePrevVideo = () => {
    if (prevVideo) handleSelectVideoWithForce(prevVideo.id);
  };

  // High-fidelity cloth deformation for the floating thumbnail
  const floatingClothDeformation = useMemo(() => {
    if (!draggingClothVideo) return null;
    const dx = draggingClothVideo.currentX - draggingClothVideo.startX;
    const dy = draggingClothVideo.currentY - draggingClothVideo.startY;
    return computeClothDeformation(
      Math.abs(dx),
      dy,
      draggingClothVideo.originXPercent,
      draggingClothVideo.originYPercent,
      draggingClothVideo.startRect.width,
      draggingClothVideo.startRect.height,
      false
    );
  }, [draggingClothVideo]);

  // Handle dragging thumbnail across the full screen to drop onto the main player
  const handleStartDragCloth = (video: VideoItem, e: React.PointerEvent, cardRect: DOMRect) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const currentTarget = e.currentTarget as HTMLElement;
    try {
      currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const originXPercent = Math.round(((e.clientX - cardRect.left) / cardRect.width) * 100);
    const originYPercent = Math.round(((e.clientY - cardRect.top) / cardRect.height) * 100);

    const startX = e.clientX;
    const startY = e.clientY;

    const initialDrag: DraggingClothState = {
      video,
      startX,
      startY,
      currentX: e.clientX,
      currentY: e.clientY,
      originXPercent,
      originYPercent,
      startRect: {
        left: cardRect.left,
        top: cardRect.top,
        width: cardRect.width,
        height: cardRect.height
      },
      isOverPlayer: false,
      isReturning: false
    };

    setDraggingClothVideo(initialDrag);

    const onPointerMove = (moveEv: PointerEvent) => {
      const playerEl = mainPlayerWrapperRef.current;
      let isOver = false;
      if (playerEl) {
        const pRect = playerEl.getBoundingClientRect();
        isOver =
          moveEv.clientX >= pRect.left - 50 &&
          moveEv.clientX <= pRect.right + 50 &&
          moveEv.clientY >= pRect.top - 50 &&
          moveEv.clientY <= pRect.bottom + 50;
      }

      setDraggingClothVideo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentX: moveEv.clientX,
          currentY: moveEv.clientY,
          isOverPlayer: isOver
        };
      });
    };

    const cleanup = () => {
      try {
        currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
    };

    const onPointerUp = () => {
      cleanup();
      // Select and play the dragged video immediately
      handleSelectVideoWithForce(video.id);
      setDraggingClothVideo(null);
    };

    const onPointerCancel = () => {
      cleanup();
      handleSelectVideoWithForce(video.id);
      setDraggingClothVideo(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Search Bar */}
      <div className="p-3.5 sm:p-5 rounded-3xl bg-[#0a0d18] border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88]">
              <Film className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-base sm:text-lg text-white flex items-center gap-2">
                {language === 'es' ? 'VIDEOS LARGOS' : 'LONG VIDEOS'}{' '}
                <span className="text-[#00ff88]">16:9 & CINE</span>
              </h2>
              <p className="text-[11px] sm:text-xs font-mono text-slate-400">
                {language === 'es'
                  ? 'Transmisiones 4K, conciertos holográficos, audionotas y videollamadas en vivo'
                  : '4K streams, holographic concerts, audio notes and live video calls'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black font-orbitron font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-md shadow-[#00ff88]/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {language === 'es' ? 'Publicar Video Largo' : 'Publish Long Video'}
          </button>
        </div>

        {/* Search Bar + Quick Category Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00ff88]" />
            <input
              type="text"
              placeholder={
                language === 'es'
                  ? 'Buscar en videos largos (ej. Cyberpunk, Mariachi, Hyperloop, 4K)...'
                  : 'Search long videos (e.g. Cyberpunk, Mariachi, Hyperloop, 4K)...'
              }
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00ff88] transition-colors"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                {language === 'es' ? 'Limpiar' : 'Clear'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'todos', label: language === 'es' ? '🔥 Todos 16:9' : '🔥 All 16:9' },
              { id: 'ai', label: '⚡ IA Veo 3.1' },
              { id: 'cyberpunk', label: '🌆 Cyberpunk' },
              { id: 'synthwave', label: '🎹 Synthwave' }
            ].map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTag === tag.id
                    ? 'bg-[#00ff88] text-black font-bold shadow-md shadow-[#00ff88]/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 3-Column Architecture:
          Col 1 (LEFT): Otros Videos y sus Miniaturas con Scroll
          Col 2 (CENTER): Video Principal 16:9 + Abajo Info/Descripción, Vistas, Likes y Comentarios (Texto con fuentes, colores, tamaños, emojis + Audio)
          Col 3 (RIGHT): Personas Conectadas en Línea con Pantallas Diminutas, Audio & Videollamadas
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 1. LADO IZQUIERDO: Playlist de los demás videos y sus miniaturas con Scroll (lg:col-span-3 2xl:col-span-3) */}
        <aside className="lg:col-span-3 2xl:col-span-3 w-full bg-[#0a0d18] border border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-2xl flex flex-col space-y-3.5">
          {/* Header Playlist */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00ff88]" />
              <h3 className="font-orbitron font-bold text-xs text-white tracking-wider">
                {language === 'es' ? 'DEMÁS VIDEOS 16:9' : 'OTHER 16:9 VIDEOS'}
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/40 text-[#00ff88] font-bold">
              {playlistVideos.length}
            </span>
          </div>

          {/* Subtitle / Tip */}
          <p className="text-[10px] font-mono text-slate-400">
            {language === 'es'
              ? 'Desliza hacia abajo para explorar toda la lista sin estorbar el video:'
              : 'Scroll down to explore the playlist without cluttering below:'}
          </p>

          {/* Scrollable Thumbnails List with Organic Cloth / Pañuelo drag physics */}
          <div className="overflow-y-auto max-h-[820px] pr-1 space-y-3 scrollbar-thin">
            {playlistVideos.map((video) => (
              <ClothThumbnailCard
                key={video.id}
                video={video}
                isActive={activeVideo?.id === video.id}
                onSelect={() => handleSelectVideoWithForce(video.id)}
                viewsLabel={t('player.views', 'vistas')}
                onStartDragCloth={(v, ev, rect) => handleStartDragCloth(v, ev, rect)}
                isBeingDraggedGlobally={draggingClothVideo?.video.id === video.id}
                onDelete={onDeleteVideo ? (v) => setVideoToDelete(v) : undefined}
              />
            ))}
          </div>
        </aside>

        {/* 2. CENTRO: Video Principal + Abajo Información, Vistas, Likes y Comentarios (Texto con fuentes/colores/tamaños/emojis + Audio) (lg:col-span-6 2xl:col-span-6) */}
        <section className="lg:col-span-6 2xl:col-span-6 space-y-4">
          {activeVideo ? (
            <>
              {/* Cinema 16:9 Video Player with 3D Cloth / Pañuelo drag physics & Drop Target */}
              <div
                ref={mainPlayerWrapperRef}
                onPointerUp={() => {
                  if (draggingClothVideo) {
                    handleSelectVideoWithForce(draggingClothVideo.video.id);
                    setDraggingClothVideo(null);
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  dragEnterCountRef.current += 1;
                  setIsNativeDragOver(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  if (!isNativeDragOver) setIsNativeDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  dragEnterCountRef.current = Math.max(0, dragEnterCountRef.current - 1);
                  if (dragEnterCountRef.current === 0) {
                    setIsNativeDragOver(false);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  dragEnterCountRef.current = 0;
                  setIsNativeDragOver(false);

                  // 1. Support direct video file drops from desktop/folders
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = Array.from(e.dataTransfer.files).find(
                      (f) => f.type.startsWith('video/') || f.name.match(/\.(mp4|webm|mov|mkv|m4v|avi|ogv)$/i)
                    );
                    if (file) {
                      const newId = `vid-file-${Date.now()}`;
                      const blobUrl = registerVideoBlob(newId, file);
                      const newVideoItem: VideoItem = {
                        id: newId,
                        title: file.name.replace(/\.[^/.]+$/, ''),
                        description: 'Video cargado directamente arrastrando desde tu equipo.',
                        videoUrl: blobUrl,
                        thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
                        format: '16:9',
                        creator: {
                          name: 'Tú (Subido)',
                          username: '@tu_video',
                          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
                          verified: true,
                          followers: '1'
                        },
                        metrics: { views: 1, likes: 1, comments: 0, shares: 0 },
                        tags: ['#MiVideo', '#ArchivoLocal', '#QuanticTube'],
                        duration: 180,
                        publishedAt: 'Recién subido',
                        pins: []
                      };
                      if (onAddVideoToFeed) onAddVideoToFeed(newVideoItem);
                      handleSelectVideoWithForce(newId);
                      return;
                    }
                  }

                  // 2. Playlist video card drops
                  const droppedId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('video-id');
                  if (droppedId) {
                    handleSelectVideoWithForce(droppedId);
                  }
                }}
                className={`relative rounded-3xl transition-all duration-300 ${
                  draggingClothVideo?.isOverPlayer || isNativeDragOver
                    ? 'ring-4 ring-[#00ff88] shadow-[0_0_50px_rgba(0,255,136,0.35)] scale-[1.01]'
                    : ''
                }`}
              >
                <VideoPlayer
                  key={activeVideo.id}
                  video={activeVideo}
                  selectTrigger={selectTrigger}
                  onAddPin={(pin) => onAddPin(activeVideo.id, pin)}
                  onLike={() => onLikeVideo(activeVideo.id)}
                  onNextVideo={handleNextVideo}
                  onPrevVideo={handlePrevVideo}
                  nextVideo={nextVideo}
                  prevVideo={prevVideo}
                />

                {/* Drop Zone Highlight Overlay when hovering with a cloth thumbnail */}
                {(draggingClothVideo?.isOverPlayer || isNativeDragOver) && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      dragEnterCountRef.current = 0;
                      setIsNativeDragOver(false);

                      // Support direct file drop on overlay
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const file = Array.from(e.dataTransfer.files).find(
                          (f) => f.type.startsWith('video/') || f.name.match(/\.(mp4|webm|mov|mkv|m4v|avi|ogv)$/i)
                        );
                        if (file) {
                          const newId = `vid-file-${Date.now()}`;
                          const blobUrl = registerVideoBlob(newId, file);
                          const newVideoItem: VideoItem = {
                            id: newId,
                            title: file.name.replace(/\.[^/.]+$/, ''),
                            description: 'Video cargado directamente arrastrando desde tu equipo.',
                            videoUrl: blobUrl,
                            thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
                            format: '16:9',
                            creator: {
                              name: 'Tú (Subido)',
                              username: '@tu_video',
                              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
                              verified: true,
                              followers: '1'
                            },
                            metrics: { views: 1, likes: 1, comments: 0, shares: 0 },
                            tags: ['#MiVideo', '#ArchivoLocal', '#QuanticTube'],
                            duration: 180,
                            publishedAt: 'Recién subido',
                            pins: []
                          };
                          if (onAddVideoToFeed) onAddVideoToFeed(newVideoItem);
                          handleSelectVideoWithForce(newId);
                          return;
                        }
                      }

                      const droppedId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('video-id');
                      if (droppedId) {
                        handleSelectVideoWithForce(droppedId);
                      }
                    }}
                    onPointerUp={() => {
                      if (draggingClothVideo) {
                        handleSelectVideoWithForce(draggingClothVideo.video.id);
                        setDraggingClothVideo(null);
                      }
                    }}
                    className={`absolute inset-0 z-40 bg-[#00ff88]/20 backdrop-blur-[2px] rounded-3xl border-2 border-[#00ff88] flex flex-col items-center justify-center animate-in fade-in duration-150 ${
                      draggingClothVideo ? 'pointer-events-none' : 'pointer-events-auto'
                    }`}
                  >
                    <div className="px-5 py-3 rounded-2xl bg-black/95 border-2 border-[#00ff88] shadow-2xl flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-[#00ff88] animate-spin" />
                      <div>
                        <p className="font-orbitron font-bold text-sm text-[#00ff88]">
                          ¡SUELTA AQUÍ PARA CARGAR ESTE VIDEO!
                        </p>
                        {draggingClothVideo?.video?.title && (
                          <p className="text-[11px] text-slate-300 font-mono truncate max-w-xs">
                            {draggingClothVideo.video.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Informacion o Descripcion del Video, Vistas, Likes, Creador */}
              <div className="p-4 sm:p-6 rounded-3xl bg-[#0b0e17] border border-slate-800 space-y-4 shadow-xl">
                {/* Title */}
                <h1 className="font-orbitron font-bold text-base sm:text-xl text-white leading-snug">
                  {activeVideo.title}
                </h1>

                {/* Creator Profile, Subscriber & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={activeVideo.creator.avatar}
                        alt={activeVideo.creator.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#00ff88]/60 shadow-md shadow-[#00ff88]/20"
                      />
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00ff88] rounded-full ring-2 ring-black" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-white">{activeVideo.creator.name}</span>
                        {activeVideo.creator.verified && (
                          <span
                            className="w-4 h-4 rounded-full bg-[#00ff88] text-black text-[10px] font-bold flex items-center justify-center"
                            title="Creador Verificado"
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {activeVideo.creator.followers} {language === 'es' ? 'suscriptores' : 'subscribers'}
                      </span>
                    </div>

                    {/* Subscribe Button */}
                    <button
                      onClick={() => setIsSubscribed(!isSubscribed)}
                      className={`ml-2 px-3.5 py-1.5 rounded-xl font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all ${
                        isSubscribed
                          ? 'bg-slate-800 border border-slate-700 text-slate-300'
                          : 'bg-[#ff0055] hover:bg-[#ff0055]/90 text-white shadow-md shadow-[#ff0055]/30'
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>
                        {isSubscribed
                          ? language === 'es'
                            ? 'Suscrito'
                            : 'Subscribed'
                          : language === 'es'
                          ? 'Suscribirse'
                          : 'Subscribe'}
                      </span>
                    </button>
                  </div>

                  {/* Actions: Likes, Views, Share */}
                  <div className="flex items-center gap-2">
                    {/* Likes Button */}
                    <button
                      onClick={() => onLikeVideo(activeVideo.id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#ff0055] flex items-center gap-2 text-xs font-mono text-slate-200 hover:text-[#ff0055] transition-all active:scale-95"
                      title="Dar me gusta al video"
                    >
                      <Heart className="w-4 h-4 text-[#ff0055] fill-[#ff0055]/30" />
                      <span className="font-bold">{activeVideo.metrics.likes.toLocaleString()}</span>
                    </button>

                    {/* Views Count */}
                    <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-xs font-mono text-slate-300">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span>{activeVideo.metrics.views.toLocaleString()}</span>
                    </div>

                    {/* Share Button */}
                    <button
                      onClick={() =>
                        onOpenShareModal({
                          type: 'video',
                          id: activeVideo.id,
                          title: activeVideo.title,
                          url: window.location.href,
                          previewImage: activeVideo.thumbnailUrl,
                          description: activeVideo.description,
                          author: activeVideo.creator.name
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black font-orbitron font-bold text-xs flex items-center gap-1.5 hover:opacity-95 shadow-md shadow-[#00ff88]/20 transition-opacity cursor-pointer active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{t('player.share', 'Compartir')}</span>
                    </button>

                    {/* Delete Video Button (Borrador) */}
                    {onDeleteVideo && (
                      <button
                        onClick={() => setVideoToDelete(activeVideo)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/80 flex items-center gap-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 transition-all active:scale-95 cursor-pointer shadow-md"
                        title={language === 'es' ? 'Borrar este video' : 'Delete this video'}
                        aria-label="Borrar video"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span className="font-bold">{language === 'es' ? 'Borrar' : 'Delete'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description Box with Expandable toggle */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="text-[#00ff88]">{activeVideo.publishedAt}</span>
                    <span>1080p 60FPS • WebM Spatial HD</span>
                  </div>

                  <p
                    className={`text-xs sm:text-sm text-slate-300 leading-relaxed ${
                      isDescriptionExpanded ? '' : 'line-clamp-2'
                    }`}
                  >
                    {activeVideo.description}
                  </p>

                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <span>{isDescriptionExpanded ? (language === 'es' ? 'Mostrar menos' : 'Show less') : (language === 'es' ? 'Mostrar más...' : 'Show more...')}</span>
                    {isDescriptionExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                    {activeVideo.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ABAJO DEL VIDEO: Sección Completa de Comentarios (Texto con fuentes, colores, tamaños, emojis + Audio) */}
              <VideoCommentsSection
                videoId={activeVideo.id}
                comments={activeVideo.pins || []}
                onAddComment={(pin) => onAddPin(activeVideo.id, pin)}
              />
            </>
          ) : (
            <div className="p-12 rounded-3xl bg-[#0b0e17] border border-slate-800 text-center text-slate-500 font-mono">
              {language === 'es' ? 'No hay videos seleccionados' : 'No videos selected'}
            </div>
          )}
        </section>

        {/* 3. LADO DERECHO: Personas Conectadas en Línea con Pantallas Diminutas, Audio & Videollamadas (lg:col-span-3 2xl:col-span-3) */}
        <div className="lg:col-span-3 2xl:col-span-3 w-full">
          <ConnectedUsersPanel channelCreatorName={activeVideo?.creator.name} />
        </div>
      </div>

      {/* 4. FULLSCREEN FLOATING CLOTH PORTAL (Moves freely across entire screen to drop onto main player) */}
      {draggingClothVideo && floatingClothDeformation && (
        <div className="fixed inset-0 z-50 pointer-events-none select-none">
          <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
            <defs>
              <clipPath id="screen-floating-cloth-clip" clipPathUnits="objectBoundingBox">
                <path d={floatingClothDeformation.svgPath} />
              </clipPath>
            </defs>
          </svg>

          <div
            style={{
              position: 'fixed',
              left: draggingClothVideo.isReturning
                ? draggingClothVideo.startRect.left
                : draggingClothVideo.startRect.left + (draggingClothVideo.currentX - draggingClothVideo.startX),
              top: draggingClothVideo.isReturning
                ? draggingClothVideo.startRect.top
                : draggingClothVideo.startRect.top + (draggingClothVideo.currentY - draggingClothVideo.startY),
              width: draggingClothVideo.startRect.width,
              height: draggingClothVideo.startRect.height,
              transition: draggingClothVideo.isReturning
                ? 'all 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                : 'none',
              transform: `perspective(800px) rotateX(${floatingClothDeformation.rotX}deg) rotateY(${floatingClothDeformation.rotY}deg) rotateZ(${floatingClothDeformation.rotZ}deg) scale(${
                draggingClothVideo.isOverPlayer ? 1.15 : 1.05
              })`,
              transformOrigin: `${draggingClothVideo.originXPercent}% ${draggingClothVideo.originYPercent}%`,
              clipPath: 'url(#screen-floating-cloth-clip)',
              boxShadow: draggingClothVideo.isOverPlayer
                ? '0 25px 50px rgba(0, 255, 136, 0.4), 0 0 35px rgba(0, 255, 136, 0.6)'
                : '0 20px 40px rgba(0, 0, 0, 0.85)'
            }}
            className="rounded-2xl overflow-hidden border-2 border-[#00ff88] shadow-2xl bg-black will-change-transform"
          >
            <img
              src={draggingClothVideo.video.thumbnailUrl}
              alt={draggingClothVideo.video.title}
              className="w-full h-full object-cover select-none pointer-events-none"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />

            {/* Cloth Stitched Hem & Creases Overlay on the floating cloth */}
            <svg
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
            >
              <path
                d={floatingClothDeformation.hemPath}
                fill="none"
                stroke="#00ff88"
                strokeWidth="0.008"
                strokeDasharray="0.02 0.01"
                opacity="0.9"
                vectorEffect="non-scaling-stroke"
              />
              {floatingClothDeformation.folds.map((fold, idx) => (
                <g key={idx} opacity={fold.opacity}>
                  <path
                    d={fold.shadowD}
                    fill="none"
                    stroke="rgba(0,0,0,0.55)"
                    strokeWidth="0.018"
                    strokeLinecap="round"
                  />
                  <path
                    d={fold.d}
                    fill="none"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="0.008"
                    strokeLinecap="round"
                  />
                </g>
              ))}
              <circle
                cx={floatingClothDeformation.pinchPoint.x}
                cy={floatingClothDeformation.pinchPoint.y}
                r="0.035"
                fill="none"
                stroke="#00ff88"
                strokeWidth="0.006"
                strokeDasharray="0.015 0.01"
              />
            </svg>

            {/* Floating Status Badge */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center pointer-events-none z-30">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shadow-lg flex items-center gap-1.5 transition-all ${
                  draggingClothVideo.isOverPlayer
                    ? 'bg-[#00ff88] text-black shadow-[#00ff88]/60 scale-105 animate-bounce'
                    : 'bg-black/90 text-white border border-[#00ff88]/50'
                }`}
              >
                {draggingClothVideo.isOverPlayer
                  ? '¡SUELTA PARA PONER EN EL PRINCIPAL!'
                  : 'JALA HACIA LA DERECHA HASTA EL PRINCIPAL'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Borrador de video) */}
      <DeleteConfirmModal
        isOpen={videoToDelete !== null}
        video={videoToDelete}
        onClose={() => setVideoToDelete(null)}
        onConfirm={(videoId) => {
          if (onDeleteVideo) onDeleteVideo(videoId);
        }}
        isShort={false}
        language={language}
      />
    </div>
  );
};
