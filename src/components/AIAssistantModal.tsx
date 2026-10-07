import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, Wand2, Lightbulb, Film } from 'lucide-react';
import { chatWithCreativeDirector } from '../services/geminiService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyIdea?: (ideaText: string) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyIdea
}) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    {
      role: 'model',
      text: '¡Saludos creador! Soy el Director Creativo de QuanticTube. ¿Qué video viral con IA Veo 3.1 o estética Cyberpunk vamos a diseñar hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, text: textToSend.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await chatWithCreativeDirector(nextMessages, textToSend);
      setMessages([...nextMessages, { role: 'model', text: reply }]);
    } catch (err) {
      console.warn('AI Director error:', err);
      setMessages([
        ...nextMessages,
        {
          role: 'model',
          text: '⚡ ¡Iniciativa genial! Te sugiero crear un Short 9:16 con Mariachi Synthwave a 128 BPM y transiciones holográficas rápidas.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Dame una idea viral para un Short 9:16 con temática Cyberpunk México',
    'Escribe un guión de 15 segundos para Veo 3.1 sobre comida futurista',
    '¿Cuáles son los 3 mejores ganchos (hooks) para retener el 90% de audiencia?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-2xl h-[580px] bg-[#090b12] rounded-3xl border border-purple-500/40 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0c0e17]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Bot className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-1.5">
                DIRECTOR CREATIVO <span className="text-purple-400">QUANTICTUBE IA</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-rajdhani">
                IMPULSADO POR GEMINI 3.8 FLASH
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 text-xs ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'model' && (
                <div className="w-7 h-7 rounded-xl bg-purple-950 border border-purple-500/50 flex items-center justify-center text-purple-300 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#00ff88]/15 border border-[#00ff88]/50 text-slate-100 rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>El Director Creativo está formulando la visión...</span>
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-2 border-t border-slate-800/80 bg-[#08090f] overflow-x-auto flex gap-1.5">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-purple-300 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <Lightbulb className="w-3 h-3 text-purple-400" />
              {qp}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-800 bg-[#0c0e17] flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre ideas virales, guiones para Veo 3.1..."
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
