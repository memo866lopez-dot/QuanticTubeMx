import React, { useState, useRef, useMemo } from 'react';
import { Clock, Play, Hand, Trash2 } from 'lucide-react';
import { VideoItem } from '../types';
import { computeClothDeformation } from './ClothPhysics';

interface ClothThumbnailCardProps {
  video: VideoItem;
  isActive: boolean;
  onSelect: () => void;
  viewsLabel: string;
  onStartDragCloth?: (
    video: VideoItem,
    e: React.PointerEvent,
    cardRect: DOMRect
  ) => void;
  isBeingDraggedGlobally?: boolean;
  onDelete?: (video: VideoItem) => void;
}

export const ClothThumbnailCard: React.FC<ClothThumbnailCardProps> = ({
  video,
  isActive,
  onSelect,
  viewsLabel,
  onStartDragCloth,
  isBeingDraggedGlobally,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isFlinging, setIsFlinging] = useState(false);
  const [isRebounding, setIsRebounding] = useState(false);
  const [drag, setDrag] = useState({
    dx: 0,
    dy: 0,
    originX: 50,
    originY: 50
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const dragMovedRef = useRef(false);

  const durationFormatted = `${Math.floor(video.duration / 60)}:${('0' + (video.duration % 60)).slice(-2)}`;
  const clipId = `cloth-thumb-clip-${video.id}`;

  const clothDeformation = useMemo(() => {
    const w = cardRef.current?.clientWidth || 240;
    const h = (w * 9) / 16;
    return computeClothDeformation(
      drag.dx,
      drag.dy,
      drag.originX,
      drag.originY,
      w,
      h,
      isFlinging
    );
  }, [drag.dx, drag.dy, drag.originX, drag.originY, isFlinging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (onStartDragCloth) {
      onStartDragCloth(video, e, rect);
      return;
    }

    const originX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const originY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    dragStartRef.current = { x: e.clientX, y: e.clientY, originX, originY };
    dragMovedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 6) {
      dragMovedRef.current = true;
      setIsDragging(true);
      setIsRebounding(false);
      setDrag({
        dx,
        dy,
        originX: dragStartRef.current.originX,
        originY: dragStartRef.current.originY
      });
    }
  };

  const handlePointerUp = () => {
    if (!dragStartRef.current) return;

    if (dragMovedRef.current && isDragging) {
      const dist = Math.hypot(drag.dx, drag.dy);
      // Fling threshold
      if (dist > 50 || drag.dx > 45) {
        setIsFlinging(true);
        setTimeout(() => {
          onSelect();
          setIsFlinging(false);
          setIsDragging(false);
          setDrag({ dx: 0, dy: 0, originX: 50, originY: 50 });
        }, 220);
      } else {
        setIsRebounding(true);
        setDrag({ dx: 0, dy: 0, originX: 50, originY: 50 });
        setTimeout(() => {
          setIsDragging(false);
          setIsRebounding(false);
        }, 320);
      }
    } else {
      onSelect();
    }

    dragStartRef.current = null;
  };

  const hasCrossed = Math.hypot(drag.dx, drag.dy) > 50 || drag.dx > 45;

  const clothStyle: React.CSSProperties = isFlinging
    ? {
        transform: `perspective(600px) translate3d(${drag.dx > 0 ? 350 : -350}px, ${drag.dy * 1.5}px, -100px) rotateZ(${drag.dx > 0 ? 30 : -30}deg) scale(0.6)`,
        opacity: 0,
        transition: 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease',
        clipPath: `url(#${clipId})`
      }
    : isDragging
    ? {
        transform: `perspective(600px) translate3d(${drag.dx}px, ${drag.dy}px, 0) rotateX(${clothDeformation.rotX * 0.8}deg) rotateY(${clothDeformation.rotY * 0.8}deg) rotateZ(${clothDeformation.rotZ * 0.7}deg) scale(${clothDeformation.scale})`,
        transformOrigin: `${drag.originX}% ${drag.originY}%`,
        transition: isRebounding ? 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
        clipPath: `url(#${clipId})`,
        boxShadow: `0 ${Math.abs(drag.dy) * 0.4 + 10}px ${Math.abs(drag.dx) * 0.4 + 16}px rgba(0,0,0,0.85)`
      }
    : {
        transform: 'none',
        transition: 'transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      };

  return (
    <div
      ref={cardRef}
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', video.id);
        e.dataTransfer.setData('video-id', video.id);
        e.dataTransfer.effectAllowed = 'copyMove';
      }}
      onClick={() => onSelect()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`group relative p-2.5 rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing select-none flex flex-col gap-2 ${
        isBeingDraggedGlobally
          ? 'opacity-30 border-dashed border-[#00ff88]/60 bg-transparent'
          : isActive
          ? 'bg-[#0f1626] border-[#00ff88] shadow-lg shadow-[#00ff88]/20 ring-1 ring-[#00ff88]'
          : 'bg-[#080b13] hover:bg-[#0d1222] border-slate-800/90 hover:border-slate-700'
      }`}
    >
      {/* SVG ClipPath Definition for this thumbnail */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={clothDeformation.svgPath} />
          </clipPath>
        </defs>
      </svg>

      {/* Underneath Reveal Slot */}
      {isDragging && (
        <div className="absolute inset-2.5 rounded-xl bg-slate-900 border border-[#00ff88]/50 flex items-center justify-center p-3 z-0 pointer-events-none">
          <div className="text-center">
            <Play className="w-6 h-6 text-[#00ff88] mx-auto animate-pulse mb-1" />
            <p className="text-[10px] font-mono font-bold text-[#00ff88]">
              {hasCrossed ? '¡SUELTA PARA REPRODUCIR!' : 'JALA PARA REPRODUCIR'}
            </p>
          </div>
        </div>
      )}

      {/* Main Cloth Surface */}
      <div
        style={clothStyle}
        className="relative z-10 will-change-transform transform-gpu"
      >
        {/* Thumbnail Image Container */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black shrink-0">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover select-none pointer-events-none"
            style={{
              imageRendering: '-webkit-optimize-contrast'
            }}
          />

          {/* Playing indicator */}
          {isActive && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full border border-[#00ff88]/60">
                <span className="w-1.5 h-3.5 bg-[#00ff88] animate-pulse rounded-full" />
                <span className="w-1.5 h-5 bg-[#00ff88] animate-pulse delay-75 rounded-full" />
                <span className="w-1.5 h-2.5 bg-[#00ff88] animate-pulse delay-150 rounded-full" />
                <span className="text-[9px] font-mono font-bold text-[#00ff88] ml-1">EN REPRODUCCIÓN</span>
              </div>
            </div>
          )}

          {/* Duration badge */}
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-mono text-white flex items-center gap-1 pointer-events-none">
            <Clock className="w-2.5 h-2.5 text-[#00ff88]" />
            <span>{durationFormatted}</span>
          </div>

          {/* Delete Button (Borrador de video) */}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDelete(video);
              }}
              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/80 hover:bg-rose-950 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-400 transition-all z-20 cursor-pointer shadow-md opacity-80 hover:opacity-100"
              title="Borrar video de la lista"
              aria-label="Borrar video"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
            </button>
          )}

          {/* 16:9 & Cloth Hint Badge */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 pointer-events-none">
            <span className="px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-cyan-300 border border-cyan-500/40">
              16:9
            </span>
            <span className="hidden group-hover:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88] text-[8px] font-mono">
              <Hand className="w-2.5 h-2.5" />
              Jalar
            </span>
          </div>

          {/* Cloth Stitched Hem & Creases Overlay on the Thumbnail */}
          {isDragging && (
            <svg
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
            >
              {/* Hem */}
              <path
                d={clothDeformation.hemPath}
                fill="none"
                stroke="#00ff88"
                strokeWidth="0.01"
                strokeDasharray="0.03 0.015"
                opacity="0.85"
                vectorEffect="non-scaling-stroke"
              />

              {/* Folds */}
              {clothDeformation.folds.map((fold, idx) => (
                <g key={idx} opacity={fold.opacity}>
                  <path
                    d={fold.shadowD}
                    fill="none"
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth="0.02"
                    strokeLinecap="round"
                  />
                  <path
                    d={fold.d}
                    fill="none"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="0.01"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              {/* Finger Pinch Point */}
              <circle
                cx={clothDeformation.pinchPoint.x}
                cy={clothDeformation.pinchPoint.y}
                r="0.04"
                fill="none"
                stroke="#00ff88"
                strokeWidth="0.008"
                strokeDasharray="0.015 0.01"
              />
            </svg>
          )}
        </div>

        {/* Video Meta Info */}
        <div className="space-y-1 mt-2">
          <h4
            className={`text-xs font-bold line-clamp-2 leading-snug transition-colors ${
              isActive ? 'text-[#00ff88]' : 'text-slate-200 group-hover:text-white'
            }`}
          >
            {video.title}
          </h4>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
            <span className="truncate max-w-[130px] text-cyan-400">{video.creator.name}</span>
            <span>{video.metrics.views.toLocaleString()} {viewsLabel}</span>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <span>❤️ {video.metrics.likes.toLocaleString()}</span>
            <span>💬 {video.pins?.length || video.metrics.comments}</span>
          </div>

          {/* Quick Play Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`w-full mt-1 py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isActive
                ? 'bg-[#00ff88]/20 border border-[#00ff88] text-[#00ff88]'
                : 'bg-slate-900 hover:bg-[#00ff88] border border-slate-700 hover:border-[#00ff88] text-slate-300 hover:text-black shadow-sm'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isActive ? 'EN REPRODUCTOR' : 'REPRODUCIR VIDEO'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
