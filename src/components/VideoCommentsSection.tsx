import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Smile,
  Palette,
  Type,
  Maximize2,
  Play,
  Pause,
  Trash2,
  Heart,
  Volume2,
  Sparkles,
  Search,
  Check,
  RotateCcw
} from 'lucide-react';
import { CommentPin } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface VideoCommentsSectionProps {
  videoId: string;
  comments: CommentPin[];
  onAddComment: (comment: CommentPin) => void;
}

// Available Font Families
export const COMMENT_FONTS = [
  { id: 'sans', label: 'Moderna (Sans)', fontClass: 'font-sans' },
  { id: 'orbitron', label: 'Cyberpunk (Orbitron)', fontClass: 'font-orbitron' },
  { id: 'rajdhani', label: 'Tecnológica (Rajdhani)', fontClass: 'font-rajdhani' },
  { id: 'mono', label: 'Hacker (Monospace)', fontClass: 'font-mono' },
  { id: 'serif', label: 'Clásica (Serif)', fontClass: 'font-serif' },
  { id: 'cursive', label: 'Caligráfica (Cursiva)', fontClass: 'italic font-serif' },
  { id: 'impact', label: 'Titular (Impact)', fontClass: 'font-extrabold uppercase tracking-wide' }
];

// Preset Color Box
export const COMMENT_COLORS = [
  { id: 'white', hex: '#ffffff', label: 'Blanco' },
  { id: 'cyan', hex: '#00f5ff', label: 'Cian Neón' },
  { id: 'green', hex: '#00ff88', label: 'Verde Cuántico' },
  { id: 'pink', hex: '#ff007f', label: 'Rosa Neón' },
  { id: 'gold', hex: '#ffbb00', label: 'Oro Solar' },
  { id: 'purple', hex: '#b026ff', label: 'Púrpura Eléctrico' },
  { id: 'orange', hex: '#ff5500', label: 'Naranja Fuego' },
  { id: 'emerald', hex: '#10b981', label: 'Esmeralda' },
  { id: 'blue', hex: '#3b82f6', label: 'Zafiro' },
  { id: 'rose', hex: '#f43f5e', label: 'Carmesí' }
];

// Font Sizes
export const COMMENT_SIZES = [
  { id: 'xs', label: 'Pequeño', sizeClass: 'text-xs' },
  { id: 'sm', label: 'Normal', sizeClass: 'text-sm' },
  { id: 'base', label: 'Mediano', sizeClass: 'text-base' },
  { id: 'lg', label: 'Grande', sizeClass: 'text-lg' },
  { id: 'xl', label: 'Extra Grande', sizeClass: 'text-xl' }
];

// Emojis Categorizados
export const EMOJI_CATEGORIES = [
  {
    name: 'Top / Reacciones',
    emojis: ['🔥', '🚀', '🤖', '⚡', '💎', '❤️', '🤩', '🤯', '👏', '💯', '🎉', '✨', '🌟', '👑', '🦾', '👾']
  },
  {
    name: 'Caritas & Gestos',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥹', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍',
      '🥰', '😘', '😋', '😛', '😜', '🤪', '😎', '🤓', '🧐', '🥳', '😏', '🤔', '🤫', '🫡', '🤨', '😐',
      '😑', '😶', '🙄', '😬', '😮‍💨', '🤥', '😌', '😴', '🤤', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶',
      '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺',
      '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤',
      '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '🎃'
    ]
  },
  {
    name: 'Manos & Celebración',
    emojis: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪',
      '🦾', '🦿', '🦵', '🦶', '👂', '👃', '🧠', '👀', '👁️', '👅', '👄', '💋', '✌️', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '🎉', '🎊'
    ]
  },
  {
    name: 'Tech, Sci-Fi & Media',
    emojis: [
      '⚡', '🛸', '🚀', '🛰️', '🌌', '🪐', '🌠', '🔭', '🔬', '🧬', '🧪', '🔮', '🧿', '🕹️', '🎮', '🎧',
      '🎙️', '📻', '📹', '🎥', '📽️', '🎞️', '💻', '🖥️', '📱', '🔋', '🔌', '💿', '📀', '💾', '📼', '📷'
    ]
  },
  {
    name: 'Corazones & Símbolos',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☯️', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'
    ]
  }
];

