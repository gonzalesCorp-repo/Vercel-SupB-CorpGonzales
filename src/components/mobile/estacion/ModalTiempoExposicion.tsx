'use client';

import React from 'react';
import { X, Clock } from 'lucide-react';

interface ModalTiempoExposicionProps {
  isOpen: boolean;
  onClose: () => void;
  minutos: number;
  setMinutos: (m: number) => void;
  motivo: string;
  setMotivo: (m: string) => void;
  onIniciarExposicion: () => void;
  isProcessing: boolean;
}

export function ModalTiempoExposicion({
  isOpen,
  onClose,
  minutos,
  setMinutos,
  motivo,
  setMotivo,
  onIniciarExposicion,
  isProcessing
}: ModalTiempoExposicionProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-800 space-y-4 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-black text-white">Tiempo de Exposición</h4>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <p className="text-xs text-slate-300">
            Fija el tiempo de pose para el tratamiento químico. Se notificará a Recepción/Bar y quedarás libre para atenciones rápidas.
          </p>

          {/* Minutos Presets */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Tiempo de Pose (Minutos):</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[15, 20, 30, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutos(m)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition ${
                    minutos === m
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>

          {/* Motivo de Exposición */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Tratamiento / Motivo:</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors rounded-xl text-xs text-white outline-none"
            >
              <option value="🎨 Tinte / Coloración Global">🎨 Tinte / Coloración Global</option>
              <option value="✨ Decoloración / Balayage">✨ Decoloración / Balayage</option>
              <option value="💆 Tratamiento Capilar / Keratina">💆 Tratamiento Capilar / Keratina</option>
              <option value="🧖 Mascarilla / Hidratación Profunda">🧖 Mascarilla / Hidratación Profunda</option>
              <option value="🧪 Otro Tratamiento Químico">🧪 Otro Tratamiento Químico</option>
            </select>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1">
            <p className="text-[10px] text-amber-300 font-bold">
              💡 Notificación Automática:
            </p>
            <p className="text-[10px] text-slate-400">
              El personal de sala sabrá que el cliente está esperando y podrá ofrecerle algo del bar o realizarle manicure/pedicure complementario.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onIniciarExposicion}
              disabled={isProcessing}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5" /> Iniciar Exposición
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
