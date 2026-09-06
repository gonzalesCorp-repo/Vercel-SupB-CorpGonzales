'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ShieldCheck, AlertTriangle, AlertCircle, 
  CheckCircle2, DollarSign, RefreshCw, FileCheck, 
  UserCheck, ArrowRight, Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PreAuditoriaLiquidacionInput, PreAuditoriaLiquidacionOutput } from '@/types/opal';
import { procesarPreAuditoriaLiquidacionOpal } from '@/services/opalService';

export interface LiquidacionesPreAuditorOpalProps {
  liquidacionesPendientes: any[];
  onLoteAprobado?: () => void;
}

export function LiquidacionesPreAuditorOpal({
  liquidacionesPendientes,
  onLoteAprobado
}: LiquidacionesPreAuditorOpalProps) {
  const [dataOpal, setDataOpal] = useState<PreAuditoriaLiquidacionOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(false);

  const ejecutarPreAuditoria = async () => {
    if (!liquidacionesPendientes || liquidacionesPendientes.length === 0) {
      setDataOpal(null);
      return;
    }

    setLoading(true);
    try {
      const payload: PreAuditoriaLiquidacionInput = {
        liquidaciones_pendientes: liquidacionesPendientes.map(l => ({
          id: l.id,
          agente_nombre: l.agente_nombre || 'Colaborador',
          rol: l.agente_rol || 'STAFF',
          total_servicios: Number(l.total_servicios_bruto || l.total_servicios || 0),
          total_comisiones: Number(l.total_comisiones_bruto || l.total_a_pagar || 0),
          items_count: l.items_liquidaciones?.length || 0
        }))
      };

      const res = await procesarPreAuditoriaLiquidacionOpal(payload);
      setDataOpal(res);
    } catch (e) {
      console.error('Error al procesar pre-auditoría Opal de liquidaciones:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ejecutarPreAuditoria();
  }, [liquidacionesPendientes.length]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-xl space-y-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="h-4 w-52 bg-slate-800 rounded mb-2" />
            <div className="h-3 w-64 bg-slate-800/60 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!dataOpal || liquidacionesPendientes.length === 0) return null;

  const esConforme100 = dataOpal.tasa_conformidad_porcentaje === 100;

  return (
    <div className={`rounded-3xl p-5 border shadow-xl backdrop-blur-xl space-y-4 transition ${
      esConforme100 
        ? 'bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/30' 
        : 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/40'
    }`}>
      {/* Header Pre-Auditor Stitch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            esConforme100 
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
              : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Google Opal AI • Pre-Auditor de Comisiones
              </span>
              <span className="text-[9px] bg-white/10 text-slate-300 font-mono px-2 py-0.5 rounded-full">
                Conformidad: {dataOpal.tasa_conformidad_porcentaje}%
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-0.5">
              Auditoría Previa al Pago ({dataOpal.total_auditado} liquidaciones pendientes)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={ejecutarPreAuditoria}
            className="text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-auditar
          </button>
        </div>
      </div>

      {/* Dictamen Resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-white/5">
        <p className="text-slate-200 font-medium">
          {dataOpal.dictamen_auditoria}
        </p>
        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Monto Auditado</span>
          <span className="text-base font-black text-emerald-400 font-mono">
            S/ {dataOpal.monto_total_por_desembolsar.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Botón para ver/ocultar observaciones de colaboradores */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
        >
          <span>{expandido ? 'Ocultar' : 'Ver'} detalle de {dataOpal.observaciones.length} colaboradores auditados</span>
          <ArrowRight className={`w-3.5 h-3.5 transition-transform ${expandido ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {expandido && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-1 max-h-60 overflow-y-auto"
            >
              {dataOpal.observaciones.map(obs => (
                <div
                  key={obs.liquidacion_id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    obs.estado === 'APROBADA'
                      ? 'bg-slate-950/40 border-slate-800 text-slate-300'
                      : obs.estado === 'REVISAR'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{obs.colaborador}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.2 rounded">
                        Ratio: {obs.ratio_comision_promedio}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {obs.mensaje}
                    </p>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                    obs.estado === 'APROBADA' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : obs.estado === 'REVISAR'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {obs.estado}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
