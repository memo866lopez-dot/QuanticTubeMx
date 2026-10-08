import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Video,
  Upload,
  Music,
  Sliders,
  Play,
  Square,
  Check,
  Film,
  Camera,
  Layers,
  Wand2,
  FileText,
  Image as ImageIcon,
  Send,
  Plus,
  Radio,
  Tag,
  Eye,
  Download,
  Flame,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VideoItem, PhotoItem, TextPostItem, GifItem } from '../types';
import { generateSyntheticVideo } from '../services/videoGenerator';
import { mexiSynth } from '../services/audioSynth';
import { generateVideoStoryboard } from '../services/geminiService';
import { addPhoto, addPost, addGif } from '../services/mediaHubService';
import { registerVideoBlob, FALLBACK_VIDEOS } from '../services/videoBlobService';
import { uploadVideoToCloudinary, getCloudinaryVideoThumbnail } from '../services/cloudinaryService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface MexiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoCreated: (newVideo: VideoItem) => void;
  onPhotoCreated?: (newPhoto: PhotoItem) => void;
  onPostCreated?: (newPost: TextPostItem) => void;
  onGifCreated?: (newGif: GifItem) => void;
}

export const MexiStudioModal: React.FC<MexiStudioModalProps> = ({
  isOpen,
  onClose,
  onVideoCreated,
  onPhotoCreated,
  onPostCreated,
  onGifCreated
}) => {
  const { user, userProfile } = useAuth();
  const { language, t } = useLanguage();

  // Main Tabs: 'upload' | 'generate' | 'edit' | 'music' | 'camera'
  const [activeTab, setActiveTab] = useState<'upload' | 'generate' | 'edit' | 'music' | 'camera'>('upload');

  // Upload Sub-type: 'long_video' | 'short_video' | 'photo' | 'gif' | 'post'
  const [uploadMediaType, setUploadMediaType] = useState<'long_video' | 'short_video' | 'photo' | 'gif' | 'post'>('long_video');

  // Video / Short State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoThumbUrl, setVideoThumbUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<'16:9' | '9:16'>('16:9');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoTags, setVideoTags] = useState('#QuanticTube, #Futurista, #4K');

  // Photo State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');
  const [photoCategory, setPhotoCategory] = useState<'cyberpunk' | 'neon' | 'synthwave' | 'ia-art' | 'wallpaper' | 'futurista'>('cyberpunk');
  const [photoTags, setPhotoTags] = useState('#FotoCuantica, #Neon, #8K');

  // GIF State
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifTitle, setGifTitle] = useState('');
  const [gifCategory, setGifCategory] = useState<'cyberpunk' | 'anime' | 'synthwave' | 'neon' | 'memes' | 'reactions' | 'ia'>('cyberpunk');
  const [gifTags, setGifTags] = useState('#GifCuantico, #Loop, #Neon');

  // Post / Audio State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('#Comunidad, #QuanticFeed');
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // AI Generator state
  const [prompt, setPrompt] = useState(
    language === 'es'
      ? `Cyberpunk mariachi tocando guitarra de plasma en Paseo de la Reforma ${new Date().getFullYear()}`
      : `Cyberpunk guitarist performing with neon plasma in futuristic metropolis ${new Date().getFullYear()}`
  );
  const [aiFormat, setAiFormat] = useState<'16:9' | '9:16'>('16:9');
  const [style, setStyle] = useState<'cyberpunk' | 'mariachi_synth' | 'hyperreal' | 'neon_matrix' | 'retro_vhs'>('cyberpunk');
  const [overlayText, setOverlayText] = useState(`QUANTICTUBE ${new Date().getFullYear()}`);
  const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');

  // Lyria Synth Music state
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [selectedMusicPreset, setSelectedMusicPreset] = useState('Cyber Corrido Synth');
  const [synthBpm, setSynthBpm] = useState(128);

  // Camera Recording state
  const [isRecordingWebcam, setIsRecordingWebcam] = useState(false);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordPreviewRef = useRef<HTMLVideoElement>(null);

  if (!isOpen) return null;

  const currentUser = {
    name: userProfile?.name || user?.displayName || 'Comandante Quantic',
    username: userProfile?.handle ? `@${userProfile.handle}` : (user?.email ? `@${user.email.split('@')[0]}` : '@comandante_quantic'),
    avatar: userProfile?.avatar || user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    verified: userProfile?.isVerified ?? true,
    followers: userProfile?.subscribersCount ? `${userProfile.subscribersCount}` : '14.2K'
  };

  // Video File Handlers
  const handleVideoFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const tempId = `temp-${Date.now()}`;
      const url = registerVideoBlob(tempId, file);
      setVideoUrl(url);
      if (!videoTitle) {
        setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

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
              setVideoThumbUrl(thumb);
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

  const handleThumbFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoThumbUrl(url);
    }
  };

  const handlePhotoFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      if (!photoTitle) {
        setPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleGifFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGifFile(file);
      const url = URL.createObjectURL(file);
      setGifUrl(url);
      if (!gifTitle) {
        setGifTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Handle image upload for AI animation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate video with AI
  const handleStartGeneration = async () => {
    setIsGenerating(true);
    setProgress(5);
    setProgressStage(language === 'es' ? 'Iniciando síntesis neuronal...' : 'Starting neural synthesis...');

    try {
      const storyboard = await generateVideoStoryboard(prompt, aiFormat);
      setVideoTitle(storyboard.title);
      setVideoDesc(storyboard.hook + ' ' + storyboard.scenes.map((s) => s.visual).join('. '));
      setVideoTags(storyboard.tags.join(', '));
      setFormat(aiFormat);

      const result = await generateSyntheticVideo({
        prompt,
        format: aiFormat,
        style,
        overlayText,
        sourceImageBase64: sourceImageBase64 || undefined,
        durationSeconds: aiFormat === '9:16' ? 6 : 8,
        onProgress: (pct, stage) => {
          setProgress(pct);
          setProgressStage(stage);
        }
      });

      setVideoUrl(result.videoUrl);
      setVideoThumbUrl(result.thumbnailUrl);
      setIsGenerating(false);
      setActiveTab('edit');
    } catch (err) {
      console.warn('Video generation error:', err);
      setIsGenerating(false);
      alert(language === 'es' ? 'Ocurrió un detalle al generar el video. Intenta de nuevo.' : 'Error generating video. Please try again.');
    }
  };

  // Lyria Music Synth play/stop
  const toggleSynthPlay = () => {
    if (isPlayingMusic) {
      mexiSynth.stop();
      setIsPlayingMusic(false);
    } else {
      mexiSynth.setPreset(selectedMusicPreset);
      mexiSynth.setBpm(synthBpm);
      mexiSynth.play();
      setIsPlayingMusic(true);
    }
  };

  // Webcam quick recording
  const startWebcamRecording = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      webcamStreamRef.current = s;
      if (recordPreviewRef.current) {
        recordPreviewRef.current.srcObject = s;
      }
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(s);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        s.getTracks().forEach((t) => t.stop());
        setIsRecordingWebcam(false);
        setActiveTab('edit');
      };

      mr.start();
      setIsRecordingWebcam(true);
    } catch (err) {
      console.warn('Webcam recording error:', err);
      alert(language === 'es' ? 'No se pudo acceder a la cámara para grabar.' : 'Could not access camera.');
    }
  };

  const stopWebcamRecording = () => {
    if (mediaRecorderRef.current && isRecordingWebcam) {
      mediaRecorderRef.current.stop();
    }
  };

  // Trigger celebration confetti
  const triggerCelebration = () => {
    confetti({
      particleCount: 110,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#00ff88', '#00ccff', '#ff0055', '#ffffff']
    });
  };

  // Publish from Studio
  const handlePublishFromStudio = async () => {
    if (activeTab === 'upload') {
      if (uploadMediaType === 'long_video' || uploadMediaType === 'short_video') {
        const finalFormat = uploadMediaType === 'short_video' ? '9:16' : '16:9';
        const newVidId = `vid-${Date.now()}`;
        let finalUrl = videoUrl;
        let finalThumb = videoThumbUrl;

        if (videoFile) {
          try {
            const res = await uploadVideoToCloudinary(videoFile);
            if (res.success && res.url) {
              finalUrl = res.url;
              const autoThumb = getCloudinaryVideoThumbnail(res.url);
              if (autoThumb && !finalThumb) finalThumb = autoThumb;
            } else {
              finalUrl = registerVideoBlob(newVidId, videoFile);
            }
          } catch {
            finalUrl = registerVideoBlob(newVidId, videoFile);
          }
        } else if (!finalUrl) {
          finalUrl = uploadMediaType === 'short_video' ? FALLBACK_VIDEOS['9:16'][0] : FALLBACK_VIDEOS['16:9'][0];
        }

        const newVideo: VideoItem = {
          id: newVidId,
          title: videoTitle.trim() || (finalFormat === '9:16' ? 'Short Cuántico 9:16' : 'Video Largo Cuántico 16:9'),
          description: videoDesc.trim() || (language === 'es' ? 'Subido directamente desde QuanticStudio.' : 'Uploaded directly from QuanticStudio.'),
          videoUrl: finalUrl,
          thumbnailUrl: finalThumb || (finalFormat === '9:16' ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' : 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80'),
          format: finalFormat,
          creator: currentUser,
          metrics: { views: 1, likes: 1, comments: 0, shares: 0 },
          tags: videoTags.split(',').map((t) => t.trim()).filter(Boolean),
          duration: finalFormat === '9:16' ? 30 : 120,
          publishedAt: language === 'es' ? 'Recién subido' : 'Just uploaded',
          pins: []
        };
        onVideoCreated(newVideo);
      } else if (uploadMediaType === 'photo') {
        const finalPhotoUrl = photoUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80';
        const newPhoto: PhotoItem = {
          id: `photo-${Date.now()}`,
          title: photoTitle.trim() || (language === 'es' ? 'Foto Cuántica 8K' : '8K Quantum Photo'),
          description: photoDesc.trim() || (language === 'es' ? 'Subida desde QuanticStudio.' : 'Uploaded from QuanticStudio.'),
          imageUrl: finalPhotoUrl,
          category: photoCategory,
          creator: currentUser,
          metrics: { likes: 1, views: 1, shares: 0, downloads: 0 },
          tags: photoTags.split(',').map((t) => t.trim()).filter(Boolean),
          resolution: '8K UltraHD',
          createdAt: language === 'es' ? 'Recién subido' : 'Just uploaded',
          isAiGenerated: photoCategory === 'ia-art'
        };
        addPhoto(newPhoto);
        if (onPhotoCreated) onPhotoCreated(newPhoto);
      } else if (uploadMediaType === 'gif') {
        const finalGifUrl = gifUrl || 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif';
        const newGif: GifItem = {
          id: `gif-${Date.now()}`,
          title: gifTitle.trim() || 'GIF Animado Cyberpunk',
          gifUrl: finalGifUrl,
          previewUrl: finalGifUrl,
          category: gifCategory,
          tags: gifTags.split(',').map((t) => t.trim()).filter(Boolean),
          creator: { name: currentUser.name, avatar: currentUser.avatar },
          metrics: { likes: 1, shares: 0, views: 1 },
          dimensions: { width: 480, height: 480 },
          createdAt: language === 'es' ? 'Recién subido' : 'Just uploaded'
        };
        addGif(newGif);
        if (onGifCreated) onGifCreated(newGif);
      } else if (uploadMediaType === 'post') {
        const newPost: TextPostItem = {
          id: `post-${Date.now()}`,
          title: postTitle.trim() || undefined,
          content: postContent.trim() || (language === 'es' ? 'Nuevo comunicado holográfico desde QuanticStudio.' : 'New announcement from QuanticStudio.'),
          author: currentUser,
          createdAt: language === 'es' ? 'Recién publicado' : 'Just published',
          tags: postTags.split(',').map((t) => t.trim()).filter(Boolean),
          hasVoiceNote,
          voiceDuration: hasVoiceNote ? 15 : undefined,
          metrics: { likes: 1, comments: 0, shares: 0 },
          reactions: { fire: 1, heart: 1, zap: 0, rocket: 0 }
        };
        addPost(newPost);
        if (onPostCreated) onPostCreated(newPost);
      }
    } else {
      // From AI generation or edit tab
      if (!videoUrl) {
        alert(language === 'es' ? 'Primero genera o sube un video.' : 'First generate or upload a video.');
        return;
      }
      const newVideo: VideoItem = {
        id: `vid-${Date.now()}`,
        title: videoTitle || (format === '9:16' ? 'Short IA QuanticTube' : 'Video Panorámico QuanticTube'),
        description: videoDesc || (language === 'es' ? `Creado con QuanticStudio IA en QuanticTube ${new Date().getFullYear()}.` : `Created with QuanticStudio AI in QuanticTube ${new Date().getFullYear()}.`),
        videoUrl,
        thumbnailUrl: videoThumbUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        format,
        creator: currentUser,
        metrics: { views: 1, likes: 1, comments: 0, shares: 0 },
        tags: videoTags.split(',').map((t) => t.trim()).filter(Boolean),
        duration: format === '9:16' ? 15 : 60,
        publishedAt: language === 'es' ? 'Recién subido' : 'Just uploaded',
        isAIGenerated: true,
        pins: []
      };
      onVideoCreated(newVideo);
    }

    if (isPlayingMusic) {
      mexiSynth.stop();
      setIsPlayingMusic(false);
    }

    triggerCelebration();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#090b14] rounded-3xl border-2 border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Studio Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#0b0e1a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#00ff88] via-[#00ccff] to-[#ff0055] p-0.5 shadow-lg shadow-[#00ff88]/20">
              <div className="w-full h-full bg-[#090b14] rounded-[14px] flex items-center justify-center text-[#00ff88]">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-orbitron text-white">
                  QUANTICSTUDIO <span className="text-[#00ff88]">CREATOR & UPLOAD SUITE</span>
                </h2>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/40 text-[#00ff88] text-[10px] font-mono font-bold">
                  {language === 'es' ? 'SUBIR & CREAR' : 'UPLOAD & CREATE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'es'
                  ? 'Sube videos largos 16:9, shorts 9:16, fotos, GIFs y notas de voz, o genera con IA Veo 3.1.'
                  : 'Upload long 16:9 videos, 9:16 shorts, photos, GIFs and voice notes, or generate with AI Veo 3.1.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isPlayingMusic) {
                mexiSynth.stop();
                setIsPlayingMusic(false);
              }
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-rose-500 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Studio Tabs */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-[#070912] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-orbitron font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-[#00ff88]/25 to-[#00ccff]/25 border-2 border-[#00ff88] text-[#00ff88] shadow-md shadow-[#00ff88]/20'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Upload className="w-4 h-4 text-[#00ff88]" />
            <span>{language === 'es' ? 'SUBIR ARCHIVOS (UPLOAD)' : 'UPLOAD MEDIA'}</span>
          </button>

          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-orbitron font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 border-2 border-purple-400 text-purple-300 shadow-md'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4 text-purple-400" />
            <span>{language === 'es' ? 'Generar con IA (Veo 3.1)' : 'Generate with AI (Veo 3.1)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-orbitron font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 shadow-md'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>{language === 'es' ? 'Editor & Previsualización' : 'Editor & Preview'}</span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-orbitron font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'music'
                ? 'bg-purple-500/20 border-2 border-purple-400 text-purple-300 shadow-md'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4 text-purple-400" />
            <span>{language === 'es' ? 'Música Lyria Synth' : 'Lyria Synth Music'}</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-orbitron font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-300 shadow-md'
                : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4 text-rose-400" />
            <span>{language === 'es' ? 'Grabar Cámara en Vivo' : 'Live Camera Record'}</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: DEDICATED UPLOAD HUB (VIDEOS LARGOS, SHORTS, FOTOS, GIFS, POSTS) */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Media Sub-Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { id: 'long_video', label: '16:9 Video Largo', icon: Video, color: 'text-[#00ff88]', border: 'border-[#00ff88]', bg: 'bg-[#00ff88]/15' },
                  { id: 'short_video', label: '9:16 Short', icon: Play, color: 'text-[#ff0055]', border: 'border-[#ff0055]', bg: 'bg-[#ff0055]/15' },
                  { id: 'photo', label: language === 'es' ? 'Foto / Arte 8K' : 'Photo / 8K Art', icon: ImageIcon, color: 'text-[#00ccff]', border: 'border-[#00ccff]', bg: 'bg-[#00ccff]/15' },
                  { id: 'gif', label: 'GIF Animado', icon: Sparkles, color: 'text-[#ffaa00]', border: 'border-[#ffaa00]', bg: 'bg-[#ffaa00]/15' },
                  { id: 'post', label: language === 'es' ? 'Post & Audio' : 'Post & Audio', icon: FileText, color: 'text-purple-400', border: 'border-purple-400', bg: 'bg-purple-500/15' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = uploadMediaType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setUploadMediaType(item.id as any)}
                      className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        isActive
                          ? `${item.bg} ${item.border} ${item.color} font-bold shadow-lg shadow-black/40 scale-[1.02]`
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-slate-400'}`} />
                      <span className="text-xs font-orbitron">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* UPLOAD VIEW 1: VIDEO LARGO 16:9 */}
              {uploadMediaType === 'long_video' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Left: Dropzone & File Selectors */}
                  <div className="space-y-4">
                    <div className="p-6 rounded-3xl bg-slate-950 border-2 border-dashed border-[#00ff88]/50 hover:border-[#00ff88] transition-all text-center flex flex-col items-center justify-center relative overflow-hidden group">
                      <div className="p-4 rounded-2xl bg-[#00ff88]/10 text-[#00ff88] mb-3 group-hover:scale-110 transition-transform">
                        <Video className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-white font-orbitron mb-1">
                        {language === 'es' ? 'Subir Video Largo (Formato 16:9)' : 'Upload Long Video (16:9 Format)'}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4 max-w-xs">
                        {language === 'es' ? 'Archivos MP4, WebM, MOV en resolución 1080p o 4K UltraHD' : 'MP4, WebM, MOV files in 1080p or 4K UltraHD'}
                      </p>

                      <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black text-xs font-orbitron font-bold hover:opacity-95 shadow-lg shadow-[#00ff88]/30 transition-all flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>{language === 'es' ? 'ELEGIR ARCHIVO DE VIDEO 16:9' : 'CHOOSE 16:9 VIDEO FILE'}</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleVideoFileInput}
                        />
                      </label>

                      {videoFile && (
                        <div className="mt-4 px-3 py-1.5 rounded-xl bg-[#00ff88]/15 border border-[#00ff88]/40 text-[#00ff88] text-xs font-mono flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span className="truncate max-w-[240px]">{videoFile.name}</span>
                          <span className="text-[10px] opacity-80">({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                        </div>
                      )}
                    </div>

                    {/* Custom Thumbnail Upload */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <ImageIcon className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="text-xs font-bold text-white">
                            {language === 'es' ? 'Miniatura Personalizada 16:9' : 'Custom 16:9 Thumbnail'}
                          </p>
                          <p className="text-[10px] text-slate-400">JPG, PNG o WebP en 1920x1080</p>
                        </div>
                      </div>
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-semibold transition-all">
                        {language === 'es' ? 'Subir Miniatura' : 'Upload Thumbnail'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleThumbFileInput}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Right: Metadata & Live Preview */}
                  <div className="space-y-4">
                    {videoUrl ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-xl">
                        <video src={videoUrl} controls autoPlay muted loop className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#00ff88] border border-[#00ff88]/40">
                          16:9 PANORÁMICO
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                        <Film className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="text-xs font-mono">
                          {language === 'es' ? 'La previsualización del video 16:9 aparecerá aquí al seleccionarlo' : '16:9 video preview will appear here'}
                        </span>
                      </div>
                    )}

                    {/* Metadata fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                          {language === 'es' ? 'Título del Video 16:9 *' : '16:9 Video Title *'}
                        </label>
                        <input
                          type="text"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder={language === 'es' ? 'Ej. Documental Metrópolis Cuántica 4K...' : 'E.g. Quantum Metropolis Documentary 4K...'}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ff88]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">
                          {language === 'es' ? 'Descripción del Video:' : 'Video Description:'}
                        </label>
                        <textarea
                          rows={2}
                          value={videoDesc}
                          onChange={(e) => setVideoDesc(e.target.value)}
                          placeholder={language === 'es' ? 'Escribe los detalles y créditos de tu video...' : 'Write video details and credits...'}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ff88]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">
                          {language === 'es' ? 'Etiquetas (separadas por coma):' : 'Tags (comma separated):'}
                        </label>
                        <input
                          type="text"
                          value={videoTags}
                          onChange={(e) => setVideoTags(e.target.value)}
                          placeholder="#QuanticTube, #Cinema, #4K"
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-cyan-400 focus:outline-none focus:border-[#00ff88]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOAD VIEW 2: VIDEO CORTO / SHORT 9:16 */}
              {uploadMediaType === 'short_video' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div className="p-6 rounded-3xl bg-slate-950 border-2 border-dashed border-[#ff0055]/50 hover:border-[#ff0055] transition-all text-center flex flex-col items-center justify-center relative overflow-hidden group">
                      <div className="p-4 rounded-2xl bg-[#ff0055]/10 text-[#ff0055] mb-3 group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 fill-[#ff0055]" />
                      </div>
                      <h4 className="text-sm font-bold text-white font-orbitron mb-1">
                        {language === 'es' ? 'Subir Short Vertical (Formato 9:16)' : 'Upload Vertical Short (9:16 Format)'}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4 max-w-xs">
                        {language === 'es' ? 'Formato móvil vertical óptimo para interacción con pañuelo 3D' : 'Mobile vertical format optimized for 3D cloth interaction'}
                      </p>

                      <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff0055] via-[#ff00aa] to-[#00f0ff] text-white text-xs font-orbitron font-bold hover:opacity-95 shadow-lg shadow-[#ff0055]/30 transition-all flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>{language === 'es' ? 'ELEGIR ARCHIVO DE SHORT 9:16' : 'CHOOSE 9:16 SHORT FILE'}</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleVideoFileInput}
                        />
                      </label>

                      {videoFile && (
                        <div className="mt-4 px-3 py-1.5 rounded-xl bg-[#ff0055]/15 border border-[#ff0055]/40 text-pink-300 text-xs font-mono flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#ff0055]" />
                          <span className="truncate max-w-[240px]">{videoFile.name}</span>
                          <span className="text-[10px] opacity-80">({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                        </div>
                      )}
                    </div>

                    {/* Custom Thumbnail for Short */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <ImageIcon className="w-5 h-5 text-pink-400" />
                        <div>
                          <p className="text-xs font-bold text-white">
                            {language === 'es' ? 'Portada Vertical 9:16' : 'Vertical 9:16 Cover'}
                          </p>
                          <p className="text-[10px] text-slate-400">JPG o PNG en 1080x1920</p>
                        </div>
                      </div>
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-pink-500 text-pink-300 text-xs font-semibold transition-all">
                        {language === 'es' ? 'Subir Portada' : 'Upload Cover'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleThumbFileInput}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {videoUrl ? (
                      <div className="relative max-w-[240px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-black border-2 border-[#ff0055]/60 shadow-2xl">
                        <video src={videoUrl} controls autoPlay muted loop className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#ff0055] border border-[#ff0055]/40 font-bold">
                          9:16 SHORT
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[240px] mx-auto aspect-[9/16] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                        <Play className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="text-xs font-mono">
                          {language === 'es' ? 'Previsualización del Short 9:16' : '9:16 Short Preview'}
                        </span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                          {language === 'es' ? 'Título del Short 9:16 *' : '9:16 Short Title *'}
                        </label>
                        <input
                          type="text"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder={language === 'es' ? 'Ej. Baile Holográfico en Neón...' : 'E.g. Holographic Neon Dance...'}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ff0055]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1">
                          {language === 'es' ? 'Hashtags del Short:' : 'Short Hashtags:'}
                        </label>
                        <input
                          type="text"
                          value={videoTags}
                          onChange={(e) => setVideoTags(e.target.value)}
                          placeholder="#Shorts, #QuanticTube, #Viral, #3D"
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-pink-300 focus:outline-none focus:border-[#ff0055]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOAD VIEW 3: FOTOS / ARTE DIGITAL 8K */}
              {uploadMediaType === 'photo' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div className="p-6 rounded-3xl bg-slate-950 border-2 border-dashed border-[#00ccff]/50 hover:border-[#00ccff] transition-all text-center flex flex-col items-center justify-center">
                      <div className="p-4 rounded-2xl bg-[#00ccff]/10 text-[#00ccff] mb-3">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-white font-orbitron mb-1">
                        {language === 'es' ? 'Subir Foto o Imagen de Alta Definición' : 'Upload Photo or HD Artwork'}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4 max-w-xs">
                        {language === 'es' ? 'JPG, PNG, WebP en resoluciones 4K u 8K UltraHD' : 'JPG, PNG, WebP in 4K or 8K UltraHD'}
                      </p>

                      <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00ccff] to-[#00ff88] text-black text-xs font-orbitron font-bold hover:opacity-95 shadow-lg shadow-[#00ccff]/30 transition-all flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>{language === 'es' ? 'ELEGIR FOTO / IMAGEN LOCAL' : 'CHOOSE LOCAL PHOTO / IMAGE'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoFileInput}
                        />
                      </label>

                      {photoFile && (
                        <div className="mt-4 px-3 py-1.5 rounded-xl bg-[#00ccff]/15 border border-[#00ccff]/40 text-[#00ccff] text-xs font-mono flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span className="truncate max-w-[240px]">{photoFile.name}</span>
                          <span className="text-[10px] opacity-80">({(photoFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {photoUrl ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-cyan-500/50 shadow-xl">
                        <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#00ccff] border border-[#00ccff]/40 font-bold">
                          8K ULTRA HD
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                        <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="text-xs font-mono">
                          {language === 'es' ? 'Previsualización de la foto seleccionada' : 'Photo preview will appear here'}
                        </span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                          {language === 'es' ? 'Título de la Foto / Arte *' : 'Photo / Art Title *'}
                        </label>
                        <input
                          type="text"
                          value={photoTitle}
                          onChange={(e) => setPhotoTitle(e.target.value)}
                          placeholder={language === 'es' ? 'Ej. Rascacielos Neón y Tráfico Holográfico' : 'E.g. Neon Skyscrapers and Holographic Traffic'}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ccff]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-slate-300 mb-1">
                            {language === 'es' ? 'Categoría:' : 'Category:'}
                          </label>
                          <select
                            value={photoCategory}
                            onChange={(e) => setPhotoCategory(e.target.value as any)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ccff]"
                          >
                            <option value="cyberpunk">Cyberpunk</option>
                            <option value="ia-art">Arte con IA (Veo Art)</option>
                            <option value="neon">Neón Cuántico</option>
                            <option value="synthwave">Synthwave</option>
                            <option value="futurista">Futurista</option>
                            <option value="wallpaper">Wallpaper 8K</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-slate-300 mb-1">
                            {language === 'es' ? 'Etiquetas:' : 'Tags:'}
                          </label>
                          <input
                            type="text"
                            value={photoTags}
                            onChange={(e) => setPhotoTags(e.target.value)}
                            placeholder="#Foto, #8K, #Neon"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-cyan-400 focus:outline-none focus:border-[#00ccff]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOAD VIEW 4: GIF ANIMADO */}
              {uploadMediaType === 'gif' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div className="p-6 rounded-3xl bg-slate-950 border-2 border-dashed border-[#ffaa00]/50 hover:border-[#ffaa00] transition-all text-center flex flex-col items-center justify-center">
                      <div className="p-4 rounded-2xl bg-[#ffaa00]/10 text-[#ffaa00] mb-3">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-white font-orbitron mb-1">
                        {language === 'es' ? 'Subir Archivo GIF Animado' : 'Upload Animated GIF File'}
                      </h4>
                      <p className="text-xs text-slate-400 mb-4 max-w-xs">
                        {language === 'es' ? 'Archivos .gif, .webm o loops de animación instantáneos' : '.gif, .webm or instant animated loop files'}
                      </p>

                      <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ffaa00] to-[#ff0055] text-white text-xs font-orbitron font-bold hover:opacity-95 shadow-lg shadow-[#ffaa00]/30 transition-all flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>{language === 'es' ? 'ELEGIR ARCHIVO .GIF' : 'CHOOSE .GIF FILE'}</span>
                        <input
                          type="file"
                          accept="image/gif,video/mp4,video/webm"
                          className="hidden"
                          onChange={handleGifFileInput}
                        />
                      </label>

                      {gifFile && (
                        <div className="mt-4 px-3 py-1.5 rounded-xl bg-[#ffaa00]/15 border border-[#ffaa00]/40 text-[#ffaa00] text-xs font-mono flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span className="truncate max-w-[240px]">{gifFile.name}</span>
                          <span className="text-[10px] opacity-80">({(gifFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {gifUrl ? (
                      <div className="relative max-w-xs mx-auto aspect-square rounded-2xl overflow-hidden bg-black border border-amber-500/50 shadow-xl">
                        <img src={gifUrl} alt="GIF Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-[#ffaa00] border border-[#ffaa00]/40 font-bold">
                          BUCLE ANIMADO
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-xs mx-auto aspect-square rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                        <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="text-xs font-mono">
                          {language === 'es' ? 'Previsualización del GIF en bucle infinito' : 'Infinite loop preview will appear here'}
                        </span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                          {language === 'es' ? 'Título del GIF Animado *' : 'Animated GIF Title *'}
                        </label>
                        <input
                          type="text"
                          value={gifTitle}
                          onChange={(e) => setGifTitle(e.target.value)}
                          placeholder={language === 'es' ? 'Ej. Bucle Neón Infinito Cyberpunk' : 'E.g. Infinite Cyberpunk Neon Loop'}
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ffaa00]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-mono text-slate-300 mb-1">
                            {language === 'es' ? 'Categoría:' : 'Category:'}
                          </label>
                          <select
                            value={gifCategory}
                            onChange={(e) => setGifCategory(e.target.value as any)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#ffaa00]"
                          >
                            <option value="cyberpunk">Cyberpunk</option>
                            <option value="anime">Anime FX</option>
                            <option value="synthwave">Synthwave</option>
                            <option value="neon">Neón / Loops</option>
                            <option value="memes">Memes & Reacciones</option>
                            <option value="ia">IA & Neuronal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-slate-300 mb-1">
                            {language === 'es' ? 'Etiquetas:' : 'Tags:'}
                          </label>
                          <input
                            type="text"
                            value={gifTags}
                            onChange={(e) => setGifTags(e.target.value)}
                            placeholder="#Gif, #Loop, #Cyber"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-300 focus:outline-none focus:border-[#ffaa00]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOAD VIEW 5: POST DE TEXTO & NOTAS DE VOZ */}
              {uploadMediaType === 'post' && (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <h4 className="text-xs font-bold text-purple-300 font-orbitron uppercase">
                        {language === 'es' ? 'Crear Publicación para el Feed Cuántico' : 'Create Post for Quantum Feed'}
                      </h4>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        {language === 'es' ? 'Título (Opcional):' : 'Title (Optional):'}
                      </label>
                      <input
                        type="text"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder={language === 'es' ? 'Ej. Anuncio para la comunidad cuántica...' : 'E.g. Announcement for quantum community...'}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        {language === 'es' ? 'Mensaje o Contenido de Texto *' : 'Message or Text Content *'}
                      </label>
                      <textarea
                        rows={3}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder={language === 'es' ? '¿Qué estás pensando o creando hoy en QuanticTube?' : 'What are you thinking or creating today on QuanticTube?'}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    {/* Audio Note Toggle */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[#00ff88]" />
                        <span className="text-xs font-mono text-slate-300">
                          {language === 'es' ? 'Adjuntar Nota de Audio Holográfica' : 'Attach Holographic Audio Note'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHasVoiceNote(!hasVoiceNote)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                          hasVoiceNote ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {hasVoiceNote ? (language === 'es' ? '✓ Audio Adjunto' : '✓ Audio Attached') : (language === 'es' ? '+ Activar Audio' : '+ Enable Audio')}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        {language === 'es' ? 'Etiquetas:' : 'Tags:'}
                      </label>
                      <input
                        type="text"
                        value={postTags}
                        onChange={(e) => setPostTags(e.target.value)}
                        placeholder="#Comunidad, #QuanticFeed, #Update"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-purple-300 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI GENERATE (VEO 3.1) */}
          {activeTab === 'generate' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-orbitron">
                      {language === 'es' ? 'Prompt Creativo para Veo 3.1' : 'Veo 3.1 Creative Prompt'}
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-slate-900 border border-slate-700 rounded-2xl text-xs text-white focus:outline-none focus:border-[#00ff88] transition-colors"
                      placeholder={language === 'es' ? 'Describe la escena futurista, iluminación de neón, cámaras...' : 'Describe futuristic scene, neon lighting, cameras...'}
                    />
                  </div>

                  {/* Format Selector: 16:9 Long Video vs 9:16 Shorts */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-orbitron">
                      {language === 'es' ? 'Formato del Video a Generar' : 'Video Format to Generate'}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAiFormat('16:9')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          aiFormat === '16:9'
                            ? 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88] font-bold shadow-md shadow-[#00ff88]/20'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Video className="w-5 h-5" />
                        <span className="text-xs font-orbitron font-bold">16:9 Panorámico</span>
                        <span className="text-[10px] font-mono opacity-80">Video Largo / Cine</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiFormat('9:16')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          aiFormat === '9:16'
                            ? 'bg-[#ff0055]/20 border-[#ff0055] text-pink-300 font-bold shadow-md shadow-[#ff0055]/20'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Play className="w-5 h-5" />
                        <span className="text-xs font-orbitron font-bold">9:16 Vertical</span>
                        <span className="text-[10px] font-mono opacity-80">Shorts / Pañuelo 3D</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Style Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-orbitron">
                      {language === 'es' ? 'Estilo Visual Neuronal' : 'Neural Visual Style'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'cyberpunk', label: '🌆 Cyberpunk' },
                        { id: 'mariachi_synth', label: '🎺 Mariachi Synth' },
                        { id: 'hyperreal', label: '⚡ Hyperreal 8K' },
                        { id: 'neon_matrix', label: '🟢 Matrix Neon' },
                        { id: 'retro_vhs', label: '📼 Retro VHS' }
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setStyle(s.id as any)}
                          className={`p-2 rounded-xl border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                            style === s.id
                              ? 'bg-gradient-to-r from-[#00ff88]/20 to-[#00ccff]/20 border-[#00ff88] text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Reference Image to Video */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        {language === 'es' ? 'Animar Imagen a Video (Opcional)' : 'Animate Image to Video (Optional)'}
                      </span>
                      {sourceImageBase64 && (
                        <button
                          type="button"
                          onClick={() => setSourceImageBase64(null)}
                          className="text-[10px] text-rose-400 hover:underline"
                        >
                          {language === 'es' ? 'Quitar' : 'Remove'}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      {language === 'es' ? 'Sube una foto para sintetizarla en un video cinematográfico con partículas y paneos:' : 'Upload a photo to synthesize into a cinematic video with particles:'}
                    </p>
                    <label className="cursor-pointer block p-3 text-center rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-cyan-400 text-xs text-slate-300 transition-colors">
                      {sourceImageBase64 ? (
                        <span className="text-emerald-400 font-mono flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {language === 'es' ? 'Imagen cargada para animación' : 'Image loaded for animation'}
                        </span>
                      ) : (
                        <span>{language === 'es' ? '📁 Subir Imagen de Referencia (JPG / PNG)' : '📁 Upload Reference Image (JPG / PNG)'}</span>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-orbitron">
                      {language === 'es' ? 'Texto Flotante sobre Video' : 'Floating Video Text'}
                    </label>
                    <input
                      type="text"
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="QUANTICTUBE 2099"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ff88]"
                    />
                  </div>

                  {/* Progress bar during generation */}
                  {isGenerating && (
                    <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-[#00ff88]/40">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#00ff88]">{progressStage}</span>
                        <span className="text-white font-bold">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00ff88] via-[#00ccff] to-[#ff0055] transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleStartGeneration}
                    disabled={isGenerating}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00ff88] via-white to-[#ff0055] text-black font-orbitron font-bold text-xs tracking-wider hover:opacity-95 shadow-lg shadow-[#00ff88]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>{isGenerating ? (language === 'es' ? 'GENERANDO VIDEO CUÁNTICO...' : 'GENERATING VIDEO...') : (language === 'es' ? 'GENERAR VIDEO CON VEO 3.1 & IA' : 'GENERATE VIDEO WITH VEO 3.1 & AI')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EDIT & PREVIEW */}
          {activeTab === 'edit' && (
            <div className="space-y-5">
              {videoUrl ? (
                <div className="relative max-w-xl mx-auto aspect-video bg-black rounded-3xl overflow-hidden border-2 border-cyan-500/60 shadow-2xl">
                  <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/80 text-[10px] text-[#00ff88] font-mono border border-[#00ff88]/50 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> {language === 'es' ? 'RENDERIZADO 4K' : '4K RENDERED'}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
                  {language === 'es' ? 'Sube o genera un video primero para ver la previsualización y editar metadatos.' : 'Upload or generate a video first to see preview and edit metadata.'}
                </div>
              )}

              <div className="space-y-3 pt-2 max-w-xl mx-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'es' ? 'Título del Video' : 'Video Title'}
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder={language === 'es' ? 'Título llamativo para QuanticTube...' : 'Catchy title for QuanticTube...'}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'es' ? 'Descripción / Sinopsis Cuántica' : 'Description / Synopsis'}
                  </label>
                  <textarea
                    value={videoDesc}
                    onChange={(e) => setVideoDesc(e.target.value)}
                    rows={2}
                    placeholder={language === 'es' ? 'Descripción de tu contenido...' : 'Content description...'}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'es' ? 'Hashtags Neuronales' : 'Hashtags'}
                  </label>
                  <input
                    type="text"
                    value={videoTags}
                    onChange={(e) => setVideoTags(e.target.value)}
                    placeholder="#QuanticTube, #Cyber, #Viral"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-cyan-400 focus:outline-none focus:border-[#00ff88]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LYRIA SYNTH MUSIC */}
          {activeTab === 'music' && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-slate-950 border border-purple-500/30 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Music className="w-5 h-5 text-purple-400" />
                  <h4 className="font-orbitron font-bold text-xs text-purple-300">
                    {language === 'es' ? 'SINTETIZADOR PROCEDURAL LYRIA (AUDIO WEB API)' : 'LYRIA PROCEDURAL SYNTHESIZER (WEB AUDIO API)'}
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  {language === 'es'
                    ? 'Genera beats futuristas en vivo para acompañar tus videos largos y cortos.'
                    : 'Generate live futuristic beats to accompany your long and short videos.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Cyber Corrido Synth',
                    `Mariachi ${new Date().getFullYear()}`,
                    'Neon Trap Beat',
                    `Cumbia Lo-Fi ${new Date().getFullYear()}`
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedMusicPreset(preset);
                        mexiSynth.setPreset(preset);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        selectedMusicPreset === preset
                          ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={toggleSynthPlay}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-orbitron transition-all cursor-pointer ${
                      isPlayingMusic
                        ? 'bg-rose-950 border border-rose-500 text-rose-300 animate-pulse'
                        : 'bg-purple-600 text-white hover:bg-purple-500'
                    }`}
                  >
                    {isPlayingMusic ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlayingMusic ? (language === 'es' ? 'DETENER BEAT' : 'STOP BEAT') : (language === 'es' ? 'ESCUCHAR BEAT EN VIVO' : 'LISTEN LIVE BEAT')}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">Tempo:</span>
                    <input
                      type="range"
                      min="90"
                      max="160"
                      value={synthBpm}
                      onChange={(e) => {
                        const bpm = Number(e.target.value);
                        setSynthBpm(bpm);
                        mexiSynth.setBpm(bpm);
                      }}
                      className="w-24 accent-purple-500"
                    />
                    <span className="text-xs font-mono font-bold text-purple-300 w-12">{synthBpm} BPM</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CAMERA RECORDING */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                <Camera className="w-10 h-10 text-rose-500 mb-2" />
                <h4 className="text-sm font-bold text-white mb-1 font-orbitron">
                  {language === 'es' ? 'Grabar con Cámara en Vivo' : 'Live Camera Recording'}
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  {language === 'es' ? 'Captura un video o short directamente con tu webcam y micrófono' : 'Capture video directly with your webcam and microphone'}
                </p>

                {isRecordingWebcam ? (
                  <button
                    type="button"
                    onClick={stopWebcamRecording}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold font-orbitron animate-pulse shadow-lg shadow-rose-600/30 cursor-pointer"
                  >
                    {language === 'es' ? 'Detener Grabación' : 'Stop Recording'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startWebcamRecording}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold font-orbitron hover:opacity-90 shadow-lg shadow-rose-500/30 transition-all cursor-pointer"
                  >
                    {language === 'es' ? 'Iniciar Grabación de Cámara' : 'Start Camera Recording'}
                  </button>
                )}

                {isRecordingWebcam && (
                  <video
                    ref={recordPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-video mt-4 rounded-2xl border-2 border-red-500 object-cover shadow-xl"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Studio Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0b0e1a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            <span className="text-[#00ff88] flex items-center gap-1 font-mono">
              <Check className="w-3.5 h-3.5" />
              {activeTab === 'upload'
                ? (language === 'es' ? `Listo para subir: ${uploadMediaType === 'long_video' ? 'Video Largo 16:9' : uploadMediaType === 'short_video' ? 'Short 9:16' : uploadMediaType === 'photo' ? 'Foto 8K' : uploadMediaType === 'gif' ? 'GIF Animado' : 'Post'}` : `Ready to upload: ${uploadMediaType}`)
                : (videoUrl ? (language === 'es' ? 'Video listo para publicar' : 'Video ready to publish') : (language === 'es' ? 'Completa la configuración para publicar' : 'Complete config to publish'))}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isPlayingMusic) {
                  mexiSynth.stop();
                  setIsPlayingMusic(false);
                }
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handlePublishFromStudio}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00ff88] via-[#00ccff] to-[#ff0055] text-black font-orbitron font-bold text-xs tracking-wider hover:opacity-95 shadow-lg shadow-[#00ff88]/30 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{language === 'es' ? 'PUBLICAR EN QUANTICTUBE' : 'PUBLISH TO QUANTICTUBE'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
