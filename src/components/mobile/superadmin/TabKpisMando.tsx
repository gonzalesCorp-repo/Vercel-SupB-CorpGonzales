'use client';

import React from 'react';
import { 
  DollarSign, Users, Activity, Clock, ShieldCheck, 
  Sparkles, CheckCircle2, AlertTriangle, ArrowUpRight, 
  TrendingUp, Radio, RefreshCw, Layers, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TabKpisMandoProps {
  sedeActivaNombre: string;
  totalVentasHoy: number;
  totalComprobantesHoy: number;
  oatcsActivas: any[];
  staffPresente: any[];
  staffAusente: any[];
  onRefresh: () => void;
  loading: boolean;
}

export function TabKpisMando({
  sedeActivaNombre,
  totalVentasHoy,
  totalComprobantesHoy,
  oatcsActivas,
  staffPresente,
  staffAusente,
  onRefresh,
  loading
}: TabKpisMandoProps) {
  const enEspera = oatcsActivas.filter(o => o.estado_proceso === 'EN_ESPERA').length;
  const enProceso = oatcsActivas.filter(o => o.estado_proceso === 'EN_PROCESO' || o.estado_proceso === 'TRABAJANDO').length;
  const porCobrar = oatcsActivas.filter(o => o.estado_proceso === 'POR_COBRAR' || o.estado_proceso === 'PRE_COBRADO').length;

  return (
    <div className="space-y-4 pb-20">
      {/* Banner Superior Centro de Mando */}
      <div className="bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950/70 border border-purple-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-black">
              👑
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white tracking-wide">Centro de Mando</h2>
                <span className="flex items-center gap-1 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  EN VIVO
                </span>
              </div>
              <p className="text-[11px] text-purple-200/70">{sedeActivaNombre}</p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-purple-300 border border-purple-500/20 active:scale-95 transition cursor-pointer"
            title="Refrescar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-purple-500/20">
          <div className="bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Ventas Hoy</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xl font-black text-white font-mono">
              S/ {totalVentasHoy.toFixed(2)}
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {totalComprobantesHoy} comprobantes
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Órdenes Activas</span>
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-xl font-black text-white font-mono">
              {oatcsActivas.length}
            </p>
            <p className="text-[10px] text-indigo-400 mt-0.5 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> En piso y sala
            </p>
          </div>
        </div>
      </div>

      {/* Monitor de Fases de Piso */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" /> Ritmo Operativo de Piso
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-black/60 dark:bg-slate-950/80 border border-amber-500/20 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-amber-400 block uppercase">En Espera</span>
            <span className="text-lg font-black text-white font-mono">{enEspera}</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">En cola de piso</span>
          </div>

          <div className="bg-black/60 dark:bg-slate-950/80 border border-indigo-500/20 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-indigo-400 block uppercase">En Proceso</span>
            <span className="text-lg font-black text-white font-mono">{enProceso}</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">En servicio</span>
          </div>

          <div className="bg-black/60 dark:bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold text-emerald-400 block uppercase">Por Cobrar</span>
            <span className="text-lg font-black text-white font-mono">{porCobrar}</span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5">En caja</span>
          </div>
        </div>
      </div>

      {/* Monitor de Asistencia y Staff en Turno */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" /> Staff en Turno ({staffPresente.length})
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {staffAusente.length} fuera de turno
          </span>
        </div>

        <div className="space-y-2">
          {staffPresente.length === 0 ? (
            <p className="text-xs text-slate-500 p-3 bg-slate-950/50 rounded-2xl text-center">
              No hay colaboradores con asistencia registrada hoy en esta sede.
            </p>
          ) : (
            staffPresente.map((s) => (
              <div
                key={s.id}
                className="bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {s.nombre ? s.nombre.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{s.nombre}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{s.rol || 'STAFF'} • {s.especialidad || 'General'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                    s.estado === 'DISPONIBLE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : s.estado === 'OCUPADO'
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {s.estado || 'DISPONIBLE'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Estado del Sistema */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-2 shadow-xl">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" /> Infraestructura & Salud
        </h3>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-white">Supabase Realtime</p>
              <p className="text-[9px] text-emerald-400">Conectado (Active WS)</p>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-white">Servidor Dev</p>
              <p className="text-[9px] text-emerald-400">0.0.0.0:3000 (LAN OK)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
