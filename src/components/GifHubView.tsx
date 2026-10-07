import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Heart,
  Share2,
  Copy,
  Check,
  Download,
  Plus,
  Code,
  Flame,
  Zap,
  Tag
} from 'lucide-react';
import { GifItem, ShareItemData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface GifHubViewProps {
  gifs: GifItem[];
  onLikeGif: (gifId: string) => void;
  onOpenShareModal: (item: ShareItemData) => void;
  onOpenCreateModal: () => void;
}

export const GifHubView: React.FC<GifHubViewProps> = ({
  gifs,
  onLikeGif,
  onOpenShareModal,
  onOpenCreateModal
}) => {
  const { language, t } = useLanguage();
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'todos', label: t('gifs.all', '👾 Todos los GIFs') },
    { id: 'cyberpunk', label: '🌆 Cyberpunk' },
    { id: 'anime', label: '⚡ Anime FX' },
    { id: 'synthwave', label: '🎹 Synthwave' },
    { id: 'neon', label: language === 'es' ? '✨ Neón & Loops' : '✨ Neon & Loops' },
    { id: 'memes', label: language === 'es' ? '🎭 Memes Cuánticos' : '🎭 Quantum Memes' },
    { id: 'ia', label: language === 'es' ? '🧠 IA & Neuronal' : '🧠 AI & Neural' }
  ];

  const filteredGifs = gifs.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(localSearch.toLowerCase()) ||
      g.tags.some((t) => t.toLowerCase().includes(localSearch.toLowerCase())) ||
      g.creator.name.toLowerCase().includes(localSearch.toLowerCase());

    if (selectedCategory !== 'todos') {
      return matchesSearch && g.category === selectedCategory;
    }
    return matchesSearch;
  });

  const handleCopyGifUrl = (gif: GifItem) => {
    navigator.clipboard.writeText(gif.gifUrl);
    setCopiedId(gif.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Dedicated Search Header for GIFs */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0d18] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#ffaa00]/20 border border-[#ffaa00]/40 text-[#ffaa00]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white flex items-center gap-2">
                {t('gifs.title', 'GIF HUB')} <span className="text-[#ffaa00]">{t('gifs.sub', 'BUCLES & ANIMACIONES')}</span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {t('gifs.desc', 'GIFs animados cyberpunk, bucles synthwave y stickers holográficos listos para compartir')}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffaa00] to-[#ff0055] text-white font-orbitron font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-md shadow-[#ffaa00]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('gifs.publishBtn', 'Publicar GIF Animado')}
          </button>
        </div>

        {/* Dedicated Search Bar for GIFs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ffaa00]" />
            <input
              type="text"
              placeholder={t('gifs.searchPlaceholder', 'Buscar GIFs animados y bucles (ej. Tunnel, Neon, Matrix, Anime, Drive)...')}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#ffaa00] transition-colors"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                {t('search.clear', 'Limpiar')}
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#ffaa00] text-black font-bold shadow-md shadow-[#ffaa00]/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GIFs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGifs.map((gif) => (
          <div
            key={gif.id}
            className="group rounded-3xl overflow-hidden bg-[#0b0e17] border border-slate-800 hover:border-[#ffaa00]/60 shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
          >
            {/* GIF Player Preview */}
            <div className="relative aspect-square sm:aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
              <img
                src={gif.gifUrl}
                alt={gif.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-50 group-hover:opacity-80 transition-opacity" />

              {/* GIF Badge */}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-0.5 rounded-full bg-black/70 text-[#ffaa00] border border-[#ffaa00]/40 text-[10px] font-mono font-bold backdrop-blur-md">
                  {t('gifs.badge', 'GIF BUCLE')}
                </span>
              </div>

              {/* 1-Click Copy Overlay Button */}
              <button
                onClick={() => handleCopyGifUrl(gif)}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 border border-slate-700 text-white text-xs font-bold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-105 flex items-center gap-1.5"
              >
                {copiedId === gif.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#00ff88]" /> {t('gifs.copied', 'Copiado')}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> {t('gifs.copyLink', 'Copiar Enlace')}
                  </>
                )}
              </button>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h3 className="font-orbitron font-bold text-sm truncate drop-shadow">
                  {gif.title}
                </h3>
              </div>
            </div>

            {/* Details and Actions */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="flex flex-wrap gap-1">
                {gif.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-amber-300"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLikeGif(gif.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#ff0055] text-slate-300 hover:text-[#ff0055] text-xs font-semibold transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 text-[#ff0055]" />
                    <span>{gif.metrics.likes.toLocaleString()}</span>
                  </button>

                  <button
                    onClick={() => handleCopyGifUrl(gif)}
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                    title={t('gifs.copyLink', 'Copiar URL del GIF')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() =>
                    onOpenShareModal({
                      type: 'gif',
                      id: gif.id,
                      title: gif.title,
                      url: gif.gifUrl,
                      previewImage: gif.gifUrl,
                      description: `GIF: ${gif.title}`,
                      author: gif.creator.name
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ffaa00]/20 border border-[#ffaa00]/50 text-[#ffaa00] text-xs font-bold font-orbitron hover:bg-[#ffaa00]/30 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {t('player.share', 'COMPARTIR').toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGifs.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-[#0b0e17] rounded-3xl border border-slate-800">
          {t('gifs.none', 'No se encontraron GIFs')} {localSearch ? `("${localSearch}")` : ''}.
        </div>
      )}
    </div>
  );
};
