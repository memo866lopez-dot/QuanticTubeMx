import React from 'react';
import {
  X,
  Info,
  Sparkles,
  Zap,
  Globe,
  Rocket,
  Flame,
  Heart,
  Award,
  Tv,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#090c16] border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-500/20 flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-purple-950/40 via-slate-900 to-pink-950/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-400 text-purple-300 shadow-lg shadow-purple-500/30">
              <Info className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-white flex items-center gap-2">
                {t('about.title', 'SOBRE')} <span className="bg-gradient-to-r from-[#00ff88] via-cyan-400 to-[#ff0055] bg-clip-text text-transparent font-black">QUANTICTUBE</span>
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {t('about.subtitle', 'La plataforma social multimedia y de video del futuro')}
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
          {/* Mission & Vision */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-3">
            <div className="flex items-center gap-2.5 text-purple-400 font-orbitron font-bold text-base">
              <Rocket className="w-5 h-5" />
              <span>{t('about.missionTitle', 'Nuestra Misión: Superar los Límites del Video y las Redes Sociales')}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {t(
                'about.missionDesc',
                'QuanticTube nace con la visión de revolucionar la forma en que el mundo consume, crea y comparte contenido. Reuniendo lo mejor de YouTube (videos largos 16:9), TikTok (Shorts verticales interactivos 9:16), Instagram (galerías de fotografía y arte digital), X (microblogging y notas de voz), y Twitch (estudio en vivo Omni-Live con WebRTC), todo potenciado por física de pañuelo 3D orgánico y control automatizado con Inteligencia Artificial.'
              )}
            </p>
          </div>

          {/* Pillars of Innovation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-[#00ff88] font-orbitron font-bold text-sm">
                <Cpu className="w-4 h-4 text-[#00ff88]" />
                <span>{t('about.techPillar', 'Poder Tecnológico Cuántico')}</span>
              </div>
              <p className="text-xs text-slate-300">
                {t(
                  'about.techDesc',
                  'Desarrollado con React 19, TypeScript, aceleración 3D por GPU (WebGL/CSS 3D Transforms), WebRTC de latencia ultra baja y Web Audio API procedural.'
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-bold text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>{t('about.aiPillar', 'Inteligencia Artificial Gemini 3.8')}</span>
              </div>
              <p className="text-xs text-slate-300">
                {t(
                  'about.aiDesc',
                  'Asistencia inteligente en tiempo real, director creativo de guiones, generador de video Veo 3.1, moderación automática y síntesis musical Lyria.'
                )}
              </p>
            </div>
          </div>

          {/* Founder Memo Lopez note */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-purple-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00ff88] via-cyan-400 to-[#ff0055] p-[2px] shadow-lg shadow-cyan-500/30 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-orbitron font-black text-2xl text-white">
                M
              </div>
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-orbitron font-bold text-sm text-white flex items-center justify-center sm:justify-start gap-2">
                <span>{t('about.founder', 'Creado & Diseñado por Memo Lopez')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 font-mono">
                  {t('about.creatorBadge', 'Fundador & Arquitecto')}
                </span>
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                {t(
                  'about.founderNote',
                  'Una plataforma concebida desde el corazón para conectar creadores globales con una experiencia visual y táctil sin precedentes.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            {language === 'es' ? '© 2026 QuanticTube Inc. • Todos los derechos reservados' : '© 2026 QuanticTube Inc. • All rights reserved'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-[#00ff88] text-white font-orbitron font-bold text-xs hover:opacity-95 transition-all cursor-pointer shadow-md shadow-purple-500/20"
          >
            {t('about.close', 'CERRAR')}
          </button>
        </div>
      </div>
    </div>
  );
};
