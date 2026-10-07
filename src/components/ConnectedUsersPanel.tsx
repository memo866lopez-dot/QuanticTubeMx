import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  Send,
  Users,
  Sparkles,
  Camera,
  Tv,
  Crown,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  LogIn,
  UserPlus,
  Radio
} from 'lucide-react';
import { ConnectedUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface ConnectedUsersPanelProps {
  channelCreatorName?: string;
}

export const ConnectedUsersPanel: React.FC<ConnectedUsersPanelProps> = ({ channelCreatorName }) => {
  const {
    currentUser,
    isAuthenticated,
    openAuthModal,
    connectedUsers,
    myCameraStream,
    isMyCameraActive,
    isMyMicActive,
    toggleMyCamera,
    toggleMyMic,
    startCall,
    sendUserChatMessage,
    expandedChatUserId,
    toggleUserChatExpanded
  } = useAuth();

  const { language, t } = useLanguage();
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedScreens, setExpandedScreens] = useState<Record<string, boolean>>({});

  const myVideoRef = useRef<HTMLVideoElement | null>(null);

  // Sync webcam stream to current user video element
  useEffect(() => {
    if (myVideoRef.current) {
      if (myCameraStream && isMyCameraActive) {
        myVideoRef.current.srcObject = myCameraStream;
      } else {
        myVideoRef.current.srcObject = null;
      }
    }
  }, [myCameraStream, isMyCameraActive]);

  const handleInputChange = (userId: string, val: string) => {
    setChatInputs((prev) => ({ ...prev, [userId]: val }));
  };

  const handleSendMessage = (userId: string) => {
    const text = chatInputs[userId];
    if (!text || !text.trim()) return;
    sendUserChatMessage(userId, text);
    setChatInputs((prev) => ({ ...prev, [userId]: '' }));
  };

  const toggleScreenExpansion = (userId: string) => {
    setExpandedScreens((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const myUserItem: ConnectedUser = useMemo(() => ({
    id: currentUser.id || 'my-live-screen',
    name: currentUser.name || 'Memo Lopez',
    username: currentUser.username || '@memolopez',
    avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    isCreator: true,
    channelName: currentUser.channelName || 'Quantic Studio Oficial',
    channelSubscribers: '14.2K',
    isOnline: true,
    isCurrentUser: true,
    cameraActive: isMyCameraActive,
    micActive: isMyMicActive,
    videoStreamUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    statusText: isMyCameraActive
      ? (language === 'es' ? 'Cámara encendida • En vivo 1080p' : 'Camera active • Live 1080p')
      : (language === 'es' ? 'Cámara en pausa' : 'Camera paused'),
    chatMessages: []
  }), [currentUser, isMyCameraActive, isMyMicActive, language]);

  const allUsersWithMe = useMemo(() => {
    return [myUserItem, ...connectedUsers.filter((u) => !u.isCurrentUser && u.id !== myUserItem.id)];
  }, [myUserItem, connectedUsers]);

  const filteredUsers = allUsersWithMe.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.channelName && u.channelName.toLowerCase().includes(q))
    );
  });

  return (
    <aside className="w-full bg-[#0a0d18] border border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-2xl flex flex-col space-y-3.5">
      {/* Header: Status and Quick Actions */}
      <div className="flex flex-col gap-2.5 pb-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ff88]" />
            </span>
            <h3 className="font-orbitron font-bold text-xs text-white tracking-wider">
              {language === 'es' ? 'PERSONAS EN LÍNEA' : 'ONLINE PEOPLE'}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/40 text-[#00ff88] font-mono font-bold">
              {allUsersWithMe.length}
            </span>
          </div>

          {/* New Channel / Sign In action */}
          <button
            onClick={() => openAuthModal(isAuthenticated ? 'new_channel' : 'signup')}
            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#00ccff] text-[10px] font-orbitron font-bold text-cyan-300 flex items-center gap-1.5 transition-all"
            title={language === 'es' ? 'Crear un canal nuevo o cambiar de cuenta' : 'Create new channel or switch account'}
          >
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">
              {isAuthenticated ? (language === 'es' ? '+ Nuevo Canal' : '+ New Channel') : (language === 'es' ? 'Sign In / Up' : 'Sign In / Up')}
            </span>
          </button>
        </div>

        {/* User's Own Camera Broadcast Controls Bar */}
        <div className="p-2.5 rounded-2xl bg-[#0e1424] border border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#00ff88] shrink-0">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt="Me"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#00ff88] ring-1 ring-black" />
            </div>
            <div className="truncate">
              <div className="font-bold text-white text-[11px] truncate flex items-center gap-1">
                <span>{currentUser?.name || 'Guillermo López'}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#00ff88]/20 text-[#00ff88] font-mono">TÚ</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono truncate">
                {currentUser?.channelName || 'Quantic Studio Oficial'}
              </div>
            </div>
          </div>

          {/* Quick Camera & Mic Toggles */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleMyCamera}
              className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                isMyCameraActive
                  ? 'bg-[#00ff88] text-black border-[#00ff88] shadow-md shadow-[#00ff88]/30 font-bold'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMyCameraActive ? (language === 'es' ? 'Desactivar mi cámara' : 'Turn off my camera') : (language === 'es' ? 'Activar mi cámara en vivo (WebRTC)' : 'Turn on my live camera')}
            >
              {isMyCameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5 text-slate-400" />}
              <span className="text-[10px] font-mono hidden sm:inline">
                {isMyCameraActive ? 'CAM ON' : 'CAM OFF'}
              </span>
            </button>

            <button
              onClick={toggleMyMic}
              className={`p-1.5 rounded-xl border transition-all ${
                isMyMicActive
                  ? 'bg-slate-900 border-slate-700 text-cyan-300 hover:text-white'
                  : 'bg-rose-950/60 border-rose-500/60 text-rose-300'
              }`}
              title={isMyMicActive ? (language === 'es' ? 'Silenciar mi micrófono' : 'Mute my mic') : (language === 'es' ? 'Activar micrófono' : 'Unmute mic')}
            >
              {isMyMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Filter input */}
        <input
          type="text"
          placeholder={language === 'es' ? 'Buscar creadores o personas...' : 'Search creators or people...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff88]"
        />
      </div>

      {/* Connected Users List (Smooth Scrollable Container with Independent Scroll per User) */}
      <div className="overflow-y-auto max-h-[640px] pr-1 space-y-3 scrollbar-thin">
        {filteredUsers.map((user) => {
          const isMe = user.isCurrentUser;
          const isChatOpen = expandedChatUserId === user.id;
          const isScreenExpanded = !!expandedScreens[user.id];

          return (
            <div
              key={user.id}
              className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
                isMe
                  ? 'bg-gradient-to-b from-[#0b1220] to-[#070b14] border-[#00ff88]/50 shadow-md shadow-[#00ff88]/10'
                  : user.isCreator
                  ? 'bg-[#090d19] border-slate-800 hover:border-cyan-500/50'
                  : 'bg-[#090b14] border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* User Header Info */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className={`w-8 h-8 rounded-full object-cover border ${
                        isMe ? 'border-[#00ff88]' : user.isCreator ? 'border-cyan-400' : 'border-slate-700'
                      }`}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00ff88] border-2 border-black" />
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate">{user.name}</span>
                      {isMe ? (
                        <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/50 text-[9px] font-mono text-[#00ff88] font-bold">
                          <Radio className="w-2.5 h-2.5 text-[#00ff88] animate-pulse" />
                          <span>{language === 'es' ? 'TÚ (EN VIVO)' : 'YOU (LIVE)'}</span>
                        </span>
                      ) : user.isCreator && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-[9px] font-mono text-cyan-300 font-bold">
                          <Crown className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{language === 'es' ? 'Creador' : 'Creator'}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {user.channelName ? `${user.channelName} • ` : ''}{user.username}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                  <span>LIVE</span>
                </div>
              </div>

              {/* Pantalla Diminuta (Mini Video Screen Viewport) */}
              <div
                className={`relative rounded-xl overflow-hidden bg-black border transition-all ${
                  isScreenExpanded ? 'h-48' : 'h-28 sm:h-32'
                } ${
                  isMe && isMyCameraActive
                    ? 'border-[#00ff88] shadow-lg shadow-[#00ff88]/25 ring-1 ring-[#00ff88]'
                    : user.cameraActive
                    ? 'border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'border-slate-800'
                }`}
              >
                {isMe ? (
                  <div className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center">
                    {myCameraStream && isMyCameraActive ? (
                      <video
                        ref={(el) => {
                          myVideoRef.current = el;
                          if (el) {
                            if (el.srcObject !== myCameraStream) {
                              el.srcObject = myCameraStream;
                            }
                            el.play().catch(() => {});
                          }
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <video
                        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover opacity-90 scale-x-[-1]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />
                    
                    {/* Live indicator badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00ff88]/25 border border-[#00ff88]/60 text-[#00ff88] text-[9px] font-mono font-bold animate-pulse shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                      <span>{language === 'es' ? 'CÁMARA EN VIVO' : 'LIVE CAMERA'}</span>
                    </div>

                    <div className="absolute top-2 right-9 flex items-center gap-1 text-[8px] font-mono text-cyan-300 bg-black/75 px-1.5 py-0.5 rounded border border-cyan-500/40 shadow-sm">
                      <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                      <span>1080p • 60 FPS</span>
                    </div>

                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between text-[8px] font-mono text-slate-300">
                      <span className="text-[#00ff88] flex items-center gap-1 font-bold bg-black/60 px-1.5 py-0.5 rounded">
                        <Camera className="w-2.5 h-2.5 text-[#00ff88]" /> {language === 'es' ? 'HD EN VIVO' : 'HD LIVE'}
                      </span>
                      <span className="text-cyan-300 font-bold bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                        {language === 'es' ? 'LISTA PARA TRANSMITIR' : 'READY TO STREAM'}
                      </span>
                    </div>
                  </div>
                ) : user.videoStreamUrl ? (
                  <video
                    src={user.videoStreamUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950">
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover opacity-50" />
                  </div>
                )}

                {/* Overlay Screen Badges & Expand Button */}
                <div className="absolute top-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-white pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded bg-black/70 border border-slate-700 backdrop-blur-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
                    <span>{isMe ? (isMyCameraActive ? 'TU CÁMARA 1080p • EN VIVO' : 'EN ESPERA') : 'CANAL EN VIVO'}</span>
                  </span>

                  <button
                    onClick={() => toggleScreenExpansion(user.id)}
                    className="pointer-events-auto p-1 rounded bg-black/70 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                    title={isScreenExpanded ? 'Reducir pantalla' : 'Agrandar pantalla'}
                  >
                    {isScreenExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                  </button>
                </div>

                {/* Simulated Audio Equalizer Bars at bottom of mini screen */}
                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono">
                  <div className="flex items-center gap-0.5">
                    {[12, 18, 14, 22, 16, 20, 10, 24].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h * 0.55}px` }}
                        className={`w-1 rounded-full ${
                          (isMe && isMyMicActive) || (!isMe && user.micActive)
                            ? 'bg-[#00ff88] animate-pulse'
                            : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  <span className="px-1.5 py-0.2 rounded bg-black/80 text-slate-300 text-[9px]">
                    {user.statusText || 'Conectado'}
                  </span>
                </div>
              </div>

              {/* Interactive Communication Buttons */}
              {isMe ? (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    onClick={toggleMyCamera}
                    className={`flex-1 py-1.5 px-2 rounded-xl border text-[10px] font-orbitron font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isMyCameraActive
                        ? 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88] shadow-sm shadow-[#00ff88]/20'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title={isMyCameraActive ? 'Desactivar cámara' : 'Activar cámara'}
                  >
                    {isMyCameraActive ? <Video className="w-3 h-3 text-[#00ff88]" /> : <VideoOff className="w-3 h-3 text-slate-400" />}
                    <span>{isMyCameraActive ? 'CÁMARA ON' : 'CÁMARA OFF'}</span>
                  </button>

                  <button
                    onClick={toggleMyMic}
                    className={`flex-1 py-1.5 px-2 rounded-xl border text-[10px] font-orbitron font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isMyMicActive
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    }`}
                    title={isMyMicActive ? 'Silenciar micrófono' : 'Activar micrófono'}
                  >
                    {isMyMicActive ? <Mic className="w-3 h-3 text-cyan-400" /> : <MicOff className="w-3 h-3 text-rose-400" />}
                    <span>{isMyMicActive ? 'MIC ON' : 'MIC MUTE'}</span>
                  </button>

                  <div className="px-2.5 py-1.5 rounded-xl bg-[#00ff88]/15 border border-[#00ff88]/40 text-[#00ff88] text-[9px] font-mono font-bold flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
                    <span>EN VIVO</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 pt-0.5">
                  {/* 1. Videollamada */}
                  <button
                    onClick={() => startCall(user, 'video')}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/50 text-cyan-200 text-[10px] font-orbitron font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title={language === 'es' ? `Iniciar videollamada con ${user.name}` : `Start video call with ${user.name}`}
                  >
                    <Video className="w-3 h-3 text-cyan-400" />
                    <span>{language === 'es' ? 'Videollamada' : 'Video Call'}</span>
                  </button>

                  {/* 2. Audio Call */}
                  <button
                    onClick={() => startCall(user, 'audio')}
                    className="p-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#00ff88] text-slate-300 hover:text-[#00ff88] text-[10px] font-orbitron font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title={language === 'es' ? `Llamada de voz con ${user.name}` : `Voice call with ${user.name}`}
                  >
                    <PhoneCall className="w-3 h-3 text-[#00ff88]" />
                    <span className="hidden sm:inline">{language === 'es' ? 'Voz' : 'Voice'}</span>
                  </button>

                  {/* 3. Text Chat Drawer Toggle */}
                  <button
                    onClick={() => toggleUserChatExpanded(user.id)}
                    className={`p-1.5 px-2.5 rounded-xl border text-[10px] font-orbitron font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isChatOpen
                        ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title={language === 'es' ? `Abrir chat con ${user.name}` : `Open chat with ${user.name}`}
                  >
                    <MessageSquare className="w-3 h-3 text-purple-400" />
                    <span>{user.chatMessages.length}</span>
                    {isChatOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              )}

              {/* Individual Scrollable Text Chat Drawer for each User */}
              {isChatOpen && (
                <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800/90 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-1 border-b border-slate-800/70">
                    <span className="text-purple-300 font-bold">
                      {language === 'es' ? 'Chat Directo con' : 'Direct Chat with'} {user.name}
                    </span>
                    <span>{user.chatMessages.length} {language === 'es' ? 'mensajes' : 'messages'}</span>
                  </div>

                  {/* Independent Scrollable Chat Area */}
                  <div className="overflow-y-auto max-h-32 space-y-1.5 pr-1 scrollbar-thin">
                    {user.chatMessages.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic text-center py-2">
                        {language === 'es' ? 'No hay mensajes aún. ¡Escribe un saludo!' : 'No messages yet. Send a greeting!'}
                      </p>
                    ) : (
                      user.chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-1.5 rounded-lg text-[11px] leading-tight ${
                            msg.isSelf
                              ? 'ml-auto bg-[#00ff88]/15 border border-[#00ff88]/40 text-slate-100 max-w-[85%]'
                              : 'bg-slate-900 border border-slate-800 text-slate-300 max-w-[85%]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mb-0.5">
                            <span className="font-bold text-[#00ccff]">{msg.sender}</span>
                            <span>{msg.time}</span>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input Bar */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder={language === 'es' ? 'Escribe a este creador...' : 'Write to this creator...'}
                      value={chatInputs[user.id] || ''}
                      onChange={(e) => handleInputChange(user.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(user.id)}
                      className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={() => handleSendMessage(user.id)}
                      className="p-1 px-2.5 rounded-lg bg-[#00ff88] text-black font-bold hover:bg-emerald-400 text-xs transition-colors"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
