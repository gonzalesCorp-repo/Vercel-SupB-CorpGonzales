'use client';

import React, { useState } from 'react';
import { Award, Calendar, DollarSign, CheckCircle2, TrendingUp } from 'lucide-react';

interface TabProduccionProps {
  comisionesTotal: number;
  serviciosTotal: number;
}

export function TabProduccion({ comisionesTotal, serviciosTotal }: TabProduccionProps) {
  const [filtroFecha, setFiltroFecha] = useState<'Hoy' | 'Ayer' | 'Semana'>('Hoy');

  const historial = [
    { id: '1', cliente: 'Luciana Ramos', servicio: 'Alisado Orgánico + Tratamiento', hora: '03:15 PM', monto: 65.00, estado: 'Completado' },
    { id: '2', cliente: 'Mariana Ríos', servicio: 'Corte Fade & Lavado Especial', hora: '01:20 PM', monto: 22.50, estado: 'Completado' },
    { id: '3', cliente: 'Andrea Silva', servicio: 'Balayage Premium Matizado', hora: '11:00 AM', monto: 98.00, estado: 'Completado' }
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Tarjeta de Resumen Financiero */}
      <div className="bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 p-5 rounded-3xl space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
          <Award className="w-4 h-4" /> Comisiones Acumuladas
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-400">S/. {comisionesTotal.toFixed(2)}</span>
          <span className="text-xs text-slate-400 font-semibold">({serviciosTotal} servicios)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Tus comisiones operativas generadas en tiempo real.
        </p>
      </div>

      {/* Selector de Rango */}
      <div className="flex gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
        {(['Hoy', 'Ayer', 'Semana'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFiltroFecha(r)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              filtroFecha === r
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Historial de Atenciones */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
          Detalle de Servicios Realizados
        </span>

        {historial.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between"
          >
            <div>
              <h4 className="text-xs font-bold text-slate-100">{item.cliente}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{item.servicio}</p>
              <span className="text-[9px] text-slate-500 font-mono mt-1 block">{item.hora}</span>
            </div>

            <div className="text-right">
              <span className="text-xs font-black text-amber-400 font-mono block">
                + S/. {item.monto.toFixed(2)}
              </span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block">
                {item.estado}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
