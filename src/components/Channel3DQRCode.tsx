import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Sparkles,
  Share2,
  Copy,
  Check,
  Download,
  Maximize2,
  X,
  ExternalLink,
  Radio,
  Eye
} from 'lucide-react';
import { ChannelCustomization, ChannelLedColor } from '../types';
import { LED_COLOR_CONFIG } from '../services/channelService';
import { ChannelAvatarMedia } from './ChannelAvatarMedia';

interface Channel3DQRCodeProps {
  channel: ChannelCustomization;
  ledColor?: ChannelLedColor;
  className?: string;
}

export const Channel3DQRCode: React.FC<Channel3DQRCodeProps> = ({
  channel,
  ledColor = 'neon-green',
  className = ''
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 12, rotateY: -15 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const ledConfig = LED_COLOR_CONFIG[ledColor] || LED_COLOR_CONFIG['neon-green'];
  const channelUrl = `${window.location.origin}/#channel/${encodeURIComponent(channel.handle)}`;

  useEffect(() => {
    QRCode.toDataURL(
      channelUrl,
      {
        width: 380,
        margin: 2,
        color: {
          dark: '#030712',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [channelUrl]);

  // Interactive 3D tilt on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 22;
    const rotY = ((x - centerX) / centerX) * 22;
    setTilt({ rotateX: rotX, rotateY: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 12, rotateY: -15 });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(channelUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2400);
    } catch {}
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QuanticTube_QR_${channel.handle.replace('@', '')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <>
      {/* 3D Holographic Card Container */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={`relative perspective-1000 cursor-pointer select-none group ${className}`}
        onClick={() => setIsModalOpen(true)}
      >
        <div
          style={{
            transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${isHovered ? 1.04 : 1}, ${isHovered ? 1.04 : 1}, 1)`,
            transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out'
          }}
          className="relative p-3.5 rounded-2xl bg-gradient-to-b from-[#0b1021]/95 to-[#04060d]/95 border border-slate-800 hover:border-[#00ff88]/60 shadow-2xl backdrop-blur-xl transition-all duration-300"
        >
          {/* Holographic Glowing Aura */}
          <div
            style={{
              backgroundColor: ledConfig.hex,
              boxShadow: `0 0 35px ${ledConfig.glowRgba}`
            }}
            className="absolute -inset-1 rounded-2xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity pointer-events-none"
          />

          {/* 3D Cyber HUD Header */}
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span
                style={{ color: ledConfig.hex }}
                className="p-1 rounded-md bg-slate-900 border border-slate-800"
              >
                <QrCode className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200">
                QR 3D DIGITAL
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>ACTIVO</span>
            </div>
          </div>

          {/* Holographic QR Core with Scanning Laser */}
          <div className="relative w-40 h-40 mx-auto rounded-xl overflow-hidden bg-slate-950 p-2 border border-slate-800/80 flex items-center justify-center shadow-inner">
            {/* Cyber Grid background */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#00ff88_1px,transparent_1px)] [background-size:12px_12px]" />

            {/* Orbiting Rotating Holographic Ring */}
            <div
              style={{
                borderColor: ledConfig.hex
              }}
              className="absolute -inset-2 rounded-full border border-dashed opacity-40 animate-[spin_10s_linear_infinite] pointer-events-none"
            />

            {/* The Actual QR Code Image */}
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Canal ${channel.name}`}
                className="w-full h-full object-contain rounded-lg relative z-10 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              />
            ) : (
              <div className="text-xs font-mono text-slate-500 animate-pulse">
                Generando QR 3D...
              </div>
            )}

            {/* Futuristic Scanning Laser line animation */}
            <div
              style={{
                background: `linear-gradient(180deg, transparent, ${ledConfig.hex}, transparent)`,
                boxShadow: `0 0 12px ${ledConfig.glowRgba}`
              }}
              className="absolute left-0 right-0 h-1.5 z-20 pointer-events-none animate-[scanLaser_2.4s_ease-in-out_infinite]"
            />

            {/* Center Channel Hologram Badge */}
            <div className="absolute z-20 pointer-events-none w-7 h-7 rounded-full bg-[#050814]/90 border border-[#00ff88] p-0.5 shadow-lg flex items-center justify-center overflow-hidden">
              <ChannelAvatarMedia
                src={channel.avatar}
                type={channel.avatarType}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </div>

          {/* Quick Footer info */}
          <div className="mt-2 text-center">
            <p className="text-[10px] font-mono text-slate-400 truncate max-w-[170px] mx-auto">
              {channel.handle}
            </p>
            <p className="text-[9px] font-mono text-[#00ff88] flex items-center justify-center gap-1 mt-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Toca para expandir 3D</span>
            </p>
          </div>
        </div>
      </div>

      {/* EXPANDED FULLSCREEN 3D HOLOGRAPHIC QR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md p-6 rounded-3xl bg-gradient-to-b from-[#0c1226] to-[#04060d] border border-slate-700/80 shadow-2xl space-y-5"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#00ff88] shadow-md bg-black">
                <ChannelAvatarMedia
                  src={channel.avatar}
                  type={channel.avatarType}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-base font-bold font-mono text-white flex items-center gap-1.5">
                  <span>{channel.name}</span>
                </h3>
                <p className="text-xs font-mono text-[#00ff88]">{channel.handle}</p>
              </div>
            </div>

            {/* Large 3D Holographic Display */}
            <div className="relative p-6 rounded-2xl bg-[#030612] border border-slate-800 flex flex-col items-center justify-center shadow-inner overflow-hidden">
              {/* Spinning 3D Rings */}
              <div
                style={{ borderColor: ledConfig.hex }}
                className="absolute inset-4 rounded-full border-2 border-dashed opacity-25 animate-[spin_12s_linear_infinite] pointer-events-none"
              />
              <div
                style={{ borderColor: ledConfig.hex }}
                className="absolute inset-1 rounded-full border border-dotted opacity-20 animate-[spin_18s_linear_infinite_reverse] pointer-events-none"
              />

              {/* QR Image */}
              <div className="relative z-10 w-64 h-64 bg-white p-3 rounded-2xl shadow-2xl flex items-center justify-center">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt={`QR Canal ${channel.name}`}
                    className="w-full h-full object-contain"
                  />
                )}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#050814]/95 border-2 border-[#00ff88] p-1 shadow-2xl flex items-center justify-center">
                    <img
                      src={channel.avatar}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Holographic Laser */}
              <div
                style={{
                  background: `linear-gradient(180deg, transparent, ${ledConfig.hex}, transparent)`,
                  boxShadow: `0 0 16px ${ledConfig.glowRgba}`
                }}
                className="absolute left-6 right-6 h-2 z-20 pointer-events-none animate-[scanLaser_2.6s_ease-in-out_infinite]"
              />

              <p className="text-xs font-mono text-slate-300 mt-4 text-center">
                Apunta la cámara de tu celular para abrir este canal al instante.
              </p>
            </div>

            {/* URL Display Bar */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-300 truncate">
                {channelUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-[#00ff88]/15 border border-[#00ff88]/50 hover:bg-[#00ff88]/25 text-[#00ff88] font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleDownloadQR}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#00ff88]/50 text-slate-200 hover:text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Download className="w-4 h-4 text-[#00ff88]" />
                <span>Descargar PNG</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00ff88] to-emerald-400 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-[#00ff88]/20"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir Canal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
