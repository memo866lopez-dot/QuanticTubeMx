import React, { useState, useRef } from 'react';
import {
  LayoutGrid,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Camera,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { VideoItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getSafeVideoUrl } from '../services/videoBlobService';
import { useVideoErrorRecovery, VideoErrorRecoveryOverlay } from './VideoErrorRecovery';

const QuadSlotVideo: React.FC<{
  video?: VideoItem;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isSlotMuted: boolean;
  t: (key: string, fallback: string) => string;
}> = ({ video, videoRef, isSlotMuted, t }) => {
  const effectiveSrc = React.useMemo(() => {
    return video ? getSafeVideoUrl(video.videoUrl, video.format, video.id) : '';
  }, [video?.videoUrl, video?.format, video?.id]);

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
    initialSrc: effectiveSrc,
    videoId: video?.id,
    format: video?.format,
    title: video?.title
  });

  return (
    <div className="relative w-full aspect-video bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={currentSrc}
        poster={video?.thumbnailUrl}
        playsInline
        autoPlay
        loop
        muted={isSlotMuted}
        onError={handleVideoError}
        className="w-full h-full object-cover"
      />

      <VideoErrorRecoveryOverlay
        isRecovering={isRecovering}
        retryCount={retryCount}
        hasFailedPermanently={hasFailedPermanently}
        onRetry={manualRetry}
        onFallback={forceFallback}
        compact
      />

      {!isSlotMuted && (
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-[#00ff88]/20 border border-[#00ff88]/60 backdrop-blur-md flex items-center gap-1.5 text-[10px] font-bold text-[#00ff88]">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
          <span>{t('quad.soundActive', 'AUDIO ACTIVO')}</span>
        </div>
      )}
    </div>
  );
};

interface QuadViewProps {
  allVideos: VideoItem[];
}

