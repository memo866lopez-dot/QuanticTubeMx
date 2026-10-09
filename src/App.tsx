import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Radio,
  BookOpen,
  LayoutGrid,
  Video as VideoIcon,
  Play,
  Heart,
  Eye,
  Share2,
  Clock,
  Filter,
  Zap,
  TrendingUp,
  Award,
  Layers,
  Image as ImageIcon,
  FileText,
  HelpCircle,
  ShieldCheck,
  Info
} from 'lucide-react';
import { VideoItem, PhotoItem, TextPostItem, GifItem, CommentPin, ShareItemData } from './types';
import { getSafeVideoUrl } from './services/videoBlobService';
import {
  initialVideos,
  initialPhotos,
  initialPosts,
  initialGifs,
  loadVideos,
  saveVideos,
  addVideoToFeed,
  removeVideoFromFeed,
  getDeletedVideoIds,
  markVideoAsDeleted,
  loadPhotos,
  savePhotos,
  loadPosts,
  savePosts,
  loadGifs,
  saveGifs
} from './services/storage';
import {
  subscribeToVideos,
  publishVideoToFirestore,
  deleteVideoFromFirestore,
  publishPhotoToFirestore,
  publishPostToFirestore,
  publishPinToFirestore
} from './services/firestoreSync';
import { deleteVideoBlob } from './services/videoBlobService';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, NavigationTabType } from './components/Navbar';
import { LongVideosView } from './components/LongVideosView';
import { ShortsView } from './components/ShortsView';
import { PhotosGalleryView } from './components/PhotosGalleryView';
import { CommunityPostsView } from './components/CommunityPostsView';
import { GifHubView } from './components/GifHubView';
import { BookFlipView } from './components/BookFlipView';
import { QuadView } from './components/QuadView';
import { OmniLiveStudio } from './components/OmniLiveStudio';
import { DirectMessages } from './components/DirectMessages';
import { ModerationPanel } from './components/ModerationPanel';
import { ShareModal } from './components/ShareModal';
import { CreateMediaModal } from './components/CreateMediaModal';
import { MexiStudioModal } from './components/MexiStudioModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { QuanticVoiceAgent } from './components/QuanticVoiceAgent';
import { CommandAction } from './services/voiceAgentService';
import { AuthModal } from './components/AuthModal';
import { DirectVideoCallModal } from './components/DirectVideoCallModal';
import { HowToUseModal } from './components/HowToUseModal';
import { PoliciesModal } from './components/PoliciesModal';
import { AboutUsModal } from './components/AboutUsModal';
import { ChannelView } from './components/ChannelView';

