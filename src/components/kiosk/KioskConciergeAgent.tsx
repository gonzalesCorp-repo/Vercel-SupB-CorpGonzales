'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Coffee, Clock, HeartHandshake, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { ClienteVipPerfil } from '@/services/clientes';
import { KioskConciergeOutput } from './types';
import { procesarKioskConciergeOpal } from '@/services/opalService';

export interface KioskConciergeAgentProps {
  clienteVip: ClienteVipPerfil;
  branding: any;
  onPedirBebida: (bebida: string) => void;
}

export function KioskConciergeAgent({ clienteVip, branding, onPedirBebida }: KioskConciergeAgentProps) {
  const [conciergeData, setConciergeData] = useState<KioskConciergeOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [bebidaPedida, setBebidaPedida] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    procesarKioskConciergeOpal({
      cliente_id: clienteVip.cliente.id,
      nombre_cliente: clienteVip.cliente.nombre,
      hora_ingreso: new Date().toISOString(),
      puntos_actuales: clienteVip.puntosVaikuntha
    }).then(res => {
      if (isMounted) {
        setConciergeData(res);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Error cargando concierge Opal:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [clienteVip.cliente.id, clienteVip.cliente.nombre, clienteVip.puntosVaikuntha]);

  if (loading) {
    return (
      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 flex items-center justify-center gap-3 text-xs text-purple-300 animate-pulse">
        <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
        <span>Google Opal AI Concierge preparando tu experiencia de bienvenida...</span>
      </div>
    );
  }

  if (!conciergeData) return null;

  const handlePedir = () => {
    setBebidaPedida(true);
    onPedirBebida(conciergeData.bebida_sugerida.nombre);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/40 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Concierge */}
      <div className="relative z-10 flex items-center justify-between border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shadow-md shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                {branding.brandName} Concierge
              </h3>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full font-bold uppercase">
                Opal AI
              </span>
            </div>
            <p className="text-[11px] text-purple-200/80 font-medium">Asistencia y cortesías en tiempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] text-purple-300 font-bold">
          <Clock className="w-3 h-3 text-amber-300" />
          <span>Espera aprox: ~{conciergeData.tiempo_espera_estimado_minutos} min</span>
        </div>
      </div>

      {/* Saludo Personalizado */}
      <p className="text-xs text-slate-200 leading-relaxed relative z-10">
        {conciergeData.saludo_personalizado}
      </p>

      {/* Tarjeta de Bebida Sugerida de Cortesía */}
      <div className="relative z-10 p-3.5 bg-slate-950/80 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Sugerencia Especial de Bienvenida
            </span>
            <h4 className="text-xs font-black text-white mt-0.5">
              {conciergeData.bebida_sugerida.nombre}
            </h4>
            <p className="text-[10px] text-slate-400 leading-snug">
              {conciergeData.bebida_sugerida.descripcion}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePedir}
          disabled={bebidaPedida}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-md ${
            bebidaPedida
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 active:scale-95'
          }`}
        >
          {bebidaPedida ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Solicitada al Bar</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Aceptar Cortesía (1-Toque)</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
