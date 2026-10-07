import React, { useState } from 'react';
import { Shield, ShieldAlert, UserX, Check, Plus, Trash2, Sparkles, Filter } from 'lucide-react';
import { scanContentModeration } from '../services/geminiService';

export const ModerationPanel: React.FC = () => {
  const [bannedUsers, setBannedUsers] = useState<
    { id: string; name: string; reason: string; timestamp: string; isDisintegrating?: boolean }[]
  >([
    { id: 'u1', name: '@spambot_3000', reason: 'Spam masivo de enlaces', timestamp: 'Hace 10 min' },
    { id: 'u2', name: '@troll_cyber', reason: 'Comportamiento hostil en live', timestamp: 'Hace 25 min' }
  ]);

  const [blockedWords, setBlockedWords] = useState<string[]>([
    'odio',
    'estafa',
    'bot_attack',
    'toxic_raid'
  ]);
  const [newWord, setNewWord] = useState('');
  const [testComment, setTestComment] = useState('');
  const [testResult, setTestResult] = useState<{ safe: boolean; reason?: string } | null>(null);

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    setBlockedWords((prev) => [...prev, newWord.trim().toLowerCase()]);
    setNewWord('');
  };

  const handleRemoveWord = (word: string) => {
    setBlockedWords((prev) => prev.filter((w) => w !== word));
  };

  const handleTestScan = () => {
    if (!testComment.trim()) return;
    const res = scanContentModeration(testComment);
    setTestResult(res);
  };

  const handleDisintegrateUser = (id: string) => {
    // Trigger matrix disintegrate animation
    setBannedUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isDisintegrating: true } : u))
    );

    setTimeout(() => {
      setBannedUsers((prev) => prev.filter((u) => u.id !== id));
    }, 700);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#0b0d14] border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40">
              <Shield className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold font-orbitron text-white">
              PANEL DE <span className="text-[#00ff88]">MODERACIÓN IA</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-[#00ff88] border border-emerald-500/30">
              ESCUDO CUÁNTICO ACTIVO
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Filtra comentarios tóxicos automáticamente con Gemini y gestiona bloqueos con desvanecimiento visual.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Blocked Words & AI Scanner */}
        <div className="p-5 rounded-2xl bg-[#0b0d14] border border-slate-800 space-y-4">
          <h3 className="font-orbitron font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#00ff88]" />
            FILTRO DE PALABRAS PROHIBIDAS POR IA
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              placeholder="Nueva palabra o término tóxico..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#00ff88]"
            />
            <button
              onClick={handleAddWord}
              className="p-2 rounded-xl bg-[#00ff88] text-black font-bold hover:bg-emerald-400 text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2">
            {blockedWords.map((word) => (
              <span
                key={word}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 font-mono"
              >
                <span>{word}</span>
                <button
                  onClick={() => handleRemoveWord(word)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Test Scanner */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">
              Probar Escáner de Toxicidad en Tiempo Real:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={testComment}
                onChange={(e) => setTestComment(e.target.value)}
                placeholder="Escribe una frase para probar el filtro..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
              <button
                onClick={handleTestScan}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Analizar
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.safe
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-[#00ff88]'
                    : 'bg-rose-950/30 border-rose-500/50 text-rose-300'
                }`}
              >
                {testResult.safe ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Contenido Seguro verificado por IA.</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Alerta: {testResult.reason}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Banned Users with Matrix Disintegration Effect */}
        <div className="p-5 rounded-2xl bg-[#0b0d14] border border-slate-800 space-y-4">
          <h3 className="font-orbitron font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <UserX className="w-4 h-4 text-[#ff0055]" />
            USUARIOS BLOQUEADOS & DESINTEGRACIÓN CUÁNTICA
          </h3>

          <div className="space-y-2.5">
            {bannedUsers.map((u) => (
              <div
                key={u.id}
                className={`p-3 rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs transition-all duration-700 ${
                  u.isDisintegrating
                    ? 'scale-50 opacity-0 blur-md bg-red-900 border-red-500'
                    : 'scale-100 opacity-100'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-200">{u.name}</div>
                  <div className="text-[11px] text-slate-400">{u.reason}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{u.timestamp}</div>
                </div>

                <button
                  onClick={() => handleDisintegrateUser(u.id)}
                  title="Desintegrar del sistema"
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold"
                >
                  Desbloquear
                </button>
              </div>
            ))}

            {bannedUsers.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No hay usuarios bloqueados en este momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
