import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  SwitchCamera,
  Radio,
  Users,
  Send,
  Sparkles,
  Gift,
  Shield,
  Heart,
  Share2,
  CheckCircle2,
  MonitorUp,
  Volume2
} from 'lucide-react';
import { LiveChatMessage, LiveGuest, LiveGift } from '../types';

const GIFTS: LiveGift[] = [
  { id: 'g1', name: 'Rosa Neón', icon: '🌹', cost: 10, color: '#ff0055', particleCount: 8 },
  { id: 'g2', name: 'Corazón Esmeralda', icon: '💚', cost: 25, color: '#00ff88', particleCount: 12 },
  { id: 'g3', name: 'Taco de Oro Cuántico', icon: '🌮', cost: 50, color: '#ffd700', particleCount: 15 },
  { id: 'g4', name: 'Cohete Neotitlán', icon: '🚀', cost: 100, color: '#00f5ff', particleCount: 20 },
  { id: 'g5', name: 'Corona Azteca Cyber', icon: '👑', cost: 500, color: '#e0aaff', particleCount: 30 }
];

export const OmniLiveStudio: React.FC = () => {
  // Streams & Devices
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);

  // Audio VU Meter
  const [audioLevel, setAudioLevel] = useState(0);

  // Guests on stage
  const [guests, setGuests] = useState<LiveGuest[]>([
    {
      id: 'g-1',
      name: 'Elena_Cyber',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      status: 'pending'
    },
    {
      id: 'g-2',
      name: 'Carlos_Holo',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      status: 'pending'
    }
  ]);

  // Live Chat
  const [messages, setMessages] = useState<LiveChatMessage[]>([
    {
      id: 'm1',
      sender: 'QuanticBot_AI',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
      message: '¡Transmisión segura iniciada con nodo cuántico QuanticTube! Moderación automática activa.',
      timestamp: '19:00',
      isModerator: true
    },
    {
      id: 'm2',
      sender: 'Mateo_Future',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      message: `¡Saludos desde Guadalajara ${new Date().getFullYear()}! Se ve nítido en 4K.`,
      timestamp: '19:01'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [floatingGifts, setFloatingGifts] = useState<{ id: number; icon: string; x: number }[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Start Real WebRTC Camera
  const startCamera = async (newFacingMode = facingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      setStream(mediaStream);
      setIsCameraOn(true);
      setIsMicOn(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setupAudioAnalyser(mediaStream);
    } catch (err) {
      console.warn('Camera access error:', err);
      alert('Por favor autoriza el acceso a tu cámara y micrófono para transmitir en vivo.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setIsCameraOn(false);
    setIsMicOn(false);
    setIsLiveActive(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
  };

  const toggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isCameraOn) {
      await startCamera(nextMode);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      if (screenRef.current && screenRef.current.srcObject) {
        const scr = screenRef.current.srcObject as MediaStream;
        scr.getTracks().forEach((t) => t.stop());
        screenRef.current.srcObject = null;
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setIsScreenSharing(true);
        if (screenRef.current) {
          screenRef.current.srcObject = screenStream;
        }
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.warn('Screen share error:', err);
      }
    }
  };

  // Setup Web Audio Analyser for VU Meter
  const setupAudioAnalyser = (mediaStream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(mediaStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
        animFrameIdRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Audio analyser setup error:', e);
    }
  };

  // Stage Guest Management
  const handleToggleGuestStage = (guestId: string) => {
    setGuests((prev) =>
      prev.map((g) =>
        g.id === guestId
          ? { ...g, status: g.status === 'on_stage' ? 'pending' : 'on_stage' }
          : g
      )
    );
  };

  // Live Chat send
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: LiveChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'Comandante_Quantic',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      message: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  // Send Gift animation
  const handleSendGift = (gift: LiveGift) => {
    const newMsg: LiveChatMessage = {
      id: `gift-${Date.now()}`,
      sender: 'Comandante_Quantic',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      message: `¡Envió ${gift.name}! ${gift.icon}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGift: true,
      giftName: gift.name,
      giftIcon: gift.icon
    };
    setMessages((prev) => [...prev, newMsg]);

    // Add floating gift particle
    setFloatingGifts((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), icon: gift.icon, x: Math.random() * 80 + 10 }
    ]);
  };

  // Disintegrate / Matrix Ban Effect on a user
  const handleBanUser = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isBanned: true } : m))
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-[#0b0d14] border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-red-500/20 text-[#ff0055] border border-red-500/40">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <h2 className="text-xl font-bold font-orbitron text-white">
              OMNI-LIVE <span className="text-[#ff0055]">WEBRTC STUDIO</span>
            </h2>
            {isLiveActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff0055] text-white flex items-center gap-1 shadow-lg shadow-[#ff0055]/50 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                EN VIVO
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Transmite en directo con cámara dual, soporte para invitados en el escenario y audio VU-meter.
          </p>
        </div>

        {/* Start / Stop Stream Actions */}
        <div className="flex items-center gap-2">
          {!isCameraOn ? (
            <button
              onClick={() => startCamera()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00ff88] via-[#00f5ff] to-[#ff0055] text-black font-orbitron font-bold text-xs hover:opacity-95 shadow-lg shadow-[#00ff88]/20 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>ACTIVAR CÁMARA & MIC</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsLiveActive(!isLiveActive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
                  isLiveActive
                    ? 'bg-rose-950/60 border border-rose-500 text-rose-300'
                    : 'bg-[#ff0055] text-white hover:bg-rose-600 shadow-lg shadow-[#ff0055]/30'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>{isLiveActive ? 'FINALIZAR LIVE' : 'TRANSMITIR EN VIVO'}</span>
              </button>

              <button
                onClick={stopCamera}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs"
              >
                Desconectar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Studio Viewport & Side Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video Stage (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center group">
            {/* Primary Webcam Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
            />

            {/* Offline Placeholder */}
            {!isCameraOn && (
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                  <VideoOff className="w-8 h-8" />
                </div>
                <h3 className="font-orbitron font-bold text-slate-300 text-base mb-1">
                  Cámara Desconectada
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Haz clic en &quot;Activar Cámara &amp; Mic&quot; para iniciar tu transmisión en tiempo real con WebRTC.
                </p>
                <button
                  onClick={() => startCamera()}
                  className="px-4 py-2 rounded-xl bg-[#00ff88] text-black font-bold text-xs font-orbitron hover:bg-emerald-400"
                >
                  Conectar Ahora
                </button>
              </div>
            )}

            {/* PiP: Dual Camera / Screen Sharing View */}
            {isScreenSharing && (
              <div className="absolute top-4 right-4 w-52 aspect-video rounded-xl overflow-hidden border-2 border-cyan-400 shadow-2xl bg-black z-30">
                <video ref={screenRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-1 right-2 text-[9px] bg-black/80 px-1.5 py-0.5 rounded text-cyan-400 font-mono">
                  PANTALLA
                </div>
              </div>
            )}

            {/* On-Stage Guests Split Grid Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-start gap-3 z-30 pointer-events-none">
              {guests
                .filter((g) => g.status === 'on_stage')
                .map((guest) => (
                  <div
                    key={guest.id}
                    className="w-36 aspect-video rounded-xl overflow-hidden border-2 border-[#00ff88] shadow-2xl bg-slate-900 pointer-events-auto relative animate-in zoom-in-90"
                  >
                    <img
                      src={guest.avatar}
                      alt={guest.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 px-1.5 py-0.5 text-[9px] text-white flex items-center justify-between font-mono">
                      <span className="truncate">{guest.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
                    </div>
                  </div>
                ))}
            </div>

            {/* Floating Gift Emojis Rendering */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
              {floatingGifts.map((fg) => (
                <div
                  key={fg.id}
                  style={{ left: `${fg.x}%` }}
                  className="absolute bottom-10 text-4xl animate-bounce"
                >
                  {fg.icon}
                </div>
              ))}
            </div>

            {/* Live Indicator & Viewers Badge */}
            {isCameraOn && (
              <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-black/80 border border-slate-700 backdrop-blur-md flex items-center gap-1.5 text-xs text-white">
                  <Users className="w-3.5 h-3.5 text-[#00ff88]" />
                  <span className="font-mono font-bold">14,892</span>
                  <span className="text-[10px] text-slate-400">espectadores</span>
                </div>
              </div>
            )}
          </div>

          {/* Camera & Audio Hardware Toolbar */}
          <div className="p-4 rounded-2xl bg-[#0b0d14] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* Mic toggle */}
              <button
                onClick={toggleMic}
                disabled={!isCameraOn}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isMicOn
                    ? 'bg-[#00ff88]/20 border border-[#00ff88]/60 text-[#00ff88]'
                    : 'bg-slate-900 border border-slate-700 text-slate-400'
                }`}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-400" />}
                <span>{isMicOn ? 'Mic Activo' : 'Mic Silenciado'}</span>
              </button>

              {/* Flip camera */}
              <button
                onClick={toggleCameraFacing}
                disabled={!isCameraOn}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <SwitchCamera className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {facingMode === 'user' ? 'Cámara Frontal' : 'Cámara Trasera'}
                </span>
              </button>

              {/* Screen Share PiP */}
              <button
                onClick={toggleScreenShare}
                disabled={!isCameraOn}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isScreenSharing
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <MonitorUp className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Compartir Pantalla (PiP)</span>
              </button>
            </div>

            {/* Audio VU-Meter (Tricolor LED Neon) */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <div className="w-28 h-2.5 bg-slate-900 rounded-full border border-slate-700 overflow-hidden flex">
                <div
                  style={{ width: `${audioLevel}%` }}
                  className="h-full bg-gradient-to-r from-[#00ff88] via-white to-[#ff0055] transition-all duration-75"
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-8">{audioLevel}%</span>
            </div>
          </div>

          {/* Multi-Guest Stage Management */}
          <div className="p-4 rounded-2xl bg-[#0b0d14] border border-slate-800">
            <h4 className="text-xs font-orbitron font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00ff88]" />
              ESCENARIO MULTI-GUEST (INVITADOS EN VIVO)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guests.map((g) => (
                <div
                  key={g.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={g.avatar}
                      alt={g.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#00ff88]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-100">{g.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {g.status === 'on_stage' ? 'En el escenario' : 'Pidiendo subir'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleGuestStage(g.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      g.status === 'on_stage'
                        ? 'bg-rose-950/40 border border-rose-500/50 text-rose-300'
                        : 'bg-[#00ff88] text-black hover:bg-emerald-400'
                    }`}
                  >
                    {g.status === 'on_stage' ? 'Bajar' : 'Subir al Escenario'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Chat, Gifts & Moderation (1 Col) */}
        <div className="bg-[#0b0d14] rounded-2xl border border-slate-800 p-4 flex flex-col h-[650px] shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff0055] animate-ping" />
              <h3 className="font-orbitron font-bold text-xs text-white">LIVE CHAT & REGALOS</h3>
            </div>
            <span className="text-[10px] font-mono text-[#00ff88]">MODERACIÓN IA ACTIVA</span>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-2.5 rounded-xl border text-xs transition-all duration-700 ${
                  m.isBanned
                    ? 'opacity-0 scale-75 bg-red-950/80 border-red-500 pointer-events-none'
                    : m.isGift
                    ? 'bg-gradient-to-r from-rose-950/30 to-purple-950/30 border-[#ff0055]/40 text-slate-100'
                    : m.isModerator
                    ? 'bg-[#00ff88]/10 border-[#00ff88]/40 text-slate-100'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <img src={m.avatar} alt={m.sender} className="w-4 h-4 rounded-full object-cover" />
                    <span
                      className={`font-bold ${
                        m.isModerator ? 'text-[#00ff88]' : m.isGift ? 'text-[#ff0055]' : 'text-slate-200'
                      }`}
                    >
                      {m.sender}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">{m.timestamp}</span>
                    {/* Disintegrate Ban Button for moderation */}
                    <button
                      onClick={() => handleBanUser(m.id)}
                      title="Baneo IA Cuántico (Desintegración)"
                      className="text-slate-600 hover:text-red-400 p-0.5"
                    >
                      <Shield className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-300 text-xs">{m.message}</p>
              </div>
            ))}
          </div>

          {/* Quick Gifts Selector */}
          <div className="py-2 border-t border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex items-center gap-1">
              <Gift className="w-3 h-3 text-[#ff0055]" />
              ENVIAR REGALO NEÓN EN VIVO
            </div>
            <div className="flex items-center justify-between gap-1">
              {GIFTS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSendGift(g)}
                  title={`${g.name} (${g.cost} créditos)`}
                  className="flex-1 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#ff0055] text-center text-sm transition-all hover:scale-110 active:scale-95"
                >
                  <div>{g.icon}</div>
                  <div className="text-[9px] text-slate-400 font-mono">{g.cost}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Envía un mensaje cuántico..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff88]"
            />
            <button
              onClick={handleSendMessage}
              className="p-2 rounded-xl bg-[#00ff88] text-black font-bold hover:bg-emerald-400 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
