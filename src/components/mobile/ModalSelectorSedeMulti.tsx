'use client';

import React from 'react';
import { Building2, Check, MapPin, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export interface SedeOpcion {
  id: string;
  nombre: string;
  direccion?: string;
}

interface ModalSelectorSedeMultiProps {
  isOpen: boolean;
  onClose: () => void;
  sedes: SedeOpcion[];
  sedeActualId?: string;
  onSelectSede: (sede: SedeOpcion) => void;
  esObligatorio?: boolean;
}

export function ModalSelectorSedeMulti({
  isOpen,
  onClose,
  sedes,
  sedeActualId,
  onSelectSede,
  esObligatorio = false
}: ModalSelectorSedeMultiProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ¿En qué sede trabajas hoy?
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Selecciona tu salón operativo
              </p>
            </div>
          </div>

          {!esObligatorio && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Lista de Sedes Asignadas */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
          {sedes.map((s) => {
            const isSelected = s.id === sedeActualId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelectSede(s);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all active:scale-95 flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/70 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <h4 className={`text-xs font-black truncate ${isSelected ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                    {s.nombre}
                  </h4>
                  {s.direccion && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{s.direccion}</span>
                    </p>
                  )}
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'border border-slate-300 dark:border-slate-600 text-transparent'
                }`}>
                  <Check className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Pie */}
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          Puedes cambiar de sede en cualquier momento desde la cabecera del sistema.
        </p>

      </div>
    </div>
  );
}
