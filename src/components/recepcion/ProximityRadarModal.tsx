'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Sparkles, MapPin, X, UserCheck, ArrowRight, Bell, Volume2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EventoProximidadPayload } from '@/services/proximidad';

interface ProximityRadarModalProps {
  sedeId: string;
  onPreAsignarOatc?: (evento: EventoProximidadPayload) => void;
}

export function ProximityRadarModal({ sedeId, onPreAsignarOatc }: ProximityRadarModalProps) {
  const [eventos, setEventos] = useState<EventoProximidadPayload[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Reproducir Chime armónico de proximidad
  const playProximityChime = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      // Secuencia armónica de 3 notas: Do5 -> Mi5 -> Sol5
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    } catch (e) {
      console.warn('AudioContext no disponible para chime:', e);
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!sedeId) return;
    const supabase = createClient();
    const channelName = `realtime-proximidad-${sedeId}`;

    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'CLIENTE_PROXIMIDAD' }, (payload: { payload: EventoProximidadPayload }) => {
        const evento = payload.payload;
        if (!evento) return;

        // Añadir o actualizar evento en lista
        setEventos(prev => {
          const filtrados = prev.filter(e => e.clienteNombre !== evento.clienteNombre);
          return [evento, ...filtrados].slice(0, 3);
        });

        // Reproducir sonido si está cercano o en puerta
        if (evento.zona === 'CERCANO' || evento.zona === 'EN_PUERTA') {
          playProximityChime();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sedeId, playProximityChime]);

  const descartarEvento = (idx: number) => {
    setEventos(prev => prev.filter((_, i) => i !== idx));
  };

  if (eventos.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-auto">
      <AnimatePresence>
        {eventos.map((ev, idx) => (
          <motion.div
            key={`${ev.clienteNombre}-${idx}`}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`p-4 rounded-3xl shadow-2xl backdrop-blur-xl border relative overflow-hidden ${
              ev.zona === 'EN_PUERTA'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-white shadow-emerald-950/50'
                : 'bg-indigo-950/90 border-indigo-500/50 text-white shadow-indigo-950/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                  ev.zona === 'EN_PUERTA'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse'
                }`}>
                  <Radio className="w-3 h-3" />
                  {ev.zona === 'EN_PUERTA' ? '🚪 En Puerta (<25m)' : `📍 A ${ev.distanciaMetros}m`}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Cita {ev.horaCita || 'Hoy'}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                  title={soundEnabled ? 'Silenciar alertas' : 'Activar sonido'}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${soundEnabled ? 'text-indigo-400' : 'opacity-40'}`} />
                </button>
                <button
                  type="button"
                  onClick={() => descartarEvento(idx)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-lg font-black text-white shrink-0 border border-white/10">
                {ev.clienteNombre.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-white truncate">{ev.clienteNombre}</h4>
                <p className="text-[11px] text-slate-300 truncate">
                  {ev.servicioNombre || 'Servicio General'} • <span className="text-amber-300 font-bold">{ev.estilistaNombre || 'Staff'}</span>
                </p>
              </div>
            </div>

            {onPreAsignarOatc && (
              <button
                type="button"
                onClick={() => {
                  onPreAsignarOatc(ev);
                  descartarEvento(idx);
                }}
                className="mt-3 w-full py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 border border-white/20"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pre-Asignar Estación en Recepción</span>
                <ArrowRight className="w-3 h-3 text-slate-300 ml-1" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
