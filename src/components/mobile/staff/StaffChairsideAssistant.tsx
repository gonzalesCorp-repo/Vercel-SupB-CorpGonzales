'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, ShoppingBag, DollarSign, Play, Pause, RotateCcw, 
  CheckCircle2, AlertTriangle, Plus, ChevronDown, ChevronUp, Zap 
} from 'lucide-react';
import { StaffChairsideInput, StaffChairsideOutput, ProductoCrossSellingOpal } from '@/types/opal';
import { procesarStaffChairsideOpal } from '@/services/opalService';

export interface StaffChairsideAssistantProps {
  oatcActiva?: any | null;
  agenteNombre?: string;
  onAnadirProductoOatc?: (producto: ProductoCrossSellingOpal) => void;
}

export function StaffChairsideAssistant({
  oatcActiva,
  agenteNombre,
  onAnadirProductoOatc
}: StaffChairsideAssistantProps) {
  const [dataOpal, setDataOpal] = useState<StaffChairsideOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(true);

  // Cronómetro de Exposición
  const [segundosRestantes, setSegundosRestantes] = useState<number>(0);
  const [timerCorriendo, setTimerCorriendo] = useState(false);
  const [agregados, setAgregados] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!oatcActiva) return;

    let isMounted = true;
    setLoading(true);

    const input: StaffChairsideInput = {
      oatc_id: oatcActiva.id,
      cliente_nombre: oatcActiva.cliente_nombre,
      servicios_activos: Array.isArray(oatcActiva.punto_partida) ? oatcActiva.punto_partida : [],
      porcentaje_comision_staff: 40
    };

    procesarStaffChairsideOpal(input).then(res => {
      if (isMounted) {
        setDataOpal(res);
        if (res.tiempo_exposicion_sugerido_minutos > 0 && segundosRestantes === 0) {
          setSegundosRestantes(res.tiempo_exposicion_sugerido_minutos * 60);
        }
        setLoading(false);
      }
    }).catch(err => {
      console.error('Error procesando Chairside Assistant:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [oatcActiva?.id, oatcActiva?.punto_partida]);

  // Tick del temporizador
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerCorriendo && segundosRestantes > 0) {
      interval = setInterval(() => {
        setSegundosRestantes(prev => prev - 1);
      }, 1000);
    } else if (segundosRestantes === 0 && timerCorriendo) {
      setTimerCorriendo(false);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([300, 150, 300]);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerCorriendo, segundosRestantes]);

  if (!oatcActiva) return null;

  const formatTiempo = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleToggleTimer = () => setTimerCorriendo(prev => !prev);
  const handleResetTimer = () => {
    setTimerCorriendo(false);
    setSegundosRestantes((dataOpal?.tiempo_exposicion_sugerido_minutos || 30) * 60);
  };

  const handleAnadir = (prod: ProductoCrossSellingOpal) => {
    setAgregados(prev => ({ ...prev, [prod.id]: true }));
    if (onAnadirProductoOatc) {
      onAnadirProductoOatc(prod);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-4 shadow-xl space-y-3.5 transition-all">
      
      {/* Header Expandible */}
      <div 
        onClick={() => setExpandido(prev => !prev)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Chairside Copilot
              </h4>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-bold">
                Opal AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Asistente en sillón de atención</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dataOpal && (
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              +S/ {dataOpal.comision_servicio_actual.toFixed(2)} devengados
            </span>
          )}
          {expandido ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expandido && (
        <div className="space-y-3 pt-1 border-t border-slate-800/80 animate-in fade-in">
          
          {/* Cronómetro de Exposición Química */}
          {dataOpal && dataOpal.tiempo_exposicion_sugerido_minutos > 0 && (
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Tiempo de Exposición</span>
                  <span className={`text-base font-black font-mono ${
                    segundosRestantes === 0 ? 'text-rose-400 animate-pulse' : 'text-white'
                  }`}>
                    {formatTiempo(segundosRestantes)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer min-h-[36px] ${
                    timerCorriendo
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  {timerCorriendo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{timerCorriendo ? 'Pausar' : 'Iniciar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetTimer}
                  title="Reiniciar temporizador"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Alerta Técnica si aplica */}
          {dataOpal?.alerta_tecnica && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>{dataOpal.alerta_tecnica}</span>
            </div>
          )}

          {/* Sugerencia de Venta Cruzada en Sillón */}
          {dataOpal && dataOpal.productos_cross_selling.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-indigo-400" />
                  <span>Venta Cruzada en Sillón</span>
                </span>
                <span className="text-[10px] font-bold text-amber-400">
                  Potencial: +S/ {dataOpal.comision_potencial_upsell.toFixed(2)} comisión
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dataOpal.productos_cross_selling.map((prod) => {
                  const yaAgregado = agregados[prod.id];
                  return (
                    <div 
                      key={prod.id}
                      className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col justify-between gap-1.5"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h5 className="text-[11px] font-bold text-white leading-tight">{prod.nombre}</h5>
                          <span className="text-[11px] font-black font-mono text-emerald-400 shrink-0 ml-1">
                            S/ {prod.precio.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-tight mt-1">{prod.motivo_recomendacion}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                        <span className="text-[9px] text-indigo-300 font-bold">
                          Tu comisión: +S/ {prod.comision_estimada.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAnadir(prod)}
                          disabled={yaAgregado}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition cursor-pointer min-h-[32px] ${
                            yaAgregado
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {yaAgregado ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{yaAgregado ? 'Agregado' : 'Añadir'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
