import { AgentMemory, TaskReminder, VideoItem } from '../types';
import { getGeminiClient, processAudioWithGemini } from './geminiService';

const MEMORY_STORAGE_KEY = 'quantictube_agent_memory_v1';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  isVoice?: boolean;
}

export interface CommandAction {
  type:
    | 'CHANGE_TAB'
    | 'PLAY_VIDEO'
    | 'TOGGLE_PLAY'
    | 'TOGGLE_MUTE'
    | 'OPEN_STUDIO'
    | 'OPEN_ASSISTANT'
    | 'OPEN_CREATE'
    | 'OPEN_HOW_TO_USE'
    | 'OPEN_POLICIES'
    | 'OPEN_ABOUT'
    | 'OPEN_AUTH'
    | 'OPEN_CHANNEL'
    | 'FILTER_CATEGORY'
    | 'SEARCH'
    | 'LIKE_VIDEO'
    | 'TRIGGER_REACTION'
    | 'TOGGLE_DRAWING'
    | 'CLEAR_DRAWING'
    | 'SET_ALARM'
    | 'ADD_REMINDER'
    | 'SET_USER_NAME'
    | 'SET_FAVORITE_VIDEO'
    | 'SPEAK_INFO'
    | 'NONE';
  payload?: any;
  speechResponse: string;
}

// Default memory state
export const DEFAULT_MEMORY: AgentMemory = {
  userName: 'Memo',
  favoriteVideoId: 'vid-2',
  favoriteVideoTitle: 'Mariachi Synthwave: Concierto en Vivo en el Zócalo Holográfico',
  alarmTime: '07:30',
  alarmEnabled: false,
  tasks: [
    {
      id: 'task-1',
      title: 'Explorar videos generados con IA Veo 3.1 en QuanticStudio',
      datetime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      completed: false,
      notified: false,
      category: 'tarea'
    },
    {
      id: 'task-2',
      title: 'Conectarse a la transmisión cuántica en Omni-Live con la comunidad',
      datetime: new Date(Date.now() + 7200000).toISOString().slice(0, 16),
      completed: false,
      notified: false,
      category: 'recordatorio'
    }
  ],
  notes: [
    'Le gusta la música mariachi synthwave y los videos en 4K.',
    'Prefiere interactuar con comentarios espaciales neón.'
  ]
};

// Subtle Web Audio Chime for Quantum AI Connected connect/disconnect
export function playLiveChime(type: 'connect' | 'disconnect') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'connect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.08); // C#5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.18); // E5
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.33);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(440.0, now + 0.16);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.29);
    }
  } catch (e) {}
}

class VoiceAgentEngine {
  private memory: AgentMemory = DEFAULT_MEMORY;
  private synth: SpeechSynthesis | null = null;
  private warmVoice: SpeechSynthesisVoice | null = null;
  private timerInterval: any = null;
  private onMemoryChangeCallbacks: ((mem: AgentMemory) => void)[] = [];
  private onActionCallbacks: ((action: CommandAction) => void)[] = [];
  private onAlarmTriggerCallbacks: ((video: { id: string; title: string }) => void)[] = [];
  private onReminderTriggerCallbacks: ((task: TaskReminder) => void)[] = [];
  private onChatMessagesCallbacks: ((messages: ChatMessageItem[]) => void)[] = [];

  // Chat conversation messages
  private chatMessages: ChatMessageItem[] = [
    {
      id: 'init-1',
      sender: 'agent',
      text: '¡Hola! Soy Quantum AI, tu Agente Inteligente y Navegador Oficial de QuanticTube. Puedo llevarte a cualquier sección (Feed, Shorts, 3D Book, Quad-View, Subir Videos, Mensajes) y responder cualquier duda que tengas sobre todo lo que contiene la página. ¿Hacia dónde te gustaría ir o qué deseas explorar?',
      timestamp: 'Ahora'
    }
  ];

  // Direct Audio Capture & VAD (Voice Activity Detection) Engine
  private isLiveActive = false;
  private isRecording = false;
  private isSpeaking = false;
  private isProcessing = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private localAudioStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private vadInterval: any = null;
  private silenceTimer: any = null;
  private speechDetectedInChunk = false;
  private parallelRecognition: any = null;
  private capturedSpeechText = '';
  private speechRecognitionDisabled = false;

  private conversationHistory: { role: 'user' | 'model'; text: string }[] = [];
  private liveCallbacks: {
    onInterimText?: (text: string) => void;
    onStateChange?: (state: 'listening' | 'recording' | 'speaking' | 'processing' | 'idle') => void;
    onFinalTurn?: (userText: string, action: CommandAction) => void;
    onAudioLevel?: (level: number) => void;
  } = {};
  private liveCurrentVideos: VideoItem[] = [];

  constructor() {
    this.loadMemory();
    if (typeof window !== 'undefined') {
      this.initSpeechSynthesis();
      this.startReminderWatcher();
    }
  }

  // --- MEMORY MANAGEMENT ---
  public loadMemory(): AgentMemory {
    if (typeof window === 'undefined') return DEFAULT_MEMORY;
    try {
      const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (raw) {
        this.memory = { ...DEFAULT_MEMORY, ...JSON.parse(raw) };
      } else {
        this.memory = { ...DEFAULT_MEMORY };
        this.saveMemory();
      }
    } catch (e) {
      this.memory = { ...DEFAULT_MEMORY };
    }
    return this.memory;
  }

