import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { VideoItem } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  video: VideoItem | null;
  onClose: () => void;
  onConfirm: (videoId: string) => void;
  isShort?: boolean;
  language?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  video,
  onClose,
  onConfirm,
  isShort = false,
  language = 'es'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !video) return null;

  const isSpanish = language === 'es';
  const itemType = isShort ? (isSpanish ? 'Short' : 'Short') : (isSpanish ? 'video' : 'video');

  const handleConfirmClick = () => {
    onConfirm(video.id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0d111d] border border-rose-500/40 rounded-3xl p-6 shadow-2xl shadow-rose-950/50 space-y-5 text-white"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={isSpanish ? 'Cerrar' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Trash2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-base sm:text-lg text-rose-300">
              {isSpanish ? `¿Eliminar este ${itemType}?` : `Delete this ${itemType}?`}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {isSpanish ? 'Esta acción es permanente' : 'This action is permanent'}
            </p>
          </div>
        </div>

        {/* Video Preview Card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/50 border border-slate-800">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback image if broken
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-200 truncate">
              {video.title}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {video.creator.name}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-950/60 border border-rose-500/30 text-rose-300">
              {isShort ? 'Formato 9:16' : 'Formato 16:9'}
            </span>
          </div>
        </div>

        {/* Warning text */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            {isSpanish
              ? `¿Confirmas que deseas borrar "${video.title}"? Se removerá inmediatamente de tu lista de videos y no aparecerá en el reproductor.`
              : `Are you sure you want to delete "${video.title}"? It will be removed immediately from your video list and player.`}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron font-bold text-xs transition-colors cursor-pointer"
          >
            {isSpanish ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-orbitron font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isSpanish ? 'Sí, Eliminar' : 'Yes, Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