function AppContent() {
  const { t } = useLanguage();
  const { openAuthModal } = useAuth();
  // State for all 5 media collections
  const [videos, setVideos] = useState<VideoItem[]>(() => loadVideos());
  const [photos, setPhotos] = useState<PhotoItem[]>(() => loadPhotos());
  const [posts, setPosts] = useState<TextPostItem[]>(() => loadPosts());
  const [gifs, setGifs] = useState<GifItem[]>(() => loadGifs());

  // Channel navigation state
  const [selectedChannelHandle, setSelectedChannelHandle] = useState<string>('@guillermo_lopez');

  // Listen to hash change for direct channel links (e.g. #channel/@canal)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#channel/')) {
        const handle = decodeURIComponent(hash.replace('#channel/', ''));
        setSelectedChannelHandle(handle);
        setCurrentTab('channel');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleOpenChannel = (handleOrName: string) => {
    const clean = handleOrName.startsWith('@') ? handleOrName : `@${handleOrName}`;
    setSelectedChannelHandle(clean);
    setCurrentTab('channel');
    window.location.hash = `channel/${encodeURIComponent(clean)}`;
  };

  // Real-time Firestore sync for Videos & Upload URL updater
  useEffect(() => {
    const handleUrlUpdated = (e: Event) => {
      const customEv = e as CustomEvent<{ id: string; url: string }>;
      if (customEv.detail?.id && customEv.detail?.url) {
        setVideos((prev) => {
          const updated = prev.map((v) =>
            v.id === customEv.detail.id ? { ...v, videoUrl: customEv.detail.url } : v
          );
          saveVideos(updated);
          return updated;
        });
      }
    };
    window.addEventListener('quantictube_video_url_updated', handleUrlUpdated);

    const unsubscribe = subscribeToVideos((remoteVideos) => {
      if (remoteVideos && remoteVideos.length > 0) {
        setVideos((prevLocal) => {
          let hasChanges = false;
          const remoteMap = new Map(remoteVideos.map((rv) => [rv.id, rv]));

          // Update existing local videos if remote has updated URL or pins
          const updatedLocal = prevLocal.map((lv) => {
            const remoteMatch = remoteMap.get(lv.id);
            if (remoteMatch && remoteMatch.videoUrl && remoteMatch.videoUrl !== lv.videoUrl && !remoteMatch.videoUrl.startsWith('blob:')) {
              hasChanges = true;
              return { ...lv, videoUrl: remoteMatch.videoUrl };
            }
            return lv;
          });

          // Merge new remote videos not in local
          const deletedIds = getDeletedVideoIds();
          const localIds = new Set(prevLocal.map((v) => v.id));
          const newFromRemote = remoteVideos
            .filter((rv) => !localIds.has(rv.id) && !deletedIds.has(rv.id))
            .map((rv) => ({
              ...rv,
              videoUrl: rv.videoUrl || getSafeVideoUrl(rv.videoUrl, rv.format, rv.id)
            }));

          if (newFromRemote.length > 0 || hasChanges) {
            const merged = [...newFromRemote, ...updatedLocal].filter((v) => !deletedIds.has(v.id));
            saveVideos(merged);
            return merged;
          }
          return prevLocal.filter((v) => !deletedIds.has(v.id));
        });
      }
    });

    return () => {
      window.removeEventListener('quantictube_video_url_updated', handleUrlUpdated);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Active navigation tab & view state
  const [currentTab, setCurrentTab] = useState<NavigationTabType>('feed');
  const [activeVideoId, setActiveVideoId] = useState<string>(videos[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isCreateMediaOpen, setIsCreateMediaOpen] = useState(false);
  const [createMediaInitialType, setCreateMediaInitialType] = useState<'video' | 'short' | 'photo' | 'post' | 'gif'>('video');
  const [activeShareItem, setActiveShareItem] = useState<ShareItemData | null>(null);

  // Informational Modals State
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);

  // Add Comment Pin with real-time Firestore sync
  const handleAddPin = (videoId: string, pin: CommentPin) => {
    const targetId = videoId || activeVideoId;
    publishPinToFirestore(targetId, pin);
    setVideos((prevVideos) => {
      const updated = prevVideos.map((v) => {
        if (v.id === targetId) {
          const currentPins = v.pins || [];
          return {
            ...v,
            pins: [...currentPins, pin],
            metrics: {
              ...v.metrics,
              comments: v.metrics.comments + 1
            }
          };
        }
        return v;
      });
      saveVideos(updated);
      return updated;
    });
  };

  // Like video
  const handleLikeVideo = (videoId: string) => {
    setVideos((prev) => {
      const updated = prev.map((v) =>
        v.id === videoId
          ? { ...v, metrics: { ...v.metrics, likes: v.metrics.likes + 1 } }
          : v
      );
      saveVideos(updated);
      return updated;
    });
  };

  // Like photo
  const handleLikePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const updated = prev.map((p) =>
        p.id === photoId
          ? { ...p, metrics: { ...p.metrics, likes: p.metrics.likes + 1 } }
          : p
      );
      savePhotos(updated);
      return updated;
    });
  };

  // React to post
  const handleReactPost = (postId: string, reaction: 'fire' | 'heart' | 'zap' | 'rocket') => {
    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === postId) {
          const currentReactions = p.reactions || { fire: 0, heart: 0, zap: 0, rocket: 0 };
          return {
            ...p,
            reactions: {
              ...currentReactions,
              [reaction]: (currentReactions[reaction] || 0) + 1
            }
          };
        }
        return p;
      });
      savePosts(updated);
      return updated;
    });
  };

  // Like GIF
  const handleLikeGif = (gifId: string) => {
    setGifs((prev) => {
      const updated = prev.map((g) =>
        g.id === gifId
          ? { ...g, metrics: { ...g.metrics, likes: g.metrics.likes + 1 } }
          : g
      );
      saveGifs(updated);
      return updated;
    });
  };

  // Video created callback
  const handleVideoCreated = (newVideo: VideoItem) => {
    publishVideoToFirestore(newVideo);
    const updated = addVideoToFeed(newVideo);
    setVideos(updated);
    setActiveVideoId(newVideo.id);
    if (newVideo.format === '9:16') {
      setCurrentTab('shorts');
    } else {
      setCurrentTab('feed');
    }
  };

  // Delete video callback (for long videos and shorts)
  const handleDeleteVideo = (videoId: string) => {
    markVideoAsDeleted(videoId);

    try {
      deleteVideoFromFirestore(videoId);
    } catch (err) {
      console.warn('Error deleting video from Firestore:', err);
    }

    try {
      deleteVideoBlob(videoId);
    } catch (err) {
      console.warn('Error deleting video blob:', err);
    }

    try {
      removeVideoFromFeed(videoId);
    } catch (err) {
      console.warn('Error removing video from storage feed:', err);
    }

    setVideos((prevVideos) => {
      const updated = prevVideos.filter((v) => v.id !== videoId);
      saveVideos(updated);
      return updated;
    });

    setActiveVideoId((prevActive) => {
      if (prevActive === videoId) {
        const remaining = loadVideos().filter((v) => v.id !== videoId);
        const nextVideo =
          remaining.find((v) =>
            currentTab === 'shorts'
              ? (v.format === '9:16' || v.id.startsWith('vid-short-'))
              : (v.format === '16:9' || !v.format)
          ) || remaining[0];
        return nextVideo ? nextVideo.id : '';
      }
      return prevActive;
    });
  };

  // Photo created callback
  const handlePhotoCreated = (newPhoto: PhotoItem) => {
    publishPhotoToFirestore(newPhoto);
    setPhotos((prev) => [newPhoto, ...prev]);
    setCurrentTab('photos');
  };

  // Post created callback
  const handlePostCreated = (newPost: TextPostItem) => {
    publishPostToFirestore(newPost);
    setPosts((prev) => [newPost, ...prev]);
    setCurrentTab('posts');
  };

  // GIF created callback
  const handleGifCreated = (newGif: GifItem) => {
    setGifs((prev) => [newGif, ...prev]);
    setCurrentTab('gifs');
  };

  // Voice Agent execution dispatcher
  const handleExecuteVoiceCommand = (action: CommandAction) => {
    switch (action.type) {
      case 'CHANGE_TAB':
        if (action.payload) {
          if (action.payload === 'shorts') setCurrentTab('shorts');
          else if (action.payload === 'photos') setCurrentTab('photos');
          else if (action.payload === 'posts') setCurrentTab('posts');
          else if (action.payload === 'gifs') setCurrentTab('gifs');
          else if (action.payload === 'book' || action.payload === 'bookflip') setCurrentTab('bookflip');
          else if (action.payload === 'quad' || action.payload === 'quadview') setCurrentTab('quadview');
          else if (action.payload === 'live') setCurrentTab('live');
          else if (action.payload === 'dm' || action.payload === 'dms') setCurrentTab('dms');
          else if (action.payload === 'moderation') setCurrentTab('moderation');
          else if (action.payload === 'channel') setCurrentTab('channel');
          else setCurrentTab('feed');
        }
        break;
      case 'OPEN_CHANNEL':
        if (action.payload) handleOpenChannel(action.payload);
        else setCurrentTab('channel');
        break;
      case 'PLAY_VIDEO':
        if (action.payload) {
          setActiveVideoId(action.payload);
          setCurrentTab('feed');
        }
        break;
      case 'OPEN_STUDIO':
        setIsStudioOpen(true);
        break;
      case 'OPEN_ASSISTANT':
        setIsAssistantOpen(true);
        break;
      case 'OPEN_CREATE':
        if (action.payload && ['video', 'short', 'photo', 'post', 'gif'].includes(action.payload)) {
          setCreateMediaInitialType(action.payload);
        }
        setIsCreateMediaOpen(true);
        break;
      case 'OPEN_HOW_TO_USE':
        setIsHowToUseOpen(true);
        break;
      case 'OPEN_POLICIES':
        setIsPoliciesOpen(true);
        break;
      case 'OPEN_ABOUT':
        setIsAboutUsOpen(true);
        break;
      case 'OPEN_AUTH':
        openAuthModal();
        break;
      case 'SEARCH':
        if (typeof action.payload === 'string') {
          setSearchQuery(action.payload);
        }
        break;
      case 'LIKE_VIDEO':
        if (activeVideoId) {
          handleLikeVideo(activeVideoId);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 cyber-grid flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenStudio={() => setIsStudioOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenCreateMedia={() => setIsCreateMediaOpen(true)}
        onOpenHowToUse={() => setIsHowToUseOpen(true)}
        onOpenPolicies={() => setIsPoliciesOpen(true)}
        onOpenAboutUs={() => setIsAboutUsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6">
        {/* TAB 1: VIDEOS LARGOS 16:9 & CINE */}
        {currentTab === 'feed' && (
          <LongVideosView
            videos={videos}
            activeVideoId={activeVideoId}
            onSelectVideo={(id) => setActiveVideoId(id)}
            onAddVideoToFeed={(newVideo) => {
              const updated = addVideoToFeed(newVideo);
              setVideos(updated);
              setActiveVideoId(newVideo.id);
            }}
            onDeleteVideo={handleDeleteVideo}
            onAddPin={handleAddPin}
            onLikeVideo={handleLikeVideo}
            onOpenShareModal={(item: ShareItemData) => setActiveShareItem(item)}
            onOpenCreateModal={() => setIsCreateMediaOpen(true)}
            onOpenChannel={handleOpenChannel}
          />
        )}

        {/* TAB 2: VIDEOS CORTOS 9:16 (SHORTS) */}
        {currentTab === 'shorts' && (
          <ShortsView
            videos={videos}
            activeVideoId={activeVideoId}
            onSelectShort={(id) => setActiveVideoId(id)}
            onAddVideo={handleVideoCreated}
            onDeleteVideo={handleDeleteVideo}
            onLikeVideo={handleLikeVideo}
            onOpenShareModal={(item: ShareItemData) => setActiveShareItem(item)}
            onOpenCreateModal={() => {
              setCreateMediaInitialType('short');
              setIsCreateMediaOpen(true);
            }}
          />
        )}

        {/* TAB 3: FOTOS E IMÁGENES */}
        {currentTab === 'photos' && (
          <PhotosGalleryView
            photos={photos}
            onLikePhoto={handleLikePhoto}
            onOpenShareModal={(item: ShareItemData) => setActiveShareItem(item)}
            onOpenCreateModal={() => setIsCreateMediaOpen(true)}
          />
        )}

        {/* TAB 4: COMUNIDAD, POSTS DE TEXTO Y NOTAS DE VOZ */}
        {currentTab === 'posts' && (
          <CommunityPostsView
            posts={posts}
            onReactPost={handleReactPost}
            onOpenShareModal={(item: ShareItemData) => setActiveShareItem(item)}
            onOpenCreateModal={() => setIsCreateMediaOpen(true)}
          />
        )}

        {/* TAB 5: HUB DE GIFS ANIMADOS */}
        {currentTab === 'gifs' && (
          <GifHubView
            gifs={gifs}
            onLikeGif={handleLikeGif}
            onOpenShareModal={(item: ShareItemData) => setActiveShareItem(item)}
            onOpenCreateModal={() => setIsCreateMediaOpen(true)}
          />
        )}

        {/* TAB 6: MODO 3D BOOK-FLIP FUTURISTA */}
        {currentTab === 'bookflip' && (
          <BookFlipView
            videos={videos}
            onAddPin={handleAddPin}
          />
        )}

        {/* TAB 7: QUAD-VIEW (4 PANTALLAS SIMULTÁNEAS) */}
        {currentTab === 'quadview' && <QuadView allVideos={videos} />}

        {/* TAB 8: ESTUDIO OMNI-LIVE WEBRTC DUAL-CAM */}
        {currentTab === 'live' && <OmniLiveStudio />}

        {/* TAB 9: MENSAJES DIRECTOS Y CHAT CIFRADO */}
        {currentTab === 'dms' && <DirectMessages />}

        {/* TAB 10: PANEL DE MODERACIÓN IA */}
        {currentTab === 'moderation' && <ModerationPanel />}

        {/* TAB 11: CANAL CUÁNTICO INDEPENDIENTE CON BANNER MOVIMIENTO Y QR 3D */}
        {currentTab === 'channel' && (
          <ChannelView
            channelHandle={selectedChannelHandle}
            onBackToFeed={() => setCurrentTab('feed')}
            videos={videos}
            photos={photos}
            posts={posts}
            gifs={gifs}
            onSelectVideo={(id) => {
              setActiveVideoId(id);
              setCurrentTab('feed');
            }}
            onSelectChannel={(handle) => {
              setSelectedChannelHandle(handle);
              window.location.hash = `channel/${encodeURIComponent(handle)}`;
            }}
          />
        )}
      </main>

      {/* Floating Action Button for Publishing on mobile */}
      <div className="fixed bottom-24 right-5 sm:hidden z-30">
        <button
          onClick={() => setIsCreateMediaOpen(true)}
          className="p-3.5 rounded-full bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black shadow-lg shadow-[#00ff88]/40 hover:scale-105 active:scale-95 cursor-pointer"
          title={t('app.publishFloating', 'Publicar Contenido')}
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      {/* Footer with Quick Informational Links */}
      <footer className="border-t border-slate-800/80 bg-[#08090d] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-orbitron font-bold text-slate-300">
              QUANTIC<span className="text-[#00ff88]">TUBE</span> {new Date().getFullYear()}
            </span>
            <span>• {t('brand.subtitle', 'Quantic Social media & videos')}</span>
          </div>

          {/* Quick info links */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={() => setIsHowToUseOpen(true)}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('footer.howToUse', '¿Cómo Usar?')}</span>
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => setIsPoliciesOpen(true)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('footer.privacy', 'Políticas y Privacidad')}</span>
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => setIsAboutUsOpen(true)}
              className="hover:text-purple-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('footer.aboutUs', 'Sobre Nosotros')}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="text-[#00ff88]">{t('footer.aiConnected', '● Quantum AI Conectado')}</span>
            <span>{t('footer.webrtc', 'WebRTC Dual-Cam')}</span>
            <span>{t('footer.veo', 'Veo 3.1 Rápido')}</span>
            <span>{t('footer.audio', 'Audio Espacial')}</span>
          </div>
        </div>
      </footer>

      {/* Universal Share Modal */}
      <ShareModal
        isOpen={!!activeShareItem}
        onClose={() => setActiveShareItem(null)}
        item={activeShareItem}
        onShareToDM={() => {
          setCurrentTab('dms');
        }}
      />

      {/* Universal Create & Share Media Modal */}
      <CreateMediaModal
        isOpen={isCreateMediaOpen}
        onClose={() => setIsCreateMediaOpen(false)}
        onVideoCreated={handleVideoCreated}
        onPhotoCreated={handlePhotoCreated}
        onPostCreated={handlePostCreated}
        onGifCreated={handleGifCreated}
        initialType={createMediaInitialType}
      />

      {/* MexiStudio AI Suite Modal */}
      <MexiStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onVideoCreated={handleVideoCreated}
        onPhotoCreated={handlePhotoCreated}
        onPostCreated={handlePostCreated}
        onGifCreated={handleGifCreated}
      />

      {/* Creative Director Assistant Modal */}
      <AIAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      {/* QuanticVoice Intelligent Voice Agent & Memorizer Hub */}
      <QuanticVoiceAgent
        currentVideos={videos}
        activeVideoId={activeVideoId}
        onExecuteCommand={handleExecuteVoiceCommand}
      />

      {/* Auth & Channel Creation Modal */}
      <AuthModal />

      {/* Direct 4K Video Call and Voice Holographic Modal */}
      <DirectVideoCallModal />

      {/* Interactive How To Use Modal */}
      <HowToUseModal
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
      />

      {/* Policies & Privacy Modal */}
      <PoliciesModal
        isOpen={isPoliciesOpen}
        onClose={() => setIsPoliciesOpen(false)}
      />

      {/* About Us Modal */}
      <AboutUsModal
        isOpen={isAboutUsOpen}
        onClose={() => setIsAboutUsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
