'use client';

import React from 'react';
import { NodoPipelineData } from '@/types/catalogoCanvas';
import { 
  UserCheck, Sparkles, Beaker, Scissors, Coffee, 
  DollarSign, Clock, ShieldCheck, CheckCircle2 
} from 'lucide-react';

interface NodePipelineOperativoProps {
  data: NodoPipelineData;
  seleccionado: boolean;
  onSelect: () => void;
  onToggleActivo: (id: string) => void;
}

export function NodePipelineOperativo({
  data,
  seleccionado,
  onSelect,
  onToggleActivo
}: NodePipelineOperativoProps) {
  const getIcon = () => {
    switch (data.etapa) {
      case 'CHECKIN': return <UserCheck className="w-5 h-5 text-sky-400" />;
      case 'ASESORIA': return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'LAB_DESPACHO': return <Beaker className="w-5 h-5 text-amber-400" />;
      case 'SILLA_SERVICIO': return <Scissors className="w-5 h-5 text-indigo-400" />;
      case 'BAR_LOUNGE': return <Coffee className="w-5 h-5 text-amber-500" />;
      case 'CAJA_POS': return <DollarSign className="w-5 h-5 text-emerald-400" />;
      default: return <Sparkles className="w-5 h-5 text-slate-400" />;
    }
  };

  const getCarrilBadge = () => {
    switch (data.carril) {
      case 'FOH_ANFITRIONAJE': return { label: 'Front of House (FOH)', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      case 'BOH_LABORATORIO': return { label: 'Back of House (BOH)', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'STAFF_TECNICO': return { label: 'Staff en Piso / Sillón', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'CAJA_ADMIN': return { label: 'Caja & Administración', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
  };

  const carril = getCarrilBadge();

  return (
    <div
      onClick={onSelect}
      className={`relative w-72 rounded-3xl p-4 transition-all duration-200 cursor-pointer select-none backdrop-blur-xl border ${
        seleccionado
          ? 'bg-slate-900/95 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-[1.02]'
          : data.activo
          ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-lg'
          : 'bg-slate-950/40 border-slate-900 opacity-60'
      }`}
    >
      {/* Indicador de Secuencia y Paso */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-xs">
            {getIcon()}
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Paso #{data.orden}
            </span>
            <h4 className="text-xs font-black text-white truncate max-w-[130px]">
              {data.nombre}
            </h4>
          </div>
        </div>

        {/* Toggle Activo */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleActivo(data.id);
          }}
          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition active:scale-95 ${
            data.activo
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          }`}
        >
          {data.activo ? 'En Flujo' : 'Bypass'}
        </button>
      </div>

      {/* Cuerpo del Nodo */}
      <div className="py-2.5 space-y-2">
        <p className="text-[11px] text-slate-400 leading-snug">
          {data.subtitulo}
        </p>

        {/* Carril de Responsabilidad */}
        <div className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-xl border inline-block ${carril.bg}`}>
          {carril.label}
        </div>

        {/* Métricas de la etapa */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Tiempo Base</span>
            <span className="text-xs font-black text-indigo-400 font-mono flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {data.tiempoEstimadoMin} min
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">Responsable</span>
            <span className="text-[11px] font-bold text-slate-200 truncate block mt-0.5">
              {data.perfilResponsable}
            </span>
          </div>
        </div>

        {/* Hardware Involucrado */}
        {data.requiereHardware.length > 0 && (
          <div className="pt-1 flex items-center gap-1 flex-wrap">
            {data.requiereHardware.map((hw, idx) => (
              <span key={idx} className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono border border-slate-700/60">
                ⚡ {hw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Puerto de Salida / Conector */}
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-indigo-500 shadow-md flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
      </div>

      {/* Puerto de Entrada */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      </div>
    </div>
  );
}
