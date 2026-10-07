import React, { useState } from 'react';
import {
  Search,
  Image as ImageIcon,
  Heart,
  Share2,
  Download,
  Eye,
  Sparkles,
  Plus,
  Maximize2,
  X,
  Layers,
  Filter
} from 'lucide-react';
import { PhotoItem, ShareItemData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PhotosGalleryViewProps {
  photos: PhotoItem[];
  onLikePhoto: (photoId: string) => void;
  onOpenShareModal: (item: ShareItemData) => void;
  onOpenCreateModal: () => void;
}

export const PhotosGalleryView: React.FC<PhotosGalleryViewProps> = ({
  photos,
  onLikePhoto,
  onOpenShareModal,
  onOpenCreateModal
}) => {
  const { language, t } = useLanguage();
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<PhotoItem | null>(null);

  const categories = [
    { id: 'todos', label: t('photos.all', '🌟 Todas las Fotos') },
    { id: 'cyberpunk', label: '🌆 Cyberpunk' },
    { id: 'ia-art', label: language === 'es' ? '⚡ Arte con IA (Veo)' : '⚡ AI Art (Veo)' },
    { id: 'neon', label: language === 'es' ? '✨ Neón Cuántico' : '✨ Quantum Neon' },
    { id: 'synthwave', label: '🎹 Synthwave' },
    { id: 'wallpaper', label: '🖼️ Wallpapers 4K' }
  ];

  const filteredPhotos = photos.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(localSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(localSearch.toLowerCase()) ||
      p.creator.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(localSearch.toLowerCase()));

    if (selectedCategory !== 'todos') {
      return matchesSearch && p.category === selectedCategory;
    }
    return matchesSearch;
  });

  const handleDownload = (photo: PhotoItem) => {
    const link = document.createElement('a');
    link.href = photo.imageUrl;
    link.download = `${photo.title.toLowerCase().replace(/\s+/g, '_')}_quantic.jpg`;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Dedicated Search Header for Photos & Images */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0d18] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00ccff]/20 border border-[#00ccff]/40 text-[#00ccff]">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white flex items-center gap-2">
                {t('photos.title', 'GALERÍA DE FOTOS')} <span className="text-[#00ccff]">{t('photos.sub', '& ARTE DIGITAL')}</span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {t('photos.desc', 'Fotografía cyberpunk, wallpapers 8K y creaciones visuales de la comunidad')}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#00ccff] to-[#00ff88] text-black font-orbitron font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-md shadow-[#00ccff]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('photos.publishBtn', 'Subir Foto / Imagen')}
          </button>
        </div>

        {/* Dedicated Search Bar for Photos */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00ccff]" />
            <input
              type="text"
              placeholder={t('photos.searchPlaceholder', 'Buscar fotos e imágenes (ej. Neón, Metrópolis, Maya, Wallpaper, Katana)...')}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00ccff] transition-colors"
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
                    ? 'bg-[#00ccff] text-black font-bold shadow-md shadow-[#00ccff]/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Photos Masonry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            className="group rounded-3xl overflow-hidden bg-[#0b0e17] border border-slate-800 hover:border-[#00ccff]/60 shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
          >
            {/* Image Preview */}
            <div className="relative aspect-[4/3] overflow-hidden bg-black">
              <img
                src={photo.imageUrl}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-60 group-hover:opacity-90 transition-opacity" />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                {photo.isAiGenerated && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-950/90 text-purple-300 border border-purple-500/50 text-[10px] font-mono font-bold backdrop-blur-md">
                    ⚡ IA RENDER
                  </span>
                )}
                {photo.resolution && (
                  <span className="px-2 py-0.5 rounded-full bg-black/70 text-slate-200 text-[10px] font-mono backdrop-blur-md border border-slate-700">
                    {photo.resolution}
                  </span>
                )}
              </div>

              {/* Expand Lightbox Button */}
              <button
                onClick={() => setActiveLightboxPhoto(photo)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 border border-slate-700 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                title="Ver en pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Bottom Creator Info */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <img
                    src={photo.creator.avatar}
                    alt={photo.creator.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#00ccff]"
                  />
                  <span className="text-xs font-bold drop-shadow">{photo.creator.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-300 drop-shadow">
                  {photo.createdAt}
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-orbitron font-bold text-sm text-white group-hover:text-[#00ccff] transition-colors">
                  {photo.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {photo.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {photo.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-slate-900 text-cyan-400 text-[10px] font-mono border border-slate-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions Toolbar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onLikePhoto(photo.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#ff0055] text-slate-300 hover:text-[#ff0055] text-xs font-semibold transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 text-[#ff0055]" />
                    <span>{photo.metrics.likes.toLocaleString()}</span>
                  </button>
                  <button
                    onClick={() => handleDownload(photo)}
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                    title={t('photos.download', 'Descargar Foto')}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() =>
                    onOpenShareModal({
                      type: 'photo',
                      id: photo.id,
                      title: photo.title,
                      url: photo.imageUrl,
                      previewImage: photo.imageUrl,
                      description: photo.description,
                      author: photo.creator.name
                    })
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ccff]/20 border border-[#00ccff]/50 text-[#00ccff] text-xs font-bold font-orbitron hover:bg-[#00ccff]/30 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {t('player.share', 'COMPARTIR').toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPhotos.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-[#0b0e17] rounded-3xl border border-slate-800">
          {t('photos.none', 'No se encontraron fotos o imágenes')} {localSearch ? `("${localSearch}")` : ''}.
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {activeLightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fadeIn">
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button
              onClick={() => setActiveLightboxPhoto(null)}
              className="absolute -top-12 right-0 p-2 rounded-xl bg-slate-900 border border-slate-700 text-white hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeLightboxPhoto.imageUrl}
              alt={activeLightboxPhoto.title}
              className="max-h-[75vh] w-auto rounded-2xl object-contain border-2 border-[#00ccff]/50 shadow-2xl shadow-[#00ccff]/30"
            />
            <div className="mt-4 p-4 rounded-2xl bg-[#0b0e17] border border-slate-800 w-full flex items-center justify-between">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base">
                  {activeLightboxPhoto.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('photos.by', 'Por')} {activeLightboxPhoto.creator.name} • {activeLightboxPhoto.resolution}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(activeLightboxPhoto)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> {t('photos.download', 'Descargar')}
                </button>
                <button
                  onClick={() => {
                    onOpenShareModal({
                      type: 'photo',
                      id: activeLightboxPhoto.id,
                      title: activeLightboxPhoto.title,
                      url: activeLightboxPhoto.imageUrl,
                      previewImage: activeLightboxPhoto.imageUrl,
                      description: activeLightboxPhoto.description,
                      author: activeLightboxPhoto.creator.name
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-[#00ccff] text-black text-xs font-orbitron font-bold flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> {t('player.share', 'Compartir')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