  public saveMemory() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.memory));
      this.notifyMemoryChange();
    } catch (e) {}
  }

  public getMemory(): AgentMemory {
    return this.memory;
  }

  public setUserName(name: string) {
    this.memory.userName = name.trim();
    this.saveMemory();
  }

  public setFavoriteVideo(id: string, title: string) {
    this.memory.favoriteVideoId = id;
    this.memory.favoriteVideoTitle = title;
    this.saveMemory();
  }

  public setAlarm(time: string, enabled: boolean) {
    this.memory.alarmTime = time;
    this.memory.alarmEnabled = enabled;
    this.saveMemory();
  }

  public addTask(title: string, datetime: string, category: 'tarea' | 'recordatorio' | 'alarma' = 'tarea'): TaskReminder {
    const newTask: TaskReminder = {
      id: `task-${Date.now()}`,
      title,
      datetime,
      completed: false,
      notified: false,
      category
    };
    this.memory.tasks = [newTask, ...this.memory.tasks];
    this.saveMemory();
    return newTask;
  }

  public toggleTaskCompletion(taskId: string) {
    this.memory.tasks = this.memory.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    this.saveMemory();
  }

  public deleteTask(taskId: string) {
    this.memory.tasks = this.memory.tasks.filter((t) => t.id !== taskId);
    this.saveMemory();
  }

  // --- CHAT MESSAGES MANAGEMENT ---
  public getChatMessages(): ChatMessageItem[] {
    return this.chatMessages;
  }

  public addChatMessage(sender: 'user' | 'agent', text: string, isVoice = false) {
    const msg: ChatMessageItem = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      isVoice
    };
    this.chatMessages = [...this.chatMessages, msg];
    if (this.chatMessages.length > 50) {
      this.chatMessages = this.chatMessages.slice(-50);
    }
    this.onChatMessagesCallbacks.forEach((cb) => cb(this.chatMessages));
  }

  public onChatMessagesChange(callback: (messages: ChatMessageItem[]) => void): () => void {
    this.onChatMessagesCallbacks.push(callback);
    callback(this.chatMessages);
    return () => {
      this.onChatMessagesCallbacks = this.onChatMessagesCallbacks.filter((cb) => cb !== callback);
    };
  }

  // --- PERSONALIZED SCHEDULED GREETING ---
  public generatePersonalizedGreeting(detectedName: string, lang: 'es' | 'en' = 'es'): string {
    const hour = new Date().getHours();
    const cleanName = detectedName.trim() || this.memory.userName || 'Memo';

    if (lang === 'es') {
      let timeGreeting = 'buenos días';
      if (hour >= 12 && hour < 19) {
        timeGreeting = 'buenas tardes';
      } else if (hour >= 19 || hour < 5) {
        timeGreeting = 'buenas noches';
      }
      return `¡Hola, ${timeGreeting}, ${cleanName}! Soy Quantum AI, tu Agente Inteligente de QuanticTube. Puedo guiarte y navegar a cualquier sección de la página, o responderte cualquier duda de la plataforma. ¿Hacia dónde te gustaría ir o qué deseas explorar hoy?`;
    } else {
      let timeGreeting = 'good morning';
      if (hour >= 12 && hour < 19) {
        timeGreeting = 'good afternoon';
      } else if (hour >= 19 || hour < 5) {
        timeGreeting = 'good evening';
      }
      return `Hello, ${timeGreeting}, ${cleanName}! I am Quantum AI, your Intelligent Agent & Navigator for QuanticTube. I can guide you to any section of the platform and answer questions about all features. Where would you like to navigate or explore today?`;
    }
  }

  public greetUser(detectedName: string, lang: 'es' | 'en' = 'es', speakAloud: boolean = true): string {
    const cleanName = detectedName.trim() || this.memory.userName || 'Memo';
    this.setUserName(cleanName);
    const greeting = this.generatePersonalizedGreeting(cleanName, lang);
    this.addChatMessage('agent', greeting, false);
    if (speakAloud) {
      this.speak(greeting);
    }
    return greeting;
  }

  // Subscriptions
  public onMemoryChange(callback: (mem: AgentMemory) => void): () => void {
    this.onMemoryChangeCallbacks.push(callback);
    return () => {
      this.onMemoryChangeCallbacks = this.onMemoryChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onAction(callback: (action: CommandAction) => void): () => void {
    this.onActionCallbacks.push(callback);
    return () => {
      this.onActionCallbacks = this.onActionCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onAlarmTrigger(callback: (video: { id: string; title: string }) => void): () => void {
    this.onAlarmTriggerCallbacks.push(callback);
    return () => {
      this.onAlarmTriggerCallbacks = this.onAlarmTriggerCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onReminderTrigger(callback: (task: TaskReminder) => void): () => void {
    this.onReminderTriggerCallbacks.push(callback);
    return () => {
      this.onReminderTriggerCallbacks = this.onReminderTriggerCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyMemoryChange() {
    this.onMemoryChangeCallbacks.forEach((cb) => cb(this.memory));
  }

  // --- ULTRA-REALISTIC MALE SPEECH SYNTHESIS ---
  private initSpeechSynthesis() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      const setVoice = () => {
        if (!this.synth) return;
        const voices = this.synth.getVoices();
        const spanishVoices = voices.filter(
          (v) => v.lang.startsWith('es') || v.lang.includes('ES') || v.lang.includes('MX') || v.lang.includes('US')
        );

        const femaleNames = [
          'paulina', 'monica', 'helena', 'sabina', 'lucia', 'rosa',
          'elena', 'conchita', 'mia', 'sofia', 'victoria', 'zira',
          'female', 'laura', 'marta', 'penelope', 'carmen', 'francisca',
          'paloma', 'hilda', 'elvira', 'lupe', 'soledad', 'teresa'
        ];
        const maleSpanishVoices = spanishVoices.filter(
          (v) => !femaleNames.some((f) => v.name.toLowerCase().includes(f))
        );

        const preferredMale = maleSpanishVoices.find(
          (v) =>
            v.name.includes('Natural') ||
            v.name.includes('Neural') ||
            v.name.includes('Jorge') ||
            v.name.includes('Alvaro') ||
            v.name.includes('Diego') ||
            v.name.includes('Pablo') ||
            v.name.includes('Raul') ||
            v.name.includes('Carlos') ||
            v.name.includes('Manuel') ||
            v.name.includes('Andres') ||
            v.name.includes('Google') ||
            v.name.includes('Mateo')
        );

        this.warmVoice = preferredMale || maleSpanishVoices[0] || spanishVoices[0] || voices[0] || null;
      };

      setVoice();
      if (this.synth && this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = setVoice;
      }
    }
  }

  public async speak(text: string, onEnd?: () => void): Promise<void> {
    const cleanText = text.replace(/[*#_`]/g, '').trim();
    if (!cleanText) {
      onEnd?.();
      return;
    }

    this.stopSpeaking();
    this.isSpeaking = true;
    this.liveCallbacks.onStateChange?.('speaking');

    let hasFinished = false;
    const finishSpeaking = () => {
      if (hasFinished) return;
      hasFinished = true;
      this.isSpeaking = false;
      this.currentAudioElement = null;
      this.liveCallbacks.onStateChange?.(this.isLiveActive ? 'recording' : 'idle');
      onEnd?.();

      // In continuous live mode, safely reopen mic listening after TTS acoustic echo clears
      if (this.isLiveActive) {
        setTimeout(() => {
          if (this.isLiveActive && !this.isSpeaking) {
            this.startContinuousRecordingCycle();
          }
        }, 700);
      }
    };

    // Priority 1: High-Fidelity Studio Neural Male Voice (Studio Neural HD)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7500);

      const res = await fetch('/api/gemini/speak-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
          this.currentAudioElement = audio;
          audio.onended = () => finishSpeaking();
          audio.onerror = () => {
            this.fallbackWebSpeech(cleanText, finishSpeaking);
          };

          try {
            await audio.play();
            return;
          } catch (_playErr) {
            this.fallbackWebSpeech(cleanText, finishSpeaking);
            return;
          }
        }
      }
    } catch (_err) {
      // Offline, transient timeout, or error -> fallback to local browser speech synthesis
    }

    // Priority 2: Local Web Speech Synthesis with warm baritone pitch
    this.fallbackWebSpeech(cleanText, finishSpeaking);
  }

  private fallbackWebSpeech(cleanText: string, onFinished: () => void) {
    if (!this.synth || typeof window === 'undefined') {
      onFinished();
      return;
    }

    try {
      this.synth.cancel();
      if (typeof this.synth.resume === 'function') {
        this.synth.resume();
      }
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-MX';
    if (this.warmVoice) {
      utterance.voice = this.warmVoice;
    }
    // Deep warm baritone voice tuning
    utterance.pitch = 0.88;
    utterance.rate = 0.96;
    utterance.volume = 1.0;

    utterance.onend = onFinished;
    utterance.onerror = onFinished;

    const maxDuration = Math.max(3000, cleanText.length * 85);
    setTimeout(() => {
      if (this.isSpeaking) {
        onFinished();
      }
    }, maxDuration);

    try {
      this.synth.speak(utterance);
    } catch (e) {
      onFinished();
    }
  }

  public stopSpeaking() {
    this.isSpeaking = false;
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (e) {}
      this.currentAudioElement = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
  }

  // --- NATIVE DIRECT MICROPHONE & AUDIO CAPTURE ENGINE ---
  private async ensureMicrophoneStream(forceRefresh = false): Promise<MediaStream | null> {
    if (!forceRefresh && this.localAudioStream && this.localAudioStream.active && this.localAudioStream.getAudioTracks().some(t => t.readyState === 'live')) {
      return this.localAudioStream;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return null;
    }
    try {
      if (this.localAudioStream) {
        try {
          this.localAudioStream.getTracks().forEach((track) => track.stop());
        } catch (e) {}
        this.localAudioStream = null;
      }
      try {
        this.localAudioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (advancedErr) {
        // Fallback to basic audio constraint if strict constraints fail
        this.localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      this.initAudioAnalyser(this.localAudioStream);
      return this.localAudioStream;
    } catch (err) {
      console.warn('Microphone access request failed:', err);
      return null;
    }
  }

  private initAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
      source.connect(this.analyserNode);
    } catch (e) {}
  }

  // Push-to-Talk / Direct Voice Recording
  public async startPushToTalk(
    onAudioLevel?: (level: number) => void,
    onInterimText?: (text: string) => void
  ): Promise<boolean> {
    const stream = await this.ensureMicrophoneStream(true);
    if (!stream) return false;

    this.audioChunks = [];
    this.capturedSpeechText = '';
    this.isRecording = true;
    if (onInterimText) {
      this.liveCallbacks.onInterimText = onInterimText;
    }

    // Start parallel browser speech recognition as extra booster
    this.startParallelRecognition();

    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      this.mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100);

      // Volume monitoring loop
      if (this.vadInterval) clearInterval(this.vadInterval);
      const dataArray = new Uint8Array(this.analyserNode?.frequencyBinCount || 32);

      this.vadInterval = setInterval(() => {
        if (!this.isRecording || !this.analyserNode) return;
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        onAudioLevel?.(avg);
      }, 80);

      return true;
    } catch (e) {
      this.isRecording = false;
      return false;
    }
  }

  public async stopPushToTalk(): Promise<{ transcript: string; reply: string; action: CommandAction } | null> {
    this.stopParallelRecognition();
    if (this.vadInterval) clearInterval(this.vadInterval);
    this.isRecording = false;

    return new Promise((resolve) => {
      const handleAudioProcessing = async () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm'
        });
        this.audioChunks = [];

        let userTranscript = this.capturedSpeechText.trim();
        let aiResponseText = '';

        if (!userTranscript && audioBlob.size > 100) {
          const base64Audio = await this.blobToBase64(audioBlob);
          const userName = this.memory.userName || 'Memo';
          const result = await processAudioWithGemini(
            base64Audio,
            audioBlob.type,
            userName
          );
          userTranscript = result.userTranscript;
          aiResponseText = result.aiResponse;
        }

        if (!userTranscript) {
          userTranscript = 'Hola Quantum AI';
        }

        // Add user voice transcript to chat
        this.addChatMessage('user', userTranscript, true);

        // Process through intelligent command router
        const action = await this.processUserInput(userTranscript, this.liveCurrentVideos);
        const finalReply = action.speechResponse || aiResponseText;
        action.speechResponse = finalReply;

        // Add agent response to chat
        this.addChatMessage('agent', finalReply, false);

        if (action.type !== 'NONE') {
          this.onActionCallbacks.forEach((cb) => cb(action));
        }

        // Speak aloud with charismatic male voice
        await this.speak(finalReply);

        resolve({
          transcript: userTranscript,
          reply: finalReply,
          action
        });
      };

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          handleAudioProcessing();
        };
        try {
          this.mediaRecorder.stop();
        } catch (e) {
          handleAudioProcessing();
        }
      } else {
        handleAudioProcessing();
      }
    });
  }

  // --- CONTINUOUS LIVE VOICE CONVERSATION ENGINE ---
  public async startLiveSession(
    callbacks: {
      onInterimText?: (text: string) => void;
      onStateChange?: (state: 'listening' | 'recording' | 'speaking' | 'processing' | 'idle') => void;
      onFinalTurn?: (userText: string, action: CommandAction) => void;
      onAudioLevel?: (level: number) => void;
    },
    currentVideos: VideoItem[]
  ) {
    this.isLiveActive = true;
    this.liveCallbacks = callbacks;
    this.liveCurrentVideos = currentVideos;

    if (this.synth) {
      try {
        this.synth.cancel();
        if (typeof this.synth.resume === 'function') {
          this.synth.resume();
        }
      } catch (e) {}
    }

    const stream = await this.ensureMicrophoneStream(true);
    if (!stream) {
      alert('Por favor autoriza el acceso al micrófono para hablar en tiempo real con Quantum AI.');
      this.stopLiveSession();
      return;
    }

    playLiveChime('connect');
    this.startContinuousRecordingCycle();
  }

  private cycleStartTime = 0;

  private startContinuousRecordingCycle() {
    if (!this.isLiveActive || this.isSpeaking || !this.localAudioStream) return;

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    this.cycleStartTime = Date.now();
    this.audioChunks = [];
    this.capturedSpeechText = '';
    this.speechDetectedInChunk = false;
    this.liveCallbacks.onStateChange?.('listening');
    this.liveCallbacks.onInterimText?.('🟢 Quantum AI escuchando tu voz... (habla libremente)');

    this.startParallelRecognition();

    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.localAudioStream, { mimeType })
        : new MediaRecorder(this.localAudioStream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100);

      // Real-time Voice Activity Detection (VAD) watcher with ultra-sensitive threshold for hands-free mode
      if (this.vadInterval) clearInterval(this.vadInterval);
      const dataArray = new Uint8Array(this.analyserNode?.frequencyBinCount || 32);
      let lastSpokenText = '';
      let speechStartTime = 0;

      this.vadInterval = setInterval(() => {
        if (!this.isLiveActive || this.isSpeaking) return;

        const isWarmingUp = Date.now() - this.cycleStartTime < 650;

        let avg = 0;
        if (this.analyserNode && !isWarmingUp) {
          this.analyserNode.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          avg = sum / dataArray.length;
          this.liveCallbacks.onAudioLevel?.(avg);
        }

        // Voice activity detection: user is making sound or text is actively arriving
        const isSoundPresent = !isWarmingUp && avg > 3.0;
        const currentText = this.capturedSpeechText.trim();
        const hasNewSpeechText = currentText.length > 0 && currentText !== lastSpokenText;
        if (hasNewSpeechText) {
          lastSpokenText = currentText;
        }

        const isActivelyTalking = isSoundPresent || hasNewSpeechText;

        if (isActivelyTalking) {
          this.speechDetectedInChunk = true;
          if (speechStartTime === 0) speechStartTime = Date.now();
          this.liveCallbacks.onStateChange?.('recording');
          this.liveCallbacks.onInterimText?.(
            currentText ? `🎙️ "${currentText}"` : '🎙️ Escuchando tu voz... (habla libremente)'
          );
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
          // Max turn length protection: if speaking for more than 7 seconds, auto-finish turn
          if (Date.now() - speechStartTime > 7000) {
            this.finishContinuousTurn();
          }
        } else if (this.speechDetectedInChunk && !this.silenceTimer) {
          // User finished speaking and paused for 900ms -> auto-process turn
          this.silenceTimer = setTimeout(() => {
            if (this.isLiveActive && !this.isSpeaking && this.speechDetectedInChunk) {
              this.finishContinuousTurn();
            }
          }, 900);
        }
      }, 80);
    } catch (e) {
      console.warn('Continuous recording cycle error:', e);
    }
  }

  private async finishContinuousTurn() {
    if (this.vadInterval) clearInterval(this.vadInterval);
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = null;

    const speechText = this.capturedSpeechText.trim();
    this.stopParallelRecognition();

    this.liveCallbacks.onStateChange?.('processing');
    this.liveCallbacks.onInterimText?.('🧠 Quantum AI procesando tu voz...');

    let audioBlob: Blob | null = null;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        await new Promise<void>((resolve) => {
          if (!this.mediaRecorder) {
            resolve();
            return;
          }
          this.mediaRecorder.onstop = () => {
            if (this.audioChunks.length > 0) {
              audioBlob = new Blob(this.audioChunks, {
                type: this.mediaRecorder?.mimeType || 'audio/webm'
              });
            }
            this.audioChunks = [];
            resolve();
          };
          this.mediaRecorder.stop();
        });
      } catch (e) {
        console.warn('Error stopping MediaRecorder in continuous turn:', e);
      }
    }

    let userTranscript = speechText;
    let aiResponseText = '';

    if (!userTranscript && audioBlob && (audioBlob as Blob).size > 200) {
      try {
        const base64Audio = await this.blobToBase64(audioBlob);
        const userName = this.memory.userName || 'Memo';

        const result = await processAudioWithGemini(
          base64Audio,
          (audioBlob as Blob).type,
          userName
        );
        userTranscript = result.userTranscript;
        aiResponseText = result.aiResponse;
      } catch (err) {
        console.warn('Audio processing fallback failed:', err);
      }
    }

    if (!userTranscript) {
      if (this.speechDetectedInChunk) {
        userTranscript = 'Hola Quantum AI';
      } else {
        // Recycle back to continuous listening smoothly!
        if (this.isLiveActive && !this.isSpeaking) {
          setTimeout(() => {
            if (this.isLiveActive && !this.isSpeaking) {
              this.startContinuousRecordingCycle();
            }
          }, 300);
        }
        return;
      }
    }

    this.addChatMessage('user', userTranscript, true);

    const action = await this.processUserInput(userTranscript, this.liveCurrentVideos);
    const finalReply = action.speechResponse || aiResponseText;
    action.speechResponse = finalReply;

    this.addChatMessage('agent', finalReply, false);

    if (action.type !== 'NONE') {
      this.onActionCallbacks.forEach((cb) => cb(action));
    }

    this.liveCallbacks.onFinalTurn?.(userTranscript, action);

    // Speak answer with realistic male voice
    await this.speak(finalReply);
  }

  public stopLiveSession() {
    this.isLiveActive = false;
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    if (this.vadInterval) clearInterval(this.vadInterval);
    this.silenceTimer = null;
    this.vadInterval = null;
    this.stopParallelRecognition();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }

    if (this.localAudioStream) {
      try {
        this.localAudioStream.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      this.localAudioStream = null;
    }

    this.stopSpeaking();
    playLiveChime('disconnect');
    this.liveCallbacks.onStateChange?.('idle');
    this.liveCallbacks.onInterimText?.('');
  }

  public isLiveSessionActive(): boolean {
    return this.isLiveActive;
  }

  private startParallelRecognition() {
    if (this.speechRecognitionDisabled || typeof window === 'undefined') return;
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      this.stopParallelRecognition();

      const rec = new SpeechRecognition();
      rec.lang = 'es-MX';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const clean = fullTranscript.trim();
        if (clean) {
          this.capturedSpeechText = clean;
          this.speechDetectedInChunk = true;
          this.liveCallbacks.onInterimText?.(`🎙️ "${clean}"`);
        }
      };

      rec.onerror = (e: any) => {
        // Silently handle browser speech recognition network/permission limitations without spamming
        if (e?.error === 'network' || e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
          this.speechRecognitionDisabled = true;
          this.stopParallelRecognition();
        }
      };

      rec.onend = () => {
        if (this.speechRecognitionDisabled) return;
        if ((this.isRecording || this.isLiveActive) && !this.isSpeaking && this.parallelRecognition === rec) {
          setTimeout(() => {
            if (!this.speechRecognitionDisabled && (this.isRecording || this.isLiveActive) && !this.isSpeaking) {
              try {
                rec.start();
              } catch (_err) {
                this.speechRecognitionDisabled = true;
                this.stopParallelRecognition();
              }
            }
          }, 400);
        }
      };

      this.parallelRecognition = rec;
      try {
        rec.start();
      } catch (_err) {
        this.speechRecognitionDisabled = true;
      }
    } catch (_e) {}
  }

  private stopParallelRecognition() {
    if (this.parallelRecognition) {
      try {
        this.parallelRecognition.stop();
      } catch (e) {}
      this.parallelRecognition = null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  // --- REMINDERS & ALARM WATCHER ---
  private startReminderWatcher() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const now = new Date();
      const currentHours = ('0' + now.getHours()).slice(-2);
      const currentMinutes = ('0' + now.getMinutes()).slice(-2);
      const currentTimeString = `${currentHours}:${currentMinutes}`;
      const nowISO = now.toISOString().slice(0, 16);

      if (this.memory.alarmEnabled && this.memory.alarmTime === currentTimeString) {
        const lastAlarmDate = (this.memory as any)._lastAlarmTriggerDate;
        const todayStr = now.toDateString();
        if (lastAlarmDate !== todayStr) {
          (this.memory as any)._lastAlarmTriggerDate = todayStr;
          this.triggerAlarm();
        }
      }

      this.memory.tasks.forEach((task) => {
        if (!task.completed && !task.notified && task.datetime) {
          if (task.datetime <= nowISO) {
            task.notified = true;
            this.saveMemory();
            this.triggerReminder(task);
          }
        }
      });
    }, 10000);
  }

  private triggerAlarm() {
    const greeting = `¡Buenos días ${this.memory.userName}! Son las ${this.memory.alarmTime}. Es hora de despertar con tu video favorito: ${this.memory.favoriteVideoTitle}. ¡Que tengas un día grandioso!`;
    this.speak(greeting);
    this.onAlarmTriggerCallbacks.forEach((cb) =>
      cb({
        id: this.memory.favoriteVideoId,
        title: this.memory.favoriteVideoTitle
      })
    );
  }

  private triggerReminder(task: TaskReminder) {
    const message = `Hola ${this.memory.userName}, tienes un recordatorio programado para este momento: "${task.title}".`;
    this.speak(message);
    this.onReminderTriggerCallbacks.forEach((cb) => cb(task));
  }

  public getTimeAndDate(): string {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const dateStr = now.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `Son las ${timeStr} del ${dateStr}.`;
  }

  public getWeather(): string {
    return `El clima actual reporta 23 grados centígrados, cielo despejado, atmósfera cuántica óptima y brisa agradable con visibilidad perfecta.`;
  }

  public getLatestNews(): string {
    return `Noticias de QuanticTube: El motor de IA Veo 3.1 estrenó nuevos canales en 4K, la galería de fotos cuánticas y el hub de GIFs ya están disponibles para toda la comunidad.`;
  }

  public getTrendingTopics(): string {
    return `Tendencias en QuanticTube: #QuantumAI, #Veo3, Mariachi Synthwave en el Zócalo Holográfico y los nuevos comentarios fijados en pantalla.`;
  }

  // --- COMMAND INTERPRETER & INTELLIGENT ROUTER ---
  public async processUserInput(
    rawText: string,
    currentVideos: VideoItem[]
  ): Promise<CommandAction> {
    const text = rawText.trim().toLowerCase();
    const userName = this.memory.userName || 'Memo';

    // 1. Creator Query -> MANDATORY EXACT RESPONSE
    const isCreatorQuery =
      text.includes('creador') ||
      text.includes('creo') ||
      text.includes('creó') ||
      text.includes('hizo') ||
      text.includes('desarroll') ||
      text.includes('invento') ||
      text.includes('inventó') ||
      text.includes('constru') ||
      text.includes('program') ||
      text.includes('quién eres tú') ||
      text.includes('de quién es') ||
      text.includes('de quien es') ||
      text.includes('who created') ||
      text.includes('who made') ||
      text.includes('who built');

    if (isCreatorQuery) {
      const speech = `El Creador de esta pagina es Guillermo Lopez, el gran Inventor, Escritor, Desarrollador, Innovador, Pintor, Escultor, Editor, y Empresario Emprendedor, el fue quien con su conocimiento en desarrollo Web, desarrollo esta innovadora, sofisticada y futurista pagina, empoderada con la mejor y mas poderosa IA de Google.`;
      return { type: 'NONE', speechResponse: speech };
    }

    if (text.includes('me llamo ') || text.includes('mi nombre es ') || text.includes('llámame ')) {
      const match = text.match(/(?:me llamo|mi nombre es|llámame)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
      const newName = match ? match[1] : 'Creador';
      this.setUserName(newName);
      const speech = `¡Un gusto saludarte ${newName}! A partir de ahora te llamaré ${newName}. ¿Qué te gustaría explorar hoy en QuanticTube?`;
      return { type: 'SET_USER_NAME', payload: newName, speechResponse: speech };
    }

    if (
      text === 'hola' ||
      text.startsWith('hola ') ||
      text.includes('buenos días') ||
      text.includes('buenas tardes') ||
      text.includes('buenas noches') ||
      text.includes('salúdame') ||
      text.includes('qué onda') ||
      text.includes('quiúbole')
    ) {
      const speech = `¡Hola ${userName}! Es un gusto hablar contigo en vivo y en directo. Aquí estoy listo para reproducir videos, platicar de lo que quieras o ayudarte en la plataforma. ¿Qué se te antoja hacer hoy?`;
      return { type: 'NONE', speechResponse: speech };
    }

    if (text.includes('hora') || text.includes('fecha') || text.includes('qué día es') || text.includes('tiempo es')) {
      const info = this.getTimeAndDate();
      const speech = `${userName}, ${info}`;
      return { type: 'SPEAK_INFO', payload: info, speechResponse: speech };
    }

    if (text.includes('clima') || text.includes('temperatura') || text.includes('hace calor') || text.includes('hace frío') || text.includes('llover')) {
      const weather = this.getWeather();
      const speech = `${userName}, ${weather}`;
      return { type: 'SPEAK_INFO', payload: weather, speechResponse: speech };
    }

    if (text.includes('noticia') || text.includes('noticias') || text.includes('novedades')) {
      const news = this.getLatestNews();
      const speech = `${userName}, aquí tienes las noticias: ${news}`;
      return { type: 'SPEAK_INFO', payload: news, speechResponse: speech };
    }

    if (text.includes('tendencia') || text.includes('tendencias') || text.includes('viral') || text.includes('trending') || text.includes('populares')) {
      const trends = this.getTrendingTopics();
      const speech = `${userName}, ${trends}`;
      return { type: 'SPEAK_INFO', payload: trends, speechResponse: speech };
    }

    if (text.includes('alarma') || text.includes('despiértame') || text.includes('despertador')) {
      const timeMatch = text.match(/(\d{1,2})[:.](\d{2})/);
      let targetTime = '07:30';
      if (timeMatch) {
        const hours = ('0' + timeMatch[1]).slice(-2);
        const minutes = timeMatch[2];
        targetTime = `${hours}:${minutes}`;
      }
      this.setAlarm(targetTime, true);
      const speech = `Listo ${userName}, alarma configurada para las ${targetTime}. Te despertaré con tu video favorito: ${this.memory.favoriteVideoTitle}.`;
      return { type: 'SET_ALARM', payload: { time: targetTime, enabled: true }, speechResponse: speech };
    }

    if (text.includes('favorito') || text.includes('mi música') || text.includes('canción favorita') || text.includes('video musical favorito')) {
      const favVideo = currentVideos.find((v) => v.id === this.memory.favoriteVideoId) || currentVideos[1] || currentVideos[0];
      const speech = `¡Claro que sí ${userName}! Reproduciendo tu video favorito: ${favVideo.title}.`;
      return { type: 'PLAY_VIDEO', payload: favVideo.id, speechResponse: speech };
    }

    if (text.includes('recuérdame') || text.includes('recordar') || text.includes('tarea') || text.includes('agenda')) {
      let taskTitle = text
        .replace(/(?:recuérdame|recordar|agrega una tarea|anota|agenda)\s*/i, '')
        .trim();
      if (!taskTitle) taskTitle = 'Revisar novedades en QuanticTube';

      const dueTime = new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16);
      const task = this.addTask(taskTitle, dueTime, 'recordatorio');
      const speech = `Anotado en mi memoria, ${userName}: "${taskTitle}". Te lo recordaré a tiempo.`;
      return { type: 'ADD_REMINDER', payload: task, speechResponse: speech };
    }

    if (text.includes('short') || text.includes('shorts') || text.includes('vertical')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'shorts',
        speechResponse: `Abriendo la sección de Shorts verticales 9:16, ${userName}.`
      };
    }

    if (text.includes('foto') || text.includes('fotos') || text.includes('imagen') || text.includes('imágenes') || text.includes('galería')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'photos',
        speechResponse: `Abriendo la galería de fotos y capturas en 4K, ${userName}.`
      };
    }

    if (text.includes('post') || text.includes('texto') || text.includes('nota de voz') || text.includes('comunidad') || text.includes('muro')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'posts',
        speechResponse: `Abriendo el muro de publicaciones y notas de voz de la comunidad, ${userName}.`
      };
    }

    if (text.includes('gif') || text.includes('gifs') || text.includes('animación') || text.includes('bucle')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'gifs',
        speechResponse: `Abriendo el Hub de GIFs animados por categorías, ${userName}.`
      };
    }

    if (text.includes('3d') || text.includes('libro') || text.includes('book') || text.includes('flip')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'book',
        speechResponse: `Cambiando al modo 3D Book-Flip futurista, ${userName}. Puedes hojear las páginas arrastrando el ratón o deslizando con el dedo.`
      };
    }

    if (text.includes('quad') || text.includes('cuatro pantallas') || text.includes('cuatro videos') || text.includes('multiview')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'quad',
        speechResponse: `Activando Quad-View cuántico con 4 pantallas simultáneas independientes, ${userName}.`
      };
    }

    if (text.includes('omni') || text.includes('live') || text.includes('en vivo') || text.includes('transmisión') || text.includes('stream')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'live',
        speechResponse: `Abriendo el estudio Omni-Live WebRTC dual-cam con chat en directo, ${userName}.`
      };
    }

    if (text.includes('mensaje') || text.includes('mensajes') || text.includes('dm') || text.includes('chat privado') || text.includes('videollamada')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'dm',
        speechResponse: `Abriendo tus mensajes directos cifrados y canal de videollamadas 4K, ${userName}.`
      };
    }

    if (text.includes('feed') || text.includes('inicio') || text.includes('principal') || text.includes('videos largos')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'feed',
        speechResponse: `Mostrando el Feed Principal de videos 16:9 con comentarios interactivos, ${userName}.`
      };
    }

    if (text.includes('subir video') || text.includes('subir contenido') || text.includes('publicar video') || text.includes('cargar video') || text.includes('subir un video')) {
      return {
        type: 'OPEN_CREATE',
        payload: 'video',
        speechResponse: `Abriendo de inmediato el panel de subida, ${userName}. Aquí puedes subir tu video MP4 para almacenarlo permanentemente en Cloudinary y Firestore.`
      };
    }

    if (text.includes('subir foto') || text.includes('publicar foto')) {
      return {
        type: 'OPEN_CREATE',
        payload: 'photo',
        speechResponse: `Abriendo el panel para publicar una fotografía en la galería, ${userName}.`
      };
    }

    if (text.includes('publicar post') || text.includes('crear post') || text.includes('grabar nota de voz')) {
      return {
        type: 'OPEN_CREATE',
        payload: 'post',
        speechResponse: `Abriendo el panel para compartir tu mensaje o nota de voz con la comunidad, ${userName}.`
      };
    }

    if (text.includes('estudio') || text.includes('crear video con ia') || text.includes('generar video') || text.includes('veo 3') || text.includes('quanticstudio')) {
      return {
        type: 'OPEN_STUDIO',
        payload: true,
        speechResponse: `Abriendo QuanticStudio IA Suite para generar contenido cinematográfico con Google Veo 3.1, ${userName}.`
      };
    }

    if (text.includes('asistente') || text.includes('director creativo') || text.includes('director')) {
      return {
        type: 'OPEN_ASSISTANT',
        payload: true,
        speechResponse: `Conectando con el Director Creativo inteligente de QuanticTube, ${userName}.`
      };
    }

    if (text.includes('cómo usar') || text.includes('tutorial') || text.includes('guía') || text.includes('manual')) {
      return {
        type: 'OPEN_HOW_TO_USE',
        payload: true,
        speechResponse: `Abriendo la guía interactiva oficial de QuanticTube, ${userName}. Te mostraré paso a paso cada función de la plataforma.`
      };
    }

    if (text.includes('política') || text.includes('privacidad') || text.includes('términos')) {
      return {
        type: 'OPEN_POLICIES',
        payload: true,
        speechResponse: `Desplegando las Políticas de Privacidad y Normas Comunitarias de QuanticTube, ${userName}.`
      };
    }

    if (text.includes('sobre nosotros') || text.includes('quiénes somos') || text.includes('acerca de')) {
      return {
        type: 'OPEN_ABOUT',
        payload: true,
        speechResponse: `Abriendo la historia y visión de QuanticTube creada por Guillermo López, ${userName}.`
      };
    }

    if (text.includes('iniciar sesión') || text.includes('login') || text.includes('crear canal') || text.includes('registrarse') || text.includes('mi cuenta')) {
      return {
        type: 'OPEN_AUTH',
        payload: true,
        speechResponse: `Abriendo el panel de acceso para ingresar o registrar tu canal en QuanticTube, ${userName}.`
      };
    }

    if (text.includes('moderación') || text.includes('panel de moderación')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'moderation',
        speechResponse: `Ingresando al panel de auditoría y moderación de contenidos, ${userName}.`
      };
    }

    if (text.includes('canal') || text.includes('canales') || text.includes('mi canal') || text.includes('personalizar canal') || text.includes('qr 3d')) {
      let targetHandle = '@guillermo_lopez';
      if (text.includes('quetzal')) targetHandle = '@quetzal_ai';
      else if (text.includes('mariachi')) targetHandle = '@mariachi_synth';
      else if (text.includes('valeria')) targetHandle = '@valeria_cyber';
      else if (text.includes('tenoch') || text.includes('chef')) targetHandle = '@chef_tenoch';
      else if (text.includes('mi canal')) targetHandle = '@mi_canal';

      return {
        type: 'OPEN_CHANNEL',
        payload: targetHandle,
        speechResponse: `Abriendo el Canal Cuántico futurista de ${targetHandle}, ${userName}. Cuenta con cabecera en movimiento, efectos 3D tipo pañuelo en sus videos, letras LED neón personalizables y código QR 3D digitalizado.`
      };
    }

    if (text.includes('cloudinary') || text.includes('almacenamiento en la nube') || text.includes('guardar en la nube')) {
      return {
        type: 'OPEN_CREATE',
        payload: 'video',
        speechResponse: `Cloudinary es el almacenamiento en la nube permanente de QuanticTube. Te permite subir videos MP4 y fotos gratis desde PC o celular sin saturar tu memoria, con enlaces CDN optimizados. Para usarlo, configura tu Cloud Name y tu Upload Preset en modo Unsigned en la ventana de subida que te acabo de abrir, ${userName}.`
      };
    }

    if (
      text.includes('cómo funciona') ||
      text.includes('que contiene la pagina') ||
      text.includes('qué contiene la página') ||
      text.includes('que secciones tiene') ||
      text.includes('qué secciones tiene') ||
      text.includes('explícame la página') ||
      text.includes('explicame la pagina') ||
      text.includes('qué es quantic tube') ||
      text.includes('que es quantic tube')
    ) {
      return {
        type: 'NONE',
        speechResponse: `QuanticTube es una plataforma multimedia futurista con: Feed principal de videos 16:9 con comentarios interactivos por pines espaciales, Shorts verticales 9:16, galería de fotos 4K, muro de publicaciones y notas de voz, modo 3D Book-Flip holográfico, Quad-View con 4 pantallas sincronizadas, transmisiones Omni-Live WebRTC, mensajes directos con videollamadas 4K, y QuanticStudio con IA Veo 3.1. Además almacena tus videos en Cloudinary con sincronización en Firestore. ¿A qué sección te gustaría que te guíe, ${userName}?`
      };
    }

    if (text.includes('pausa') || text.includes('pausar') || text.includes('detén el video') || text.includes('stop')) {
      return {
        type: 'TOGGLE_PLAY',
        payload: 'pause',
        speechResponse: `He pausado el video, ${userName}.`
      };
    }

    if (text.includes('play') || text.includes('reanudar') || text.includes('continúa') || text.includes('dale play')) {
      return {
        type: 'TOGGLE_PLAY',
        payload: 'play',
        speechResponse: `Reanudando reproducción, ${userName}.`
      };
    }

    if (text.startsWith('reproduce ') || text.startsWith('pon el video ') || text.startsWith('ver video ')) {
      const query = text.replace(/(?:reproduce|pon el video|ver video|pon)\s*/i, '').trim();
      const matched = currentVideos.find((v) =>
        v.title.toLowerCase().includes(query) || v.creator.name.toLowerCase().includes(query)
      );
      if (matched) {
        return {
          type: 'PLAY_VIDEO',
          payload: matched.id,
          speechResponse: `Reproduciendo "${matched.title}", ${userName}.`
        };
      }
    }

    if (text.startsWith('busca ') || text.startsWith('buscar ')) {
      const q = text.replace(/(?:busca|buscar)\s*/i, '').trim();
      return {
        type: 'SEARCH',
        payload: q,
        speechResponse: `Buscando "${q}" en QuanticTube, ${userName}.`
      };
    }

    if (text.includes('like') || text.includes('me gusta') || text.includes('fuego') || text.includes('corazón') || text.includes('reaccionar')) {
      return {
        type: 'LIKE_VIDEO',
        payload: true,
        speechResponse: `¡Reacción enviada al video! Le encantará al creador, ${userName}.`
      };
    }

    // Conversational Gemini Multi-turn with Autonomous Navigation Actions
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const contents = [
          ...this.conversationHistory.slice(-6).map((msg) => ({
            role: msg.role,
            parts: [{ text: msg.text }]
          })),
          {
            role: 'user',
            parts: [
              {
                text: `Eres Quantum AI Voice, el Agente Inteligente, Copiloto Autónomo y Guía de Navegación Oficial de QuanticTube.
Hablas con ${userName}.
Tu propósito no es ser un chatbot genérico, sino un AGENTE INTELIGENTE ACTIVO que:
1. Ayuda al usuario a navegar por toda la página y lo lleva directamente a cualquier sección que solicite.
2. Responde con maestría cualquier pregunta sobre todo lo que QuanticTube contiene y cómo se utiliza.

Conocimiento del sistema QuanticTube:
- Feed de Videos: Videos panorámicos 16:9 con reproductor cuántico y comentarios interactivos por pines espaciales en segundos exactos.
- Shorts: Videos verticales 9:16 con reproducción continua tipo reels.
- Fotos: Galería visual de alta resolución 4K.
- Muro de Posts / Comunidad: Publicaciones de texto y notas de voz grabadas directamente desde el navegador.
- GIFs: Hub con animaciones en bucle organizadas por categorías.
- Modo 3D Book-Flip: Experiencia tridimensional inmersiva que convierte el contenido en un libro interactivo holográfico para hojear.
- Quad-View: Reproducción simultánea sincronizada de 4 pantallas simultáneas independientes.
- Omni-Live: Transmisión WebRTC dual-camera con chat en vivo.
- Mensajes Directos (DMs): Chat privado cifrado y videollamadas directas en 4K.
- QuanticStudio: Suite de creación generativa asistida por IA (Google Veo 3.1).
- Cloudinary Storage: Subida en la nube para videos MP4 y fotos con enlaces permanentes y CDN optimizada para celular y PC.
- Canales Cuánticos Personalizados: Cada canal cuenta con cabecera en movimiento (GIF animado o loop MP4), letras LED neón configurables en colores y animaciones, efecto 3D tipo pañuelo en sus videos y código QR 3D digitalizado.
- Creador: Guillermo Lopez, el gran Inventor, Escritor, Desarrollador, Innovador, Pintor, Escultor, Editor, y Empresario Emprendedor.

Si el usuario pide ir a una sección, o si tu respuesta implica abrir una herramienta, agrega al FINAL de tu texto EXACTAMENTE una de estas etiquetas:
[ACTION:NAV_FEED], [ACTION:NAV_SHORTS], [ACTION:NAV_PHOTOS], [ACTION:NAV_POSTS], [ACTION:NAV_GIFS], [ACTION:NAV_3D], [ACTION:NAV_QUAD], [ACTION:NAV_LIVE], [ACTION:NAV_DMS], [ACTION:OPEN_CHANNEL], [ACTION:OPEN_STUDIO], [ACTION:OPEN_UPLOAD], [ACTION:OPEN_HOW_TO_USE], [ACTION:OPEN_POLICIES], [ACTION:OPEN_ABOUT], [ACTION:OPEN_AUTH].

Responde en español de forma carismática, segura, ejecutiva, amistosa y concisa (1 a 3 oraciones).
Mensaje: "${rawText}"`
              }
            ]
          }
        ];

        const response = await Promise.race([
          gemini.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: contents as any
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3200))
        ]);

        if (response && response.text) {
          const rawReply = response.text.trim();
          let cleanedReply = rawReply;
          let detectedAction: CommandAction = { type: 'NONE', speechResponse: rawReply };

          const actionMatch = rawReply.match(/\[ACTION:([A-Z0-9_:]+)\]/i);
          if (actionMatch) {
            const actionTag = actionMatch[1].toUpperCase();
            cleanedReply = rawReply.replace(/\[ACTION:[A-Z0-9_:]+\]/gi, '').trim();
            if (actionTag === 'NAV_FEED') detectedAction = { type: 'CHANGE_TAB', payload: 'feed', speechResponse: cleanedReply };
            else if (actionTag === 'NAV_SHORTS') detectedAction = { type: 'CHANGE_TAB', payload: 'shorts', speechResponse: cleanedReply };
            else if (actionTag === 'NAV_PHOTOS') detectedAction = { type: 'CHANGE_TAB', payload: 'photos', speechResponse: cleanedReply };
            else if (actionTag === 'NAV_POSTS') detectedAction = { type: 'CHANGE_TAB', payload: 'posts', speechResponse: cleanedReply };
            else if (actionTag === 'NAV_GIFS') detectedAction = { type: 'CHANGE_TAB', payload: 'gifs', speechResponse: cleanedReply };
            else if (actionTag === 'NAV_3D') detectedAction = { type: 'CHANGE_TAB', payload: 'book', speechResponse: cleanedReply };
            else if (actionTag === 'NAV_QUAD') detectedAction = { type: 'CHANGE_TAB', payload: 'quad', speechResponse: cleanedReply };
            else if (actionTag === 'NAV_LIVE') detectedAction = { type: 'CHANGE_TAB', payload: 'live', speechResponse: cleanedReply };
            else if (actionTag === 'NAV_DMS') detectedAction = { type: 'CHANGE_TAB', payload: 'dm', speechResponse: cleanedReply };
            else if (actionTag === 'OPEN_CHANNEL') detectedAction = { type: 'OPEN_CHANNEL', payload: '@guillermo_lopez', speechResponse: cleanedReply };
            else if (actionTag === 'OPEN_STUDIO') detectedAction = { type: 'OPEN_STUDIO', payload: true, speechResponse: cleanedReply };
            else if (actionTag === 'OPEN_UPLOAD') detectedAction = { type: 'OPEN_CREATE', payload: 'video', speechResponse: cleanedReply };
            else if (actionTag === 'OPEN_HOW_TO_USE') detectedAction = { type: 'OPEN_HOW_TO_USE', payload: true, speechResponse: cleanedReply };
            else if (actionTag === 'OPEN_POLICIES') detectedAction = { type: 'OPEN_POLICIES', payload: true, speechResponse: cleanedReply };
            else if (actionTag === 'OPEN_ABOUT') detectedAction = { type: 'OPEN_ABOUT', payload: true, speechResponse: cleanedReply };
            else if (actionTag === 'OPEN_AUTH') detectedAction = { type: 'OPEN_AUTH', payload: true, speechResponse: cleanedReply };
          }

          detectedAction.speechResponse = cleanedReply;
          this.conversationHistory.push({ role: 'user', text: rawText });
          this.conversationHistory.push({ role: 'model', text: cleanedReply });
          return detectedAction;
        }
      } catch (e) {}
    }

    const reply = this.generateSmartConversationalReply(rawText, userName);
    this.conversationHistory.push({ role: 'user', text: rawText });
    this.conversationHistory.push({ role: 'model', text: reply });
    return {
      type: 'NONE',
      speechResponse: reply
    };
  }

  private generateSmartConversationalReply(query: string, user: string): string {
    const q = query.toLowerCase();

    if (
      q.includes('quién creó') ||
      q.includes('quien creo') ||
      q.includes('creador') ||
      q.includes('quién hizo') ||
      q.includes('quien hizo') ||
      q.includes('desarrollador') ||
      q.includes('who created') ||
      q.includes('who made')
    ) {
      return `El Creador de esta pagina es Guillermo Lopez, el gran Inventor, Escritor, Desarrollador, Innovador, Pintor, Escultor, Editor, y Empresario Emprendedor, el fue quien con su conocimiento en desarrollo Web, desarrollo esta innovadora, sofisticada y futurista pagina, empoderada con la mejor y mas poderosa IA de Google.`;
    }

    if (
      q.includes('cómo funciona') ||
      q.includes('como funciona') ||
      q.includes('qué contiene') ||
      q.includes('que contiene') ||
      q.includes('qué es quantic tube') ||
      q.includes('que es quantic tube') ||
      q.includes('secciones') ||
      q.includes('explicame') ||
      q.includes('explícame')
    ) {
      return `QuanticTube es una plataforma multimedia futurista completa. Contiene: Feed de videos 16:9 con comentarios fijados en pines espaciales, Shorts verticales 9:16, galería de fotos 4K, muro de publicaciones y notas de voz, modo 3D Book-Flip holográfico, Quad-View con 4 pantallas simultáneas, transmisiones Omni-Live WebRTC, mensajes directos cifrados con videollamadas 4K, QuanticStudio con IA Veo 3.1, y almacenamiento gratuito en Cloudinary sincronizado en tiempo real con Firestore. Puedes pedirme que te lleve a cualquiera de estas secciones cuando gustes.`;
    }

    if (q.includes('cloudinary') || q.includes('almacenamiento') || q.includes('guardar videos')) {
      return `Cloudinary es nuestro servicio de almacenamiento permanente en la nube para videos y fotos. Te permite subir videos MP4 y fotos desde tu PC o celular de forma gratuita, generando enlaces permanentes y entrega optimizada sin saturar el almacenamiento de tu equipo. Para usarlo, pulsa el botón Subir (+), configura tu Cloud Name y tu Upload Preset en modo Unsigned una sola vez, ¡y listo!`;
    }

    if (q.includes('3d') || q.includes('book') || q.includes('libro')) {
      return `El Modo 3D Book convierte la navegación de QuanticTube en un libro holográfico tridimensional. Puedes pasar las páginas virtuales haciendo clic y arrastrando o deslizando en pantallas táctiles con física interactiva.`;
    }

    if (q.includes('quad') || q.includes('cuatro pantallas') || q.includes('multiview')) {
      return `Quad-View te permite ver hasta 4 transmisiones o videos simultáneos en una cuadrícula de cuatro pantallas sincronizadas, pudiendo alternar el audio de cada cuadrante con un solo toque.`;
    }

    if (q.includes('omni') || q.includes('live') || q.includes('en vivo') || q.includes('transmisión')) {
      return `Omni-Live es el estudio de streaming cuántico con tecnología WebRTC, soporte para alternar entre cámara frontal y trasera en tiempo real, chat en vivo y reacciones instantáneas.`;
    }

    if (q.includes('pin') || q.includes('comentario') || q.includes('comentar')) {
      return `En QuanticTube puedes pausar un video o tocar la barra de tiempo para fijar un 'Pin' de comentario interactivo en el segundo exacto. Tu mensaje aparecerá flotando como un holograma para toda la comunidad.`;
    }

    if (q.includes('cómo estás') || q.includes('qué tal') || q.includes('cómo te va') || q.includes('cómo andas')) {
      return `¡Qué tal ${user}! Me encuentro excelente, con todos los sistemas cuánticos al cien por ciento y listo para guiarte por la plataforma o resolver cualquier duda. ¿Hacia dónde te gustaría que naveguemos hoy?`;
    }

    if (q.includes('quién eres') || q.includes('qué eres') || q.includes('cómo te llamas')) {
      return `Soy Quantum AI Voice, tu Agente Inteligente, Copiloto Autónomo y Guía Oficial de QuanticTube. Mi misión es ayudarte a navegar por todas las secciones de la página, resolver cualquier duda sobre sus herramientas, gestionar tus recordatorios y hacer tu experiencia interactiva y fascinante.`;
    }

    if (q.includes('chiste') || q.includes('broma') || q.includes('hazme reír')) {
      const jokes = [
        `¿Qué le dice un bit a otro bit en el ciberespacio? ¡Nos vemos en el bus cuántico!`,
        `¿Por qué la inteligencia artificial nunca se pierde? Porque siempre tiene buen algoritmo de ubicación.`,
        `¿Qué hace un androide en el Zócalo? ¡Bailar mariachi synthwave a 128 pulsos por minuto con todo el estilo!`
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (q.includes('música') || q.includes('canción') || q.includes('mariachi') || q.includes('synthwave')) {
      return `¡La música mariachi synthwave está con todo en QuanticTube! Te recomiendo ver el concierto holográfico en el Zócalo tocando en el feed principal.`;
    }

    if (q.includes('gracias') || q.includes('muchas gracias') || q.includes('agradecido') || q.includes('chido')) {
      return `¡Para eso estamos ${user}! Es un verdadero honor apoyarte como tu Agente Inteligente. ¿Qué otra sección de QuanticTube deseas explorar?`;
    }

    if (q.includes('video') || q.includes('veo') || q.includes('generar') || q.includes('crear')) {
      return `Puedes usar nuestro motor Veo 3.1 en la pestaña de Estudio para crear videos cinematográficos en segundos con IA avanzada de Google.`;
    }

    if (q.includes('adiós') || q.includes('hasta luego') || q.includes('bye') || q.includes('nos vemos')) {
      return `¡Hasta luego ${user}! Que tengas un excelente día. Aquí estaré listo cuando quieras volver a navegar o platicar.`;
    }

    const naturalReplies = [
      `Entendido ${user}. Como tu Agente Inteligente, puedo llevarte a cualquier sección como Feed, Shorts, Modo 3D Book, Quad-View o el panel de subida a Cloudinary cuando me lo indiques.`,
      `¡Excelente punto ${user}! Recuerda que puedes pedirme que abra cualquier herramienta de QuanticTube o reproducir cualquier video al instante.`,
      `Estoy a tu completa disposición, ${user}. Dime si deseas que te lleve a los Shorts, a las fotos, a publicar contenido o a ver los videos del feed.`
    ];
    return naturalReplies[Math.floor(Math.random() * naturalReplies.length)];
  }
}

export const quanticVoiceAgent = new VoiceAgentEngine();
