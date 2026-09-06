'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, AlertCircle, 
  Sparkles, RefreshCw, FileText, ChevronRight, Lock, 
  ExternalLink, ArrowUpRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CajaAuditoriaInput, CajaAuditoriaOutput } from '@/types/opal';
import { procesarAuditoriaCajaOpal } from '@/services/opalService';

export interface CajaAuditorOpalProps {
  input: CajaAuditoriaInput;
  onConfirmarCierreAuditado?: () => void;
}

export function CajaAuditorOpal({
  input,
  onConfirmarCierreAuditado
}: CajaAuditorOpalProps) {
  const [dataOpal, setDataOpal] = useState<CajaAuditoriaOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditadoManual, setAuditadoManual] = useState(false);

  const ejecutarAuditoria = async () => {
    setLoading(true);
    try {
      const res = await procesarAuditoriaCajaOpal(input);
      setDataOpal(res);
      setAuditadoManual(true);
    } catch (err) {
      console.error('Error al procesar auditoría Opal de caja:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ejecutarAuditoria();
  }, [
    input.total_declarado,
    input.total_esperado_sistema,
    input.diferencia,
    input.diferencia_efectivo,
    input.diferencia_vouchers
  ]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="h-4 w-48 bg-slate-800 rounded-md mb-2" />
            <div className="h-3 w-64 bg-slate-800/60 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!dataOpal) return null;

  const isConforme = dataOpal.estado_veredicto === 'CONFORME';
  const isObs = dataOpal.estado_veredicto === 'OBSERVACION_LEVE';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl p-6 border shadow-2xl backdrop-blur-xl space-y-5 transition-colors ${
        isConforme 
          ? 'bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-950/20'
          : isObs
          ? 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/40 shadow-amber-950/20'
          : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/50 shadow-rose-950/30'
      }`}
    >
      {/* Header del Agente Auditor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${
            isConforme 
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
              : isObs 
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' 
              : 'bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Google Opal AI • Auditor 360°
              </span>
              <span className="text-[9px] bg-white/10 text-slate-300 font-mono px-2 py-0.5 rounded-full">
                Score: {dataOpal.score_confianza}/100
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
              <span>Dictamen de Arqueo:</span>
              <span className={
                isConforme ? 'text-emerald-400' : isObs ? 'text-amber-400' : 'text-rose-400'
              }>
                {dataOpal.estado_veredicto.replace('_', ' ')}
              </span>
            </h3>
          </div>
        </div>

        <button 
          type="button"
          onClick={ejecutarAuditoria}
          className="self-start sm:self-auto text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-auditar
        </button>
      </div>

      {/* Resumen Ejecutivo */}
      <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
        {dataOpal.resumen_ejecutivo}
      </p>

      {/* Tarjetas de Alertas Detectadas */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Puntos de Control & Observaciones ({dataOpal.alertas.length})
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dataOpal.alertas.map(alerta => (
            <div 
              key={alerta.id}
              className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                alerta.nivel === 'CRITICO'
                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                  : alerta.nivel === 'ADVERTENCIA'
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {alerta.nivel === 'CRITICO' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : alerta.nivel === 'ADVERTENCIA' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{alerta.titulo}</span>
              </div>
              <p className="text-[11px] text-slate-300/90 leading-normal">
                {alerta.descripcion}
              </p>
              <div className="pt-1 text-[10px] font-mono text-indigo-300 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>Acción: {alerta.accion_recomendada}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocolo de Cierre Seguro */}
      <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
            Protocolo de Cierre Recomendado
          </span>
          <p className="text-slate-300 text-[11px] mt-0.5 font-medium">
            {dataOpal.protocolo_cierre_recomendado}
          </p>
        </div>

        {onConfirmarCierreAuditado && isConforme && (
          <button
            type="button"
            onClick={onConfirmarCierreAuditado}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition shrink-0 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" /> Cerrar Turno Seguro
          </button>
        )}
      </div>
    </motion.div>
  );
}
