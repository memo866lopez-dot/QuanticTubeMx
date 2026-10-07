import React, { useState, useRef } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Send,
  Sparkles,
  MessageSquare,
  Volume2,
  Trash2,
  Headphones
} from 'lucide-react';
import { AudioNote } from '../types';

export const DirectMessages: React.FC = () => {
  const [activeContact, setActiveContact] = useState({
    name: 'Dra. Quetzal AI',
    handle: '@quetzal_ai',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    status: 'Online cuántico'
  });

  const [notes, setNotes] = useState<AudioNote[]>([
    {
      id: 'an-1',
      sender: 'Dra. Quetzal AI',
      timestamp: '15:20',
      duration: 8,
      audioBlobUrl: ''
    }
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Start recording audio note with MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);

        const newNote: AudioNote = {
          id: `note-${Date.now()}`,
          sender: 'Yo (Comandante Quantic)',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: recordingSeconds || 4,
          audioBlobUrl: url
        };

        setNotes((prev) => [...prev, newNote]);
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        setRecordingSeconds(0);
      };

      mr.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone recording error:', err);
      alert('Por favor autoriza el micrófono para grabar notas de voz cuánticas.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const playNote = (note: AudioNote) => {
    if (playingId === note.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (note.audioBlobUrl) {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      audioPlayerRef.current.src = note.audioBlobUrl;
      audioPlayerRef.current.onended = () => setPlayingId(null);
      audioPlayerRef.current.play();
      setPlayingId(note.id);
    } else {
      // Simulate synthetic audio beep
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
      setPlayingId(note.id);
      setTimeout(() => setPlayingId(null), 1000);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-[#0b0d14] border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={activeContact.avatar}
              alt={activeContact.name}
              className="w-10 h-10 rounded-full object-cover border border-[#00ff88]"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00ff88] ring-2 ring-black" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-orbitron text-white">{activeContact.name}</h2>
            <div className="text-[11px] text-[#00ff88] font-mono">{activeContact.status}</div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
          <Headphones className="w-4 h-4 text-cyan-400" />
          <span>CANAL DE VOZ CIFRADO {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Voice Notes Thread */}
      <div className="p-4 sm:p-6 bg-[#0b0d14] rounded-2xl border border-slate-800 space-y-4 min-h-[380px] flex flex-col justify-between">
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`p-3 rounded-2xl border max-w-md text-xs flex items-center justify-between gap-3 ${
                note.sender.includes('Yo')
                  ? 'ml-auto bg-[#00ff88]/10 border-[#00ff88]/40 text-slate-100'
                  : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1">
                <button
                  onClick={() => playNote(note)}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#00ff88] hover:text-black border border-slate-700 flex items-center justify-center transition-all"
                >
                  {playingId === note.id ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* Simulated Waveform */}
                <div className="flex items-center gap-0.5 flex-1 h-6">
                  {[...Array(18)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        height: `${Math.max(20, Math.sin(i * 0.7) * 90)}%`
                      }}
                      className={`w-1 rounded-full transition-all ${
                        playingId === note.id ? 'bg-[#00ff88] animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-400 font-mono">
                <div>{note.duration}s</div>
                <div>{note.timestamp}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Voice Recorder Action Bar */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-orbitron font-bold text-xs animate-pulse shadow-lg shadow-rose-600/30"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>DETENER GRABACIÓN ({recordingSeconds}s)</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00ff88] to-emerald-500 text-black font-orbitron font-bold text-xs hover:opacity-95 shadow-lg shadow-[#00ff88]/20 transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>GRABAR NOTA DE VOZ</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {isRecording ? 'Capturando audio 48kHz...' : 'Pulsa el botón para enviar audio en vivo'}
          </div>
        </div>
      </div>
    </div>
  );
};
