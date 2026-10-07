import React, { useState, useEffect, useRef } from 'react';
import { Mic, Activity, CheckCircle2, AlertCircle, Play, Volume2, Sparkles, RefreshCw, Zap, Disc, VolumeX, ShieldAlert, ExternalLink } from 'lucide-react';
import { quanticVoiceAgent } from '../services/voiceAgentService';
import { processAudioWithGemini } from '../services/geminiService';

interface VoiceSpectrumTesterProps {
  onStartChat: () => void;
  language: 'es' | 'en';
}

export const VoiceSpectrumTester: React.FC<VoiceSpectrumTesterProps> = ({ onStartChat, language }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [dbLevel, setDbLevel] = useState(0);
  const [maxDb, setMaxDb] = useState(0);
  const [testTranscript, setTestTranscript] = useState('');
  const [testSuccess, setTestSuccess] = useState(false);
  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 5-second clip recording state
  const [isRecordingClip, setIsRecordingClip] = useState(false);
  const [clipCountdown, setClipCountdown] = useState(5);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [geminiAudioReply, setGeminiAudioReply] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recRef = useRef<any>(null);
  const clipMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const clipChunksRef = useRef<Blob[]>([]);

  // Start live microphone & spectrum analyzer
  const startSpectrumTest = async () => {
    try {
      setErrorMessage('');
      setTestSuccess(false);
      setTestTranscript('');
      setMaxDb(0);
      setIsTesting(true);
      setMicStatus('testing');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta captura de micrófono directamente.');
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start spectrum visualizer loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const drawSpectrum = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const currentAvg = Math.round((sum / bufferLength) * 1.5);
        setDbLevel(currentAvg);
        setMaxDb((prev) => Math.max(prev, currentAvg));

        // Canvas render
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.8;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;

          // Multi-color gradient for laser spectrum
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, '#00ff88');
          gradient.addColorStop(0.5, '#00ccff');
          gradient.addColorStop(0.8, '#a855f7');
          gradient.addColorStop(1, '#ff0055');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

          // Glow cap
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, canvas.height - barHeight - 2, barWidth - 2, 2);

          x += barWidth;
        }

        animFrameRef.current = requestAnimationFrame(drawSpectrum);
      };

      drawSpectrum();

      // Start test speech recognition sandbox
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.lang = 'es-MX';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (e: any) => {
          let text = '';
          for (let i = 0; i < e.results.length; i++) {
            text += e.results[i][0].transcript;
          }
          if (text.trim()) {
            setTestTranscript(text.trim());
            setTestSuccess(true);
            setMicStatus('success');
            quanticVoiceAgent.speak(
              language === 'es'
                ? '¡Excelente! Escuché tu voz perfectamente. Tu micrófono está listo.'
                : 'Excellent! I heard your voice perfectly. Your microphone is ready.'
            );
          }
        };

        rec.onerror = () => {};
        recRef.current = rec;
        try {
          rec.start();
        } catch (e) {}
      }
    } catch (err: any) {
      console.warn('Spectrum test error:', err);
      setMicStatus('error');
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'El acceso al micrófono fue denegado. Permite el permiso en el ícono de candado 🔒 de tu navegador.'
          : err.message || 'No se pudo acceder al micrófono.'
      );
      setIsTesting(false);
    }
  };

  // Record a 5-second voice clip directly and play it back to test hardware
  const record5SecondTestClip = async () => {
    try {
      setRecordedAudioUrl(null);
      setGeminiAudioReply(null);
      setTestTranscript('');
      setErrorMessage('');
      setIsRecordingClip(true);
      setClipCountdown(5);

      let stream = streamRef.current;
      if (!stream || !stream.active) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true }
          });
        } catch (e) {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        streamRef.current = stream;
      }

      clipChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      clipMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) clipChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsRecordingClip(false);
        const audioBlob = new Blob(clipChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm'
        });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // Convert blob to base64 and send to Gemini audio processor
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          const result = await processAudioWithGemini(base64Data, audioBlob.type, 'Memo');
          if (result.userTranscript) {
            setTestTranscript(result.userTranscript);
            setTestSuccess(true);
            setMicStatus('success');
            setGeminiAudioReply(result.aiResponse);
            quanticVoiceAgent.speak(result.aiResponse || '¡Escuché tu grabación perfectamente!');
          }
        };
      };

      mediaRecorder.start(100);

      // 5 second timer countdown
      let count = 5;
      const interval = setInterval(() => {
        count--;
        setClipCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          if (clipMediaRecorderRef.current && clipMediaRecorderRef.current.state !== 'inactive') {
            clipMediaRecorderRef.current.stop();
          }
        }
      }, 1000);
    } catch (e: any) {
      setIsRecordingClip(false);
      setErrorMessage('No se pudo grabar la prueba de voz: ' + (e.message || e));
    }
  };

  // Stop test resources
  const stopSpectrumTest = () => {
    setIsTesting(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch (e) {}
      recRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopSpectrumTest();
    };
  }, []);

  return (
    <div className="space-y-4 p-1 text-slate-100 font-sans">
      {/* Title & Description */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#0d1326] via-[#0a0f1d] to-[#120e24] border border-[#00ff88]/40 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-orbitron font-bold text-xs text-white tracking-wider flex items-center gap-2">
              PROBADOR DE MICRÓFONO & ESPECTRO CUÁNTICO
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40">
                100% EN VIVO
              </span>
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Calibra tu micrófono y graba un audio de 5 segundos para escuchar tu propia voz y verificar la lectura de audio.
            </p>
          </div>
        </div>
      </div>

      {/* Live Spectrum Canvas Analyzer */}
      <div className="relative p-3 rounded-2xl bg-[#060812] border border-slate-800 flex flex-col items-center justify-center min-h-[120px] overflow-hidden group">
        <div className="absolute top-2 left-3 flex items-center gap-2 z-10">
          <span className={`w-2 h-2 rounded-full ${isTesting ? 'bg-[#00ff88] animate-ping' : 'bg-slate-600'}`} />
          <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
            {isTesting ? 'Lector de Frecuencias Activo' : 'Lector en Reposo'}
          </span>
        </div>

        <div className="absolute top-2 right-3 flex items-center gap-2 z-10 font-mono text-[11px]">
          <span className="text-slate-400">Nivel:</span>
          <span className={`font-bold ${dbLevel > 10 ? 'text-[#00ff88]' : dbLevel > 2 ? 'text-amber-400' : 'text-slate-500'}`}>
            {dbLevel} dB
          </span>
        </div>

        <canvas
          ref={canvasRef}
          width={400}
          height={90}
          className="w-full h-24 rounded-xl bg-[#080b18] border border-slate-800/80 shadow-inner mt-4"
        />

        {!isTesting && (
          <div className="absolute inset-0 bg-[#060812]/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 p-2 text-center">
            <Sparkles className="w-6 h-6 text-[#00ff88] animate-bounce" />
            <p className="text-xs font-semibold text-slate-200">
              Haz clic abajo para iniciar la calibración del micrófono
            </p>
          </div>
        )}
      </div>

      {/* Instant 5-Second Voice Recording Clip & Playback */}
      <div className="p-3.5 rounded-2xl bg-[#0a0e1c] border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-orbitron font-bold text-white">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Disc className="w-4 h-4 text-cyan-400 animate-spin" />
            PRUEBA FÍSICA: GRABAR & REPRODUCIR TU PROPIA VOZ
          </span>
        </div>

        <button
          onClick={record5SecondTestClip}
          disabled={isRecordingClip}
          className={`w-full py-3 px-4 rounded-xl font-orbitron font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            isRecordingClip
              ? 'bg-[#ff0055] text-white shadow-lg shadow-[#ff0055]/50 animate-pulse'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:scale-[1.02] active:scale-95 shadow-md shadow-cyan-500/20'
          }`}
        >
          {isRecordingClip ? (
            <>
              <Disc className="w-4 h-4 animate-spin" />
              <span>GRABANDO TU VOZ... ({clipCountdown}s)</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>GRABAR 5 SEGUNDOS DE PRUEBA Y ESCUCHAR MI VOZ</span>
            </>
          )}
        </button>

        {recordedAudioUrl && (
          <div className="p-3 rounded-xl bg-[#050814] border border-cyan-500/40 space-y-2 animate-fadeIn">
            <p className="text-xs font-mono text-cyan-300 font-semibold">
              🔊 Tu voz grabada (escúchala con el reproductor):
            </p>
            <audio controls src={recordedAudioUrl} className="w-full h-9 rounded-lg" />
          </div>
        )}

        {geminiAudioReply && (
          <div className="p-2.5 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/40 text-xs text-slate-200">
            <span className="font-bold text-[#00ff88]">🧠 Respuesta de Quantum AI:</span> "{geminiAudioReply}"
          </div>
        )}
      </div>

      {/* Signal Sensitivity Gauge Bar */}
      <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#00ff88]" />
            Intensidad de Audio Entrante:
          </span>
          <span className="font-bold text-white">{dbLevel} / 100 dB (Máx: {maxDb} dB)</span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00ff88] via-[#00ccff] to-[#ff0055] transition-all duration-75"
            style={{ width: `${Math.min(100, dbLevel * 1.5)}%` }}
          />
        </div>
      </div>

      {/* Live Sandbox Speech Transcription Box */}
      {isTesting && (
        <div className="p-3 rounded-xl bg-[#080d1a] border border-[#00ff88]/40 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#00ff88]">
            <span>🎙️ Transcripción en Vivo de Prueba:</span>
            {testSuccess && <span className="text-xs text-emerald-400 font-bold">¡VERIFICADO!</span>}
          </div>
          <div className="p-2.5 rounded-lg bg-[#050710] border border-slate-800 text-xs font-mono text-slate-200 min-h-[42px] flex items-center">
            {testTranscript ? (
              <span className="text-white font-bold">"{testTranscript}"</span>
            ) : (
              <span className="text-slate-500 italic">
                Di algo como: "Hola Quantum AI 1 2 3 probando el micrófono"...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error / Instruction Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/60 text-red-200 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{errorMessage}</p>
            <p className="text-[11px] text-red-300">
              💡 Para solucionar permisos en tu navegador: Haz clic en el candado 🔒 junto a la barra de direcciones &gt; Permisos &gt; Micrófono &gt; Permitir, y recarga la página.
            </p>
          </div>
        </div>
      )}

      {/* Direct Full Tab Launcher & Instructions Banner */}
      <div className="p-3 rounded-2xl bg-[#090e1f] border border-cyan-500/40 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
          <span>🚀 ¿Estás usando la vista previa embebida?</span>
        </div>
        <p className="text-[11px] text-slate-300">
          Si tu navegador o celular bloquea el micrófono por seguridad dentro del marco, abre la aplicación en una pestaña independiente para autorizar tu micrófono con 1 clic:
        </p>
        <button
          onClick={() => window.open('https://ais-pre-kqko46hefzjxpxlwxzkgra-89447317841.us-east5.run.app', '_blank')}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-orbitron font-bold text-xs shadow-md shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>ABRIR APLICACIÓN EN PESTAÑA COMPLETA</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {!isTesting ? (
          <button
            onClick={startSpectrumTest}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00ff88] via-[#00ccff] to-[#a855f7] text-black font-orbitron font-bold text-xs shadow-lg shadow-[#00ff88]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>ACTIVAR ESPECTRO DE VOZ</span>
          </button>
        ) : (
          <button
            onClick={stopSpectrumTest}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-orbitron font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>REINICIAR ESPECTRO</span>
          </button>
        )}

        <button
          onClick={() => {
            stopSpectrumTest();
            onStartChat();
          }}
          className={`flex-1 py-3 px-4 rounded-xl font-orbitron font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            testSuccess
              ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/40 animate-pulse hover:scale-[1.02]'
              : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>PLATICAR CON QUANTUM AI</span>
        </button>
      </div>
    </div>
  );
};
