import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  QrCode,
  Code,
  Send,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Download
} from 'lucide-react';
import { ShareItemData } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShareItemData | null;
  onShareToDM?: (item: ShareItemData) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  item,
  onShareToDM
}) => {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'social' | 'qr' | 'embed'>('link');

  if (!isOpen || !item) return null;

  const itemUrl = item.url || (typeof window !== 'undefined' ? window.location.href : 'https://quantictube.ai');
  const shareText = `Mira este contenido cuántico en QuanticTube: "${item.title}"`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(itemUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEmbed = () => {
    const embedCode = `<iframe src="${itemUrl}" width="560" height="315" frameborder="0" allowfullscreen title="${item.title}"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description || shareText,
          url: itemUrl
        });
      } catch (e) {}
    } else {
      handleCopyLink();
    }
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${itemUrl}`)}`
    },
    {
      name: 'X / Twitter',
      icon: '𝕏',
      color: 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(itemUrl)}&hashtags=QuanticTube,QuantumAI`
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: 'bg-sky-600/20 text-sky-400 border-sky-500/40 hover:bg-sky-600/30',
      url: `https://t.me/share/url?url=${encodeURIComponent(itemUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Reddit',
      icon: '🤖',
      color: 'bg-orange-600/20 text-orange-400 border-orange-500/40 hover:bg-orange-600/30',
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(itemUrl)}&title=${encodeURIComponent(item.title)}`
    },
    {
      name: 'Facebook',
      icon: '🌐',
      color: 'bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(itemUrl)}`
    },
    {
      name: 'Email',
      icon: '✉️',
      color: 'bg-purple-600/20 text-purple-400 border-purple-500/40 hover:bg-purple-600/30',
      url: `mailto:?subject=${encodeURIComponent(`QuanticTube: ${item.title}`)}&body=${encodeURIComponent(`${shareText}\n\nEnlace: ${itemUrl}`)}`
    }
  ];

  const typeLabels = {
    video: '🎥 Video Largo 16:9',
    short: '📱 Video Corto 9:16',
    photo: '🖼️ Foto / Imagen',
    post: '📝 Texto y Nota de Voz',
    gif: '👾 GIF Animado'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0a0d18] border-2 border-[#00ff88]/60 rounded-3xl shadow-2xl shadow-[#00ff88]/20 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#0d1222] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-1.5">
                COMPARTIR <span className="text-[#00ff88]">CUÁNTICO</span>
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                {typeLabels[item.type] || 'Contenido'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Preview Card */}
        <div className="p-4 bg-[#080a13] border-b border-slate-800/80">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            {item.previewImage && (
              <img
                src={item.previewImage}
                alt={item.title}
                className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-orbitron font-bold text-xs text-white truncate">
                {item.title}
              </h4>
              {item.author && (
                <p className="text-[11px] text-slate-400">Por {item.author}</p>
              )}
              <p className="text-[10px] font-mono text-emerald-400 truncate mt-0.5">
                {itemUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs: Link / Redes Sociales / QR / Embed */}
        <div className="flex items-center border-b border-slate-800 bg-[#070912]">
          {[
            { id: 'link', label: '🔗 Enlace', icon: Copy },
            { id: 'social', label: '🌐 Redes', icon: Share2 },
            { id: 'qr', label: '🔳 QR', icon: QrCode },
            { id: 'embed', label: '💻 Embeber', icon: Code }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 text-xs font-orbitron font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: DIRECT LINK */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">Enlace Cuántico Directo:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={itemUrl}
                    className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all ${
                      copied
                        ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/40'
                        : 'bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black hover:opacity-95'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Share in Quantic DM */}
              {onShareToDM && (
                <button
                  onClick={() => {
                    onShareToDM(item);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-950/60 border border-purple-500/50 hover:bg-purple-900/60 text-purple-200 text-xs font-bold font-orbitron flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  Enviar a un amigo en Mensajes Directos (DM)
                </button>
              )}

              {/* Native Share button */}
              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#00ff88] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4 text-[#00ff88]" />
                Abrir menú nativo de compartir en tu dispositivo
              </button>
            </div>
          )}

          {/* TAB 2: SOCIAL NETWORKS */}
          {activeTab === 'social' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {socialLinks.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 ${s.color}`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <span>{s.name}</span>
                </a>
              ))}
            </div>
          )}

          {/* TAB 3: QR CODE */}
          {activeTab === 'qr' && (
            <div className="text-center space-y-3">
              <div className="inline-block p-4 rounded-2xl bg-white border-4 border-[#00ff88] shadow-xl shadow-[#00ff88]/30">
                {/* SVG QR Code Simulation with holographic aesthetic */}
                <svg viewBox="0 0 100 100" className="w-36 h-36 mx-auto fill-black">
                  <rect width="100" height="100" fill="#ffffff" />
                  {/* Outer corner squares */}
                  <rect x="10" y="10" width="25" height="25" fill="#000000" />
                  <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="18" width="9" height="9" fill="#00ff88" />

                  <rect x="65" y="10" width="25" height="25" fill="#000000" />
                  <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="73" y="18" width="9" height="9" fill="#00ff88" />

                  <rect x="10" y="65" width="25" height="25" fill="#000000" />
                  <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="73" width="9" height="9" fill="#00ff88" />

                  {/* QR Pattern dots */}
                  <rect x="42" y="12" width="6" height="6" fill="#000000" />
                  <rect x="52" y="18" width="6" height="6" fill="#000000" />
                  <rect x="42" y="30" width="6" height="6" fill="#000000" />
                  <rect x="52" y="42" width="6" height="6" fill="#000000" />
                  <rect x="12" y="45" width="6" height="6" fill="#000000" />
                  <rect x="25" y="45" width="6" height="6" fill="#000000" />
                  <rect x="42" y="55" width="6" height="6" fill="#000000" />
                  <rect x="65" y="45" width="6" height="6" fill="#000000" />
                  <rect x="75" y="55" width="6" height="6" fill="#000000" />
                  <rect x="85" y="65" width="6" height="6" fill="#000000" />
                  <rect x="52" y="75" width="6" height="6" fill="#000000" />
                  <rect x="65" y="75" width="6" height="6" fill="#000000" />
                  <rect x="75" y="85" width="6" height="6" fill="#000000" />
                  <rect x="42" y="85" width="6" height="6" fill="#000000" />
                </svg>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Escanea con la cámara de tu teléfono para abrir directamente este contenido.
              </p>
            </div>
          )}

          {/* TAB 4: EMBED CODE */}
          {activeTab === 'embed' && (
            <div className="space-y-3">
              <label className="text-xs font-mono text-slate-300">
                Código HTML para insertar en tu sitio web:
              </label>
              <textarea
                readOnly
                rows={3}
                value={`<iframe src="${itemUrl}" width="560" height="315" frameborder="0" allowfullscreen title="${item.title}"></iframe>`}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyEmbed}
                className="w-full py-2.5 rounded-xl bg-[#00ff88] text-black font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#00ff88]/30"
              >
                {embedCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {embedCopied ? '¡Código HTML Copiado!' : 'Copiar Código Embebido'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
