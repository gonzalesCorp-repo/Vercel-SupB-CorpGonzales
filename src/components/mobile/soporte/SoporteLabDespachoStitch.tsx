'use client';

import React, { useState, useEffect } from 'react';
import { 
  Beaker, Scale, CheckCircle2, AlertTriangle, Clock, 
  Sparkles, RefreshCw, ChevronRight, X, ShieldAlert, 
  Layers, Package, Check, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { obtenerPedidosPendientesLab } from '@/services/lab';
import { procesarFormulaLabDespachoOpal } from '@/services/opalMobileService';
import { FormulaLabDespachoOutput, InsumoFormulaReceta } from '@/types/opalMobile';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';

export interface SoporteLabDespachoStitchProps {
  agente: any;
  sedeId: string;
}

export function SoporteLabDespachoStitch({
  agente,
  sedeId
}: SoporteLabDespachoStitchProps) {
  const { showAlert } = useUIStore();
  const supabase = createClient();

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any | null>(null);

  // Estado del Asistente Opal de Receta
  const [recetaOpal, setRecetaOpal] = useState<FormulaLabDespachoOutput | null>(null);
  const [loadingReceta, setLoadingReceta] = useState(false);

  // Balanza Interactiva Stitch
  const [pasoRecetaIdx, setPasoRecetaIdx] = useState(0);
  const [pesoActualGramos, setPesoActualGramos] = useState<number>(0);
  const [tarado, setTarado] = useState(true);
  const [despachando, setDespachando] = useState(false);

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const data = await obtenerPedidosPendientesLab();
      setPedidos(data || []);
    } catch (e) {
      console.error('Error cargando pedidos de laboratorio:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, [sedeId]);

  // Al seleccionar un pedido, invocar Opal para desglose de fórmula
  const handleSeleccionarPedido = async (p: any) => {
    setPedidoSeleccionado(p);
    setPasoRecetaIdx(0);
    setPesoActualGramos(0);
    setTarado(true);
    setLoadingReceta(true);

    try {
      const formulaStr = p.insumo_solicitado || p.formula_solicitada || p.descripcion || 'Decoloración y Matiz';
      const servicioStr = p.oatc?.servicio_nombre || p.servicio || 'Coloración Técnica';

      const res = await procesarFormulaLabDespachoOpal({
        pedido_id: p.id,
        estilista_nombre: p.agente_nombre || 'Estilista en Piso',
        servicio_nombre: servicioStr,
        formula_solicitada: formulaStr
      });

      setRecetaOpal(res);
      if (res.receta_desglosada.length > 0) {
        setPesoActualGramos(res.receta_desglosada[0].gramos_requeridos);
      }
    } catch (e) {
      console.error('Error al procesar receta con Opal:', e);
    } finally {
      setLoadingReceta(false);
    }
  };

  const insumoActual: InsumoFormulaReceta | undefined = recetaOpal?.receta_desglosada[pasoRecetaIdx];
  const gramosObjetivo = insumoActual?.gramos_requeridos || 30;
  const deltaGramos = pesoActualGramos - gramosObjetivo;
  const enTolerancia = Math.abs(deltaGramos) <= (recetaOpal?.tolerancia_gramos || 2);

  const handleAvanzarOCompletar = async () => {
    if (!recetaOpal || !pedidoSeleccionado) return;

    if (pasoRecetaIdx < recetaOpal.receta_desglosada.length - 1) {
      // Avanzar al siguiente ingrediente
      const sigIdx = pasoRecetaIdx + 1;
      setPasoRecetaIdx(sigIdx);
      setPesoActualGramos(recetaOpal.receta_desglosada[sigIdx].gramos_requeridos);
      setTarado(true);
    } else {
      // Completar despacho de la fórmula
      setDespachando(true);
      try {
        if (pedidoSeleccionado.solicitud_id) {
          await supabase
            .from('pedidos_insumos')
            .update({ estado: 'COMPLETADO' })
            .eq('id', pedidoSeleccionado.solicitud_id);
        } else if (pedidoSeleccionado.id && !pedidoSeleccionado.id.startsWith('oatc_')) {
          await supabase
            .from('lab_pedidos')
            .update({ estado: 'DESPACHADO' })
            .eq('id', pedidoSeleccionado.id);
        }

        showAlert(`¡Fórmula despachada con éxito para ${pedidoSeleccionado.agente_nombre || 'el estilista'}!`, 'success');
        setPedidoSeleccionado(null);
        cargarPedidos();
      } catch (err: any) {
        showAlert('Error al despachar fórmula: ' + err.message, 'error');
      } finally {
        setDespachando(false);
      }
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      
      {/* Header de la Cola Stitch */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Google Stitch • Balanza Táctil
          </span>
          <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
            Cola de Pedidos de Laboratorio ({pedidos.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={cargarPedidos}
          className="p-2 text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Lista de Pedidos en Espera */}
      <div className="space-y-2.5">
        {pedidos.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-bold">Laboratorio al día</p>
            <p className="text-[11px] text-slate-500 mt-1">No hay fórmulas químicas pendientes de preparación.</p>
          </div>
        ) : (
          pedidos.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSeleccionarPedido(p)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 active:scale-98 transition cursor-pointer hover:border-indigo-500/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Beaker className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {p.insumo_solicitado || p.formula_solicitada || p.oatc?.cliente_nombre || 'Fórmula Química'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Solicitado por: <strong>{p.agente_nombre || 'Estilista'}</strong> • {p.origen || 'Sillón'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20 flex items-center gap-1">
                  <Scale className="w-3 h-3" /> Pesar
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Stitch: Balanza Interactiva con Tolerancia ±2g */}
      <AnimatePresence>
        {pedidoSeleccionado && (
          <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                      Balanza Stitch • Opal Assistant
                    </span>
                    <h4 className="text-sm font-black truncate max-w-[240px]">
                      {pedidoSeleccionado.insumo_solicitado || 'Fórmula en Preparación'}
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPedidoSeleccionado(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingReceta ? (
                <div className="p-8 text-center space-y-2 animate-pulse">
                  <Sparkles className="w-6 h-6 text-indigo-500 mx-auto animate-spin" />
                  <p className="text-xs text-slate-400">Opal calculando proporción exacta...</p>
                </div>
              ) : recetaOpal && insumoActual ? (
                <div className="space-y-4">
                  
                  {/* Stepper de Ingredientes */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {recetaOpal.receta_desglosada.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition ${
                          idx === pasoRecetaIdx
                            ? 'bg-indigo-600 text-white'
                            : idx < pasoRecetaIdx
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}. {item.nombre.split(' ')[0]} ({item.gramos_requeridos}g)
                      </div>
                    ))}
                  </div>

                  {/* Componente Actual */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                      Paso {pasoRecetaIdx + 1} de {recetaOpal.receta_desglosada.length}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {insumoActual.nombre}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {insumoActual.instruccion}
                    </p>
                  </div>

                  {/* Monitor Digital de Balanza */}
                  <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3 shadow-inner">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>OBJETIVO: {gramosObjetivo}.0 g</span>
                      <button
                        type="button"
                        onClick={() => setTarado(!tarado)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 transition"
                      >
                        {tarado ? '✓ TARADO 0.0g' : 'TARAR'}
                      </button>
                    </div>

                    {/* Número Digital Gigante */}
                    <div className="py-2">
                      <span className={`text-5xl font-black font-mono tracking-tight transition-colors ${
                        enTolerancia 
                          ? 'text-emerald-400' 
                          : deltaGramos < 0 
                          ? 'text-amber-400' 
                          : 'text-rose-400'
                      }`}>
                        {pesoActualGramos.toFixed(1)}
                      </span>
                      <span className="text-lg font-bold text-slate-500 font-mono ml-1">g</span>
                    </div>

                    {/* Semáforo de Tolerancia Stitch (±2g) */}
                    <div className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      enTolerancia 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : deltaGramos < 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {enTolerancia ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>¡Peso Óptimo! (Tolerancia ±2g)</span>
                        </>
                      ) : deltaGramos < 0 ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Faltan {Math.abs(deltaGramos).toFixed(1)}g para la dosis requerida</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Exceso de {deltaGramos.toFixed(1)}g (Riesgo de merma)</span>
                        </>
                      )}
                    </div>

                    {/* Botonera Táctil de Calibración de Peso */}
                    <div className="flex items-center justify-center gap-2 pt-1">
                      {[-5, -1, 1, 5].map((step) => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setPesoActualGramos(prev => Math.max(0, prev + step))}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white active:scale-95 transition"
                        >
                          {step > 0 ? `+${step}g` : `${step}g`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Consejo Técnico Opal */}
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <p className="text-[11px] leading-tight">
                      <strong>Tip Técnico:</strong> {recetaOpal.consejo_tecnico}
                    </p>
                  </div>

                  {/* Botón de Acción Ergonómico 44px+ */}
                  <button
                    type="button"
                    disabled={despachando}
                    onClick={handleAvanzarOCompletar}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {despachando ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : pasoRecetaIdx < recetaOpal.receta_desglosada.length - 1 ? (
                      <>
                        <span>Confirmar Ingrediente & Siguiente</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Completar y Despachar a Sillón</span>
                      </>
                    )}
                  </button>

                </div>
              ) : null}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
