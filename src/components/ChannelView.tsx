import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Play,
  Film,
  Video as VideoIcon,
  Bell,
  Check,
  Share2,
  Copy,
  Sliders,
  Settings,
  ArrowLeft,
  Flame,
  Eye,
  Heart,
  QrCode,
  Image as ImageIcon,
  FileText,
  Radio,
  ExternalLink,
  ChevronDown,
  UserCheck,
  UserPlus,
  Volume2,
  VolumeX,
  Pause,
  Tv,
  Camera,
  Upload
} from 'lucide-react';
import {
  VideoItem,
  PhotoItem,
  TextPostItem,
  GifItem,
  ChannelCustomization,
  ChannelLedColor
} from '../types';
import {
  LED_COLOR_CONFIG,
  getChannelByHandle,
  loadChannels,
  updateChannel,
  getUserChannel
} from '../services/channelService';
import { Channel3DQRCode } from './Channel3DQRCode';
import { ChannelVideoClothCard } from './ChannelVideoClothCard';
import { ChannelCustomizeModal } from './ChannelCustomizeModal';
import { ChannelAvatarMedia } from './ChannelAvatarMedia';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface ChannelViewProps {
  channelHandle?: string;
  onBackToFeed: () => void;
  videos: VideoItem[];
  photos: PhotoItem[];
  posts: TextPostItem[];
  gifs: GifItem[];
  onSelectVideo: (videoId: string) => void;
  onSelectChannel: (handle: string) => void;
}