export const VideoCommentsSection: React.FC<VideoCommentsSectionProps> = ({
  videoId,
  comments,
  onAddComment
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();

  // Mode: 'text' or 'audio'
  const [commentType, setCommentType] = useState<'text' | 'audio'>('text');
  const [commentText, setCommentText] = useState('');

  // Rich Text Customizations
  const [selectedFont, setSelectedFont] = useState(COMMENT_FONTS[0].id);
  const [selectedColor, setSelectedColor] = useState(COMMENT_COLORS[0].hex);
  const [selectedSize, setSelectedSize] = useState('sm');

  // Popovers
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const [isSizePickerOpen, setIsSizePickerOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState(false);

  // Playing state for existing audio comments
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Comment Likes local state
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Insert Emoji at current cursor position
  const handleInsertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const updated = commentText.substring(0, start) + emoji + commentText.substring(end);
      setCommentText(updated);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 10);
    } else {
      setCommentText((prev) => prev + emoji);
    }
  };

  // Start Audio Recording
  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlobUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      setAudioBlobUrl(null);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecordingAudio();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Audio recording access error:', err);
      // Fallback simulated audio note if hardware permission is denied
      simulateAudioRecording();
    }
  };

  // Fallback simulator for sandboxed/mock environment
  const simulateAudioRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setAudioBlobUrl(null);
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 5) {
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          setIsRecording(false);
          setAudioDuration(5);
          // Synthetic audio beep / chime URI
          setAudioBlobUrl('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');
          return 5;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Stop Audio Recording
  const stopRecordingAudio = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setAudioDuration(recordingSeconds);
    setIsRecording(false);
  };

  // Discard Recorded Audio
  const discardRecordedAudio = () => {
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
    }
    setAudioBlobUrl(null);
    setAudioDuration(0);
    setRecordingSeconds(0);
    setIsPlayingRecordedAudio(false);
  };

  // Toggle Playing Recorded Preview
  const togglePlayRecordedAudio = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingRecordedAudio) {
      previewAudioRef.current.pause();
      setIsPlayingRecordedAudio(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingRecordedAudio(true);
    }
  };

  // Submit Text or Audio Comment
  const handleSubmitComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (commentType === 'text') {
      if (!commentText.trim()) return;

      const newPin: CommentPin = {
        id: `pin-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        xPercent: 50,
        yPercent: 50,
        timeSeconds: 0,
        author: currentUser?.name || 'Creador Quantic',
        avatar:
          currentUser?.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: commentText.trim(),
        createdAt: language === 'es' ? 'Ahora' : 'Just now',
        fontFamily: selectedFont,
        textColor: selectedColor,
        fontSize: selectedSize,
        likes: 0
      };

      onAddComment(newPin);
      setCommentText('');
      setIsEmojiPickerOpen(false);
    } else if (commentType === 'audio') {
      if (!audioBlobUrl) return;

      const newPin: CommentPin = {
        id: `pin-audio-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        xPercent: 50,
        yPercent: 50,
        timeSeconds: 0,
        author: currentUser?.name || 'Creador Quantic',
        avatar:
          currentUser?.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        text: `🎙️ ${language === 'es' ? 'Nota de audio' : 'Audio voice note'} (${audioDuration || recordingSeconds || 5}s)`,
        createdAt: language === 'es' ? 'Ahora' : 'Just now',
        isVoice: true,
        voiceUrl: audioBlobUrl,
        audioDuration: audioDuration || recordingSeconds || 5,
        fontFamily: 'orbitron',
        textColor: '#00ff88',
        fontSize: 'sm',
        likes: 0
      };

      onAddComment(newPin);
      discardRecordedAudio();
      setCommentType('text');
    }
  };

  // Like a comment
  const handleLikeComment = (commentId: string) => {
    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + 1
    }));
  };

  // Helper for font styling
  const getFontClass = (fontId?: string) => {
    const f = COMMENT_FONTS.find((cf) => cf.id === fontId);
    return f ? f.fontClass : 'font-sans';
  };

  // Helper for size styling
  const getSizeClass = (sizeId?: string) => {
    switch (sizeId) {
      case 'xs':
        return 'text-xs';
      case 'sm':
        return 'text-sm';
      case 'base':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl font-bold';
      default:
        return 'text-sm';
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="rounded-3xl bg-[#0b0e17] border border-slate-800 p-4 sm:p-6 space-y-5 shadow-2xl">
      {/* Header: Title and Counter */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-[#00ff88]" />
          <h3 className="font-orbitron font-bold text-sm sm:text-base text-white tracking-wide">
            {language === 'es' ? 'COMENTARIOS Y AUDIONOTAS' : 'COMMENTS & AUDIO NOTES'}
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/40 text-[#00ff88] font-mono text-xs font-bold">
            {comments.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-[#00ccff] animate-pulse" />
          <span>{language === 'es' ? 'Texto + Audio HD' : 'Rich Text + Audio HD'}</span>
        </div>
      </div>

      {/* Main Form Box: Text vs Audio Switcher */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#080b13] border border-slate-800/90 space-y-3.5">
        {/* Toggle between Text and Audio Comment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCommentType('text')}
              className={`px-3 py-1.5 rounded-xl text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all ${
                commentType === 'text'
                  ? 'bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black shadow-md shadow-[#00ff88]/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{language === 'es' ? 'Comentario de Texto' : 'Text Comment'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCommentType('audio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-orbitron font-bold flex items-center gap-1.5 transition-all ${
                commentType === 'audio'
                  ? 'bg-gradient-to-r from-[#ff0055] to-purple-600 text-white shadow-md shadow-[#ff0055]/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{language === 'es' ? 'Nota de Voz / Audio' : 'Voice / Audio Note'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <img
              src={
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover border border-[#00ff88]"
            />
            <span className="hidden sm:inline text-xs font-mono text-slate-300">
              {currentUser?.name || 'Tú'}
            </span>
          </div>
        </div>

        {/* 1. TEXT COMMENT MODE (Rich formatting: Fonts, Colors, Sizes, Emoji Library) */}
        {commentType === 'text' && (
          <div className="space-y-2.5">
            {/* Rich Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800/90 text-xs">
              {/* 1.1 Font Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsFontPickerOpen(!isFontPickerOpen);
                    setIsColorPickerOpen(false);
                    setIsSizePickerOpen(false);
                    setIsEmojiPickerOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 flex items-center gap-1.5 text-xs font-mono transition-all"
                  title="Seleccionar tipo de fuente"
                >
                  <Type className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="truncate max-w-[110px]">
                    {COMMENT_FONTS.find((f) => f.id === selectedFont)?.label.split(' ')[0]}
                  </span>
                </button>

                {isFontPickerOpen && (
                  <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-[#0d1222] border border-cyan-500/40 shadow-2xl p-2 z-40 space-y-1">
                    <p className="text-[10px] font-mono text-cyan-400 px-2 py-1 uppercase font-bold">
                      {language === 'es' ? 'Tipos de Fuentes' : 'Font Families'}
                    </p>
                    {COMMENT_FONTS.map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => {
                          setSelectedFont(font.id);
                          setIsFontPickerOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                          selectedFont === font.id
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className={font.fontClass}>{font.label}</span>
                        {selectedFont === font.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 1.2 Font Size Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsSizePickerOpen(!isSizePickerOpen);
                    setIsFontPickerOpen(false);
                    setIsColorPickerOpen(false);
                    setIsEmojiPickerOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-[#00ff88] text-slate-200 flex items-center gap-1.5 text-xs font-mono transition-all"
                  title="Cambiar tamaño de texto"
                >
                  <span className="font-bold text-[11px]">Tᴛ</span>
                  <span>{COMMENT_SIZES.find((s) => s.id === selectedSize)?.label}</span>
                </button>

                {isSizePickerOpen && (
                  <div className="absolute left-0 mt-2 w-44 rounded-2xl bg-[#0d1222] border border-[#00ff88]/40 shadow-2xl p-2 z-40 space-y-1">
                    <p className="text-[10px] font-mono text-[#00ff88] px-2 py-1 uppercase font-bold">
                      {language === 'es' ? 'Tamaño de Texto' : 'Text Size'}
                    </p>
                    {COMMENT_SIZES.map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => {
                          setSelectedSize(sz.id);
                          setIsSizePickerOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                          selectedSize === sz.id
                            ? 'bg-[#00ff88]/20 text-[#00ff88] font-bold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span>{sz.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">{sz.id.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 1.3 Color Palette Box */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsColorPickerOpen(!isColorPickerOpen);
                    setIsFontPickerOpen(false);
                    setIsSizePickerOpen(false);
                    setIsEmojiPickerOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-pink-500 text-slate-200 flex items-center gap-2 text-xs font-mono transition-all"
                  title="Caja de colores para el texto"
                >
                  <Palette className="w-3.5 h-3.5 text-pink-400" />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="hidden sm:inline">{language === 'es' ? 'Color' : 'Color'}</span>
                </button>

                {isColorPickerOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#0d1222] border border-pink-500/40 shadow-2xl p-3 z-40 space-y-2.5 animate-fadeIn">
                    <p className="text-[10px] font-mono text-pink-400 uppercase font-bold">
                      {language === 'es' ? 'Caja de Colores del Texto' : 'Text Color Palette'}
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {COMMENT_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => {
                            setSelectedColor(col.hex);
                            setIsColorPickerOpen(false);
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-2 ${
                            selectedColor === col.hex ? 'border-white ring-2 ring-pink-500 scale-105' : 'border-slate-800'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.label}
                        >
                          {selectedColor === col.hex && (
                            <Check
                              className={`w-4 h-4 ${
                                col.id === 'white' || col.id === 'gold' || col.id === 'green' || col.id === 'cyan'
                                  ? 'text-black font-bold'
                                  : 'text-white'
                              }`}
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Custom HTML5 color input */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-300">
                      <span>{language === 'es' ? 'Personalizado:' : 'Custom:'}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-[10px] text-slate-400">{selectedColor}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 1.4 Emoji Library Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmojiPickerOpen(!isEmojiPickerOpen);
                    setIsFontPickerOpen(false);
                    setIsColorPickerOpen(false);
                    setIsSizePickerOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
                    isEmojiPickerOpen
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-700 hover:border-amber-400 text-slate-200'
                  }`}
                  title="Abrir librería de Emojis"
                >
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'es' ? 'Emojis' : 'Emojis'}</span>
                </button>

                {/* Emoji Library Popover Drawer */}
                {isEmojiPickerOpen && (
                  <div className="absolute left-0 sm:left-auto right-0 sm:right-auto mt-2 w-72 sm:w-80 rounded-2xl bg-[#090d18] border border-amber-500/40 shadow-2xl p-3 z-40 space-y-2.5 max-h-80 overflow-hidden flex flex-col animate-fadeIn">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <span className="font-orbitron font-bold text-xs text-amber-400">
                        {language === 'es' ? 'LIBRERÍA DE EMOJIS' : 'EMOJI LIBRARY'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEmojiPickerOpen(false)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Emoji search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={emojiSearch}
                        onChange={(e) => setEmojiSearch(e.target.value)}
                        placeholder={language === 'es' ? 'Buscar emojis...' : 'Search emojis...'}
                        className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Emoji Grid with Scroll */}
                    <div className="overflow-y-auto max-h-56 pr-1 space-y-3 scrollbar-thin">
                      {EMOJI_CATEGORIES.map((category) => {
                        const filtered = emojiSearch
                          ? category.emojis.filter((em) => em.includes(emojiSearch))
                          : category.emojis;

                        if (filtered.length === 0) return null;

                        return (
                          <div key={category.name} className="space-y-1">
                            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                              {category.name}
                            </p>
                            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
                              {filtered.map((emoji, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleInsertEmoji(emoji)}
                                  className="w-8 h-8 rounded-lg hover:bg-slate-800 text-lg flex items-center justify-center transition-transform hover:scale-125 active:scale-95"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Emojis strip */}
              <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-800">
                {['🔥', '🚀', '🤖', '⚡', '❤️', '👏', '💯', '✨'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => handleInsertEmoji(em)}
                    className="hover:scale-125 transition-transform text-sm p-0.5"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Textarea with Live Preview of Font, Color and Size */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSubmitComment();
                  }
                }}
                placeholder={
                  language === 'es'
                    ? 'Escribe tu comentario en QuanticTube (Ctrl + Enter para enviar)...'
                    : 'Write your comment on QuanticTube (Ctrl + Enter to send)...'
                }
                rows={3}
                style={{ color: selectedColor }}
                className={`w-full p-3 rounded-2xl bg-black/70 border border-slate-700/80 focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-all resize-none placeholder-slate-500 ${getFontClass(
                  selectedFont
                )} ${getSizeClass(selectedSize)}`}
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-slate-500">
                  {commentText.length} {language === 'es' ? 'caracteres' : 'chars'} •{' '}
                  <span style={{ color: selectedColor }}>
                    {COMMENT_FONTS.find((f) => f.id === selectedFont)?.label.split(' ')[0]} / {selectedSize.toUpperCase()}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => handleSubmitComment()}
                  disabled={!commentText.trim()}
                  className={`px-4 py-2 rounded-xl font-orbitron font-bold text-xs flex items-center gap-2 transition-all ${
                    commentText.trim()
                      ? 'bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black shadow-lg shadow-[#00ff88]/30 hover:scale-105 active:scale-95 cursor-pointer'
                      : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? 'PUBLICAR COMENTARIO' : 'POST COMMENT'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. AUDIO / VOICE NOTE COMMENT MODE */}
        {commentType === 'audio' && (
          <div className="p-4 rounded-2xl bg-black/80 border border-purple-500/30 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-orbitron font-bold text-xs text-purple-300 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#ff0055]" />
                  <span>{language === 'es' ? 'GRABADOR DE AUDIONOTA CUÁNTICA' : 'QUANTUM AUDIO NOTE RECORDER'}</span>
                </h4>
                <p className="text-[11px] font-mono text-slate-400">
                  {language === 'es'
                    ? 'Graba tu voz con el micrófono y publícala como nota de audio en este video'
                    : 'Record your voice using the microphone and post as an audio note on this video'}
                </p>
              </div>

              {/* Status Badge */}
              <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                {isRecording ? (
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>GRABANDO {formatSeconds(recordingSeconds)}</span>
                  </span>
                ) : audioBlobUrl ? (
                  <span className="text-[#00ff88] font-bold">
                    ✓ LISTO ({audioDuration || recordingSeconds}s)
                  </span>
                ) : (
                  <span className="text-slate-400">EN ESPERA</span>
                )}
              </div>
            </div>

            {/* Audio Waveform Simulator while recording */}
            {isRecording && (
              <div className="flex items-center justify-center gap-1 h-16 py-2 bg-slate-950/80 rounded-xl border border-rose-500/40">
                {[14, 28, 42, 20, 36, 50, 24, 46, 32, 18, 40, 22, 48, 30, 16, 38, 26, 44, 20, 32].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-rose-600 via-[#ff0055] to-purple-400 animate-pulse"
                  />
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {!isRecording && !audioBlobUrl && (
                  <button
                    type="button"
                    onClick={startRecordingAudio}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-orbitron font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{language === 'es' ? 'INICIAR GRABACIÓN' : 'START RECORDING'}</span>
                  </button>
                )}

                {isRecording && (
                  <button
                    type="button"
                    onClick={stopRecordingAudio}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs flex items-center gap-2 animate-bounce transition-all"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>{language === 'es' ? 'DETENER Y GUARDAR' : 'STOP & SAVE'}</span>
                  </button>
                )}

                {audioBlobUrl && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlayRecordedAudio}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-orbitron font-bold text-xs flex items-center gap-2 transition-all"
                    >
                      {isPlayingRecordedAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-cyan-400" />}
                      <span>{isPlayingRecordedAudio ? 'Pausar' : 'Escuchar Audio'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={discardRecordedAudio}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-500 text-rose-400 transition-all"
                      title="Descartar y volver a grabar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <audio
                      ref={previewAudioRef}
                      src={audioBlobUrl}
                      onEnded={() => setIsPlayingRecordedAudio(false)}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {audioBlobUrl && (
                <button
                  type="button"
                  onClick={() => handleSubmitComment()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black font-orbitron font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#00ff88]/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? 'PUBLICAR AUDIONOTA' : 'POST AUDIO NOTE'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comments List Feed */}
      <div className="space-y-3.5 pt-2">
        {comments.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-mono text-slate-400">
              {language === 'es'
                ? 'Sé el primero en dejar un comentario o audionota con formato enriquecido.'
                : 'Be the first to leave a comment or rich audio voice note.'}
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isAudio = comment.isVoice || !!comment.voiceUrl;
            const likesCount = (comment.likes || 0) + (commentLikes[comment.id] || 0);
            const isPlayingThisAudio = playingAudioId === comment.id;

            return (
              <div
                key={comment.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#090d18] border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 group"
              >
                {/* Comment Header: Author, Avatar, Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="w-8 h-8 rounded-full object-cover border border-cyan-400/60 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">{comment.author}</span>
                        {isAudio && (
                          <span className="px-1.5 py-0.2 rounded-md bg-purple-950/80 border border-purple-500/50 text-[9px] font-mono text-purple-300 font-bold flex items-center gap-1">
                            <Volume2 className="w-2.5 h-2.5 text-purple-400" />
                            <span>VOZ</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {comment.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => handleLikeComment(comment.id)}
                    className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Heart className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>{likesCount}</span>
                  </button>
                </div>

                {/* Comment Content (Rich text or Audio Note) */}
                {isAudio ? (
                  <div className="p-3 rounded-xl bg-[#060810] border border-purple-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlayingThisAudio) {
                            setPlayingAudioId(null);
                          } else {
                            setPlayingAudioId(comment.id);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-[#ff0055] flex items-center justify-center text-white shadow-md shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all"
                      >
                        {isPlayingThisAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>

                      <div>
                        <p className="font-orbitron font-bold text-xs text-[#00ff88]">
                          {comment.text}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {isPlayingThisAudio ? 'Reproduciendo audio...' : 'Audio cuántico cifrado'}
                        </p>
                      </div>
                    </div>

                    {/* Animated sound bars */}
                    <div className="flex items-center gap-0.5">
                      {[10, 16, 22, 14, 24, 18, 12, 20].map((h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h}px` }}
                          className={`w-1 rounded-full ${
                            isPlayingThisAudio ? 'bg-[#00ff88] animate-pulse' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    {comment.voiceUrl && isPlayingThisAudio && (
                      <audio
                        src={comment.voiceUrl}
                        autoPlay
                        onEnded={() => setPlayingAudioId(null)}
                        className="hidden"
                      />
                    )}
                  </div>
                ) : (
                  <div
                    style={{ color: comment.textColor || '#ffffff' }}
                    className={`leading-relaxed break-words ${getFontClass(
                      comment.fontFamily
                    )} ${getSizeClass(comment.fontSize)}`}
                  >
                    {comment.text}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
