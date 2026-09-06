'use client';

import React from 'react';
import { Sparkles, ShieldCheck, Droplets, Sun, Flame, Wind } from 'lucide-react';
import { VitalidadCapilarStitch } from '@/types/clienteLifestyle';

interface StitchVitalityIndexHUDProps {
  vitalidad: VitalidadCapilarStitch;
  onExplorarDiagnostico?: () => void;
}

export function StitchVitalityIndexHUD({
  vitalidad,
  onExplorarDiagnostico
}: StitchVitalityIndexHUDProps) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (vitalidad.score_general / 100) * circumference;

  const colorScore = 
    vitalidad.score_general >= 85 ? 'text-emerald-500' :
    vitalidad.score_general >= 70 ? 'text-amber-500' : 'text-rose-500';

  const colorStroke = 
    vitalidad.score_general >= 85 ? '#10b981' :
    vitalidad.score_general >= 70 ? '#f59e0b' : '#f43f5e';

  const estadoBadge = 
    vitalidad.estado_cuticula === 'SELLADA' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
    vitalidad.estado_cuticula === 'LIGERAMENTE_ABIERTA' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Vitalidad Capilar Stitch HUD
          </span>
        </div>

        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${estadoBadge}`}>
          Cutícula {vitalidad.estado_cuticula.replace('_', ' ')}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Anillo Radial SVG Stitch */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              className="text-slate-100 dark:text-slate-800"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={colorStroke}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-xl font-black font-mono tracking-tight ${colorScore}`}>
              {vitalidad.score_general}%
            </span>
            <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">
              Salud
            </span>
          </div>
        </div>

        {/* Desglose de 3 Ejes */}
        <div className="flex-1 space-y-2">
          <div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-500" /> Hidratación
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{vitalidad.hidratacion}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-500 rounded-full transition-all duration-700" 
                style={{ width: `${vitalidad.hidratacion}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-500" /> Nutrición Lipídica
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{vitalidad.nutricion_lipidica}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-700" 
                style={{ width: `${vitalidad.nutricion_lipidica}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-500" /> Escudo Térmico
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{vitalidad.proteccion_termica}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all duration-700" 
                style={{ width: `${vitalidad.proteccion_termica}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
