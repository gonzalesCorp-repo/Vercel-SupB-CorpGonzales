'use client';

import React, { useState } from 'react';
import { 
  Sun, Moon, CloudRain, Sparkles, Clock, CheckCircle2, 
  Play, ShieldCheck, Heart, Droplets, Wind, ArrowRight 
} from 'lucide-react';
import { 
  VitalidadCapilarStitch, 
  RutinaClimatologicaOpal, 
  PreferenciaSensorialCliente 
} from '@/types/clienteLifestyle';
import { StitchVitalityIndexHUD } from './StitchVitalityIndexHUD';
import { StitchBreathingTimerModal } from './StitchBreathingTimerModal';

interface ClienteSantuarioTabProps {
  vitalidad: VitalidadCapilarStitch;
  rutinaOpal: RutinaClimatologicaOpal;
  preferencias: PreferenciaSensorialCliente;
  onExplorarDiagnostico: () => void;
}

export function ClienteSantuarioTab({
  vitalidad,
  rutinaOpal,
  preferencias,
  onExplorarDiagnostico
}: ClienteSantuarioTabProps) {
  const [pasosCompletados, setPasosCompletados] = useState<string[]>([]);
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [timerConfig, setTimerConfig] = useState({ titulo: '', minutos: 10, instruccion: '' });

  const togglePaso = (id: string) => {
    setPasosCompletados(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  const abrirTimer = (titulo: string, minutos: number, instruccion: string) => {
    setTimerConfig({ titulo, minutos, instruccion });
    setTimerModalOpen(true);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* 1. Micro-HUD Stitch Anillo de Vitalidad */}
      <StitchVitalityIndexHUD
        vitalidad={vitalidad}
        onExplorarDiagnostico={onExplorarDiagnostico}
      />

      {/* 2. Tarjeta Climatológica Opal AI */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/20 rounded-3xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
              Pronóstico de Cuidado Opal AI
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            {rutinaOpal.clima.temperatura_celsius}°C • Humedad {rutinaOpal.clima.humedad_relativa}% • UV {rutinaOpal.clima.indice_uv}
          </span>
        </div>

        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
          {rutinaOpal.alerta_ambiental}
        </p>

        <div className="p-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-indigo-500/10 text-xs italic text-slate-600 dark:text-slate-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>&ldquo;{rutinaOpal.consejo_zen}&rdquo;</span>
        </div>
      </div>

      {/* 3. Pausas Zen con Temporizador Sensorial Web Audio */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Pausas de Autocuidado Sensorial
          </h3>
          <span className="text-[10px] text-pink-500 font-bold">Web Audio 432 Hz</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => abrirTimer(
              'Pausa Zen: Mascarilla Nutritiva', 
              10, 
              'Aplica de medios a puntas. Respira con el halo de luz mientras la fibra absorbe los lípidos.'
            )}
            className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 border border-pink-500/20 text-left transition cursor-pointer active:scale-95 space-y-1.5"
          >
            <div className="w-7 h-7 rounded-xl bg-pink-500 text-white flex items-center justify-center">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                Mascarilla (10 min)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Respiración guiada y cuenco
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => abrirTimer(
              'Pausa Zen: Masaje Capilar de Raíces', 
              3, 
              'Masajea en círculos suaves con las yemas de tus dedos para estimular la microcirculación.'
            )}
            className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 hover:from-indigo-500/20 hover:to-cyan-500/20 border border-indigo-500/20 text-left transition cursor-pointer active:scale-95 space-y-1.5"
          >
            <div className="w-7 h-7 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                Masaje Raíces (3 min)
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Oxigenación del folículo
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Rutina AM del Santuario */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Rutina de Mañana (Protección & Luz)
          </h3>
        </div>

        <div className="space-y-2">
          {rutinaOpal.rutina_am.map(paso => {
            const completado = pasosCompletados.includes(paso.id);
            return (
              <div
                key={paso.id}
                onClick={() => togglePaso(paso.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  completado
                    ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-pink-300'
                }`}
              >
                <div className="space-y-0.5">
                  <span className={`text-xs font-bold block ${completado ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                    {paso.titulo}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {paso.descripcion}
                  </p>
                  {paso.producto_sugerido && (
                    <span className="text-[9px] font-bold text-pink-500 dark:text-pink-400 uppercase tracking-wider block pt-0.5">
                      ✨ Sugerido: {paso.producto_sugerido}
                    </span>
                  )}
                </div>

                <div className="shrink-0 mt-0.5">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    completado ? 'bg-pink-500 border-pink-500 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {completado && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Rutina PM del Santuario */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Rutina de Noche (Nutrición & Descanso)
          </h3>
        </div>

        <div className="space-y-2">
          {rutinaOpal.rutina_pm.map(paso => {
            const completado = pasosCompletados.includes(paso.id);
            return (
              <div
                key={paso.id}
                onClick={() => togglePaso(paso.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  completado
                    ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-0.5">
                  <span className={`text-xs font-bold block ${completado ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                    {paso.titulo}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {paso.descripcion}
                  </p>
                  {paso.producto_sugerido && (
                    <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block pt-0.5">
                      🌙 Sugerido: {paso.producto_sugerido}
                    </span>
                  )}
                </div>

                <div className="shrink-0 mt-0.5">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    completado ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {completado && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Temporizador Sensorial */}
      <StitchBreathingTimerModal
        isOpen={timerModalOpen}
        onClose={() => setTimerModalOpen(false)}
        titulo={timerConfig.titulo}
        minutosIniciales={timerConfig.minutos}
        instruccionZen={timerConfig.instruccion}
      />

    </div>
  );
}