export const ChannelView: React.FC<ChannelViewProps> = ({
  channelHandle = '@guillermo_lopez',
  onBackToFeed,
  videos,
  photos,
  posts,
  gifs,
  onSelectVideo,
  onSelectChannel
}) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();

  // Load active channel state
  const [currentChannel, setCurrentChannel] = useState<ChannelCustomization>(() => {
    return getChannelByHandle(channelHandle);
  });

  const [activeTab, setActiveTab] = useState<'videos' | 'shorts' | 'photos' | 'posts' | 'about'>('videos');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number>(currentChannel.subscribersCount || 1000);
  const [isBannerPaused, setIsBannerPaused] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isCopiedUrl, setIsCopiedUrl] = useState(false);
  const [isChannelPickerOpen, setIsChannelPickerOpen] = useState(false);
  const [bannerMediaError, setBannerMediaError] = useState(false);

  // Reset banner error when channel changes
  React.useEffect(() => {
    setBannerMediaError(false);
  }, [currentChannel.bannerUrl]);

  const ledConfig = LED_COLOR_CONFIG[currentChannel.ledColor] || LED_COLOR_CONFIG['neon-green'];
  const allChannels = useMemo(() => loadChannels(), [currentChannel]);

  // Handle subscriber toggle with realistic counter increment
  const handleToggleSubscribe = () => {
    if (isSubscribed) {
      setIsSubscribed(false);
      setSubscriberCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsSubscribed(true);
      setSubscriberCount((prev) => prev + 1);
    }
  };

  const handleCopyChannelUrl = async () => {
    try {
      const url = `${window.location.origin}/#channel/${encodeURIComponent(currentChannel.handle)}`;
      await navigator.clipboard.writeText(url);
      setIsCopiedUrl(true);
      setTimeout(() => setIsCopiedUrl(false), 2000);
    } catch {}
  };

  // Filter content matching this creator's handle or name
  const channelVideos = useMemo(() => {
    const term = currentChannel.name.toLowerCase();
    const handleClean = currentChannel.handle.toLowerCase().replace('@', '');

    const matching = videos.filter(
      (v) =>
        v.format === '16:9' ||
        !v.format ||
        v.creator.username.toLowerCase().includes(handleClean) ||
        v.creator.name.toLowerCase().includes(term)
    );
    // If fewer than 2 videos specifically tagged, provide pool to ensure rich showcase
    return matching.length > 0 ? matching : videos.slice(0, 6);
  }, [videos, currentChannel]);

  const channelShorts = useMemo(() => {
    return videos.filter((v) => v.format === '9:16' || v.id.startsWith('vid-short-')).slice(0, 8);
  }, [videos]);

  const channelPhotos = useMemo(() => {
    return photos.slice(0, 8);
  }, [photos]);

  const channelPosts = useMemo(() => {
    return posts.slice(0, 6);
  }, [posts]);

  // Update when external channelHandle changes
  React.useEffect(() => {
    const ch = getChannelByHandle(channelHandle);
    setCurrentChannel(ch);
    setSubscriberCount(ch.subscribersCount || 1000);
  }, [channelHandle]);

  return (
    <div className="min-h-screen bg-[#070a14] text-slate-100 flex flex-col pb-20 cyber-grid">
      {/* 1. TOP INDEPENDENT CHANNEL NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#070a14]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        {/* Back to Feed button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToFeed}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#00ff88]/50 hover:bg-[#0f1627] text-slate-300 hover:text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md group"
          >
            <ArrowLeft className="w-4 h-4 text-[#00ff88] group-hover:-translate-x-0.5 transition-transform" />
            <span>← Volver a QuanticTube</span>
          </button>

          {/* Channel Indicator Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            <Tv className="w-3.5 h-3.5 text-[#00ff88]" />
            <span>CANAL CUÁNTICO INDEPENDIENTE</span>
          </span>
        </div>

        {/* Channel Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsChannelPickerOpen(!isChannelPickerOpen)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#00ff88]/50 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-2 transition-all"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-slate-700 bg-black">
              <ChannelAvatarMedia
                src={currentChannel.avatar}
                type={currentChannel.avatarType}
                alt={currentChannel.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold truncate max-w-[120px] sm:max-w-[180px]">
              {currentChannel.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isChannelPickerOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0b1021] border border-slate-700/80 shadow-2xl p-2 z-50 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Explorar Otros Canales:
              </div>
              {allChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setCurrentChannel(ch);
                    onSelectChannel(ch.handle);
                    setIsChannelPickerOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl flex items-center gap-2.5 text-left transition-all ${
                    currentChannel.id === ch.id
                      ? 'bg-[#00ff88]/15 border border-[#00ff88]/40 text-white'
                      : 'hover:bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 border border-slate-800 bg-black">
                    <ChannelAvatarMedia
                      src={ch.avatar}
                      type={ch.avatarType}
                      alt={ch.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate flex-1">
                    <p className="text-xs font-mono font-bold truncate">{ch.name}</p>
                    <p className="text-[10px] font-mono text-[#00ff88]">{ch.handle}</p>
                  </div>
                  {ch.isOwner && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      TÚ
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 2. CABECERA / MOVING BANNER (GIF O VIDEO LOOP MP4) */}
      <section className="relative w-full h-56 sm:h-72 md:h-84 overflow-hidden bg-slate-950 border-b border-slate-800/80">
        {(currentChannel.bannerType === 'video' ||
          currentChannel.bannerUrl.endsWith('.mp4') ||
          currentChannel.bannerUrl.endsWith('.webm') ||
          currentChannel.bannerUrl.startsWith('data:video/')) &&
        !bannerMediaError ? (
          <video
            key={currentChannel.bannerUrl}
            src={currentChannel.bannerUrl}
            autoPlay={!isBannerPaused}
            loop
            muted
            playsInline
            onError={() => setBannerMediaError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            key={currentChannel.bannerUrl}
            src={
              bannerMediaError
                ? 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif'
                : currentChannel.bannerUrl || 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif'
            }
            alt={`Banner de ${currentChannel.name}`}
            onError={() => setBannerMediaError(true)}
            className="w-full h-full object-cover"
          />
        )}

        {/* Cyberpunk Hologram Grid Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a14] via-[#070a14]/30 to-black/30 pointer-events-none" />

        {/* Controls on banner */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={() => setIsBannerPaused(!isBannerPaused)}
            title={isBannerPaused ? 'Reanudar movimiento' : 'Pausar movimiento'}
            className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-white hover:border-[#00ff88] text-xs font-mono flex items-center gap-1.5 transition-all shadow-md"
          >
            {isBannerPaused ? <Play className="w-3.5 h-3.5 text-[#00ff88]" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[10px]">
              {isBannerPaused ? 'Reanudar Movimiento' : 'Pausar Movimiento'}
            </span>
          </button>

          <button
            onClick={() => setIsCustomizeOpen(true)}
            className="px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-[#00ff88]/50 hover:bg-[#00ff88] hover:text-slate-950 text-[#00ff88] font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Personalizar Canal</span>
          </button>
        </div>
      </section>

      {/* 3. CHANNEL PROFILE HEADER & 3D ANIMATED QR CODE */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-20 z-20">
        <div className="p-5 sm:p-6 rounded-3xl bg-[#090d1c]/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar + LED Flashing/Pulsing Name + Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Holographic Avatar with Glow Ring & Quick Edit Hover */}
            <div className="relative group shrink-0">
              <div
                style={{ backgroundColor: ledConfig.hex, boxShadow: `0 0 25px ${ledConfig.glowRgba}` }}
                className="absolute -inset-1 rounded-3xl blur-md opacity-40 group-hover:opacity-85 transition-opacity"
              />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-slate-900 shadow-2xl z-10 bg-black">
                <ChannelAvatarMedia
                  src={currentChannel.avatar}
                  type={currentChannel.avatarType}
                  alt={currentChannel.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => setIsCustomizeOpen(true)}
                title="Cambiar y personalizar foto del logo del canal (GIF o MP4)"
                className="absolute inset-0 z-20 rounded-3xl bg-black/65 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity backdrop-blur-xs cursor-pointer border border-[#00ff88]/60"
              >
                <Camera className="w-5 h-5 text-[#00ff88]" />
                <span className="text-[10px] font-mono font-bold text-[#00ff88]">Cambiar Logo</span>
                <span className="text-[8px] font-mono text-slate-300">GIF / MP4</span>
              </button>
            </div>

            {/* Channel Details */}
            <div className="space-y-1.5 max-w-xl">
              {/* THE FUTURISTIC LED / NEON FLASHING NAME */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1
                  style={{
                    color: ledConfig.hex,
                    textShadow: ledConfig.textShadow
                  }}
                  className={`text-xl sm:text-2xl font-bold font-mono tracking-wider ${
                    currentChannel.ledAnimation === 'flash'
                      ? 'animate-led-flash'
                      : currentChannel.ledAnimation === 'pulse'
                      ? 'animate-led-pulse'
                      : currentChannel.ledAnimation === 'wave'
                      ? 'animate-neon-wave'
                      : ''
                  }`}
                >
                  {currentChannel.name}
                </h1>

                {currentChannel.verified && (
                  <span className="px-2 py-0.5 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/40 text-[#00ff88] text-[10px] font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>VERIFICADO</span>
                  </span>
                )}
              </div>

              {/* Handle & Subscriber Stats */}
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="text-[#00ff88] font-bold">{currentChannel.handle}</span>
                <span>•</span>
                <span>{subscriberCount.toLocaleString()} suscriptores</span>
                <span>•</span>
                <span>{channelVideos.length} videos</span>
              </div>

              {/* Bio */}
              <p className="text-xs font-mono text-slate-300 leading-relaxed line-clamp-2 pt-1">
                {currentChannel.bio}
              </p>

              {/* Action Buttons: Subscribe + Share URL + Customize Logo/Channel */}
              <div className="pt-2 flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={handleToggleSubscribe}
                  className={`px-5 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
                    isSubscribed
                      ? 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-gradient-to-r from-[#00ff88] to-emerald-400 text-slate-950 hover:brightness-110 shadow-[#00ff88]/20'
                  }`}
                >
                  {isSubscribed ? <UserCheck className="w-4 h-4 text-[#00ff88]" /> : <UserPlus className="w-4 h-4" />}
                  <span>{isSubscribed ? 'Suscrito Cuántico' : 'Suscribirse'}</span>
                </button>

                <button
                  onClick={handleCopyChannelUrl}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#00ff88]/50 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all"
                >
                  {isCopiedUrl ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedUrl ? '¡URL Copiada!' : 'Copiar URL Canal'}</span>
                </button>

                <button
                  onClick={() => setIsCustomizeOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-950/30 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-900/40 font-mono text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Personalizar Logo</span>
                </button>

                <button
                  onClick={() => setIsCustomizeOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-950/30 border border-purple-500/40 text-purple-300 hover:bg-purple-900/40 font-mono text-xs flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Personalizar Canal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: 3D DIGITALIZED & ANIMATED QR CODE */}
          <div className="shrink-0 flex justify-center md:justify-end">
            <Channel3DQRCode
              channel={currentChannel}
              ledColor={currentChannel.ledColor}
              className="w-48"
            />
          </div>
        </div>

        {/* 4. TABS DENTRO DEL CANAL (VIDEOS, SHORTS, FOTOS, COMUNIDAD, INFORMACIÓN) */}
        <div className="mt-8 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
          {[
            { id: 'videos', label: `🎬 Videos (${channelVideos.length})` },
            { id: 'shorts', label: `📱 Shorts (${channelShorts.length})` },
            { id: 'photos', label: `📸 Fotos 4K (${channelPhotos.length})` },
            { id: 'posts', label: `📝 Muro Comunidad (${channelPosts.length})` },
            { id: 'about', label: 'ℹ️ Información Cuántica' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00ff88]/15 border border-[#00ff88]/50 text-[#00ff88] shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 5. TAB CONTENT */}
        <div className="mt-6">
          {/* TAB 1: VIDEOS 16:9 WITH 3D CLOTH PHYSICS & MOVING LED TEXT */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-[#00ff88]/20 text-[#00ff88]">
                    <Film className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold font-mono text-white">
                    Videos del Canal con Efecto 3D Tipo Pañuelo y Letras LED
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Arrastra cada tarjeta para sentir la deformación 3D
                </span>
              </div>

              {/* Grid of Cloth Cards with Moving Neon Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {channelVideos.map((video) => (
                  <ChannelVideoClothCard
                    key={video.id}
                    video={video}
                    onSelectVideo={(id) => onSelectVideo(id)}
                    ledColor={currentChannel.ledColor}
                    isMarqueeActive={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SHORTS VERTICALES */}
          {activeTab === 'shorts' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {channelShorts.map((short) => (
                <div
                  key={short.id}
                  onClick={() => onSelectVideo(short.id)}
                  className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-[#00ff88] cursor-pointer shadow-lg transition-all"
                >
                  <img
                    src={short.thumbnailUrl}
                    alt={short.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-3 flex flex-col justify-end">
                    <p className="text-xs font-mono font-bold text-white line-clamp-2">
                      {short.title}
                    </p>
                    <p className="text-[10px] font-mono text-[#00ff88] mt-1">
                      {short.metrics.views.toLocaleString()} vistas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: FOTOS */}
          {activeTab === 'photos' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {channelPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-[#00ff88] shadow-lg"
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
                    <p className="text-xs font-mono font-bold text-white truncate">
                      {photo.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: COMUNIDAD */}
          {activeTab === 'posts' && (
            <div className="max-w-2xl mx-auto space-y-4">
              {channelPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#00ff88]/40"
                    />
                    <div>
                      <p className="text-xs font-mono font-bold text-white">{post.author.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{post.createdAt}</p>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-slate-200 leading-relaxed">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: ABOUT */}
          {activeTab === 'about' && (
            <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-5">
              <h3 className="text-base font-bold font-mono text-white">
                Acerca de {currentChannel.name}
              </h3>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                {currentChannel.bio}
              </p>

              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-400">
                <div>
                  <span className="text-slate-500 block">Identificador Cuántico:</span>
                  <span className="text-[#00ff88] font-bold">{currentChannel.handle}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Audiencia Total:</span>
                  <span className="text-white font-bold">{subscriberCount.toLocaleString()} suscriptores</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estilo LED de Nombre:</span>
                  <span style={{ color: ledConfig.hex }} className="font-bold">
                    {ledConfig.name} ({currentChannel.ledAnimation})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Formato de Cabecera:</span>
                  <span className="text-white font-bold uppercase">
                    {currentChannel.bannerType} en bucle permanente
                  </span>
                </div>
              </div>

              {currentChannel.links && currentChannel.links.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-mono text-slate-400 block">Enlaces Oficiales:</span>
                  <div className="flex flex-wrap gap-2">
                    {currentChannel.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-[#00ff88]/50 text-xs font-mono text-[#00ff88] flex items-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{link.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 6. MODAL PARA PERSONALIZAR EL CANAL */}
      <ChannelCustomizeModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        channel={currentChannel}
        onChannelUpdated={(updated) => {
          setCurrentChannel(updated);
        }}
      />
    </div>
  );
};
