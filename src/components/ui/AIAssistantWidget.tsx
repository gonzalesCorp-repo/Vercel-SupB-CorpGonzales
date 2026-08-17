'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, X, Send, User, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const userRol = useAppStore((state) => state.userRol);

  const sendMessage = async (userPrompt: string) => {
    if (!userPrompt.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userPrompt,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: {
            sedeNombre: sedeActiva?.nombre || 'General',
            userRol: userRol || 'STAFF',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error de conexión con Vercel AI Gateway');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantResponseText = '';

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          assistantResponseText += chunk;

          setMessages(prev =>
            prev.map(m => (m.id === assistantMessageId ? { ...m, content: assistantResponseText } : m))
          );
        }
      }
    } catch (err: any) {
      console.error('Error enviando mensaje a IA:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Lo siento, ocurrió un inconveniente conectando con el servicio de IA. Inténtalo nuevamente.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full text-white border border-white/20 flex items-center gap-2 group cursor-pointer transition-all"
        style={{ 
          background: 'linear-gradient(135deg, var(--active-theme-primary, #4f46e5), var(--active-theme-accent, #ec4899))',
          boxShadow: '0 0 24px var(--active-theme-glow, rgba(79, 70, 229, 0.4))'
        }}
        title="Copiloto V.AI"
      >
        <Sparkles className="w-6 h-6 animate-pulse text-white" />
        <span className="font-bold text-xs hidden md:inline-block pr-1 font-mono">V.AI</span>
      </motion.button>

      {/* Floating AI Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-20 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] md:w-96 h-[500px] bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2.5 rounded-2xl text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, var(--active-theme-primary, #4f46e5), var(--active-theme-accent, #7c3aed))' }}
                >
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                    V.AI Copilot 
                    <span 
                      className="text-[10px] border px-2 py-0.5 rounded-full font-bold"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'var(--active-theme-accent, #4f46e5)',
                        color: 'var(--active-theme-accent, #4f46e5)'
                      }}
                    >
                      Vercel AI
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Asistente Inteligente en Vivo</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={() => setMessages([])} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition" title="Limpiar chat">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar text-sm">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">¿En qué puedo ayudarte hoy?</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                      Pregúntame sobre combinaciones de insumos, estado de turnos WFM o sugerencias CRM.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 w-full pt-2">
                    <button
                      onClick={() => sendMessage('¿Cuáles son las recomendaciones para agilizar atenciones hoy?')}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-left text-indigo-300 font-medium transition"
                    >
                      💡 Agilizar atenciones del día
                    </button>
                    <button
                      onClick={() => sendMessage('¿Cómo funciona el registro de asistencia y cierre WFM?')}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs text-left text-indigo-300 font-medium transition"
                    >
                      ⏱️ Ayuda sobre asistencia WFM
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((m: Message) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role !== 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed font-medium ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                          : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                      }`}
                    >
                      {m.content}
                    </div>

                    {m.role === 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold p-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Vaikuntha AI respondiendo...
                </div>
              )}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-2xl text-xs border border-slate-700 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl transition active:scale-95 shadow-md shadow-indigo-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
