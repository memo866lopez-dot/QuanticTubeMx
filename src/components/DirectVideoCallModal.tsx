import React, { useRef, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Shield,
  Volume2,
  Maximize2,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const DirectVideoCallModal: React.FC = () => {
  const {
    activeCallUser,
    activeCallType,
    callDuration,
    endCall,
    myCameraStream,
    isMyCameraActive,
    isMyMicActive,
    toggleMyCamera,
    toggleMyMic
  } = useAuth();
  const { language } = useLanguage();

  const myVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (myVideoRef.current && myCameraStream && isMyCameraActive) {
      myVideoRef.current.srcObject = myCameraStream;
    }
  }, [myCameraStream, isMyCameraActive]);

  if (!activeCallUser) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#080b14] border-2 border-cyan-400/80 rounded-3xl shadow-2xl shadow-cyan-500/30 overflow-hidden flex flex-col">
        {/* Top Call Bar */}
        <div className="p-4 bg-[#0a0f20] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-400 relative">
              <img
                src={activeCallUser.avatar}
                alt={activeCallUser.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00ff88] rounded-full ring-2 ring-black" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-orbitron font-bold text-sm text-white">
                  {activeCallUser.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-bold">
                  {activeCallType === 'video' ? 'VIDEOLLAMADA 4K' : 'LLAMADA DE VOZ'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {activeCallUser.channelName || activeCallUser.username}
              </p>
            </div>
          </div>

          {/* Call Timer and Encrypted Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-mono font-bold text-[#00ff88]">
                {formatTimer(callDuration)}
              </div>
              <div className="text-[9px] font-mono text-cyan-400 flex items-center justify-end gap-1">
                <Shield className="w-2.5 h-2.5" />
                <span>P2P CUÁNTICO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Call Stage */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {/* Main Remote User Feed */}
          {activeCallUser.videoStreamUrl && activeCallType === 'video' ? (
            <video
              src={activeCallUser.videoStreamUrl}
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="relative">
                <img
                  src={activeCallUser.avatar}
                  alt={activeCallUser.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-cyan-400 shadow-2xl shadow-cyan-500/50 animate-pulse"
                />
                <span className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#00ff88] text-black">
                  <Volume2 className="w-4 h-4 animate-ping" />
                </span>
              </div>
              <div>
                <h4 className="font-orbitron font-bold text-base text-white">{activeCallUser.name}</h4>
                <p className="text-xs font-mono text-cyan-400">
                  {language === 'es' ? 'Canal de Audio Cuántico Conectado' : 'Quantum Audio Channel Connected'}
                </p>
              </div>

              {/* Dynamic Sound Wave Simulation */}
              <div className="flex items-center gap-1.5 h-10">
                {[16, 28, 20, 36, 24, 32, 18, 40, 26, 30, 20, 36, 18].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-[#00ff88] to-cyan-400 animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Picture-in-Picture (PiP): Local User Webcam View */}
          <div className="absolute top-4 right-4 w-44 aspect-video rounded-2xl overflow-hidden border-2 border-[#00ff88] shadow-2xl bg-slate-900 z-20">
            {isMyCameraActive ? (
              <video
                ref={myVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-black/85 text-center p-2">
                <VideoOff className="w-5 h-5 text-slate-500 mb-1" />
                <span className="text-[9px] font-mono text-slate-400">
                  {language === 'es' ? 'Cámara Apagada' : 'Camera Off'}
                </span>
              </div>
            )}
            <div className="absolute bottom-1 right-2 px-1.5 py-0.2 rounded bg-black/80 text-[8px] font-mono text-[#00ff88]">
              TÚ
            </div>
          </div>

          {/* Watermark badge */}
          <div className="absolute bottom-4 left-4 z-20 px-2.5 py-1 rounded-xl bg-black/70 border border-slate-700 backdrop-blur-md flex items-center gap-2 text-xs font-mono text-white">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
            <span>1080p 60FPS • WebRTC HD</span>
          </div>
        </div>

        {/* Bottom Call Controls Toolbar */}
        <div className="p-4 bg-[#0a0f20] border-t border-slate-800 flex items-center justify-center gap-4">
          {/* Toggle Mic */}
          <button
            onClick={toggleMyMic}
            className={`p-3 rounded-full border transition-all hover:scale-110 active:scale-95 ${
              isMyMicActive
                ? 'bg-slate-900 border-slate-700 text-white hover:border-[#00ff88]'
                : 'bg-rose-950 border-rose-500 text-rose-300'
            }`}
            title={isMyMicActive ? 'Silenciar micrófono' : 'Activar micrófono'}
          >
            {isMyMicActive ? <Mic className="w-5 h-5 text-[#00ff88]" /> : <MicOff className="w-5 h-5 text-rose-400" />}
          </button>

          {/* Toggle Camera */}
          <button
            onClick={toggleMyCamera}
            className={`p-3 rounded-full border transition-all hover:scale-110 active:scale-95 ${
              isMyCameraActive
                ? 'bg-slate-900 border-slate-700 text-white hover:border-[#00ff88]'
                : 'bg-rose-950 border-rose-500 text-rose-300'
            }`}
            title={isMyCameraActive ? 'Apagar cámara' : 'Encender cámara'}
          >
            {isMyCameraActive ? <Video className="w-5 h-5 text-[#00ff88]" /> : <VideoOff className="w-5 h-5 text-rose-400" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="p-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-orbitron font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all"
          >
            <PhoneOff className="w-4 h-4 fill-white" />
            <span>{language === 'es' ? 'FINALIZAR LLAMADA' : 'END CALL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