export const QuadView: React.FC<QuadViewProps> = ({ allVideos }) => {
  const { language, t } = useLanguage();
  // Select 4 videos for the 4 slots
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([
    allVideos[0]?.id || '',
    allVideos[1]?.id || '',
    allVideos[2]?.id || '',
    allVideos[3]?.id || ''
  ]);

  // Audio focus: 'all' | '0' | '1' | '2' | '3' | 'none'
  const [audioFocus, setAudioFocus] = useState<number | 'none' | 'all'>(0);
  const [globalPlaying, setGlobalPlaying] = useState<boolean>(true);
  const [fullscreenQuadrant, setFullscreenQuadrant] = useState<number | null>(null);

  const videoRefs = [
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null)
  ];

  const handleGlobalPlayToggle = () => {
    const nextState = !globalPlaying;
    setGlobalPlaying(nextState);

    videoRefs.forEach((ref) => {
      if (ref.current) {
        if (nextState) {
          ref.current.play().catch(() => {});
        } else {
          ref.current.pause();
        }
      }
    });
  };

  const handleFocusAudio = (index: number) => {
    if (audioFocus === index) {
      setAudioFocus('none');
    } else {
      setAudioFocus(index);
    }
  };

  const handleCaptureQuadrant = (index: number) => {
    const vid = videoRefs[index].current;
    if (!vid) return;

    const canvas = document.createElement('canvas');
    canvas.width = vid.videoWidth || 1280;
    canvas.height = vid.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 28px Orbitron, sans-serif';
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`⚡ QUANTICTUBE QUAD-VIEW • PANTALLA #${index + 1}`, 30, canvas.height - 30);

    const a = document.createElement('a');
    a.download = `QuanticTube_QuadView_${index + 1}_${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const handleSelectVideoForSlot = (slotIndex: number, videoId: string) => {
    setSelectedVideoIds((prev) => {
      const updated = [...prev];
      updated[slotIndex] = videoId;
      return updated;
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-[#0b0d14] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <LayoutGrid className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold font-orbitron text-white">
              {t('quad.title', 'PANEL MULTI-PANTALLA')} <span className="text-purple-400">{t('quad.sub', 'QUAD-VIEW 4X')}</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-500/30">
              {language === 'es' ? '4 CANALES PARALELOS' : '4 PARALLEL CHANNELS'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {t('quad.desc', 'Monitorea, reproduce y captura 4 streams o videos simultáneos con balance acústico independiente.')}
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGlobalPlayToggle}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-purple-400 text-slate-100 text-xs font-semibold transition-all"
          >
            {globalPlaying ? (
              <>
                <Pause className="w-4 h-4 text-purple-400" />
                <span>{t('quad.pauseAll', 'Pausar Todos')}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-[#00ff88]" />
                <span>{t('quad.playAll', 'Reproducir Todos')}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setAudioFocus('none')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
              audioFocus === 'none'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <VolumeX className="w-4 h-4" />
            <span>{language === 'es' ? 'Silenciar Todos' : 'Mute All'}</span>
          </button>
        </div>
      </div>

      {/* 2x2 Video Grid */}
      <div
        className={`grid gap-4 ${
          fullscreenQuadrant !== null ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {[0, 1, 2, 3].map((slotIdx) => {
          if (fullscreenQuadrant !== null && fullscreenQuadrant !== slotIdx) {
            return null;
          }

          const currentVideo =
            allVideos.find((v) => v.id === selectedVideoIds[slotIdx]) || allVideos[slotIdx] || allVideos[0];
          const isSlotMuted = audioFocus !== slotIdx && audioFocus !== 'all';

          return (
            <div
              key={slotIdx}
              className="relative bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group flex flex-col"
            >
              {/* Slot Header */}
              <div className="absolute top-2 inset-x-2 z-20 flex items-center justify-between p-2 rounded-xl bg-black/75 backdrop-blur-md border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-orbitron font-bold text-[10px]">
                    Q{slotIdx + 1}
                  </span>
                  <select
                    value={selectedVideoIds[slotIdx]}
                    onChange={(e) => handleSelectVideoForSlot(slotIdx, e.target.value)}
                    className="bg-slate-900/90 text-slate-200 text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-purple-400 max-w-[170px] truncate"
                  >
                    {allVideos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quadrant Quick Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Audio focus button */}
                  <button
                    onClick={() => handleFocusAudio(slotIdx)}
                    title={isSlotMuted ? (language === 'es' ? 'Activar audio en este cuadrante' : 'Unmute quadrant') : (language === 'es' ? 'Silenciar cuadrante' : 'Mute quadrant')}
                    className={`p-1.5 rounded-lg transition-all ${
                      !isSlotMuted
                        ? 'bg-[#00ff88] text-black font-bold shadow-md shadow-[#00ff88]/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {!isSlotMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  {/* Snapshot capture */}
                  <button
                    onClick={() => handleCaptureQuadrant(slotIdx)}
                    title={language === 'es' ? 'Capturar fotograma de este cuadrante' : 'Capture frame from quadrant'}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-[#00ff88] transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  {/* Expand / Minimize */}
                  <button
                    onClick={() =>
                      setFullscreenQuadrant(fullscreenQuadrant === slotIdx ? null : slotIdx)
                    }
                    title={fullscreenQuadrant === slotIdx ? (language === 'es' ? 'Restaurar cuadrícula 2x2' : 'Restore 2x2 grid') : (language === 'es' ? 'Maximizar cuadrante' : 'Maximize quadrant')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-all"
                  >
                    {fullscreenQuadrant === slotIdx ? (
                      <Minimize2 className="w-3.5 h-3.5" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Video Element with Robust VideoErrorRecovery */}
              <QuadSlotVideo
                video={currentVideo}
                videoRef={videoRefs[slotIdx]}
                isSlotMuted={isSlotMuted}
                t={t}
              />

              {/* Quadrant Footer */}
              <div className="p-3 bg-[#0b0d14] border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="truncate max-w-[70%]">
                  <span className="font-semibold text-slate-200 line-clamp-1">{currentVideo?.title}</span>
                  <span className="text-[10px] text-slate-400">{currentVideo?.creator.name}</span>
                </div>
                <div className="text-[11px] font-mono text-purple-400">
                  {currentVideo?.format}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
