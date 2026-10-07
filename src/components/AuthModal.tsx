import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Film,
  Zap,
  Radio,
  Image as ImageIcon,
  MessageSquare,
  LogOut,
  User,
  CheckCircle2,
  Lock,
  Flame,
  Camera,
  Tv,
  UserPlus,
  LogIn,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const AuthModal: React.FC = () => {
  const {
    user,
    userProfile,
    isAuthModalOpen,
    closeAuthModal,
    signInWithGoogle,
    signUpQuickCreator,
    signOutUser,
    updateUserProfile
  } = useAuth();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'google' | 'quick'>('google');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [handle, setHandle] = useState(userProfile?.handle || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [avatar, setAvatar] = useState(userProfile?.avatar || '');
  const [channelName, setChannelName] = useState(userProfile?.channelName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Quick form state
  const [quickName, setQuickName] = useState('Memo Lopez');
  const [quickHandle, setQuickHandle] = useState('memolopez');
  const [quickChannel, setQuickChannel] = useState('QuanticTube Memo Studio');
  const [quickEmail, setQuickEmail] = useState('memo866lopez@gmail.com');

  if (!isAuthModalOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    try {
      await updateUserProfile({
        name: name.trim() || userProfile?.name,
        handle: handle.trim() || userProfile?.handle,
        bio: bio.trim(),
        avatar: avatar.trim() || userProfile?.avatar,
        channelName: channelName.trim() || userProfile?.channelName
      });
      setIsEditingProfile(false);
    } catch (err) {
      setErrorMsg(language === 'es' ? 'Error al guardar el perfil.' : 'Error saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setIsLoadingAuth(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn('Google Auth note:', err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg(
          language === 'es'
            ? 'Tu navegador bloqueó la ventana emergente de Google. Por favor permite ventanas emergentes o usa la pestaña de "Registro Rápido de Canal" abajo.'
            : 'Your browser blocked the Google popup window. Please allow popups or use the "Quick Creator Registration" tab below.'
        );
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg(
          language === 'es'
            ? 'Se cerró la ventana de inicio de sesión antes de completar. Puedes intentarlo de nuevo o registrarte en 1 clic abajo.'
            : 'Authentication popup was closed. You can retry or register with 1 click below.'
        );
      } else {
        setErrorMsg(
          language === 'es'
            ? 'Aviso de conexión con Google: Puedes permitir ventanas emergentes o activar tu cuenta con la pestaña de "Registro Rápido de Canal" para comenzar a subir videos de inmediato.'
            : 'Notice: You can allow popups or activate your account via "Quick Creator Registration" to upload videos immediately.'
        );
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleQuickSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    try {
      await signUpQuickCreator({
        name: quickName,
        handle: quickHandle,
        channelName: quickChannel,
        email: quickEmail
      });
    } catch (err) {
      setErrorMsg(language === 'es' ? 'Error al crear la cuenta.' : 'Error creating creator account.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0a0d18] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#00ff88]/15 overflow-hidden my-auto">
        {/* Glow accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00ff88]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00f0ff]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {userProfile ? (
          /* Logged In View / Profile Management */
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
              <div className="relative">
                <img
                  src={userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={userProfile?.name || 'User Avatar'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00ff88] shadow-lg shadow-[#00ff88]/20"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#00ff88] rounded-full border-2 border-black flex items-center justify-center" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-orbitron font-bold text-lg text-white">
                    {userProfile?.name}
                  </h3>
                  {userProfile?.isVerified && (
                    <span className="px-1.5 py-0.5 rounded bg-[#00ff88]/20 border border-[#00ff88]/50 text-[#00ff88] text-[10px] font-bold">
                      VERIFICADO
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#00ff88] font-mono">@{userProfile?.handle}</p>
                <p className="text-xs text-slate-400 truncate">{userProfile?.email}</p>
              </div>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Nombre Público</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Handle (@usuario)</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Nombre de tu Canal</label>
                  <input
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Biografía</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00ff88] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">URL de Foto de Perfil (Avatar)</label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>

                {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl bg-[#00ff88] hover:bg-emerald-400 text-xs font-bold text-black shadow-lg shadow-[#00ff88]/30 transition-all cursor-pointer"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono">Canal Oficial:</span>
                    <span className="text-white font-bold">{userProfile?.channelName || 'Canal Quantic'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono">Suscriptores:</span>
                    <span className="text-[#00ff88] font-bold font-mono">{userProfile?.subscribersCount || 1}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono">Rol de Creador:</span>
                    <span className="text-cyan-400 font-bold uppercase">{userProfile?.role || 'Creator'}</span>
                  </div>
                  {userProfile?.bio && (
                    <p className="text-xs text-slate-300 pt-2 border-t border-slate-800 italic">
                      "{userProfile.bio}"
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setName(userProfile?.name || '');
                      setHandle(userProfile?.handle || '');
                      setBio(userProfile?.bio || '');
                      setAvatar(userProfile?.avatar || '');
                      setChannelName(userProfile?.channelName || '');
                      setIsEditingProfile(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#00ff88]" />
                    Editar Perfil
                  </button>
                  <button
                    onClick={signOutUser}
                    className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Sign In / Sign Up View */
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 text-[#00ff88] text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>COMUNIDAD OFICIAL QUANTICTUBE</span>
              </div>
              <h2 className="font-orbitron font-bold text-xl sm:text-2xl text-white">
                {language === 'es' ? 'Regístrate o Inicia Sesión' : 'Sign Up or Sign In'}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'es'
                  ? 'Crea tu canal para subir videos largos 4K, shorts 9:16, fotos, GIFs y hacer directos.'
                  : 'Create your channel to publish 4K long videos, 9:16 shorts, photos, GIFs and live streams.'}
              </p>
            </div>

            {/* Auth Method Selector Tabs */}
            <div className="flex rounded-2xl bg-slate-900/90 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab('google')}
                className={`flex-1 py-2 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'google'
                    ? 'bg-gradient-to-r from-cyan-500 to-[#00ff88] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{language === 'es' ? 'Con Google' : 'With Google'}</span>
              </button>

              <button
                onClick={() => setActiveTab('quick')}
                className={`flex-1 py-2 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'quick'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{language === 'es' ? 'Crear Canal Directo' : 'Direct Channel Signup'}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {activeTab === 'google' ? (
              <div className="space-y-4">
                {/* Google Sign In Button */}
                <button
                  onClick={handleGoogleAuth}
                  disabled={isLoadingAuth}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-black font-orbitron font-bold text-sm flex items-center justify-center gap-3 shadow-xl shadow-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {isLoadingAuth
                      ? language === 'es' ? 'Conectando con Google...' : 'Connecting with Google...'
                      : language === 'es' ? 'Continuar con Google' : 'Continue with Google'}
                  </span>
                </button>

                {/* Creator Perks Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#00ff88]/10 text-[#00ff88]">
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white">Videos Largos 16:9</p>
                      <p className="text-[9px] text-slate-400 font-mono">Ultra 4K</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white">Shorts 9:16</p>
                      <p className="text-[9px] text-slate-400 font-mono">Física de Pañuelo</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Quick Direct Channel Signup Form */
              <form onSubmit={handleQuickSignupSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    {language === 'es' ? 'Tu Nombre Completo *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="Ej. Memo Lopez"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      {language === 'es' ? 'Usuario / Handle *' : 'Username / Handle *'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">@</span>
                      <input
                        type="text"
                        required
                        value={quickHandle}
                        onChange={(e) => setQuickHandle(e.target.value)}
                        placeholder="memolopez"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00ff88]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      {language === 'es' ? 'Nombre del Canal *' : 'Channel Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={quickChannel}
                      onChange={(e) => setQuickChannel(e.target.value)}
                      placeholder="Canal Quantic"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00ff88]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    {language === 'es' ? 'Correo Electrónico (Opcional)' : 'Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                    placeholder="memo866lopez@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00ff88]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#00ff88] via-cyan-400 to-[#00f0ff] text-black font-orbitron font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00ff88]/30 hover:opacity-95 transition-all cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? language === 'es' ? 'Activando Canal...' : 'Activating Channel...'
                      : language === 'es' ? 'CREAR MI CANAL Y EMPEZAR A PUBLICAR' : 'CREATE MY CHANNEL & START PUBLISHING'}
                  </span>
                </button>
              </form>
            )}

            <p className="text-[10px] text-center text-slate-500 font-mono">
              {language === 'es'
                ? 'Al registrarte, tu cuenta queda vinculada a la nube para subir videos, shorts y fotos permanentemente.'
                : 'By registering, your account is linked to cloud storage for permanent video and media uploads.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
