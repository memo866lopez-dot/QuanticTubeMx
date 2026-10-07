import React from 'react';
import {
  X,
  HelpCircle,
  Hand,
  Sparkles,
  Video,
  Play,
  Image as ImageIcon,
  MessageSquare,
  Bot,
  Radio,
  Tv,
  Camera,
  Layers,
  Flame,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Volume2,
  Music,
  Share2,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#090c16] border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-500/20 flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/30">
              <HelpCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-white flex items-center gap-2">
                {t('help.title', 'GUÍA INTERACTIVA & CÓMO USAR')} <span className="text-[#00ff88]">QUANTICTUBE</span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {t('help.subtitle', 'Aprende a dominar todas las innovaciones táctiles, 3D, físicas y herramientas de IA')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-200">
          {/* Section 1: 3D Cloth Physics for Long Videos & Shorts */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40">
                <Hand className="w-5 h-5" />
              </div>
              <h3 className="font-orbitron font-bold text-base text-white">
                {t('help.clothTitle', '1. Física de Pañuelo 3D Orgánico (Videos Largos y Shorts)')}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {t(
                'help.clothDesc',
                'Nuestra tecnología patentada de tela de seda 3D te permite interactuar con el video como si fuera un pañuelo físico:'
              )}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-bold text-xs">
                  <ArrowUp className="w-4 h-4 text-cyan-400" />
                  <span>{t('help.flingUp', 'Jalar Arriba = Siguiente')}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {t(
                    'help.flingUpDesc',
                    'Al arrastrar el video hacia el tope superior y soltarlo, saldrá volando en 3D hacia el cosmos y se cargará el Siguiente Video.'
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-orbitron font-bold text-xs">
                  <ArrowDown className="w-4 h-4 text-amber-400" />
                  <span>{t('help.flingDown', 'Jalar Abajo = Anterior')}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {t(
                    'help.flingDownDesc',
                    'Al arrastrar el video hacia el tope inferior, se proyectará hacia abajo y restaurará el Video Anterior de la lista.'
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-[#00ff88] font-orbitron font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-[#00ff88]" />
                  <span>{t('help.freeRoam', 'Paseo Libre y Rebote')}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {t(
                    'help.freeRoamDesc',
                    'Puedes pasear el video por cualquier punto de la pantalla completa. Si lo sueltas en el medio, rebotará elásticamente a su marco original.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Drag Miniatures over the Main Player */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/40">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-orbitron font-bold text-base text-white">
                {t('help.dragThumbTitle', '2. Arrastrar Miniaturas hacia la Derecha sobre el Reproductor')}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {t(
                'help.dragThumbDesc',
                'En la lista de videos largos, puedes pulsar cualquier miniatura y jalarla con el cursor o el dedo hacia la derecha. Al soltarla encima del reproductor principal, se convertirá instantáneamente en el nuevo video activo en reproducción.'
              )}
            </p>
          </div>

          {/* Section 3: Subscriptions, Sign In & Creating Media */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="font-orbitron font-bold text-base text-white">
                {t('help.authTitle', '3. Suscripciones, Cuenta de Creador y Publicación Real en la Nube')}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {t(
                'help.authDesc',
                'Con la integración de Firebase y Google Sign-In, puedes registrar tu propio canal en 1 clic. Podrás publicar videos largos en 16:9, Shorts en 9:16, fotografías en ultra definición, posts de texto, notas de voz holográficas y GIFs animados que se guardan en la nube permanentemente.'
              )}
            </p>
          </div>

          {/* Section 4: Live Calls, Stage & Quantum AI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-bold text-sm">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>{t('help.liveTitle', 'Videollamadas 4K & Omni-Live')}</span>
              </div>
              <p className="text-xs text-slate-300">
                {t(
                  'help.liveDesc',
                  'Inicia llamadas de video directas P2P de alta fidelidad desde el panel de usuarios conectados, o transmite en Omni-Live con soporte para cámara dual e invitados en el escenario.'
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-orbitron font-bold text-sm">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>{t('help.aiTitle', 'Director Creativo & Quantum AI')}</span>
              </div>
              <p className="text-xs text-slate-300">
                {t(
                  'help.aiDesc',
                  'Utiliza la suite de IA impulsada por Gemini para generar ideas virales, guiones, sintetizar música procedural con Lyria y animar fotos a video con Veo 3.1.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            {language === 'es' ? 'QuanticTube • Experiencia Multimedia Cuántica' : 'QuanticTube • Quantum Multimedia Experience'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-[#00ff88] text-black font-orbitron font-bold text-xs hover:opacity-95 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
          >
            {t('help.gotIt', '¡ENTENDIDO!')}
          </button>
        </div>
      </div>
    </div>
  );
};
