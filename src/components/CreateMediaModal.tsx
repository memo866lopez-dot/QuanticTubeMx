import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Video,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Mic,
  Square,
  Play,
  Upload,
  Layers,
  Send,
  Check,
  Radio,
  Eye,
  Film
} from 'lucide-react';
import { VideoItem, PhotoItem, TextPostItem, GifItem } from '../types';
import { addPhoto, addPost, addGif } from '../services/mediaHubService';
import { registerVideoBlob, FALLBACK_VIDEOS, inMemoryUrls } from '../services/videoBlobService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface CreateMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoCreated: (video: VideoItem) => void;
  onPhotoCreated: (photo: PhotoItem) => void;
  onPostCreated: (post: TextPostItem) => void;
  onGifCreated: (gif: GifItem) => void;
  initialType?: 'video' | 'short' | 'photo' | 'post' | 'gif';
}

export const CreateMediaModal: React.FC<CreateMediaModalProps> = ({
  isOpen,
  onClose,
  onVideoCreated,
  onPhotoCreated,
  onPostCreated,
  onGifCreated,
  initialType = 'video'
}) => {
  const { user, userProfile } = useAuth();
  const { language, t } = useLanguage();
  const [activeType, setActiveType] = useState<'video' | 'short' | 'photo' | 'post' | 'gif'>(initialType);

  React.useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
    }
  }, [isOpen, initialType]);

  // Video / Short Form
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('https://vjs.zencdn.net/v/oceans.mp4');
  const [videoThumb, setVideoThumb] = useState('https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80');
  const [videoTags, setVideoTags] = useState('#Cyberpunk #QuanticTube #4K');

  // Photo Form
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80');
  const [photoCategory, setPhotoCategory] = useState<'cyberpunk' | 'neon' | 'synthwave' | 'ia-art' | 'wallpaper' | 'futurista'>('cyberpunk');
  const [photoTags, setPhotoTags] = useState('#FotoCuantica #Neon #8K');

  // Post / Voice Note Form
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('#Comunidad #QuanticFeed');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [hasRecordedVoice, setHasRecordedVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(12);

  // GIF Form
  const [gifTitle, setGifTitle] = useState('');
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState('https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif');
  const [gifCategory, setGifCategory] = useState<'cyberpunk' | 'anime' | 'synthwave' | 'neon' | 'memes' | 'reactions' | 'ia'>('cyberpunk');
  const [gifTags, setGifTags] = useState('#GifCuantico #Loop #Neon');

  if (!isOpen) return null;

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const tempId = `temp-${Date.now()}`;
      const url = registerVideoBlob(tempId, file);
      setVideoUrl(url);
      if (!videoTitle) setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));

      // Auto-extract real video frame thumbnail
      try {
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.src = url;
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        tempVideo.onloadeddata = () => {
          tempVideo.currentTime = Math.min(1, (tempVideo.duration || 2) * 0.2);
        };
        tempVideo.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = tempVideo.videoWidth || 1280;
            canvas.height = tempVideo.videoHeight || 720;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
              const thumb = canvas.toDataURL('image/jpeg', 0.85);
              setVideoThumb(thumb);
            }
          } catch (err) {
            console.warn('Could not generate frame thumbnail', err);
          }
        };
      } catch (err) {
        console.warn('Thumbnail generation error', err);
      }
    }
  };

  const handleThumbFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoThumb(url);
    }
  };

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      if (!photoTitle) setPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleGifFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGifFile(file);
      const url = URL.createObjectURL(file);
      setGifUrl(url);
      if (!gifTitle) setGifTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentUser = {
      name: userProfile?.name || user?.displayName || 'Memo Lopez',
      username: userProfile?.handle ? `@${userProfile.handle}` : (user?.email ? `@${user.email.split('@')[0]}` : '@memolopez'),
      avatar: userProfile?.avatar || user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      verified: userProfile?.isVerified ?? true,
      followers: userProfile?.subscribersCount ? `${userProfile.subscribersCount}` : '14.2K'
    };

    if (activeType === 'video' || activeType === 'short') {
      if (!videoTitle.trim()) return;
      const newVidId = `vid-${Date.now()}`;
      let finalUrl = videoUrl;
      if (videoFile) {
        finalUrl = registerVideoBlob(newVidId, videoFile);
      } else if (finalUrl && finalUrl.startsWith('blob:')) {
        inMemoryUrls.set(newVidId, finalUrl);
      } else if (!finalUrl) {
        finalUrl = activeType === 'short' ? FALLBACK_VIDEOS['9:16'][0] : FALLBACK_VIDEOS['16:9'][0];
      }

      const newVideo: VideoItem = {
        id: newVidId,
        title: videoTitle.trim(),
        description: videoDesc.trim() || (language === 'es' ? 'Nuevo contenido subido en QuanticTube.' : 'New content uploaded on QuanticTube.'),
        videoUrl: finalUrl,
        thumbnailUrl: videoThumb || (activeType === 'short' ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' : 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80'),
        format: activeType === 'short' ? '9:16' : '16:9',
        creator: currentUser,
        metrics: { views: 1, likes: 1, comments: 0, shares: 0 },
        tags: videoTags.split(' ').filter(Boolean),
        duration: activeType === 'short' ? 45 : 180,
        publishedAt: language === 'es' ? 'Recién publicado' : 'Just published',
        pins: []
      };
      onVideoCreated(newVideo);
    } else if (activeType === 'photo') {
      if (!photoTitle.trim()) return;
      const newPhoto: PhotoItem = {
        id: `photo-${Date.now()}`,
        title: photoTitle.trim(),
        description: photoDesc.trim() || (language === 'es' ? 'Foto compartida en QuanticGallery.' : 'Photo shared on QuanticGallery.'),
        imageUrl: photoUrl || 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
        category: photoCategory,
        creator: currentUser,
        metrics: { likes: 1, views: 1, shares: 0, downloads: 0 },
        tags: photoTags.split(' ').filter(Boolean),
        resolution: '8K UltraHD',
        createdAt: language === 'es' ? 'Recién publicado' : 'Just published',
        isAiGenerated: photoCategory === 'ia-art'
      };
      addPhoto(newPhoto);
      onPhotoCreated(newPhoto);
    } else if (activeType === 'post') {
      if (!postContent.trim()) return;
      const newPost: TextPostItem = {
        id: `post-${Date.now()}`,
        title: postTitle.trim() || undefined,
        content: postContent.trim(),
        author: currentUser,
        createdAt: language === 'es' ? 'Recién publicado' : 'Just published',
        tags: postTags.split(' ').filter(Boolean),
        hasVoiceNote: hasRecordedVoice,
        voiceDuration: hasRecordedVoice ? voiceDuration : undefined,
        metrics: { likes: 1, comments: 0, shares: 0 },
        reactions: { fire: 1, heart: 1, zap: 0, rocket: 0 }
      };
      addPost(newPost);
      onPostCreated(newPost);
    } else if (activeType === 'gif') {
      if (!gifTitle.trim()) return;
      const newGif: GifItem = {
        id: `gif-${Date.now()}`,
        title: gifTitle.trim(),
        gifUrl: gifUrl || 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
        previewUrl: gifUrl || 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/200.gif',
        category: gifCategory,
        tags: gifTags.split(' ').filter(Boolean),
        creator: { name: currentUser.name, avatar: currentUser.avatar },
        metrics: { likes: 1, shares: 0, views: 1 },
        dimensions: { width: 480, height: 480 },
        createdAt: language === 'es' ? 'Recién publicado' : 'Just published'
      };
      addGif(newGif);
      onGifCreated(newGif);
    }

    onClose();
  };

  const handleToggleVoiceRecording = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setTimeout(() => {
        setIsRecordingVoice(false);
        setHasRecordedVoice(true);
      }, 3000);
    } else {
      setIsRecordingVoice(false);
      setHasRecordedVoice(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0a0d18] border-2 border-[#00ff88]/60 rounded-3xl shadow-2xl shadow-[#00ff88]/20 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-[#0d1222] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-sm sm:text-base text-white">
                {language === 'es' ? 'SUBIR & PUBLICAR' : 'UPLOAD & PUBLISH'}{' '}
                <span className="text-[#00ff88]">{language === 'es' ? 'CONTENIDO' : 'MEDIA'}</span>
              </h3>
              <p className="text-[10px] font-mono text-slate-400">
                {language === 'es' ? 'Videos Largos 16:9, Shorts 9:16, Fotos 8K, Textos y GIFs' : 'Long 16:9 Videos, 9:16 Shorts, 8K Photos, Posts and GIFs'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Selector Tabs */}
        <div className="grid grid-cols-5 border-b border-slate-800 bg-[#070912]">
          {[
            { id: 'video', label: '16:9', desc: language === 'es' ? 'Video Largo' : 'Long Video', icon: Video, color: 'text-[#00ff88]' },
            { id: 'short', label: '9:16', desc: 'Short', icon: Play, color: 'text-[#ff0055]' },
            { id: 'photo', label: language === 'es' ? 'Foto' : 'Photo', desc: language === 'es' ? 'Imágenes' : 'Images', icon: ImageIcon, color: 'text-[#00ccff]' },
            { id: 'post', label: language === 'es' ? 'Texto' : 'Post', desc: language === 'es' ? '& Voz' : '& Voice', icon: FileText, color: 'text-purple-400' },
            { id: 'gif', label: 'GIF', desc: language === 'es' ? 'Animado' : 'Animated', icon: Sparkles, color: 'text-[#ffaa00]' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveType(tab.id as any)}
                className={`py-3 px-1 text-center border-b-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isTabActive
                    ? `border-[#00ff88] ${tab.color} bg-[#00ff88]/10 font-bold`
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-orbitron">{tab.label}</span>
                <span className="text-[9px] font-mono opacity-70 hidden sm:inline">{tab.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* VIDEO / SHORT FORM */}
          {(activeType === 'video' || activeType === 'short') && (
            <div className="space-y-4">
              {/* Native File Upload Buttons */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#00ff88]" />
                    <span className="text-xs font-bold text-white font-orbitron">
                      {language === 'es'
                        ? `Subir archivo de ${activeType === 'short' ? 'Short 9:16' : 'Video Largo 16:9'}`
                        : `Upload ${activeType === 'short' ? '9:16 Short' : '16:9 Long Video'} file`}
                    </span>
                  </div>

                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black text-xs font-orbitron font-bold hover:opacity-95 shadow-md shadow-[#00ff88]/20 transition-all flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'es' ? 'Elegir Archivo Local' : 'Choose Local File'}</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />
                  </label>
                </div>

                {videoFile && (
                  <p className="text-[11px] font-mono text-[#00ff88] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-bold">
                  {language === 'es' ? `Título del ${activeType === 'short' ? 'Short 9:16' : 'Video 16:9'} *` : `${activeType === 'short' ? '9:16 Short' : '16:9 Video'} Title *`}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'es' ? 'Ej. Concierto Holográfico en el Zócalo 2099' : 'E.g. Holographic Concert in Quantum Metropolis 2099'}
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#00ff88]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">
                  {language === 'es' ? 'Descripción:' : 'Description:'}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === 'es' ? 'Detalles sobre este video cuántico...' : 'Details about this video...'}
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#00ff88]"
                />
              </div>

              {/* URL input fallback + Thumbnail selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">
                    {language === 'es' ? 'URL o Archivo del Video:' : 'Video URL or File:'}
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#00ff88]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-slate-300">
                      {language === 'es' ? 'Miniatura / Portada:' : 'Thumbnail / Cover:'}
                    </label>
                    <label className="cursor-pointer text-[10px] text-cyan-400 hover:underline">
                      {language === 'es' ? '📁 Subir Imagen' : '📁 Upload Image'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbFile} />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={videoThumb}
                    onChange={(e) => setVideoThumb(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#00ff88]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">
                  {language === 'es' ? 'Etiquetas (separadas por espacio):' : 'Tags (space separated):'}
                </label>
                <input
                  type="text"
                  value={videoTags}
                  onChange={(e) => setVideoTags(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-400 font-mono focus:outline-none focus:border-[#00ff88]"
                />
              </div>
            </div>
          )}

          {/* PHOTO FORM */}
          {activeType === 'photo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-[#00ccff]/50 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#00ccff]" />
                    <span className="text-xs font-bold text-white font-orbitron">
                      {language === 'es' ? 'Subir Foto o Imagen de Alta Definición' : 'Upload HD Photo or Image'}
                    </span>
                  </div>

                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-[#00ccff] to-[#00ff88] text-black text-xs font-orbitron font-bold hover:opacity-95 shadow-md shadow-[#00ccff]/20 transition-all flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'es' ? 'Elegir Imagen Local' : 'Choose Local Image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />
                  </label>
                </div>

                {photoFile && (
                  <p className="text-[11px] font-mono text-[#00ccff] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {photoFile.name} ({(photoFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-bold">
                  {language === 'es' ? 'Título de la Foto / Imagen *' : 'Photo / Image Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'es' ? 'Ej. Rascacielos Neón y Tráfico Holográfico' : 'E.g. Neon Skyscrapers and Holographic Traffic'}
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#00ccff]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">
                    {language === 'es' ? 'Categoría:' : 'Category:'}
                  </label>
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#00ccff]"
                  >
                    <option value="cyberpunk">Cyberpunk</option>
                    <option value="ia-art">Arte con IA (Veo Art)</option>
                    <option value="neon">Neón Cuántico</option>
                    <option value="synthwave">Synthwave</option>
                    <option value="futurista">Futurista</option>
                    <option value="wallpaper">Fondo de Pantalla (8K)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">
                    {language === 'es' ? 'Etiquetas:' : 'Tags:'}
                  </label>
                  <input
                    type="text"
                    value={photoTags}
                    onChange={(e) => setPhotoTags(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-400 font-mono focus:outline-none focus:border-[#00ccff]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* POST / VOICE NOTE FORM */}
          {activeType === 'post' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-bold">
                  {language === 'es' ? 'Título del Post (Opcional):' : 'Post Title (Optional):'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'es' ? 'Ej. Anuncio para la comunidad cuántica' : 'E.g. Quantum community announcement'}
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-bold">
                  {language === 'es' ? 'Mensaje o Contenido de Texto *' : 'Message or Text Content *'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={language === 'es' ? '¿Qué estás pensando o creando hoy en QuanticTube?' : 'What are you thinking or creating today on QuanticTube?'}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Attach Audio Voice Note */}
              <div className="p-3.5 rounded-2xl bg-[#0e1424] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#00ff88] flex items-center gap-1.5 font-bold">
                    <Mic className="w-4 h-4" /> {language === 'es' ? 'Adjuntar Nota de Voz Holográfica' : 'Attach Holographic Voice Note'}
                  </span>
                  {hasRecordedVoice && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Audio {voiceDuration}s listo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleVoiceRecording}
                    className={`px-4 py-2 rounded-xl text-xs font-orbitron font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isRecordingVoice
                        ? 'bg-[#ff0055] text-white animate-pulse'
                        : hasRecordedVoice
                        ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-[#00ff88]'
                    }`}
                  >
                    {isRecordingVoice ? (
                      <>
                        <Square className="w-4 h-4" /> Grabando voz...
                      </>
                    ) : hasRecordedVoice ? (
                      <>
                        <Mic className="w-4 h-4 text-emerald-400" /> Regrabar Nota de Voz
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" /> Grabar Nota de Voz
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">
                  {language === 'es' ? 'Etiquetas / Hashtags:' : 'Tags / Hashtags:'}
                </label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          )}

          {/* GIF FORM */}
          {activeType === 'gif' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-[#ffaa00]/50 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#ffaa00]" />
                    <span className="text-xs font-bold text-white font-orbitron">
                      {language === 'es' ? 'Subir Archivo .GIF Animado' : 'Upload Animated .GIF File'}
                    </span>
                  </div>

                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffaa00] to-[#ff0055] text-white text-xs font-orbitron font-bold hover:opacity-95 shadow-md shadow-[#ffaa00]/20 transition-all flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{language === 'es' ? 'Elegir Archivo .GIF' : 'Choose .GIF File'}</span>
                    <input type="file" accept="image/gif,video/mp4,video/webm" className="hidden" onChange={handleGifFile} />
                  </label>
                </div>

                {gifFile && (
                  <p className="text-[11px] font-mono text-[#ffaa00] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {gifFile.name} ({(gifFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-bold">
                  {language === 'es' ? 'Título del GIF Animado *' : 'Animated GIF Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'es' ? 'Ej. Bucle Neón Infinito Cyberpunk' : 'E.g. Infinite Cyberpunk Neon Loop'}
                  value={gifTitle}
                  onChange={(e) => setGifTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#ffaa00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">
                    {language === 'es' ? 'Categoría:' : 'Category:'}
                  </label>
                  <select
                    value={gifCategory}
                    onChange={(e) => setGifCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#ffaa00]"
                  >
                    <option value="cyberpunk">Cyberpunk</option>
                    <option value="anime">Anime FX</option>
                    <option value="synthwave">Synthwave</option>
                    <option value="neon">Neón / Loops</option>
                    <option value="memes">Memes & Reacciones</option>
                    <option value="ia">IA & Neuronal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">
                    {language === 'es' ? 'Etiquetas:' : 'Tags:'}
                  </label>
                  <input
                    type="text"
                    value={gifTags}
                    onChange={(e) => setGifTags(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 font-mono focus:outline-none focus:border-[#ffaa00]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00ff88] via-[#00ccff] to-[#ff0055] text-black font-orbitron font-bold text-xs tracking-wider shadow-lg shadow-[#00ff88]/30 hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{language === 'es' ? 'PUBLICAR Y COMPARTIR EN QUANTICTUBE' : 'PUBLISH & SHARE ON QUANTICTUBE'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
