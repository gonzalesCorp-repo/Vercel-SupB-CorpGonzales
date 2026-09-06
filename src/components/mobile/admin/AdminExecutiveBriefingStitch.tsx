'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, TrendingUp, Users, AlertTriangle, 
  CheckCircle2, Clock, DollarSign, Activity, RefreshCw 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AdminExecutiveBriefingInput, AdminExecutiveBriefingOutput } from '@/types/opalMobile';
import { procesarAdminExecutiveBriefingOpal } from '@/services/opalMobileService';

export interface AdminExecutiveBriefingStitchProps {
  input: AdminExecutiveBriefingInput;
  onRefrescar?: () => void;
}

export function AdminExecutiveBriefingStitch({
  input,
  onRefrescar
}: AdminExecutiveBriefingStitchProps) {
  const [briefing, setBriefing] = useState<AdminExecutiveBriefingOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const cargarBriefing = async () => {
    setLoading(true);
    try {
      const res = await procesarAdminExecutiveBriefingOpal(input);
      setBriefing(res);
    } catch (e) {
      console.error('Error al generar briefing Opal:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBriefing();
  }, [
    input.total_ventas_hoy,
    input.oatcs_activas_count,
    input.colaboradores_activos_count,
    input.colaboradores_en_atencion_count
  ]);

  if (!briefing && loading) {
    return (
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl animate-pulse space-y-3">
        <div className="h-4 w-44 bg-slate-800 rounded" />
        <div className="h-16 bg-slate-800/60 rounded-2xl" />
      </div>
    );
  }

  if (!briefing) return null;

  const esCuelloBotella = briefing.estado_operativo_sede === 'CUELLO_BOTELLA';

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl space-y-4 text-white">
      
      {/* Header del Copilot */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block">
              Google Opal AI • Executive Copilot
            </span>
            <h4 className="text-sm font-black text-white">
              Diagnóstico de Sede en Vivo
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            cargarBriefing();
            if (onRefrescar) onRefrescar();
          }}
          className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 border border-slate-700 transition active:scale-95 cursor-pointer"
          title="Actualizar análisis"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerta de Cuello de Botella si existe */}
      {briefing.alerta_cuello_botella && (
        <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2.5 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-bold">{briefing.alerta_cuello_botella}</span>
        </div>
      )}

      {/* Resumen Ejecutivo */}
      <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
        {briefing.resumen_ejecutivo}
      </p>

      {/* Micro-HUDs Stitch: Medidor de Meta y Ocupación */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold">Meta del Día</span>
            <span className="font-mono font-bold text-indigo-300">{briefing.porcentaje_cumplimiento_meta}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500" 
              style={{ width: `${Math.min(100, briefing.porcentaje_cumplimiento_meta)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            S/ {input.total_ventas_hoy.toFixed(2)} / S/ {input.meta_ventas_hoy || 2500}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold">Ocupación Sillones</span>
            <span className="font-mono font-bold text-emerald-400">{briefing.tasa_ocupacion_sillones}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                briefing.tasa_ocupacion_sillones >= 80 
                  ? 'bg-amber-400' 
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, briefing.tasa_ocupacion_sillones)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {input.colaboradores_en_atencion_count} en atención de {input.colaboradores_activos_count}
          </span>
        </div>
      </div>

      {/* Acciones Recomendadas por Opal */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Recomendaciones Inmediatas Opal
        </span>
        {briefing.acciones_recomendadas.map((acc, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-2 text-xs text-slate-300 bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/20"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>{acc}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
