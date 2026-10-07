import React from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Cookie,
  AlertTriangle,
  Award,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PoliciesModal: React.FC<PoliciesModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#090c16] border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-500/20 flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-orbitron font-extrabold text-white flex items-center gap-2">
                {t('policies.title', 'POLÍTICAS DE PRIVACIDAD & TÉRMINOS')}
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {t('policies.subtitle', 'Compromiso de protección de datos, seguridad en la nube y derechos del creador')}
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
          {/* Section 1: Data Privacy & Security */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400 font-orbitron font-bold text-base">
              <Lock className="w-5 h-5" />
              <span>{t('policies.sec1Title', '1. Protección de Datos y Almacenamiento Cifrado')}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t(
                'policies.sec1Desc',
                'En QuanticTube protegemos tu información personal con los más altos estándares criptográficos de la industria. Tus credenciales de acceso se gestionan mediante Firebase Authentication y Google Cloud Firestore, asegurando que tu contraseña nunca sea expuesta a intermediarios.'
              )}
            </p>
          </div>

          {/* Section 2: Creator Rights & Zero Data Selling */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-cyan-400 font-orbitron font-bold text-base">
              <Award className="w-5 h-5" />
              <span>{t('policies.sec2Title', '2. Propiedad Intelectual del Creador y Cero Venta de Datos')}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t(
                'policies.sec2Desc',
                'Tú conservas el 100% de los derechos de autor de todo el contenido que publiques (videos, fotos, música, podcasts y GIFs). QuanticTube NUNCA vende ni comercializa tu información personal o hábitos de navegación a empresas de publicidad de terceros.'
              )}
            </p>
          </div>

          {/* Section 3: AI Moderation and Community Guidelines */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-purple-400 font-orbitron font-bold text-base">
              <Sparkles className="w-5 h-5" />
              <span>{t('policies.sec3Title', '3. Moderación Automatizada con IA & Normas de Convivencia')}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t(
                'policies.sec3Desc',
                'Contamos con un sistema inteligente de escaneo en tiempo real con Gemini AI para prevenir el acoso, discurso de odio, spam y contenido perjudicial. Los comentarios tóxicos son neutralizados y desintegrados de inmediato para proteger a nuestra comunidad de creadores.'
              )}
            </p>
          </div>

          {/* Section 4: Cookies & Web Technologies */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400 font-orbitron font-bold text-base">
              <Cookie className="w-5 h-5" />
              <span>{t('policies.sec4Title', '4. Uso de Cookies & Almacenamiento Local')}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t(
                'policies.sec4Desc',
                'Utilizamos almacenamiento local y cookies técnicas estrictamente necesarias para recordar tus preferencias de idioma, modo de audio espacial y sesión activa.'
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            {language === 'es' ? 'Última actualización: 2026 • Cumplimiento GDPR / CCPA' : 'Last update: 2026 • GDPR / CCPA Compliance'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-orbitron font-bold text-xs hover:opacity-95 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
          >
            {t('policies.accept', 'ACEPTAR Y CONTINUAR')}
          </button>
        </div>
      </div>
    </div>
  );
};
