'use client';

import React from 'react';
import { X, Check } from 'lucide-react';

interface ModalSelectorEstacionProps {
  isOpen: boolean;
  onClose: () => void;
  estaciones: string[];
  estacionActual: string;
  onSeleccionarEstacion: (est: string) => void;
}

export function ModalSelectorEstacion({
  isOpen,
  onClose,
  estaciones,
  estacionActual,
  onSeleccionarEstacion
}: ModalSelectorEstacionProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950/80 dark:bg-black/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">Seleccionar Estación Física</h4>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {estaciones.map((est, idx) => (
            <button key={idx}
              onClick={() => onSeleccionarEstacion(est)}
              className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                estacionActual === est
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700'
              }`}
            >
              <span>{est}</span>
              {estacionActual === est && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
