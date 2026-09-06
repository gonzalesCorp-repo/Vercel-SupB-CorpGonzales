'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Beaker, AlertTriangle, CheckCircle2, 
  TrendingUp, ShoppingCart, RefreshCw, Calendar, 
  ArrowRight, ShieldAlert, Package, Layers 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LabPredictorInput, LabPredictorOutput, InsumoQuimicoCritico } from '@/types/opal';
import { procesarPrediccionInsumosLabOpal } from '@/services/opalService';

export interface LabInsumosPredictorOpalProps {
  stockItems: any[];
  citasProximasCount?: number;
  onGenerarOrdenSugerida?: (insumo: InsumoQuimicoCritico) => void;
}

export function LabInsumosPredictorOpal({
  stockItems,
  citasProximasCount = 28,
  onGenerarOrdenSugerida
}: LabInsumosPredictorOpalProps) {
  const [dataOpal, setDataOpal] = useState<LabPredictorOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'QUIEBRES' | 'ALERTAS'>('TODOS');

  const ejecutarPrediccion = async () => {
    if (!stockItems || stockItems.length === 0) return;
    setLoading(true);
    try {
      const itemsPayload = stockItems.map(s => ({
        id: s.bien_id || s.id || Math.random().toString(),
        nombre: s.nombre || 'Insumo',
        categoria: s.categoria || 'Química Capilar',
        stock_total: (s.stock_central || 0) + (s.stock_lab || 0),
        stock_minimo: s.stock_minimo || 10
      }));

      const res = await procesarPrediccionInsumosLabOpal({
        inventario_items: itemsPayload,
        citas_proximas_count: citasProximasCount
      });
      setDataOpal(res);
    } catch (e) {
      console.error('Error al procesar predictor Opal de laboratorio:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ejecutarPrediccion();
  }, [stockItems.length, citasProximasCount]);

  const itemsFiltrados = useMemo(() => {
    if (!dataOpal) return [];
    if (filtroEstado === 'QUIEBRES') {
      return dataOpal.insumos_criticos.filter(i => i.estado_abastecimiento === 'QUIEBRE_INMINENTE');
    }
    if (filtroEstado === 'ALERTAS') {
      return dataOpal.insumos_criticos.filter(i => i.estado_abastecimiento === 'ALERTA_REPOSICION');
    }
    return dataOpal.insumos_criticos;
  }, [dataOpal, filtroEstado]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="h-4 w-56 bg-slate-800 rounded mb-2" />
            <div className="h-3 w-72 bg-slate-800/60 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!dataOpal) return null;

  const quiebresCount = dataOpal.insumos_criticos.filter(i => i.estado_abastecimiento === 'QUIEBRE_INMINENTE').length;
  const alertasCount = dataOpal.insumos_criticos.filter(i => i.estado_abastecimiento === 'ALERTA_REPOSICION').length;

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100">
      
      {/* Header HUD Stitch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg">
            <Beaker className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Google Opal AI • Laboratorio Predictivo
              </span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
                Salud Kardex: {dataOpal.score_salud_stock}%
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-0.5">
              Proyección de Consumo Químico a 7 Días
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={ejecutarPrediccion}
            className="text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar Forecast
          </button>
        </div>
      </div>

      {/* Tarjetas Métricas Stitch */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-indigo-500/20">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Demanda Proyectada</span>
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 font-mono mt-1">{citasProximasCount} citas</p>
          <span className="text-[10px] text-slate-500">Próximos 7 días en agenda</span>
        </div>

        <div className={`p-4 rounded-2xl border ${quiebresCount > 0 ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-slate-950/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Quiebres Inminentes (&le; 2 días)</span>
            <ShieldAlert className={`w-3.5 h-3.5 ${quiebresCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <p className={`text-2xl font-black font-mono mt-1 ${quiebresCount > 0 ? 'text-rose-400' : 'text-white'}`}>
            {quiebresCount} ítems
          </p>
          <span className="text-[10px] text-slate-500">Riesgo alto de rotura de stock</span>
        </div>

        <div className={`p-4 rounded-2xl border ${alertasCount > 0 ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-slate-950/60 border-slate-800'}`}>
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Reposición Necesaria (&le; 5 días)</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${alertasCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <p className={`text-2xl font-black font-mono mt-1 ${alertasCount > 0 ? 'text-amber-400' : 'text-white'}`}>
            {alertasCount} ítems
          </p>
          <span className="text-[10px] text-slate-500">Programar traslados desde Central</span>
        </div>
      </div>

      {/* Dictamen de Compras */}
      <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-xs flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
        <p className="text-slate-200 font-medium leading-relaxed">
          <strong className="text-indigo-300">Diagnóstico Opal:</strong> {dataOpal.recomendacion_compras}
        </p>
      </div>

      {/* Filtros de la Tabla Predictiva */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Insumos en Monitoreo Activo ({itemsFiltrados.length})
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFiltroEstado('TODOS')}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition ${
              filtroEstado === 'TODOS' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({dataOpal.insumos_criticos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('QUIEBRES')}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition ${
              filtroEstado === 'QUIEBRES' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Quiebres ({quiebresCount})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('ALERTAS')}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition ${
              filtroEstado === 'ALERTAS' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Alertas ({alertasCount})
          </button>
        </div>
      </div>

      {/* Lista de Insumos Críticos Stitch */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {itemsFiltrados.slice(0, 10).map((ins) => {
          const isQuiebre = ins.estado_abastecimiento === 'QUIEBRE_INMINENTE';
          const isAlerta = ins.estado_abastecimiento === 'ALERTA_REPOSICION';

          return (
            <div
              key={ins.id}
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 transition ${
                isQuiebre 
                  ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60' 
                  : isAlerta
                  ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate">{ins.nombre}</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase">
                    {ins.categoria}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                  <span>Stock: <strong className="text-white">{ins.stock_actual}</strong></span>
                  <span>Demanda 7d: <strong className="text-indigo-300 font-mono">{ins.demanda_proyectada_7d}</strong></span>
                  <span>Cobertura: <strong className={isQuiebre ? 'text-rose-400 font-mono' : isAlerta ? 'text-amber-400 font-mono' : 'text-emerald-400 font-mono'}>{ins.dias_cobertura_restantes} días</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {(isQuiebre || isAlerta) && ins.reposicion_sugerida_unidades > 0 && (
                  <button
                    type="button"
                    onClick={() => onGenerarOrdenSugerida && onGenerarOrdenSugerida(ins)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow transition active:scale-95 cursor-pointer ${
                      isQuiebre 
                        ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    <ShoppingCart className="w-3 h-3" /> Pedir +{ins.reposicion_sugerida_unidades} u.
                  </button>
                )}
                {!isQuiebre && !isAlerta && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Óptimo
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
