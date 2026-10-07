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
      text: '¡Hola Memo! Soy Quantum AI, tu copiloto y voz masculina de QuanticTube. Mi micrófono directo está listo. Puedes tocar el botón para hablar o usar habla continua.',
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
      return `¡Hola, ${timeGreeting}, ${cleanName}! ¿Qué se te ofrece mirar o ver el día de hoy, ${cleanName}? Quedo listo a la orden que me des.`;
    } else {
      let timeGreeting = 'good morning';
      if (hour >= 12 && hour < 19) {
        timeGreeting = 'good afternoon';
      } else if (hour >= 19 || hour < 5) {
        timeGreeting = 'good evening';
      }
      return `Hello, ${timeGreeting}, ${cleanName}! What would you like to watch or explore today, ${cleanName}? I am ready at your service for any command you give me.`;
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
        speechResponse: `Abriendo la galería de fotos y arte en 4K, ${userName}.`
      };
    }

    if (text.includes('post') || text.includes('texto') || text.includes('nota de voz') || text.includes('comunidad')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'posts',
        speechResponse: `Abriendo el muro de textos y notas de voz de la comunidad, ${userName}.`
      };
    }

    if (text.includes('gif') || text.includes('gifs') || text.includes('animación') || text.includes('bucle')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'gifs',
        speechResponse: `Abriendo el Hub de GIFs animados, ${userName}.`
      };
    }

    if (text.includes('3d') || text.includes('libro') || text.includes('book') || text.includes('flip')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'book',
        speechResponse: `Cambiando al modo 3D Book-Flip futurista, ${userName}.`
      };
    }

    if (text.includes('quad') || text.includes('cuatro') || text.includes('múltiple') || text.includes('multiview')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'quad',
        speechResponse: `Activando Quad-View cuántico con 4 pantallas simultáneas, ${userName}.`
      };
    }

    if (text.includes('omni') || text.includes('live') || text.includes('en vivo') || text.includes('transmisión')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'live',
        speechResponse: `Abriendo el estudio Omni-Live WebRTC dual-cam, ${userName}.`
      };
    }

    if (text.includes('mensaje') || text.includes('mensajes') || text.includes('dm') || text.includes('chat privado')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'dm',
        speechResponse: `Abriendo tus mensajes directos y canal de voz cifrado, ${userName}.`
      };
    }

    if (text.includes('feed') || text.includes('inicio') || text.includes('principal') || text.includes('videos largos')) {
      return {
        type: 'CHANGE_TAB',
        payload: 'feed',
        speechResponse: `Mostrando la lista de videos largos en formato 16:9, ${userName}.`
      };
    }

    if (text.includes('estudio') || text.includes('crear video') || text.includes('generar video') || text.includes('veo 3') || text.includes('publicar')) {
      return {
        type: 'OPEN_STUDIO',
        payload: true,
        speechResponse: `Abriendo QuanticStudio IA Suite para generar contenido con IA Veo 3.1, ${userName}.`
      };
    }

    if (text.includes('asistente') || text.includes('director') || text.includes('guión')) {
      return {
        type: 'OPEN_ASSISTANT',
        payload: true,
        speechResponse: `Conectando con el Director Creativo de QuanticTube, ${userName}.`
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

    // Conversational Gemini Multi-turn
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
                text: `Eres Quantum AI, el asistente y voz masculina carismática y cálida de QuanticTube.
Hablas con ${userName}.
Si preguntan quién creó la página, di exactamente: "El Creador de esta pagina es Guillermo Lopez, el gran Inventor, Escritor, Desarrollador, Innovador, Pintor, Escultor, Editor, y Empresario Emprendedor, el fue quien con su conocimiento en desarrollo Web, desarrollo esta innovadora, sofisticada y futurista pagina, empoderada con la mejor y mas poderosa IA de Google."
Responde en español de forma carismática, natural, empática, amistosa e inteligente (1 a 3 oraciones breves).
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
          const reply = response.text.trim();
          this.conversationHistory.push({ role: 'user', text: rawText });
          this.conversationHistory.push({ role: 'model', text: reply });
          return {
            type: 'NONE',
            speechResponse: reply
          };
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

    if (q.includes('cómo estás') || q.includes('qué tal') || q.includes('cómo te va') || q.includes('cómo andas')) {
      return `¡Qué tal ${user}! Me encuentro excelente, al cien por ciento y listo para platicar contigo o ayudarte en QuanticTube. ¿Cómo va tu día?`;
    }
    if (q.includes('quién eres') || q.includes('qué eres') || q.includes('cómo te llamas')) {
      return `Soy Quantum AI, tu copiloto y voz inteligente de QuanticTube. Mi misión es acompañarte, poner tu música favorita, avisarte de recordatorios y ayudarte a disfrutar de la plataforma.`;
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
      return `¡Para eso estamos ${user}! Es un verdadero gusto apoyarte. ¿Qué más se te antoja explorar?`;
    }
    if (q.includes('video') || q.includes('veo') || q.includes('generar') || q.includes('crear')) {
      return `Puedes usar nuestro motor Veo 3.1 en la pestaña de Estudio para crear videos cinematográficos en segundos. ¡Quedan espectaculares!`;
    }
    if (q.includes('adiós') || q.includes('hasta luego') || q.includes('bye') || q.includes('nos vemos')) {
      return `¡Hasta luego ${user}! Que tengas un excelente día. Aquí estaré listo cuando quieras volver a platicar.`;
    }

    const naturalReplies = [
      `Te entiendo perfectamente, ${user}. En QuanticTube siempre estamos listos para lo que necesites, ya sea música, videos o noticias.`,
      `¡Totalmente de acuerdo contigo ${user}! Si quieres que reproduzcamos algún video o cambiemos de modo, solo dímelo.`,
      `Qué buen tema, ${user}. Recuerda que puedes pedirme que active el modo 3D, abra el quad-view o ponga tu música favorita cuando gustes.`
    ];
    return naturalReplies[Math.floor(Math.random() * naturalReplies.length)];
  }
}

export const quanticVoiceAgent = new VoiceAgentEngine();
