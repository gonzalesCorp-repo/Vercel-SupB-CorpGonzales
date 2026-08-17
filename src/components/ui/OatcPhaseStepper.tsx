'use client';

import React from 'react';
import { Clock, Check, Sparkles, UserCheck, Scissors, CreditCard } from 'lucide-react';

export type FaseOatc = 'EN_ESPERA' | 'ASESORIA' | 'EN_PROCESO' | 'EN_EXPOSICION' | 'POR_COBRAR' | 'FINALIZADO' | 'CANCELADO';

interface OatcPhaseStepperProps {
  faseActual: FaseOatc | string;
  tiempoMinutos?: number;
  onCambiarFase?: (nuevaFase: FaseOatc) => void;
  compacto?: boolean;
}

interface StepConfig {
  id: FaseOatc;
  numero: number;
  label: string;
  colorActivo: string;
  bgActivo: string;
  borderActivo: string;
  badgeTexto: string;
  icon: any;
}

const PASOS: StepConfig[] = [
  {
    id: 'EN_ESPERA',
    numero: 1,
    label: 'En Espera',
    colorActivo: 'text-amber-400',
    bgActivo: 'bg-amber-500',
    borderActivo: 'border-amber-500/50',
    badgeTexto: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: Clock
  },
  {
    id: 'ASESORIA',
    numero: 2,
    label: 'Asesoría',
    colorActivo: 'text-purple-400',
    bgActivo: 'bg-purple-600',
    borderActivo: 'border-purple-500/50',
    badgeTexto: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    icon: UserCheck
  },
  {
    id: 'EN_PROCESO',
    numero: 3,
    label: 'En Servicio',
    colorActivo: 'text-emerald-400',
    bgActivo: 'bg-emerald-500',
    borderActivo: 'border-emerald-500/50',
    badgeTexto: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: Scissors
  },
  {
    id: 'POR_COBRAR',
    numero: 4,
    label: 'Por Cobrar',
    colorActivo: 'text-sky-400',
    bgActivo: 'bg-sky-500',
    borderActivo: 'border-sky-500/50',
    badgeTexto: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    icon: CreditCard
  }
];

export function OatcPhaseStepper({
  faseActual,
  tiempoMinutos,
  onCambiarFase,
  compacto = false
}: OatcPhaseStepperProps) {
  
  const getNumeroPaso = (fase: string) => {
    if (fase === 'EN_ESPERA') return 1;
    if (fase === 'ASESORIA') return 2;
    if (fase === 'EN_PROCESO' || fase === 'EN_EXPOSICION') return 3;
    if (fase === 'POR_COBRAR') return 4;
    if (fase === 'FINALIZADO') return 5;
    return 1;
  };

  const pasoActualNum = getNumeroPaso(faseActual);

  if (compacto) {
    if (faseActual === 'EN_EXPOSICION') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse">
            <span>⏳ En Exposición</span>
          </span>
        </div>
      );
    }

    const pasoActual = PASOS.find(p => p.id === faseActual) || PASOS[0];
    const Icon = pasoActual.icon;

    return (
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${pasoActual.badgeTexto}`}>
          <Icon className="w-3 h-3" />
          <span>{pasoActual.label}</span>
          {faseActual === 'EN_PROCESO' && tiempoMinutos !== undefined && (
            <span className="font-mono ml-0.5">({tiempoMinutos}m)</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 py-1 select-none">
      
      {/* Barra de Progreso y Conectores */}
      <div className="relative flex items-center justify-between">
        
        {/* Línea de fondo */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-800 rounded-full z-0" />
        
        {/* Línea activa con gradiente cromático */}
        <div 
          className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500 rounded-full z-0 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, ((pasoActualNum - 1) / 3) * 100))}%` }}
        />

        {PASOS.map((paso) => {
          const isActivo = faseActual === paso.id;
          const isCompletado = pasoActualNum > paso.numero;
          const Icon = paso.icon;

          return (
            <button
              key={paso.id}
              type="button"
              disabled={!onCambiarFase}
              onClick={() => onCambiarFase && onCambiarFase(paso.id)}
              className={`relative z-10 flex flex-col items-center gap-1 transition-all ${
                onCambiarFase ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
              }`}
            >
              {/* Círculo del paso */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-md ${
                isActivo
                  ? `${paso.bgActivo} text-white ring-4 ${paso.borderActivo} animate-pulse`
                  : isCompletado
                  ? 'bg-slate-850 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}>
                {isCompletado ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Etiqueta del Paso */}
              <span className={`text-[10px] font-bold tracking-tight ${
                isActivo 
                  ? `${paso.colorActivo} font-black` 
                  : isCompletado 
                  ? 'text-slate-300' 
                  : 'text-slate-500'
              }`}>
                {paso.label}
              </span>
            </button>
          );
        })}

      </div>

    </div>
  );
}
