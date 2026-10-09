import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Palette,
  Film,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sliders,
  Type,
  Radio,
  Eye,
  Save,
  Link,
  Flame,
  Upload,
  Camera,
  Layers,
  Tv,
  FileVideo,
  Play
} from 'lucide-react';
import {
  ChannelCustomization,
  ChannelLedColor,
  ChannelLedAnimation
} from '../types';
import {
  MOVING_BANNER_PRESETS,
  CHANNEL_LOGO_PRESETS,
  LED_COLOR_CONFIG,
  saveUserChannel,
  updateChannel,
  isMediaVideo
} from '../services/channelService';
import { ChannelAvatarMedia } from './ChannelAvatarMedia';
import { registerVideoBlob } from '../services/videoBlobService';

interface ChannelCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChannelCustomization;
  onChannelUpdated: (updated: ChannelCustomization) => void;
}

export const ChannelCustomizeModal: React.FC<ChannelCustomizeModalProps> = ({
  isOpen,
  onClose,
  channel,
  onChannelUpdated
}) => {
  const [name, setName] = useState(channel.name);
  const [handle, setHandle] = useState(channel.handle);
  const [bio, setBio] = useState(channel.bio);
  const [avatar, setAvatar] = useState(channel.avatar);
  const [avatarType, setAvatarType] = useState<'video' | 'gif' | 'image'>(
    channel.avatarType || (isMediaVideo(channel.avatar) ? 'video' : 'gif')
  );
  const [bannerType, setBannerType] = useState<'video' | 'gif' | 'image'>(channel.bannerType || 'gif');
  const [bannerUrl, setBannerUrl] = useState(channel.bannerUrl);
  const [ledColor, setLedColor] = useState<ChannelLedColor>(channel.ledColor || 'neon-green');
  const [ledAnimation, setLedAnimation] = useState<ChannelLedAnimation>(channel.ledAnimation || 'pulse');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [bannerLoadError, setBannerLoadError] = useState(false);

  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or channel prop changes
  useEffect(() => {
    if (isOpen) {
      setName(channel.name);
      setHandle(channel.handle);
      setBio(channel.bio);
      setAvatar(channel.avatar);
      setAvatarType(channel.avatarType || (isMediaVideo(channel.avatar) ? 'video' : 'gif'));
      setBannerType(channel.bannerType || 'gif');
      setBannerUrl(channel.bannerUrl);
      setLedColor(channel.ledColor || 'neon-green');
      setLedAnimation(channel.ledAnimation || 'pulse');
      setBannerLoadError(false);
    }
  }, [isOpen, channel]);

  if (!isOpen) return null;

  const currentLedConfig = LED_COLOR_CONFIG[ledColor] || LED_COLOR_CONFIG['neon-green'];

  // Handle direct file upload for moving banner
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv)$/i);
    // Persist securely in IndexedDB and generate lightweight blob URL
    const key = `ch_banner_${channel.id}_${Date.now()}`;
    const liveBlobUrl = registerVideoBlob(key, file);
    setBannerUrl(liveBlobUrl);
    setBannerType(isVideo ? 'video' : 'gif');
    setBannerLoadError(false);
  };

  // Handle direct file upload for channel logo photo (supports GIF, MP4, WebM, PNG, JPG)
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv)$/i);
    const isGif = file.type === 'image/gif' || file.name.match(/\.gif$/i);
    // Persist securely in IndexedDB and generate lightweight blob URL
    const key = `ch_logo_${channel.id}_${Date.now()}`;
    const liveBlobUrl = registerVideoBlob(key, file);
    setAvatar(liveBlobUrl);
    setAvatarType(isVideo ? 'video' : isGif ? 'gif' : 'image');
  };

  // Handle manual banner URL change with auto-detect
  const handleBannerUrlInput = (val: string) => {
    setBannerUrl(val);
    setBannerLoadError(false);
    const lower = val.toLowerCase();
    if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.includes('video/')) {
      setBannerType('video');
    } else if (lower.endsWith('.gif') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
      setBannerType('gif');
    }
  };

  // Handle manual logo URL change with auto-detect
  const handleLogoUrlInput = (val: string) => {
    setAvatar(val);
    const lower = val.toLowerCase();
    if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.includes('video/')) {
      setAvatarType('video');
    } else if (lower.endsWith('.gif')) {
      setAvatarType('gif');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
    const updatedChannel: ChannelCustomization = {
      ...channel,
      name: name.trim() || 'Mi Canal Cuántico',
      handle: cleanHandle || '@mi_canal',
      bio: bio.trim(),
      avatar: avatar.trim() || channel.avatar,
      avatarType,
      bannerType,
      bannerUrl: bannerUrl.trim() || channel.bannerUrl,
      ledColor,
      ledAnimation
    };

    updateChannel(updatedChannel);
    if (channel.isOwner) {
      saveUserChannel(updatedChannel);
    }
    onChannelUpdated(updatedChannel);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 800);
  };

  const isCurrentLogoVideo = avatarType === 'video' || isMediaVideo(avatar);

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl my-auto rounded-3xl bg-gradient-to-b from-[#0c1226] via-[#080c1a] to-[#04060d] border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Hidden File Inputs */}
        <input
          ref={bannerFileInputRef}
          type="file"
          accept="image/gif,image/png,image/jpeg,image/webp,video/mp4,video/webm"
          className="hidden"
          onChange={handleBannerFileChange}
        />
        <input
          ref={logoFileInputRef}
          type="file"
          accept="image/gif,image/png,image/jpeg,image/webp,video/mp4,video/webm"
          className="hidden"
          onChange={handleLogoFileChange}
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span
              style={{ color: currentLedConfig.hex, borderColor: currentLedConfig.hex }}
              className="p-2.5 rounded-2xl bg-slate-900 border shadow-lg"
            >
              <Palette className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-white flex items-center gap-2">
                <span>Personalizar Canal Cuántico</span>
                <span className="px-2 py-0.5 rounded-full bg-[#00ff88]/15 text-[#00ff88] text-[10px] font-mono border border-[#00ff88]/30">
                  GIF & MP4 EN MOVIMIENTO
                </span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Personaliza la cabecera y el logo del canal con fotos en movimiento (GIFs y videos MP4)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 scrollbar-thin">
          {/* 1. LIVE PREVIEW BANNER & LED NAME & AVATAR IN MOTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase">
                <Eye className="w-3.5 h-3.5 text-[#00ff88]" />
                <span>Vista Previa en Tiempo Real:</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                Haz clic en el logo para subir un GIF o video MP4
              </span>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner group/preview">
              {/* Moving Banner Preview with Fallback */}
              <div className="h-32 sm:h-40 w-full relative overflow-hidden bg-slate-950">
                {bannerType === 'video' && !bannerLoadError ? (
                  <video
                    key={bannerUrl}
                    src={bannerUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => setBannerLoadError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={bannerUrl}
                    alt="Banner Preview"
                    onError={() => setBannerLoadError(true)}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Cyberpunk Hologram Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c1a] via-transparent to-black/30 pointer-events-none" />

                {/* Badge Banner Status */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-mono text-[#00ff88] flex items-center gap-1 shadow-lg">
                    <Film className="w-3 h-3 animate-pulse" />
                    <span>{bannerType === 'video' ? 'BANNER VIDEO MP4' : 'BANNER GIF LOOP'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="px-2 py-0.5 rounded-md bg-[#00ff88]/20 backdrop-blur-md border border-[#00ff88]/50 text-[9px] font-mono text-[#00ff88] hover:bg-[#00ff88] hover:text-slate-950 transition-all flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Subir Banner</span>
                  </button>
                </div>
              </div>

              {/* Avatar Logo in Motion (GIF / MP4) + LED Name Overlay */}
              <div className="p-4 flex items-center gap-3.5 relative -mt-9">
                <div
                  onClick={() => logoFileInputRef.current?.click()}
                  title="Haz clic para subir un GIF o video MP4 como logo"
                  className="relative group cursor-pointer shrink-0"
                >
                  <div
                    style={{
                      backgroundColor: currentLedConfig.hex,
                      boxShadow: `0 0 20px ${currentLedConfig.glowRgba}`
                    }}
                    className="absolute -inset-1 rounded-2xl blur-xs opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-slate-950 shadow-2xl z-10 bg-black">
                    <ChannelAvatarMedia
                      src={avatar || channel.avatar}
                      type={avatarType}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 z-20 rounded-2xl bg-black/65 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                    <Camera className="w-4 h-4 text-[#00ff88]" />
                    <span className="text-[8px] font-mono font-bold text-[#00ff88]">CAMBIAR</span>
                    <span className="text-[7px] font-mono text-slate-300">GIF / MP4</span>
                  </div>
                </div>

                <div className="pt-7 flex-1 min-w-0">
                  {/* Customized LED Neon Name */}
                  <div
                    style={{
                      color: currentLedConfig.hex,
                      textShadow: currentLedConfig.textShadow
                    }}
                    className={`text-lg sm:text-xl font-bold font-mono tracking-wider truncate ${
                      ledAnimation === 'flash'
                        ? 'animate-led-flash'
                        : ledAnimation === 'pulse'
                        ? 'animate-led-pulse'
                        : ledAnimation === 'wave'
                        ? 'animate-neon-wave'
                        : ''
                    }`}
                  >
                    {name || 'Nombre del Canal'}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <p className="text-xs font-mono text-slate-400 truncate">{handle}</p>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>
                        {isCurrentLogoVideo
                          ? 'LOGO VIDEO MP4'
                          : avatarType === 'gif' || avatar.toLowerCase().includes('.gif')
                          ? 'LOGO GIF ANIMADO'
                          : 'LOGO FOTO'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. PERSONALIZAR FOTO DEL LOGO DEL CANAL (GIFS Y MP4 POR IGUAL) */}
          <div className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <label className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>1. Foto y Logo del Canal (GIFs y MP4 en Movimiento):</span>
              </label>

              {/* Logo Type Switcher: GIF, Video MP4 or Static */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAvatarType('gif')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    avatarType === 'gif'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/50 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  ⚡ GIF Animado
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarType('video')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    avatarType === 'video'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/50 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  ▶ Video MP4 Loop
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarType('image')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    avatarType === 'image'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/50 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  ★ Foto HD
                </button>
              </div>
            </div>

            {/* Direct Upload Button for Logo with MP4 and GIF support */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => logoFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/10 hover:from-cyan-500/30 hover:to-blue-500/20 border border-cyan-400/50 hover:border-cyan-400 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md group"
              >
                <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                <span>📁 Subir Logo desde tu Dispositivo (GIF o Video MP4)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAvatar(channel.avatar);
                  setAvatarType(channel.avatarType || 'image');
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Logo Original</span>
              </button>
            </div>

            <p className="text-[11px] font-mono text-slate-400">
              Soporta archivos <span className="text-cyan-400 font-bold">.GIF</span> animados y videos <span className="text-cyan-400 font-bold">.MP4</span> / <span className="text-cyan-400 font-bold">.WEBM</span> en bucle sin fin, así como fotos PNG/JPG.
            </p>

            {/* Futuristic Logo Presets Gallery with GIF & MP4 */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>O selecciona un Logo Cuántico en Movimiento (GIFs y MP4):</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-1 scrollbar-thin">
                {CHANNEL_LOGO_PRESETS.map((preset) => {
                  const isSelected = avatar === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setAvatar(preset.url);
                        setAvatarType(preset.type);
                      }}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border p-2 flex flex-col gap-2 transition-all group ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/50 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-400/10'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-slate-700 bg-black">
                        <ChannelAvatarMedia
                          src={preset.url}
                          type={preset.type}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <span className="absolute top-1 right-1 p-0.5 rounded-full bg-cyan-400 text-slate-950 shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-black/80 text-cyan-300 border border-white/10">
                          {preset.type === 'video' ? '▶ MP4' : preset.type === 'gif' ? '⚡ GIF' : '★ HD'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-200 truncate">
                        {preset.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom URL Input for Avatar */}
            <div className="pt-2 space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Link className="w-3 h-3 text-slate-400" />
                <span>O ingresa tu propia URL directa de GIF o Video MP4 para el Logo:</span>
              </label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => handleLogoUrlInput(e.target.value)}
                placeholder="https://.../tu_logo_en_movimiento.gif o .mp4"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. PERSONALIZAR CABECERA / BANNER EN MOVIMIENTO */}
          <div className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <label className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-[#00ff88]" />
                <span>2. Cabecera en Movimiento (Banner GIF o Video Loop):</span>
              </label>

              {/* Video vs GIF switcher */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBannerType('gif')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    bannerType === 'gif'
                      ? 'bg-[#00ff88]/20 text-[#00ff88] font-bold border border-[#00ff88]/50 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  GIF Animado
                </button>
                <button
                  type="button"
                  onClick={() => setBannerType('video')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    bannerType === 'video'
                      ? 'bg-[#00ff88]/20 text-[#00ff88] font-bold border border-[#00ff88]/50 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  Video Loop MP4
                </button>
              </div>
            </div>

            {/* Direct Upload Button for Banner */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => bannerFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 hover:from-emerald-500/30 hover:to-teal-500/20 border border-[#00ff88]/50 hover:border-[#00ff88] text-[#00ff88] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md group"
              >
                <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                <span>📁 Subir Banner desde tu Dispositivo (GIF o Video)</span>
              </button>

              <span className="text-[11px] font-mono text-slate-500 text-center sm:text-left">
                Soporta archivos .GIF, .MP4, .WEBM, .PNG y .JPG sin límites
              </span>
            </div>

            {/* Presets Gallery */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00ff88]" />
                <span>O selecciona un Banner Futurista en Movimiento (Probados 60 FPS):</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                {MOVING_BANNER_PRESETS.map((preset) => {
                  const isSelected = bannerUrl === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setBannerType(preset.type);
                        setBannerUrl(preset.url);
                        setBannerLoadError(false);
                      }}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border aspect-video transition-all group ${
                        isSelected
                          ? 'border-[#00ff88] ring-2 ring-[#00ff88]/40 scale-[1.02] shadow-lg shadow-[#00ff88]/10'
                          : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.previewImage}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2">
                        <span className="text-[9px] font-mono font-bold text-white truncate">
                          {preset.name}
                        </span>
                        <span className="text-[8px] font-mono text-[#00ff88]">
                          {preset.type === 'video' ? '▶ Video Loop' : '⚡ Gif 60 FPS'}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#00ff88] text-slate-950 shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom URL Input for Banner */}
            <div className="pt-2 space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Link className="w-3 h-3 text-slate-400" />
                <span>O ingresa tu propia URL directa de GIF o Video MP4:</span>
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => handleBannerUrlInput(e.target.value)}
                placeholder="https://.../tu_video_o_gif.mp4"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-[#00ff88] focus:outline-none"
              />
            </div>
          </div>

          {/* 4. NOMBRE DEL CANAL Y HANDLE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#00ff88]" />
                <span>Nombre del Canal (Letras LED):</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Quantic Nova 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:border-[#00ff88] focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <span>Handle Único:</span>
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@tu_canal"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm focus:border-[#00ff88] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* 5. COLOR LED Y ESTILO DE ILUMINACIÓN */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#00ff88]" />
              <span>Color de Letras LED & Efecto de Brillo Neón:</span>
            </label>

            {/* Colors Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(LED_COLOR_CONFIG) as ChannelLedColor[]).map((key) => {
                const conf = LED_COLOR_CONFIG[key];
                const isSelected = ledColor === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLedColor(key)}
                    style={{
                      borderColor: isSelected ? conf.hex : undefined,
                      boxShadow: isSelected ? `0 0 14px ${conf.glowRgba}` : 'none'
                    }}
                    className={`p-2.5 rounded-xl border font-mono text-xs flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-slate-900 font-bold text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: conf.hex }}
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    />
                    <span className="truncate">{conf.name}</span>
                  </button>
                );
              })}
            </div>

            {/* LED Animation Style Selector */}
            <div className="pt-2">
              <label className="text-[11px] font-mono text-slate-400 mb-1.5 block">
                Modo de Animación LED de las Letras:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'pulse', label: '💓 Pulso Suave' },
                  { id: 'flash', label: '⚡ Flash Cyber' },
                  { id: 'glow', label: '✨ Resplandor Fijo' },
                  { id: 'wave', label: '🌊 Onda Gradiente' }
                ].map((anim) => (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => setLedAnimation(anim.id as ChannelLedAnimation)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all ${
                      ledAnimation === anim.id
                        ? 'bg-[#00ff88]/15 border-[#00ff88] text-[#00ff88] font-bold shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {anim.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. BIOGRAFÍA */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300">Biografía del Canal:</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="Describe la temática futurista de tu canal..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:border-[#00ff88] focus:outline-none"
            />
          </div>

          {/* Footer Save Actions */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-mono text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00ff88] to-emerald-400 text-slate-950 font-mono text-xs font-bold hover:brightness-110 shadow-lg shadow-[#00ff88]/20 flex items-center gap-2 transition-all"
            >
              {isSavedNotice ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSavedNotice ? '¡Canal Guardado!' : 'Guardar y Publicar Canal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
