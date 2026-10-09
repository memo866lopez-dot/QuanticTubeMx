import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Calendar,
  CloudSun,
  Flame,
  Radio,
  BookOpen,
  LayoutGrid,
  CheckCircle2,
  Circle,
  Trash2,
  Plus,
  Send,
  X,
  Bell,
  Music,
  User,
  Zap,
  Minimize2,
  Maximize2,
  MessageSquare,
  Play,
  RotateCcw,
  Square,
  Activity,
  Upload,
  ExternalLink,
  FileAudio
} from 'lucide-react';
import {
  quanticVoiceAgent,
  CommandAction,
  ChatMessageItem
} from '../services/voiceAgentService';
import { processAudioWithGemini } from '../services/geminiService';
import { AgentMemory, TaskReminder, VideoItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { VoiceSpectrumTester } from './VoiceSpectrumTester';

interface QuanticVoiceAgentProps {
  currentVideos: VideoItem[];
  activeVideoId: string;
  onExecuteCommand: (action: CommandAction) => void;
}

export const QuanticVoiceAgent: React.FC<QuanticVoiceAgentProps> = ({
  currentVideos,
  activeVideoId,
  onExecuteCommand
}) => {
  const { language, t } = useLanguage();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'memory' | 'tester'>('voice');

  // Agent State
  const [memory, setMemory] = useState<AgentMemory>(quanticVoiceAgent.getMemory());
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>(() => quanticVoiceAgent.getChatMessages());
  const [isRecordingPTT, setIsRecordingPTT] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Live Continuous Mode State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveState, setLiveState] = useState<'listening' | 'recording' | 'speaking' | 'processing' | 'idle'>('idle');
  const [interimStatusText, setInterimStatusText] = useState<string>('');

  // Audio level visualizer
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [waveHeights, setWaveHeights] = useState<number[]>([10, 16, 12, 20, 14, 18, 12]);

  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'tarea' | 'recordatorio' | 'alarma'>('tarea');

  // Alarm / Alert Notification popup state
  const [activeAlert, setActiveAlert] = useState<{
    type: 'alarm' | 'reminder';
    title: string;
    message: string;
  } | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setInterimStatusText(
      language === 'es' ? '🧠 Procesando archivo de voz enviado...' : '🧠 Processing uploaded audio file...'
    );

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const result = await processAudioWithGemini(
          base64Data,
          file.type || 'audio/webm',
          memory.userName || 'Memo'
        );

        setIsProcessing(false);
        setInterimStatusText('');

        const userTranscript = result.userTranscript || (language === 'es' ? 'Nota de voz enviada' : 'Voice note sent');
        quanticVoiceAgent.addChatMessage('user', userTranscript, true);

        const action = await quanticVoiceAgent.processUserInput(userTranscript, currentVideos);
        const finalReply = action.speechResponse || result.aiResponse;
        action.speechResponse = finalReply;

        quanticVoiceAgent.addChatMessage('agent', finalReply, false);
        if (action.type !== 'NONE') {
          onExecuteCommand(action);
        }
        await quanticVoiceAgent.speak(finalReply);
      };
    } catch (err) {
      setIsProcessing(false);
      setInterimStatusText('');
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isProcessing, interimStatusText]);

  // Synchronize memory and chat messages changes
  useEffect(() => {
    const unsubMemory = quanticVoiceAgent.onMemoryChange((newMem) => {
      setMemory({ ...newMem });
    });

    const unsubChat = quanticVoiceAgent.onChatMessagesChange((msgs) => {
      setChatMessages([...msgs]);
    });

    const unsubAlarm = quanticVoiceAgent.onAlarmTrigger((favVideo) => {
      setActiveAlert({
        type: 'alarm',
        title: language === 'es' ? '⏰ ¡DESPERTADOR CUÁNTICO!' : '⏰ QUANTUM ALARM CLOCK!',
        message: language === 'es' 
          ? `Es hora de despertar con tu video favorito: "${favVideo.title}"`
          : `Time to wake up with your favorite video: "${favVideo.title}"`
      });
      onExecuteCommand({
        type: 'PLAY_VIDEO',
        payload: favVideo.id,
        speechResponse: `Despertando con tu video favorito: ${favVideo.title}`
      });
    });

    const unsubReminder = quanticVoiceAgent.onReminderTrigger((task) => {
      setActiveAlert({
        type: 'reminder',
        title: language === 'es' ? '🔔 RECORDATORIO PROGRAMADO' : '🔔 SCHEDULED REMINDER',
        message: `"${task.title}"`
      });
    });

    return () => {
      unsubMemory();
      unsubChat();
      unsubAlarm();
      unsubReminder();
    };
  }, [onExecuteCommand, language]);

  // Update dynamic waveform based on real audio level or speaking state
  useEffect(() => {
    if (isRecordingPTT || isLiveMode) {
      const mult = Math.max(1, audioLevel / 8);
      setWaveHeights([
        Math.min(36, Math.max(8, Math.round(10 * mult + Math.random() * 6))),
        Math.min(42, Math.max(12, Math.round(18 * mult + Math.random() * 8))),
        Math.min(38, Math.max(10, Math.round(14 * mult + Math.random() * 6))),
        Math.min(48, Math.max(14, Math.round(24 * mult + Math.random() * 10))),
        Math.min(40, Math.max(10, Math.round(16 * mult + Math.random() * 8))),
        Math.min(36, Math.max(12, Math.round(18 * mult + Math.random() * 6))),
        Math.min(32, Math.max(8, Math.round(12 * mult + Math.random() * 4)))
      ]);
    } else if (isSpeaking) {
      const interval = setInterval(() => {
        setWaveHeights([
          Math.floor(Math.random() * 20) + 12,
          Math.floor(Math.random() * 32) + 14,
          Math.floor(Math.random() * 26) + 12,
          Math.floor(Math.random() * 38) + 16,
          Math.floor(Math.random() * 28) + 12,
          Math.floor(Math.random() * 30) + 14,
          Math.floor(Math.random() * 22) + 10
        ]);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setWaveHeights([8, 12, 8, 14, 10, 12, 8]);
    }
  }, [audioLevel, isRecordingPTT, isLiveMode, isSpeaking]);

  // Synchronize detected name from account or channel with QuanticVoiceAgent
  useEffect(() => {
    if (currentUser) {
      const nameToUse = currentUser.channelName?.trim() || currentUser.name?.trim();
      if (nameToUse) {
        quanticVoiceAgent.setUserName(nameToUse);
      }
    }
  }, [currentUser]);

  // Open console with time-of-day greeting & offer of what to watch
  const handleOpenAgent = () => {
    setIsOpen(true);
    setIsMinimized(false);
    const nameToUse = currentUser?.channelName?.trim() || currentUser?.name?.trim() || memory.userName || 'Memo';
    quanticVoiceAgent.greetUser(nameToUse, language, speechEnabled);
  };

  const handleTestMaleVoice = async () => {
    const nameToUse = currentUser?.channelName?.trim() || currentUser?.name?.trim() || memory.userName || 'Guillermo';
    quanticVoiceAgent.greetUser(nameToUse, language, speechEnabled);
  };

  // Quantum AI Connected Continuous Session Toggle (Hands-free Live Mode)
  const handleToggleLiveMode = () => {
    if (isLiveMode) {
      quanticVoiceAgent.stopLiveSession();
      setIsLiveMode(false);
      setLiveState('idle');
      setIsSpeaking(false);
      setInterimStatusText('');
      setAudioLevel(0);
    } else {
      if (isRecordingPTT) {
        quanticVoiceAgent.stopPushToTalk();
        setIsRecordingPTT(false);
      }

      setIsLiveMode(true);
      quanticVoiceAgent.startLiveSession(
        {
          onInterimText: (text) => setInterimStatusText(text),
          onStateChange: (state) => {
            setLiveState(state);
            setIsSpeaking(state === 'speaking');
            setIsProcessing(state === 'processing');
          },
          onAudioLevel: (lvl) => setAudioLevel(lvl),
          onFinalTurn: (userText, action) => {
            setInterimStatusText('');
            if (action.type !== 'NONE') {
              onExecuteCommand(action);
            }
          }
        },
        currentVideos
      );
    }
  };

  // Direct Push-To-Talk Toggle
  const handleTogglePushToTalk = async () => {
    if (isLiveMode) {
      handleToggleLiveMode();
      return;
    }

    if (isRecordingPTT) {
      setIsRecordingPTT(false);
      setIsProcessing(true);
      setInterimStatusText(language === 'es' ? '🧠 Transcribiendo y procesando tu voz...' : '🧠 Transcribing & processing your voice...');
      const res = await quanticVoiceAgent.stopPushToTalk();
      setIsProcessing(false);
      setInterimStatusText('');
      setAudioLevel(0);
      if (res && res.action.type !== 'NONE') {
        onExecuteCommand(res.action);
      }
    } else {
      setIsRecordingPTT(true);
      setInterimStatusText(language === 'es' ? '🎙️ Grabando audio directamente... Habla ahora' : '🎙️ Recording audio directly... Speak now');
      const started = await quanticVoiceAgent.startPushToTalk(
        (lvl) => setAudioLevel(lvl),
        (text) => setInterimStatusText(text)
      );
      if (!started) {
        setIsRecordingPTT(false);
        setInterimStatusText('');
        alert(language === 'es' ? 'Por favor autoriza el micrófono en tu navegador para hablar.' : 'Please allow microphone access in your browser to speak.');
      }
    }
  };

  // Interrupt agent speech
  const handleInterruptAgent = () => {
    quanticVoiceAgent.stopSpeaking();
    setIsSpeaking(false);
    setLiveState('listening');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      quanticVoiceAgent.stopLiveSession();
    };
  }, []);

  // Process text typed in input bar
  const handleExecuteText = async (textToProcess: string) => {
    const clean = textToProcess.trim();
    if (!clean) return;

    setInputText('');
    setIsProcessing(true);

    quanticVoiceAgent.addChatMessage('user', clean, false);

    const action = await quanticVoiceAgent.processUserInput(clean, currentVideos);
    setIsProcessing(false);

    quanticVoiceAgent.addChatMessage('agent', action.speechResponse, false);

    if (speechEnabled) {
      setIsSpeaking(true);
      await quanticVoiceAgent.speak(action.speechResponse, () => {
        setIsSpeaking(false);
      });
    }

    if (action.type !== 'NONE') {
      onExecuteCommand(action);
    }
  };

  // Quick audio test with male voice & personalized greeting
  const handleTestVoice = () => {
    const nameToUse = currentUser?.channelName?.trim() || currentUser?.name?.trim() || memory.userName || 'Guillermo';
    quanticVoiceAgent.greetUser(nameToUse, language, speechEnabled);
  };

  // Handle Add Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const date = newTaskDate || new Date(Date.now() + 3600000).toISOString().slice(0, 16);
    quanticVoiceAgent.addTask(newTaskTitle.trim(), date, newTaskCategory);
    setNewTaskTitle('');
    setNewTaskDate('');

    if (speechEnabled) {
      quanticVoiceAgent.speak(language === 'es' ? `Tarea guardada en el memorizante: ${newTaskTitle}` : `Task saved in memory notebook: ${newTaskTitle}`);
    }
  };

  // Set current video as favorite
  const handleSetCurrentAsFavorite = () => {
    const current = currentVideos.find((v) => v.id === activeVideoId);
    if (current) {
      quanticVoiceAgent.setFavoriteVideo(current.id, current.title);
      if (speechEnabled) {
        quanticVoiceAgent.speak(language === 'es' ? `He guardado "${current.title}" como tu video favorito para despertarte.` : `I have saved "${current.title}" as your favorite video to wake you up.`);
      }
    }
  };

  return (
    <>
      {/* Alert Banner / Alarm Notification Modal */}
      {activeAlert && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-full bg-[#0d121f] border-2 border-[#00ff88] rounded-2xl p-4 shadow-2xl shadow-[#00ff88]/40 animate-bounce">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40">
                {activeAlert.type === 'alarm' ? <Music className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5 animate-pulse" />}
              </span>
              <div>
                <h4 className="font-orbitron font-bold text-xs text-white tracking-wider">
                  {activeAlert.title}
                </h4>
                <p className="text-xs text-slate-200 mt-0.5">{activeAlert.message}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveAlert(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING QUANTUM ORB (ALWAYS ACCESSIBLE) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3">
          <button
            onClick={handleOpenAgent}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d111d]/95 border border-[#00ff88]/40 text-xs font-mono text-slate-200 shadow-xl backdrop-blur-md hover:border-[#00ff88] transition-all group"
          >
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
            <span className="group-hover:text-[#00ff88] transition-colors">
              {t('agent.openFloating', 'Hablar con Quantum AI en Vivo')}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {currentUser?.channelName || currentUser?.name || memory.userName}
            </span>
          </button>

          <button
            onClick={handleOpenAgent}
            className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#00ff88] via-[#00ccff] to-[#ff0055] p-[2px] shadow-lg shadow-[#00ff88]/40 hover:scale-110 active:scale-95 transition-transform"
            title={t('agent.openFloating', 'Abrir Chat y Micrófono Directo con Quantum AI')}
          >
            <div className="w-full h-full rounded-full bg-[#08090f] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-radial from-[#00ff88]/30 via-transparent to-transparent animate-pulse" />
              
              <div className="flex items-center gap-0.5 z-10">
                <span className="w-0.5 h-3 bg-[#00ff88] animate-pulse rounded-full" />
                <span className="w-0.5 h-6 bg-white animate-pulse delay-75 rounded-full" />
                <span className="w-0.5 h-4 bg-[#ff0055] animate-pulse delay-150 rounded-full" />
              </div>
            </div>

            {memory.tasks.some((t) => !t.completed) && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff0055] text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#08090f]">
                {memory.tasks.filter((t) => !t.completed).length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* EXPANDED QUANTUM VOICE & CHAT CONSOLE */}
      {isOpen && (
        <div
          className={`fixed bottom-5 right-3 sm:right-6 z-50 w-[95vw] sm:w-[470px] bg-[#090c16]/98 border-2 border-[#00ff88]/60 rounded-3xl shadow-2xl shadow-[#00ff88]/25 backdrop-blur-2xl transition-all duration-300 overflow-hidden flex flex-col ${
            isMinimized ? 'h-16' : 'h-[660px] max-h-[90vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="p-3.5 bg-[#0b0f1d] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#00ff88] to-[#ff0055] p-[1.5px]">
                <div className="w-full h-full bg-[#080a12] rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#00ff88]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-orbitron font-bold text-xs text-white tracking-wider">
                    {t('agent.title', 'QUANTUM AI')} <span className="text-[#00ff88]">{t('agent.sub', 'VOZ & MIC EN VIVO')}</span>
                  </h3>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      isLiveMode || isRecordingPTT
                        ? 'bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/40 animate-pulse'
                        : 'bg-emerald-950/60 text-[#00ff88] border border-[#00ff88]/40'
                    }`}
                  >
                    {isLiveMode ? (language === 'es' ? '● EN VIVO' : '● LIVE') : isRecordingPTT ? t('agent.recording', '● GRABANDO') : t('agent.micActive', 'MIC ACTIVO')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {t('agent.warmMale', 'Quantum AI Live Now')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleTestVoice}
                title={language === 'es' ? 'Probar voz masculina cálida' : 'Test warm male voice'}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-[#00ff88] text-[10px] font-mono"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#00ff88]" />
              </button>

              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                title={speechEnabled ? 'Mute voice' : 'Enable voice'}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-[#00ff88]"
              >
                {speechEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#00ff88]" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  quanticVoiceAgent.stopLiveSession();
                  if (isRecordingPTT) quanticVoiceAgent.stopPushToTalk();
                  setIsLiveMode(false);
                  setIsRecordingPTT(false);
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Navigation Sub-Tabs */}
              <div className="flex items-center border-b border-slate-800/80 bg-[#070912]">
                <button
                  onClick={() => setActiveTab('voice')}
                  className={`flex-1 py-2 text-xs font-orbitron font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'voice'
                      ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Platicar</span>
                </button>
                <button
                  onClick={() => setActiveTab('tester')}
                  className={`flex-1 py-2 text-xs font-orbitron font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'tester'
                      ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Probador Mic</span>
                </button>
                <button
                  onClick={() => setActiveTab('memory')}
                  className={`flex-1 py-2 text-xs font-orbitron font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                    activeTab === 'memory'
                      ? 'border-purple-400 text-purple-300 bg-purple-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>Agenda ({memory.tasks.length})</span>
                </button>
              </div>

              {/* TAB 1: COMANDOS, CHAT & VOZ MASCULINA */}
              {activeTab === 'voice' && (
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 flex flex-col justify-between">
                  {/* Native Microphone Controls Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#0e1424] to-[#0a0d18] border border-slate-800 text-center relative overflow-hidden space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      {/* Big Push to Talk Microphone Button */}
                      <button
                        onClick={handleTogglePushToTalk}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-orbitron font-bold flex items-center justify-center gap-2 transition-all ${
                          isRecordingPTT
                            ? 'bg-[#ff0055] text-white shadow-lg shadow-[#ff0055]/50 animate-pulse'
                            : 'bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black shadow-md shadow-[#00ff88]/30 hover:scale-[1.02] active:scale-95'
                        }`}
                      >
                        {isRecordingPTT ? (
                          <>
                            <Square className="w-4 h-4 fill-white" />
                            <span>{t('agent.tapToSend', 'TOCAR PARA ENVIAR VOZ')}</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            <span>{t('agent.touchToSpeak', 'TOCA PARA HABLAR (MIC DIRECTO)')}</span>
                          </>
                        )}
                      </button>

                      {/* Continuous Live Mode Button */}
                      <button
                        onClick={handleToggleLiveMode}
                        className={`py-2.5 px-3 rounded-xl text-xs font-orbitron font-bold transition-all ${
                          isLiveMode
                            ? 'bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/60 animate-pulse'
                            : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isLiveMode ? t('agent.continuousOn', '● EN VIVO ON') : t('agent.continuous', 'HABLA CONTINUA')}
                      </button>
                    </div>

                    {/* Quick Test Male Voice Button */}
                    <button
                      type="button"
                      onClick={handleTestMaleVoice}
                      className="w-full py-1.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-mono text-[11px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>🎙️ PROBAR VOZ NEURONAL DE ESTUDIO (STUDIO HD)</span>
                    </button>

                    {/* Real-time Equalizer Waveform bound to voice audio */}
                    <div className="flex items-center justify-center gap-1.5 py-1">
                      {waveHeights.map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${Math.min(h, 28)}px` }}
                          className={`w-1.5 rounded-full transition-all duration-75 ${
                            isRecordingPTT || (isLiveMode && liveState === 'recording')
                              ? 'bg-[#ff0055] shadow-sm shadow-[#ff0055]'
                              : isSpeaking
                              ? 'bg-[#00ff88] shadow-sm shadow-[#00ff88]'
                              : isProcessing
                              ? 'bg-amber-400'
                              : isLiveMode
                              ? 'bg-[#00ccff]'
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Live Mic Volume Intensity Meter */}
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                        <span className="flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-[#00ff88]" />
                          Entrada de Voz Micrófono:
                        </span>
                        <span className={`font-bold ${audioLevel > 10 ? 'text-[#00ff88]' : audioLevel > 2 ? 'text-amber-400' : 'text-slate-500'}`}>
                          {Math.round(audioLevel)}% {audioLevel > 5 ? '(Captando Voz)' : '(Silencio/En espera)'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-[#00ff88] via-cyan-400 to-[#ff0055] transition-all duration-75"
                          style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
                        />
                      </div>
                    </div>

                    {/* Direct Voice File Upload & Full Tab Launcher */}
                    <div className="pt-1 flex items-center justify-between gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono flex items-center justify-center gap-1.5 transition-all"
                        title="Subir cualquier nota de voz o archivo de audio"
                      >
                        <FileAudio className="w-3.5 h-3.5 text-[#00ff88]" />
                        <span>SUBIR NOTA DE VOZ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => window.open('https://ais-pre-kqko46hefzjxpxlwxzkgra-89447317841.us-east5.run.app', '_blank')}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 font-mono flex items-center justify-center gap-1.5 transition-all"
                        title="Abrir la app en pestaña completa para otorgar permiso directo al micrófono"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>ABRIR PESTAÑA FULL</span>
                      </button>
                    </div>

                    {/* Status & Transcription Stream */}
                    {interimStatusText && (
                      <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-left animate-pulse">
                        <span className="text-[11px] font-mono text-cyan-400 font-bold">
                          {interimStatusText}
                        </span>
                      </div>
                    )}

                    {/* Interrupt Button when Agent Speaks */}
                    {isSpeaking && (
                      <div className="p-2 rounded-xl bg-emerald-950/40 border border-[#00ff88]/30 flex items-center justify-between text-left">
                        <span className="text-[10px] font-mono text-[#00ff88] font-bold">
                          {t('agent.speaking', '🔊 QUANTUM AI HABLANDO...')}
                        </span>
                        <button
                          onClick={handleInterruptAgent}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-[10px] font-bold text-amber-300 hover:bg-amber-500/30"
                        >
                          {t('agent.interrupt', 'Interrumpir')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Scrollable Conversation Chat History */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[210px] p-2.5 rounded-2xl bg-black/40 border border-slate-800/80">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2 ${
                          msg.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-slate-800 border border-slate-700 text-slate-100 rounded-br-none'
                              : 'bg-[#0c1426] border border-[#00ff88]/40 text-white rounded-bl-none shadow-md shadow-[#00ff88]/10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className={`font-mono text-[9px] font-bold ${
                                msg.sender === 'user' ? 'text-cyan-400' : 'text-[#00ff88]'
                              }`}
                            >
                              {msg.sender === 'user' ? `${t('agent.you', 'TÚ')} (${memory.userName})` : 'QUANTUM AI'}
                              {msg.isVoice && ' 🎙️'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">
                              {msg.timestamp}
                            </span>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}

                    {isProcessing && (
                      <div className="flex items-start gap-2 justify-start">
                        <div className="p-2.5 rounded-2xl bg-[#0c1426] border border-[#00ff88]/40 text-xs text-[#00ff88] font-mono flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('agent.processing', 'Quantum AI escuchando y procesando tu voz...')}</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Smart Agent Navigation & Platform Suggestions */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-[#00ff88] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      <span>{t('agent.promptHeader', 'Navegación y Consultas del Agente Inteligente:')}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(language === 'es'
                        ? [
                            '🧭 ¿Cómo funciona Quantic Tube?',
                            '📺 Abrir Canal Cuántico',
                            '🎬 Ir al Feed de Videos',
                            '📱 Ver sección de Shorts',
                            '📤 Abrir panel para Subir Video',
                            '📖 Activar Modo 3D Book',
                            '📺 Poner Modo Quad-View',
                            '📸 Ver Galería de Fotos',
                            '📝 Ir a Muro de Posts',
                            '📻 Transmisiones Omni-Live',
                            '💬 Abrir Mensajes Directos',
                            '🎨 Abrir QuanticStudio IA',
                            '❓ ¿Qué es Cloudinary y cómo se usa?',
                            '⏰ Despiértame a las 7:30'
                          ]
                        : [
                            '🧭 How does Quantic Tube work?',
                            '🎬 Go to Video Feed',
                            '📱 Explore Shorts',
                            '📤 Open Upload Panel',
                            '📖 Switch to 3D Book Mode',
                            '📺 Open Quad-View',
                            '📸 View Photo Gallery',
                            '📝 Go to Community Posts',
                            '📻 Omni-Live Streams',
                            '💬 Open Direct Messages',
                            '🎨 Launch QuanticStudio AI',
                            '❓ What is Cloudinary & how to use it?',
                            '⏰ Wake me up at 7:30'
                          ]
                      ).map((cmd, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleExecuteText(cmd)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] transition-all font-mono ${
                            idx === 0
                              ? 'bg-[#00ff88]/15 border border-[#00ff88]/50 text-[#00ff88] hover:bg-[#00ff88]/25 font-semibold'
                              : 'bg-slate-900 border border-slate-800 hover:border-[#00ff88]/50 hover:bg-[#0f1627] text-slate-300 hover:text-white'
                          }`}
                        >
                          {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MEMORIZANTE (AGENDA, RECORDATORIOS Y DESPERTADOR) */}
              {activeTab === 'memory' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Perfil del Usuario & Despertador Cuántico */}
                  <div className="p-3.5 rounded-2xl bg-[#0b0f1d] border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/40">
                          <User className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <span className="text-[10px] text-slate-400 font-mono">{t('agent.userRemembered', 'USUARIO RECORDADO')}</span>
                          <h4 className="text-xs font-bold text-white font-orbitron">{memory.userName}</h4>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const promptMsg = language === 'es' ? '¿Cómo te gustaría que te llame?' : 'What name would you like me to call you?';
                          const newName = prompt(promptMsg, memory.userName);
                          if (newName && newName.trim()) {
                            quanticVoiceAgent.setUserName(newName.trim());
                            if (speechEnabled) quanticVoiceAgent.speak(language === 'es' ? `Listo, ahora te llamaré ${newName.trim()}.` : `All set, I will now call you ${newName.trim()}.`);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-300 hover:text-[#00ff88]"
                      >
                        {t('agent.changeName', 'Cambiar Nombre')}
                      </button>
                    </div>

                    {/* Despertador Cuántico con Video Musical */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#ff0055]" />
                          <div>
                            <span className="text-xs font-bold text-white font-orbitron">
                              {t('agent.alarm', 'DESPERTADOR CON VIDEO')}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {t('agent.alarmDesc', 'Te despertará con tu música favorita.')}
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={memory.alarmEnabled}
                          onChange={(e) => {
                            quanticVoiceAgent.setAlarm(memory.alarmTime, e.target.checked);
                            if (speechEnabled) {
                              quanticVoiceAgent.speak(
                                e.target.checked
                                  ? (language === 'es' ? `Despertador activado para las ${memory.alarmTime}.` : `Alarm set for ${memory.alarmTime}.`)
                                  : (language === 'es' ? 'Despertador desactivado.' : 'Alarm disabled.')
                              );
                            }
                          }}
                          className="w-4 h-4 accent-[#00ff88] cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={memory.alarmTime}
                          onChange={(e) => quanticVoiceAgent.setAlarm(e.target.value, memory.alarmEnabled)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                        />
                        <button
                          onClick={handleSetCurrentAsFavorite}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-purple-950/60 border border-purple-500/40 text-[10px] text-purple-200 hover:bg-purple-900/60 truncate"
                          title="Fijar video activo como tu música de despertar"
                        >
                          {t('agent.setFavorite', '🎵 Fijar Video Activo como Favorito')}
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-400 truncate font-mono">
                        {language === 'es' ? 'Favorito:' : 'Favorite:'} <span className="text-[#00ff88]">{memory.favoriteVideoTitle}</span>
                      </p>
                    </div>
                  </div>

                  {/* Formulario para Agregar Tarea / Recordatorio */}
                  <form onSubmit={handleCreateTask} className="p-3 rounded-2xl bg-[#0b0f1d] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-orbitron flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-[#00ff88]" /> {t('agent.addTask', 'AGREGAR AL MEMORIZANTE')}
                      </span>
                      <select
                        value={newTaskCategory}
                        onChange={(e) => setNewTaskCategory(e.target.value as any)}
                        className="bg-slate-900 text-[10px] text-slate-300 border border-slate-700 rounded-md p-1"
                      >
                        <option value="tarea">{language === 'es' ? 'Tarea' : 'Task'}</option>
                        <option value="recordatorio">{language === 'es' ? 'Recordatorio' : 'Reminder'}</option>
                        <option value="alarma">{language === 'es' ? 'Alarma' : 'Alarm'}</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder={t('agent.taskTitlePlaceholder', 'Ej: Ver nuevo video de Veo 3.1 o revisar notas...')}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ff88]"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="datetime-local"
                        value={newTaskDate}
                        onChange={(e) => setNewTaskDate(e.target.value)}
                        className="flex-1 p-1.5 bg-slate-900 border border-slate-700 rounded-xl text-[11px] text-slate-300 font-mono"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-[#00ff88] text-black font-orbitron font-bold text-xs hover:bg-[#00e67a]"
                      >
                        {t('agent.annotate', 'Anotar')}
                      </button>
                    </div>
                  </form>

                  {/* Lista de Tareas y Recordatorios Guardados */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{language === 'es' ? `TAREAS EN MEMORIA (${memory.tasks.length})` : `TASKS IN MEMORY (${memory.tasks.length})`}</span>
                      <span>{language === 'es' ? 'FECHA' : 'DATE'}</span>
                    </div>

                    {memory.tasks.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                        {language === 'es' ? 'No hay tareas pendientes en el memorizante.' : 'No pending tasks in memory notebook.'}
                      </div>
                    ) : (
                      memory.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 ${
                            task.completed
                              ? 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                              : 'bg-[#0b0e1a] border-slate-800 hover:border-[#00ff88]/40'
                          }`}
                        >
                          <button
                            onClick={() => quanticVoiceAgent.toggleTaskCompletion(task.id)}
                            className="mt-0.5 text-slate-400 hover:text-[#00ff88]"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                              <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                                {task.category.toUpperCase()}
                              </span>
                              <span>
                                {task.datetime ? new Date(task.datetime).toLocaleString(language === 'es' ? 'es-MX' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }) : (language === 'es' ? 'Sin fecha' : 'No date')}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => quanticVoiceAgent.deleteTask(task.id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PROBADOR DE MICRÓFONO & LECTOR DE ESPECTRO */}
              {activeTab === 'tester' && (
                <div className="flex-1 overflow-y-auto p-3.5">
                  <VoiceSpectrumTester
                    onStartChat={() => setActiveTab('voice')}
                    language={language}
                  />
                </div>
              )}
              <div className="p-3 bg-[#0a0d18] border-t border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteText(inputText);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`${t('agent.inputPlaceholder', 'Habla o escribe a Quantum AI...')} (${memory.userName})`}
                    className="flex-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ff88]"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl border bg-slate-900 border-slate-700 text-slate-300 hover:text-[#00ff88] transition-all"
                    title="Subir nota de voz o archivo de audio (.mp3, .wav, .m4a, .webm)"
                  >
                    <Upload className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleTogglePushToTalk}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isRecordingPTT
                        ? 'bg-[#ff0055] text-white border-[#ff0055] animate-pulse shadow-lg shadow-[#ff0055]/50'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-[#00ff88]'
                    }`}
                    title={isRecordingPTT ? t('agent.tapToSend', 'Tocar para enviar voz') : t('agent.touchToSpeak', 'Tocar para hablar por micrófono')}
                  >
                    {isRecordingPTT ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 rounded-xl bg-[#00ff88] text-black font-bold hover:bg-[#00e67a] disabled:opacity-40 transition-opacity"
                    title="Enviar mensaje escrito"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
