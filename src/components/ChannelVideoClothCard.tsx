import React, { useState, useRef, useMemo } from 'react';
import {
  Play,
  Heart,
  Eye,
  Clock,
  Sparkles,
  Share2,
  Maximize2,
  Hand,
  Volume2
} from 'lucide-react';
import { VideoItem, ChannelLedColor } from '../types';
import { computeClothDeformation } from './ClothPhysics';
import { LED_COLOR_CONFIG } from '../services/channelService';

interface ChannelVideoClothCardProps {
  video: VideoItem;
  onSelectVideo: (videoId: string) => void;
  ledColor?: ChannelLedColor;
  isMarqueeActive?: boolean;
}

export const ChannelVideoClothCard: React.FC<ChannelVideoClothCardProps> = ({
  video,
  onSelectVideo,
  ledColor = 'neon-green',
  isMarqueeActive = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [drag, setDrag] = useState({ dx: 0, dy: 0, originX: 50, originY: 50 });
  const [isDraggingCloth, setIsDraggingCloth] = useState(false);
  const [isRebounding, setIsRebounding] = useState(false);
  const [isTextMotionPaused, setIsTextMotionPaused] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const ledConfig = LED_COLOR_CONFIG[ledColor] || LED_COLOR_CONFIG['neon-green'];
  const durationFormatted = `${Math.floor(video.duration / 60)}:${('0' + (video.duration % 60)).slice(-2)}`;

  // 3D Cloth / Pañuelo deformation computation
  const clothDeformation = useMemo(() => {
    const w = cardRef.current?.clientWidth || 320;
    const h = (w * 9) / 16;
    return computeClothDeformation(
      drag.dx,
      drag.dy,
      drag.originX,
      drag.originY,
      w,
      h,
      false
    );
  }, [drag.dx, drag.dy, drag.originX, drag.originY]);

  // Pointer drag for organic 3D cloth deformation
  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const originX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const originY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ dx: 0, dy: 0, originX, originY });
    setIsDraggingCloth(true);
    setIsRebounding(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDrag((prev) => ({ ...prev, dx, dy }));
  };

  const handlePointerUp = () => {
    if (dragStartRef.current) {
      dragStartRef.current = null;
      setIsDraggingCloth(false);
      setIsRebounding(true);
      setDrag((prev) => ({ ...prev, dx: 0, dy: 0 }));
      setTimeout(() => setIsRebounding(false), 380);
    }
  };

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handlePointerUp();
      }}
      className="relative group select-none transition-all duration-300"
    >
      {/* 3D Cloth Perspective Container */}
      <div
        style={{
          transform: isDraggingCloth
            ? `perspective(1000px) rotateX(${clothDeformation.rotX}deg) rotateY(${clothDeformation.rotY}deg) rotateZ(${clothDeformation.rotZ}deg) scale(${clothDeformation.scale}) translate3d(${drag.dx * 0.3}px, ${drag.dy * 0.3}px, 0)`
            : isHovered
            ? `perspective(1000px) rotateX(${-drag.dy * 0.15}deg) rotateY(${drag.dx * 0.15}deg) scale3d(1.02, 1.02, 1)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isDraggingCloth
            ? 'none'
            : isRebounding
            ? 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            : 'transform 0.25s ease-out'
        }}
        className="rounded-2xl overflow-hidden bg-[#0c1021]/90 border border-slate-800 hover:border-[#00ff88]/60 shadow-xl backdrop-blur-md flex flex-col"
      >
        {/* Holographic Glowing Border Accent */}
        <div
          style={{
            borderColor: ledConfig.hex,
            boxShadow: isHovered ? `0 0 20px ${ledConfig.glowRgba}` : 'none'
          }}
          className="absolute inset-0 rounded-2xl border-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20"
        />

        {/* Video Thumbnail with 3D Cloth Physics */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isHovered ? 'scale-105 brightness-110' : 'scale-100'
            }`}
          />

          {/* Holographic Mesh Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

          {/* Cloth Touch Ripple Indicator */}
          {isDraggingCloth && (
            <div
              style={{
                left: `${drag.originX}%`,
                top: `${drag.originY}%`,
                borderColor: ledConfig.hex
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-dashed animate-ping pointer-events-none opacity-60"
            />
          )}

          {/* Quick Play Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectVideo(video.id);
            }}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-900/80 border border-[#00ff88]/60 text-[#00ff88] flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl shadow-[#00ff88]/20 z-10 hover:bg-[#00ff88] hover:text-slate-950"
          >
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </button>

          {/* Duration Badge */}
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-[10px] font-mono font-bold text-white border border-white/10 z-10">
            {durationFormatted}
          </span>

          {/* 3D Cloth Tag Badge */}
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#00ff88]/15 border border-[#00ff88]/40 text-[#00ff88] text-[9px] font-mono font-bold flex items-center gap-1 z-10 backdrop-blur-md">
            <Hand className="w-2.5 h-2.5" />
            <span>PAÑUELO 3D</span>
          </span>

          {video.isAIGenerated && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[9px] font-mono font-bold flex items-center gap-1 z-10 backdrop-blur-md">
              <Sparkles className="w-2.5 h-2.5" />
              <span>VEO 3.1</span>
            </span>
          )}
        </div>

        {/* Video Information with Moving LED / Neon Text */}
        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
          <div>
            {/* MOVING NEON / LED TITLE */}
            <div
              onClick={() => onSelectVideo(video.id)}
              className="cursor-pointer overflow-hidden relative"
              title={video.title}
            >
              <div
                style={{
                  color: ledConfig.hex,
                  textShadow: ledConfig.textShadow
                }}
                className={`text-xs font-mono font-bold tracking-wide whitespace-nowrap ${
                  isMarqueeActive && !isTextMotionPaused ? 'animate-[marquee_14s_linear_infinite]' : ''
                } hover:underline`}
              >
                {video.title} • {video.title}
              </div>
            </div>

            {/* MOVING NEON / LED DESCRIPTION (TICKER) */}
            <div
              className="mt-1.5 overflow-hidden rounded-lg bg-slate-950/70 p-2 border border-slate-800/80 relative"
              title={video.description}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[8px] font-mono uppercase text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Descripción en Movimiento LED:</span>
              </div>
              <div
                style={{
                  color: '#e2e8f0',
                  textShadow: `0 0 5px ${ledConfig.glowRgba}`
                }}
                className={`text-[11px] font-mono leading-tight whitespace-nowrap ${
                  isMarqueeActive && !isTextMotionPaused ? 'animate-[marquee_22s_linear_infinite]' : ''
                }`}
              >
                {video.description} • ★ {video.description}
              </div>
            </div>
          </div>

          {/* Metrics & Interactive Play Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>{video.metrics.views.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-pink-400" />
                <span>{video.metrics.likes.toLocaleString()}</span>
              </span>
            </div>

            {/* Play video action */}
            <button
              onClick={() => onSelectVideo(video.id)}
              className="px-2.5 py-1 rounded-lg bg-[#00ff88]/15 border border-[#00ff88]/40 hover:bg-[#00ff88]/25 text-[#00ff88] font-bold font-mono text-[10px] flex items-center gap-1 transition-all"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Ver Ahora</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
