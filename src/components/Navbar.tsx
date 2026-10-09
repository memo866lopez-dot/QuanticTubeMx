import React, { useState } from 'react';
import {
  Search,
  Mic,
  Plus,
  Video,
  Play,
  Image as ImageIcon,
  FileText,
  Sparkles,
  BookOpen,
  LayoutGrid,
  Radio,
  MessageSquare,
  ShieldCheck,
  Bot,
  Menu,
  X,
  Globe,
  LogIn,
  UserPlus,
  Tv,
  LogOut,
  User,
  ChevronDown,
  HelpCircle,
  FileCode,
  Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export type NavigationTabType =
  | 'feed'
  | 'shorts'
  | 'photos'
  | 'posts'
  | 'gifs'
  | 'bookflip'
  | 'quadview'
  | 'live'
  | 'dms'
  | 'moderation'
  | 'channel';

interface NavbarProps {
  currentTab: NavigationTabType;
  onSelectTab: (tab: NavigationTabType) => void;
  onOpenStudio: () => void;
  onOpenAssistant: () => void;
  onOpenCreateMedia: () => void;
  onOpenHowToUse: () => void;
  onOpenPolicies: () => void;
  onOpenAboutUs: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenStudio,
  onOpenAssistant,
  onOpenCreateMedia,
  onOpenHowToUse,
  onOpenPolicies,
  onOpenAboutUs,
  searchQuery,
  onSearchChange
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, userProfile, openAuthModal, signOutUser } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Web Speech API for voice search
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    }).SpeechRecognition || (window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(language === 'es' ? 'Tu navegador no soporta Web Speech API para búsqueda por voz.' : 'Your browser does not support Web Speech API for voice search.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'es' ? 'es-MX' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);
      recognition.start();

      recognition.onresult = (e: SpeechRecognitionEventInstance) => {
        const text = e.results[0][0].transcript;
        onSearchChange(text);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#08090d]/90 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('feed')}
            className="flex items-center gap-2 group text-left focus:outline-none cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ff88] via-white to-[#ff0055] p-[2px] transition-transform group-hover:scale-105 neon-glow-green">
              <div className="w-full h-full bg-[#090b12] rounded-[10px] flex items-center justify-center">
                <span className="font-orbitron font-black text-xl bg-gradient-to-r from-[#00ff88] via-white to-[#ff0055] bg-clip-text text-transparent">
                  Q
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-orbitron font-extrabold text-xl tracking-wider text-white">
                  QUANTIC<span className="text-[#00ff88]">TUBE</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/50 animate-pulse">
                  {new Date().getFullYear()}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-rajdhani tracking-widest hidden sm:block">
                {t('brand.subtitle', 'Quantic Social media & videos')}
              </p>
            </div>
          </button>
        </div>

        {/* Center: Search with Voice Web Speech API */}
        <div className="flex-1 max-w-lg hidden md:block">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('search.placeholder', 'Buscar videos, fotos, gifs, posts de texto...')}
              className="w-full pl-10 pr-12 py-2 bg-slate-900/90 border border-slate-700/80 rounded-full text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-all shadow-inner"
            />
            <button
              onClick={handleVoiceSearch}
              title={t('search.voice', 'Búsqueda por voz con IA')}
              className={`absolute right-2 p-1.5 rounded-full transition-all cursor-pointer ${
                isListening
                  ? 'bg-[#ff0055] text-white animate-bounce shadow-lg shadow-[#ff0055]/50'
                  : 'text-slate-400 hover:text-[#00ff88] hover:bg-slate-800'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Quick actions & Modes */}
        <div className="flex items-center gap-2">
          {/* Quick Help / How to Use Button */}
          <button
            onClick={onOpenHowToUse}
            title={t('nav.howToUse', '¿Cómo Usar?')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold hover:border-cyan-400 transition-all cursor-pointer shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('nav.howToUse', '¿Cómo Usar?')}</span>
          </button>

          {/* Language Switcher Button (ES / EN) */}
          <button
            onClick={toggleLanguage}
            title={t('nav.langSwitch', language === 'es' ? 'Switch to English' : 'Cambiar a Español')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#00ff88]/60 text-xs font-mono font-bold transition-all shadow-sm group cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#00ff88] group-hover:rotate-45 transition-transform" />
            <span className={language === 'es' ? 'text-[#00ff88] font-black' : 'text-slate-400'}>ES</span>
            <span className="text-slate-600">/</span>
            <span className={language === 'en' ? 'text-[#00ccff] font-black' : 'text-slate-400'}>EN</span>
          </button>

          {/* Universal Create & Share Button */}
          <button
            onClick={onOpenCreateMedia}
            title={t('nav.publishTooltip', 'Publicar y Compartir (Videos, Shorts, Fotos, Textos, GIFs)')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black text-xs font-orbitron font-bold shadow-md shadow-[#00ff88]/30 hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav.publish', 'PUBLICAR')}</span>
          </button>

          {/* AI Creative Director Assistant */}
          <button
            onClick={onOpenAssistant}
            title={t('nav.directorFull', 'Director Creativo IA')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-purple-500/40 text-purple-300 text-xs font-semibold hover:border-purple-400 transition-all shadow-sm cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
            <span className="hidden lg:inline">{t('nav.director', 'Director IA')}</span>
          </button>

          {/* Create Video / AI Studio Button */}
          <button
            onClick={onOpenStudio}
            className="relative group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00ff88] via-[#00f5ff] to-[#ff0055] p-[1.5px] transition-transform active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#090b12] rounded-[10px] text-white text-xs font-bold font-orbitron group-hover:bg-transparent transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-[#00ff88] group-hover:text-white" />
              <span>{t('nav.studio', 'ESTUDIO')}</span>
            </div>
          </button>

          {/* Quick Channel Button */}
          <button
            onClick={() => onSelectTab('channel')}
            title={t('nav.channelTooltip', 'Canal Cuántico Personalizado')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-orbitron font-semibold hover:border-cyan-400 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('nav.channel', 'CANAL')}</span>
          </button>

          {/* User profile & Authentication */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-slate-900/90 border border-slate-700 hover:border-[#00ff88] transition-all cursor-pointer"
              >
                <div className="relative w-7 h-7 rounded-full border border-[#00ff88] overflow-hidden">
                  <img
                    src={userProfile?.avatar || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={userProfile?.name || user.displayName || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#00ff88] rounded-full ring-1 ring-black" />
                </div>
                <span className="hidden sm:inline text-xs font-mono text-slate-200 max-w-[80px] truncate">
                  {userProfile?.name || user.displayName || 'Creador'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#090c15] border border-slate-700 shadow-2xl shadow-cyan-500/10 p-3 z-50 animate-fadeIn space-y-3 font-mono">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                    <img
                      src={userProfile?.avatar || user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={userProfile?.name || user.displayName || 'Avatar'}
                      className="w-10 h-10 rounded-full border border-[#00ff88] object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-white truncate">{userProfile?.name || user.displayName}</p>
                      <p className="text-[10px] text-[#00ff88] truncate">@{userProfile?.handle || user.email?.split('@')[0]}</p>
                      {userProfile?.isVerified && (
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40">
                          {userProfile.channelName || 'Creador Verificado'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openAuthModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 hover:text-[#00ff88] transition-all text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#00ff88]" />
                      <span>{t('nav.myProfile', 'Mi Perfil y Canal')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenCreateMedia();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 hover:text-cyan-300 transition-all text-left cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-cyan-400" />
                      <span>{t('nav.publishMedia', 'Publicar Video / Foto / GIF')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenHowToUse();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 hover:text-cyan-300 transition-all text-left cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-cyan-400" />
                      <span>{t('nav.howToUse', '¿Cómo Usar?')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenPolicies();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 hover:text-emerald-300 transition-all text-left cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{t('nav.policies', 'Políticas')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenAboutUs();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 hover:text-purple-300 transition-all text-left cursor-pointer"
                    >
                      <Info className="w-4 h-4 text-purple-400" />
                      <span>{t('nav.about', 'Sobre Nosotros')}</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOutUser();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-950/40 text-xs text-rose-400 hover:text-rose-300 transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>{t('nav.signOut', 'Cerrar Sesión')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs font-mono transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{t('nav.signIn', 'Ingresar')}</span>
              </button>

              <button
                onClick={() => openAuthModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-[#00ff88] text-black font-orbitron font-bold text-xs hover:opacity-95 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('nav.signUp', 'Registro')}</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 md:hidden cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Primary Navigation Bar (Tabs for each media page + 3D & Live modes) */}
      <nav className="border-t border-slate-800/60 bg-[#08090d]/95 overflow-x-auto scrollbar-none px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-1.5">
          {/* TAB 1: VIDEOS LARGOS 16:9 */}
          <button
            onClick={() => onSelectTab('feed')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'feed'
                ? 'bg-gradient-to-r from-[#00ff88]/20 to-emerald-950/40 text-[#00ff88] border border-[#00ff88]/60 neon-glow-green font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{t('tab.feed', 'Videos Largos (16:9)')}</span>
          </button>

          {/* TAB 2: VIDEOS CORTOS 9:16 (SHORTS) */}
          <button
            onClick={() => onSelectTab('shorts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'shorts'
                ? 'bg-gradient-to-r from-[#ff0055]/20 to-rose-950/40 text-[#ff0055] border border-[#ff0055]/60 neon-glow-red font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-[#ff0055]" />
            <span>{t('tab.shorts', 'Shorts (9:16)')}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/40">
              VIRAL
            </span>
          </button>

          {/* TAB: CANALES CUÁNTICOS CON QR 3D Y BANNER MOVIMIENTO */}
          <button
            onClick={() => onSelectTab('channel')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'channel'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-950/40 text-emerald-400 border border-emerald-400/60 neon-glow-green font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('tab.channel', 'Canal Cuántico')}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              3D QR
            </span>
          </button>

          {/* TAB 3: FOTOS E IMÁGENES */}
          <button
            onClick={() => onSelectTab('photos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'photos'
                ? 'bg-gradient-to-r from-[#00ccff]/20 to-blue-950/40 text-[#00ccff] border border-[#00ccff]/60 neon-glow-cyan font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#00ccff]" />
            <span>{t('tab.photos', 'Fotos & Arte')}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#00ccff]/20 text-[#00ccff] border border-[#00ccff]/40">
              4K
            </span>
          </button>

          {/* TAB 4: TEXTO & NOTAS DE VOZ */}
          <button
            onClick={() => onSelectTab('posts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'posts'
                ? 'bg-gradient-to-r from-purple-500/20 to-fuchsia-950/40 text-purple-300 border border-purple-400/60 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('tab.posts', 'Comunidad')}</span>
          </button>

          {/* TAB 5: GIFS ANIMADOS */}
          <button
            onClick={() => onSelectTab('gifs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'gifs'
                ? 'bg-gradient-to-r from-[#ffaa00]/20 to-amber-950/40 text-[#ffaa00] border border-[#ffaa00]/60 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ffaa00]" />
            <span>{t('tab.gifs', 'Hub de GIFs')}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-[#ffaa00]/20 text-[#ffaa00] border border-[#ffaa00]/40">
              GIF
            </span>
          </button>

          {/* TAB 6: 3D BOOK-FLIP */}
          <button
            onClick={() => onSelectTab('bookflip')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'bookflip'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-950/40 text-cyan-400 border border-cyan-400/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('tab.book', '3D Book-Flip')}</span>
          </button>

          {/* TAB 7: QUAD-VIEW */}
          <button
            onClick={() => onSelectTab('quadview')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'quadview'
                ? 'bg-gradient-to-r from-purple-500/20 to-fuchsia-950/40 text-purple-300 border border-purple-400/60'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('tab.quad', 'Quad-View')}</span>
          </button>

          {/* TAB 8: OMNI-LIVE */}
          <button
            onClick={() => onSelectTab('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'live'
                ? 'bg-gradient-to-r from-[#ff0055]/20 to-rose-950/40 text-[#ff0055] border border-[#ff0055]/60 neon-glow-red'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#ff0055] animate-pulse" />
            <span>{t('tab.live', 'Omni-Live')}</span>
            <span className="w-2 h-2 rounded-full bg-[#ff0055] animate-ping" />
          </button>

          {/* TAB 9: DMS */}
          <button
            onClick={() => onSelectTab('dms')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'dms'
                ? 'bg-slate-800 text-white border border-slate-600'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('tab.dms', 'Mensajes DM')}</span>
          </button>

          {/* TAB 10: MODERACIÓN */}
          <button
            onClick={() => onSelectTab('moderation')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium font-orbitron tracking-wide transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'moderation'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('tab.moderation', 'Moderación IA')}</span>
          </button>
        </div>
      </nav>

      {/* Mobile search bar & menu if opened */}
      {isMobileMenuOpen && (
        <div className="p-3 border-t border-slate-800 bg-[#08090d] md:hidden space-y-3 animate-in fade-in">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('search.placeholder', 'Buscar en QuanticTube...')}
              className="w-full pl-9 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100"
            />
            <button
              onClick={handleVoiceSearch}
              className="absolute right-2 p-1 text-slate-400 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenHowToUse();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>{t('nav.howToUse', '¿Cómo Usar?')}</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenPolicies();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-300 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('nav.policies', 'Políticas')}</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAboutUs();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-purple-300 cursor-pointer"
            >
              <Info className="w-4 h-4 text-purple-400" />
              <span>{t('nav.about', 'Sobre Nosotros')}</span>
            </button>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white cursor-pointer"
            >
              <Globe className="w-4 h-4 text-[#00ff88]" />
              <span>{t('nav.langLabel', language === 'es' ? 'Idioma: Español' : 'Language: English')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

// Type definition for Web Speech API in TypeScript
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEventInstance) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
}

interface SpeechRecognitionEventInstance {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}
