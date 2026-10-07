import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Layers, Eye, Heart, MessageSquare } from 'lucide-react';
import { VideoItem, CommentPin } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { useLanguage } from '../context/LanguageContext';

interface BookFlipViewProps {
  videos: VideoItem[];
  onAddPin: (videoId: string, pin: CommentPin) => void;
}

export const BookFlipView: React.FC<BookFlipViewProps> = ({ videos, onAddPin }) => {
  const { language, t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');

  const totalPages = videos.length;
  const currentVideo = videos[currentPage] || videos[0];
  const nextVideo = videos[(currentPage + 1) % totalPages];

  const handleNextPage = () => {
    if (isFlipping) return;
    setFlipDirection('next');
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
      setIsFlipping(false);
    }, 600);
  };

  const handlePrevPage = () => {
    if (isFlipping) return;
    setFlipDirection('prev');
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
      setIsFlipping(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <BookOpen className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold font-orbitron text-white">
              {t('book.title', 'NAVEGACIÓN 3D')} <span className="text-cyan-400">{t('book.sub', 'BOOK-FLIP')}</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
              {language === 'es' ? `Página ${currentPage + 1} de ${totalPages}` : `Page ${currentPage + 1} of ${totalPages}`}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {t('book.desc', 'Pasa de página en un entorno 3D holográfico con físicas de perspectiva dimensional.')}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={isFlipping}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 text-xs font-semibold hover:bg-cyan-950/30 transition-all disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('book.prev', 'Pág. Anterior')}</span>
          </button>

          <button
            onClick={handleNextPage}
            disabled={isFlipping}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            <span>{t('book.next', 'Siguiente Página')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Book Container */}
      <div className="perspective-2000 relative w-full min-h-[580px] flex items-center justify-center">
        {/* Book Spine / Shadow Center */}
        <div className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-gradient-to-r from-black/80 via-cyan-900/30 to-black/80 z-30 pointer-events-none rounded-full blur-[1px] hidden md:block" />

        {/* The 3D Book Surface */}
        <div
          className={`w-full grid grid-cols-1 md:grid-cols-2 gap-4 transition-transform duration-700 ease-out transform-style-3d ${
            isFlipping
              ? flipDirection === 'next'
                ? '-rotate-y-12 scale-[0.98]'
                : 'rotate-y-12 scale-[0.98]'
              : 'rotate-y-0 scale-100'
          }`}
        >
          {/* Left Page (Active Video Player & Overlays) */}
          <div className="bg-[#0b0d14] rounded-2xl border border-slate-800 p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
            {/* Holographic Page Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00ff88] via-white to-[#ff0055]" />

            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-pulse" />
                  <span className="font-orbitron font-bold text-slate-200">
                    {t('book.channel', 'CANAL')} {currentPage + 1}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {currentVideo.format === '9:16' ? (language === 'es' ? 'FORMATO SHORT 9:16' : 'SHORT 9:16 FORMAT') : (language === 'es' ? 'PANORÁMICO 16:9' : 'WIDESCREEN 16:9')}
                </span>
              </div>

              {/* Video Player */}
              <div className="w-full mb-3">
                <VideoPlayer
                  key={currentVideo.id}
                  video={currentVideo}
                  onAddPin={(pin) => onAddPin(currentVideo.id, pin)}
                />
              </div>

              {/* Title & Metadata */}
              <h3 className="font-orbitron font-bold text-base text-white mb-1 line-clamp-1">
                {currentVideo.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                {currentVideo.description}
              </p>
            </div>

            {/* Creator Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <img
                  src={currentVideo.creator.avatar}
                  alt={currentVideo.creator.name}
                  className="w-7 h-7 rounded-full object-cover border border-[#00ff88]"
                />
                <div>
                  <div className="font-semibold text-slate-200 text-xs">
                    {currentVideo.creator.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentVideo.creator.username}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  {currentVideo.metrics.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-[#ff0055]" />
                  {currentVideo.metrics.likes.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right Page (Holographic Insights, Comments & Next Page Preview) */}
          <div className="bg-[#0b0d14]/90 rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-600" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-orbitron font-bold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {language === 'es' ? 'DIARIO CUÁNTICO & ANOTACIONES' : 'QUANTUM JOURNAL & NOTES'}
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {language === 'es' ? `Capítulo #${currentPage + 1}` : `Chapter #${currentPage + 1}`}
                </span>
              </div>

              {/* Spatial Pin Comments on this page */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#00ff88]" />
                  {language === 'es' ? `Comentarios Anotados por Coordenadas (${currentVideo.pins.length})` : `Spatial Pinned Comments (${currentVideo.pins.length})`}
                </h4>

                {currentVideo.pins.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {currentVideo.pins.map((pin) => (
                      <div
                        key={pin.id}
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-[#00ff88]/40 transition-colors text-xs"
                      >
                        <div className="flex items-center justify-between mb-1 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={pin.avatar}
                              alt={pin.author}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="font-bold text-[#00ff88]">{pin.author}</span>
                          </div>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {pin.timeSeconds}s (X:{Math.round(pin.xPercent)}%, Y:{Math.round(pin.yPercent)}%)
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs">{pin.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    {language === 'es' ? 'No hay pines aún. Haz clic en el reproductor de la izquierda para fijar uno.' : 'No pins yet. Click on the left player to pin one.'}
                  </div>
                )}
              </div>

              {/* Tags Cloud */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {language === 'es' ? 'Etiquetas Neuronales' : 'Neural Tags'}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {currentVideo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-[11px] text-cyan-300 font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Chapter Peek Preview */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-700 relative">
                  <img
                    src={nextVideo.thumbnailUrl}
                    alt={nextVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-cyan-300" />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-cyan-400 font-semibold uppercase">
                    {language === 'es' ? 'Próxima Página:' : 'Next Page:'}
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-1 max-w-[200px]">
                    {nextVideo.title}
                  </div>
                  <div className="text-[10px] text-slate-400">{nextVideo.creator.name}</div>
                </div>
              </div>

              <button
                onClick={handleNextPage}
                className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/30 transition-all"
                title={language === 'es' ? 'Voltear página' : 'Flip page'}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
