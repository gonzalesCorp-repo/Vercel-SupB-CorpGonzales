'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Calendar, Gift, Heart, ArrowRight, CheckCircle2, Clock 
} from 'lucide-react';
import { ClientBeautyInput, ClientBeautyOutput } from '@/types/opal';
import { procesarClientBeautyAdvisorOpal } from '@/services/opalService';

export interface ClientBeautyAdvisorProps {
  cliente: {
    id: string;
    nombre: string;
    puntos_lumina?: number;
    rango_vip?: string;
  };
  historialAtenciones?: any[];
  onSolicitarCita?: (servicio: string) => void;
}

export function ClientBeautyAdvisor({
  cliente,
  historialAtenciones = [],
  onSolicitarCita
}: ClientBeautyAdvisorProps) {
  const [dataOpal, setDataOpal] = useState<ClientBeautyOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [citaSolicitada, setCitaSolicitada] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const ultimos = historialAtenciones.slice(0, 3).map(a => ({
      nombre: a.punto_partida?.[0]?.nombre || 'Atención en Salón',
      fecha: a.created_at || new Date().toISOString()
    }));

    const input: ClientBeautyInput = {
      cliente_id: cliente.id,
      nombre_cliente: cliente.nombre,
      ultimos_servicios: ultimos,
      puntos_actuales: cliente.puntos_lumina || 0
    };

    procesarClientBeautyAdvisorOpal(input).then(res => {
      if (isMounted) {
        setDataOpal(res);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Error cargando Beauty Advisor:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [cliente.id, cliente.nombre, cliente.puntos_lumina, historialAtenciones]);

  if (loading) {
    return (
      <div className="p-4 rounded-3xl bg-pink-500/5 dark:bg-pink-500/10 border border-pink-500/20 flex items-center justify-center gap-2 text-xs text-pink-600 dark:text-pink-300 animate-pulse">
        <Sparkles className="w-4 h-4 animate-spin" />
        <span>Tu Asesor de Belleza Opal AI está analizando tus cuidados...</span>
      </div>
    );
  }

  if (!dataOpal) return null;

  const handleCita = () => {
    setCitaSolicitada(true);
    if (onSolicitarCita) {
      onSolicitarCita(dataOpal.proxima_cita_recomendada.servicio_sugerido);
    }
  };

  return (
    <div className="bg-gradient-to-br from-pink-50/60 via-white to-purple-50/60 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 border border-pink-200/80 dark:border-pink-500/30 rounded-3xl p-5 shadow-lg space-y-4 transition-colors">
      
      {/* Header Asesor */}
      <div className="flex items-center justify-between border-b border-pink-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 dark:bg-pink-500/20 text-pink-600 dark:text-pink-300 border border-pink-500/20 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-pink-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Beauty Advisor
              </h4>
              <span className="text-[9px] bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30 px-1.5 py-0.2 rounded font-bold">
                Opal AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Consejos y cuidados personalizados</p>
          </div>
        </div>

        <span className="text-[10px] bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-2 py-0.5 rounded-full font-bold">
          {cliente.rango_vip || 'VIP Gold'}
        </span>
      </div>

      {/* Consejo Personalizado */}
      <div className="p-3 bg-white dark:bg-slate-950/70 border border-pink-100 dark:border-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
        💡 {dataOpal.consejo_personalizado}
      </div>

      {/* Próxima Cita Sugerida */}
      <div className="p-3.5 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 text-[10px] font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Re-agendamiento Ideal: ~{dataOpal.proxima_cita_recomendada.fecha_estimada}</span>
          </div>
          <h5 className="text-xs font-black text-slate-900 dark:text-white">
            {dataOpal.proxima_cita_recomendada.servicio_sugerido}
          </h5>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            {dataOpal.proxima_cita_recomendada.motivo}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCita}
          disabled={citaSolicitada}
          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition cursor-pointer shrink-0 min-h-[36px] ${
            citaSolicitada
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md shadow-pink-600/20 active:scale-95'
          }`}
        >
          {citaSolicitada ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cita Solicitada</span>
            </>
          ) : (
            <>
              <span>Separar Fecha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Beneficio de Puntos Disponible */}
      {dataOpal.beneficio_fidelidad && (
        <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {dataOpal.beneficio_fidelidad.recompensa}
            </span>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            dataOpal.beneficio_fidelidad.disponible_ahora 
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          }`}>
            {dataOpal.beneficio_fidelidad.disponible_ahora ? '¡Canje Disponible!' : `${dataOpal.beneficio_fidelidad.puntos_necesarios} pts`}
          </span>
        </div>
      )}

    </div>
  );
}
