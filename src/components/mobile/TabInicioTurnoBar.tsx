'use client';

import React, { useState } from 'react';
import { Bell, Coffee, Sparkles, Wifi } from 'lucide-react';
import { TabAlertas } from './TabAlertas';
import { TabBar } from './TabBar';

interface TabInicioTurnoBarProps {
  agenteId: string;
  agenteNombre: string;
  estadoActual: string;
  clienteActual?: string | null;
  onEstadoCambiado: (nuevoEstado: string) => void;
}

export function TabInicioTurnoBar({
  agenteId,
  agenteNombre,
  estadoActual,
  clienteActual,
  onEstadoCambiado
}: TabInicioTurnoBarProps) {
  const [seccionActiva, setSeccionActiva] = useState<'asistencia' | 'bar'>('asistencia');

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Segmented Toggle Superior Rápido (Estilo iOS) */}
      <div className="flex gap-1.5 p-1 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-inner">
        <button
          type="button"
          onClick={() => setSeccionActiva('asistencia')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            seccionActiva === 'asistencia'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>🚨 Asistencia NFC</span>
        </button>

        <button
          type="button"
          onClick={() => setSeccionActiva('bar')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            seccionActiva === 'bar'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-200'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>🍹 Bar & Cafetería</span>
        </button>
      </div>

      {/* Contenido Dinámico según la sección seleccionada */}
      <div>
        {seccionActiva === 'asistencia' ? (
          <TabAlertas
            agenteId={agenteId}
            agenteNombre={agenteNombre}
            estadoActual={estadoActual}
            onEstadoCambiado={onEstadoCambiado}
          />
        ) : (
          <TabBar clienteNombre={clienteActual} />
        )}
      </div>

    </div>
  );
}
