'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface TonoItem {
  altura: string;
  nombre: string;
  colorHex: string;
  subtono: string;
}

export const ESCALA_TONOS_OFICIAL: TonoItem[] = [
  { altura: '1', nombre: 'Negro Profundo', colorHex: '#121214', subtono: 'Azulado' },
  { altura: '2', nombre: 'Moreno Natural', colorHex: '#1e1c1b', subtono: 'Frío' },
  { altura: '3', nombre: 'Castaño Oscuro', colorHex: '#312520', subtono: 'Rojizo sutil' },
  { altura: '4', nombre: 'Castaño Medio', colorHex: '#48352b', subtono: 'Cálido neutro' },
  { altura: '5', nombre: 'Castaño Claro', colorHex: '#5e4334', subtono: 'Dorado suave' },
  { altura: '6', nombre: 'Rubio Oscuro', colorHex: '#79583f', subtono: 'Caramelo' },
  { altura: '7', nombre: 'Rubio Medio', colorHex: '#99734e', subtono: 'Dorado miel' },
  { altura: '8', nombre: 'Rubio Claro', colorHex: '#c09869', subtono: 'Trigo luminoso' },
  { altura: '9', nombre: 'Rubio Muy Claro', colorHex: '#dec08f', subtono: 'Arena perlada' },
  { altura: '10', nombre: 'Rubio Platino', colorHex: '#f5e4be', subtono: 'Nácar extra claro' }
];

interface StitchToneScaleSelectorProps {
  label: string;
  valorSeleccionado: string;
  onSeleccionar: (altura: string) => void;
  descripcion?: string;
}

export function StitchToneScaleSelector({
  label,
  valorSeleccionado,
  onSeleccionar,
  descripcion
}: StitchToneScaleSelectorProps) {
  const handleSelect = (altura: string) => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    onSeleccionar(altura);
  };

  const seleccionadoItem = ESCALA_TONOS_OFICIAL.find(t => t.altura === valorSeleccionado) || ESCALA_TONOS_OFICIAL[3];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider block">
            {label}
          </label>
          {descripcion && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {descripcion}
            </p>
          )}
        </div>

        {/* Preview del tono actual seleccionado */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div 
            className="w-4 h-4 rounded-full border border-white/30 shadow-xs shrink-0" 
            style={{ backgroundColor: seleccionadoItem.colorHex }}
          />
          <span className="text-[11px] font-bold text-slate-800 dark:text-white">
            {seleccionadoItem.altura}. {seleccionadoItem.nombre}
          </span>
        </div>
      </div>

      {/* Carrusel Táctil Horizontal Ergonómico (44px+ de alto) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1 snap-x">
        {ESCALA_TONOS_OFICIAL.map((tono) => {
          const isSelected = tono.altura === valorSeleccionado;
          return (
            <button
              key={tono.altura}
              type="button"
              onClick={() => handleSelect(tono.altura)}
              className={`min-w-[54px] h-14 rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all snap-start cursor-pointer active:scale-95 shrink-0 ${
                isSelected
                  ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 scale-105 shadow-md shadow-pink-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div 
                className="w-6 h-6 rounded-full border border-white/20 shadow-xs flex items-center justify-center relative"
                style={{ backgroundColor: tono.colorHex }}
              >
                {isSelected && (
                  <Check className={`w-3.5 h-3.5 ${parseInt(tono.altura) >= 8 ? 'text-slate-900' : 'text-white'}`} />
                )}
              </div>
              <span className="text-[10px] font-black font-mono mt-1 text-slate-700 dark:text-slate-300">
                N° {tono.altura}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
