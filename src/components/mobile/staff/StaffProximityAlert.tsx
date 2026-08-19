'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Sparkles, User, Clock, Scissors, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EventoProximidadPayload } from '@/services/proximidad';

interface StaffProximityAlertProps {
  sedeId: string;
  agenteId?: string;
  agenteNombre?: string;
}

export function StaffProximityAlert({ sedeId, agenteId, agenteNombre }: StaffProximityAlertProps) {
  const [alerta, setAlerta] = useState<EventoProximidadPayload | null>(null);

  useEffect(() => {
    if (!sedeId) return;
    const supabase = createClient();
    const channelName = `realtime-proximidad-${sedeId}`;

    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'CLIENTE_PROXIMIDAD' }, (payload: { payload: EventoProximidadPayload }) => {
        const evento = payload.payload;
        if (!evento) return;

        // Si la alerta es para este estilista o es de interés de piso
        const esParaMi =
          !agenteNombre ||
          !evento.estilistaNombre ||
          evento.estilistaNombre.toLowerCase().includes(agenteNombre.toLowerCase()) ||
          agenteNombre.toLowerCase().includes(evento.estilistaNombre.toLowerCase());

        if (esParaMi && (evento.zona === 'CERCANO' || evento.zona === 'EN_PUERTA')) {
          setAlerta(evento);

          // Vibración háptica en móvil
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([150, 80, 150]);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sedeId, agenteNombre]);

  if (!alerta) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`p-4 rounded-3xl border shadow-xl relative overflow-hidden ${
          alerta.zona === 'EN_PUERTA'
            ? 'bg-emerald-950/90 border-emerald-500/50 text-white shadow-emerald-950/50'
            : 'bg-indigo-950/90 border-indigo-500/50 text-white shadow-indigo-950/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border ${
            alerta.zona === 'EN_PUERTA'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse'
          }`}>
            <Radio className="w-3 h-3" />
            {alerta.zona === 'EN_PUERTA' ? '🚪 Cliente en Puerta' : `📍 Cliente a ${alerta.distanciaMetros}m`}
          </span>

          <button
            type="button"
            onClick={() => setAlerta(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-sm font-black text-white shrink-0 border border-white/10">
            {alerta.clienteNombre.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black text-white truncate">{alerta.clienteNombre}</h4>
            <p className="text-[10px] text-slate-300 truncate">
              {alerta.servicioNombre || 'Servicio de Cita'} • Cita {alerta.horaCita || 'Hoy'}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-indigo-200 mt-2 font-medium bg-white/5 p-2 rounded-xl border border-white/10 flex items-center gap-1.5">
          <Scissors className="w-3 h-3 text-amber-400 shrink-0" />
          <span>¡Prepara tu sillón y tus herramientas de trabajo!</span>
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
