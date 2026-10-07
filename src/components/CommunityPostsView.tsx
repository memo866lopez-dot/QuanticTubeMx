import React, { useState } from 'react';
import {
  Search,
  FileText,
  Mic,
  Play,
  Pause,
  Heart,
  Flame,
  Zap,
  Rocket,
  MessageSquare,
  Share2,
  Sparkles,
  Plus,
  Volume2,
  Clock
} from 'lucide-react';
import { TextPostItem, ShareItemData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CommunityPostsViewProps {
  posts: TextPostItem[];
  onReactPost: (postId: string, reaction: 'fire' | 'heart' | 'zap' | 'rocket') => void;
  onOpenShareModal: (item: ShareItemData) => void;
  onOpenCreateModal: () => void;
}

export const CommunityPostsView: React.FC<CommunityPostsViewProps> = ({
  posts,
  onReactPost,
  onOpenShareModal,
  onOpenCreateModal
}) => {
  const { t } = useLanguage();
  const [localSearch, setLocalSearch] = useState('');
  const [activeVoicePlayingId, setActiveVoicePlayingId] = useState<string | null>(null);

  const filteredPosts = posts.filter(
    (p) =>
      p.content.toLowerCase().includes(localSearch.toLowerCase()) ||
      (p.title && p.title.toLowerCase().includes(localSearch.toLowerCase())) ||
      p.author.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(localSearch.toLowerCase()))
  );

  const handleToggleVoice = (postId: string) => {
    if (activeVoicePlayingId === postId) {
      setActiveVoicePlayingId(null);
    } else {
      setActiveVoicePlayingId(postId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dedicated Search Header for Text & Voice Notes */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#0a0d18] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-lg text-white flex items-center gap-2">
                {t('posts.title', 'TEXTO & NOTAS DE VOZ')} <span className="text-purple-400">{t('posts.sub', 'COMUNIDAD')}</span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {t('posts.desc', 'Microblogging cuántico, anuncios holográficos y notas de audio en alta fidelidad')}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="self-start md:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-[#00ff88] text-black font-orbitron font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-md shadow-purple-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('posts.publishBtn', 'Publicar Texto o Nota de Voz')}
          </button>
        </div>

        {/* Dedicated Search Bar for Text & Voice */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder={t('posts.searchPlaceholder', 'Buscar textos, notas de voz, anuncios o hashtags (ej. #QuantumAI, #Veo3, #AudioNote)...')}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
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
      </div>

      {/* Posts Feed Stream */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {filteredPosts.map((post) => {
          const isVoicePlaying = activeVoicePlayingId === post.id;

          return (
            <article
              key={post.id}
              className="p-5 rounded-3xl bg-[#0b0e17] border border-slate-800 hover:border-purple-500/50 shadow-xl transition-all space-y-4"
            >
              {/* Post Header: Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-500 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{post.author.name}</span>
                      {post.author.verified && (
                        <span className="w-3.5 h-3.5 rounded-full bg-[#00ff88] text-black flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {post.author.username} • {post.createdAt}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    onOpenShareModal({
                      type: 'post',
                      id: post.id,
                      title: post.title || `Post de ${post.author.name}`,
                      url: typeof window !== 'undefined' ? window.location.href : '',
                      description: post.content,
                      author: post.author.name
                    })
                  }
                  className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-white transition-colors"
                  title="Compartir post"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title if present */}
              {post.title && (
                <h3 className="font-orbitron font-bold text-base text-white leading-snug">
                  {post.title}
                </h3>
              )}

              {/* Content Text */}
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {post.content}
              </p>

              {/* Holographic Voice Note Player if present */}
              {post.hasVoiceNote && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-[#0e1426] to-[#0a0d18] border border-purple-500/40 flex items-center gap-3 shadow-lg">
                  <button
                    onClick={() => handleToggleVoice(post.id)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      isVoicePlaying
                        ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/40 animate-pulse'
                        : 'bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/30'
                    }`}
                  >
                    {isVoicePlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  {/* Visual Soundwave Simulation */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="text-[#00ff88] font-bold flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5" />
                        {isVoicePlaying ? t('posts.playingVoice', 'REPRODUCIENDO NOTA DE VOZ') : t('posts.voiceNote', 'NOTA DE VOZ HOLOGRÁFICA')}
                      </span>
                      <span>{post.voiceDuration || 15}s</span>
                    </div>

                    <div className="flex items-center gap-1 h-6">
                      {[12, 24, 18, 30, 16, 28, 20, 14, 26, 32, 22, 16, 24, 18, 12].map((h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h}px` }}
                          className={`flex-1 rounded-full transition-all duration-150 ${
                            isVoicePlaying
                              ? 'bg-gradient-to-t from-[#00ff88] to-cyan-400 animate-pulse'
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-purple-300"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Reactions Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => onReactPost(post.id, 'fire')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-orange-500 text-orange-400 text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>{post.reactions.fire}</span>
                  </button>

                  <button
                    onClick={() => onReactPost(post.id, 'heart')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#ff0055] text-[#ff0055] text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    <Heart className="w-4 h-4 text-[#ff0055]" />
                    <span>{post.reactions.heart}</span>
                  </button>

                  <button
                    onClick={() => onReactPost(post.id, 'zap')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-400 text-yellow-400 text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>{post.reactions.zap}</span>
                  </button>

                  <button
                    onClick={() => onReactPost(post.id, 'rocket')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-cyan-400 text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    <Rocket className="w-4 h-4 text-cyan-400" />
                    <span>{post.reactions.rocket}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {post.metrics.comments}
                  </span>
                  <button
                    onClick={() =>
                      onOpenShareModal({
                        type: 'post',
                        id: post.id,
                        title: post.title || `Post de ${post.author.name}`,
                        url: typeof window !== 'undefined' ? window.location.href : '',
                        description: post.content,
                        author: post.author.name
                      })
                    }
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-bold font-orbitron hover:bg-purple-900/60 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {t('player.share', 'COMPARTIR').toUpperCase()}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {filteredPosts.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-[#0b0e17] rounded-3xl border border-slate-800">
            {t('posts.none', 'No se encontraron publicaciones ni notas de voz')} {localSearch ? `("${localSearch}")` : ''}.
          </div>
        )}
      </div>
    </div>
  );
};
