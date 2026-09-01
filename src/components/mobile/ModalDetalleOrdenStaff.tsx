'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, User, Calendar, Clock, DollarSign, Shield, 
  Beaker, CheckCircle2, AlertCircle, Scissors, 
  Package, Lock, Sparkles, FileText, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface ModalDetalleOrdenStaffProps {
  isOpen: boolean;
  onClose: () => void;
  oatcId: string | null;
  agenteId: string;
  agenteNombre: string;
}

export function ModalDetalleOrdenStaff({
  isOpen,
  onClose,
  oatcId,
  agenteId,
  agenteNombre
}: ModalDetalleOrdenStaffProps) {
  const [orden, setOrden] = useState<any | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [insumosList, setInsumosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !oatcId) return;

    async function cargarDetalle() {
      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Cargar OATC principal
        const { data: oatcData } = await supabase
          .from('oatc')
          .select('*')
          .eq('id', oatcId)
          .maybeSingle();

        setOrden(oatcData);

        // 2. Cargar tickets vinculados a la OATC
        const { data: ticketsData } = await supabase
          .from('oatc_tickets')
          .select('*')
          .eq('oatc_id', oatcId)
          .order('created_at', { ascending: true });

        setTickets(ticketsData || []);

        // 3. Cargar fórmulas e insumos químicos relacionados a esta orden
        const { data: insumosData } = await supabase
          .from('pedidos_insumos')
          .select('*')
          .eq('oatc_id', oatcId);

        setInsumosList(insumosData || []);
      } catch (err) {
        console.error('Error cargando detalle de orden:', err);
      } finally {
        setLoading(false);
      }
    }

    cargarDetalle();
  }, [isOpen, oatcId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header del Modal */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                📋
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Detalle de Atención
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {orden?.id ? `#OATC-${orden.id.slice(0, 8).toUpperCase()}` : 'Cargando...'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 font-bold space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Consultando detalle y tickets anidados...</p>
            </div>
          ) : !orden ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No se encontró información para esta orden.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tarjeta de Resumen General */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cliente</span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      {orden.cliente_nombre || 'Cliente General'}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${
                    orden.estado_proceso === 'FINALIZADO'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                      : orden.estado_proceso === 'CANCELADO'
                      ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                      : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
                  }`}>
                    {orden.estado_proceso}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800/60">
                  <div>
                    <span className="text-[9px] text-slate-500 block">Fecha & Horario</span>
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {orden.created_at ? new Date(orden.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '-'}
                      {orden.hora_inicio_atencion && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          • {new Date(orden.hora_inicio_atencion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 block">Estado de Pago</span>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      {orden.estado_pago || 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de Tickets Anidados & Blindaje */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-indigo-500" />
                    Tickets de Servicio y Producto ({tickets.length})
                  </h4>
                  <span className="text-[9px] text-slate-500 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500" /> Datos Blindados
                  </span>
                </div>

                {tickets.length === 0 ? (
                  /* Fallback si no hay tickets divididos: mostrar punto_partida */
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {orden.agente_nombre || 'Especialista'}
                      </span>
                      <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg font-bold">
                        Servicio Base
                      </span>
                    </div>

                    <div className="space-y-1">
                      {Array.isArray(orden.punto_partida) ? (
                        orden.punto_partida.map((s: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 dark:border-slate-800/40 last:border-0">
                            <span className="text-slate-700 dark:text-slate-300">{s.nombre || s.servicio}</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {s.es_cortesia ? 'Cortesía' : `S/ ${Number(s.precio || s.precio_venta || 0).toFixed(2)}`}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">Atención general registrada en salón.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  tickets.map((t) => {
                    const esTicketPropio = 
                      (agenteId && t.agente_id === agenteId) || 
                      (agenteNombre && (t.agente_nombre || '').toLowerCase().includes(agenteNombre.toLowerCase()));

                    const itemsTicket = Array.isArray(t.items) ? t.items : [];
                    const insumosDelTicket = insumosList.filter(i => i.ticket_id === t.id);

                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-2xl border transition-colors space-y-2.5 ${
                          esTicketPropio
                            ? 'bg-indigo-50/40 dark:bg-slate-950/80 border-indigo-200 dark:border-indigo-500/30'
                            : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80'
                        }`}
                      >
                        {/* Cabecera del Ticket */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              esTicketPropio 
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {esTicketPropio ? 'TÚ' : (t.agente_nombre ? t.agente_nombre.charAt(0) : 'C')}
                            </span>
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                {esTicketPropio ? `Mi Ticket (${agenteNombre})` : (t.agente_nombre || 'Colega de Salón')}
                              </h5>
                              <p className="text-[9px] text-slate-500">
                                {t.tipo_ticket || 'servicio'} • {t.estacion_nombre || 'Estación'}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${
                            t.estado_ticket === 'FINALIZADO'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                          }`}>
                            {t.estado_ticket || 'FINALIZADO'}
                          </span>
                        </div>

                        {/* Contenido del Ticket: PROPIO vs BLINDADO */}
                        {esTicketPropio ? (
                          /* TICKET PROPIO: Detalle Completo */
                          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/60">
                            <div className="space-y-1">
                              {itemsTicket.map((it: any, iIdx: number) => (
                                <div key={iIdx} className="flex items-center justify-between text-xs py-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <span className="text-slate-800 dark:text-slate-200 font-medium">{it.nombre}</span>
                                    {it.es_cortesia && (
                                      <span className="text-[8px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-500/30">
                                        Cortesía
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    {it.es_cortesia ? 'S/ 0.00' : `S/ ${Number(it.precio_final || 0).toFixed(2)}`}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Fórmulas Químicas Propias de Lab */}
                            {insumosDelTicket.length > 0 && (
                              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-500/20 space-y-1">
                                <span className="text-[9px] font-black uppercase text-sky-700 dark:text-sky-300 flex items-center gap-1">
                                  <Beaker className="w-3 h-3 text-sky-500" /> Fórmulas Químicas Despachadas
                                </span>
                                {insumosDelTicket.map((ins: any, insIdx: number) => (
                                  <p key={insIdx} className="text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                                    • {ins.insumo_solicitado} ({ins.gramos_despachados || 0}g)
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* TICKET DE COLEGA: Blindado (Sin fórmulas, sin diagnósticos, sin precios desglosados) */
                          <div className="pt-1 border-t border-slate-200 dark:border-slate-800/60 space-y-1.5">
                            <div className="space-y-1">
                              {itemsTicket.map((it: any, iIdx: number) => (
                                <div key={iIdx} className="flex items-center justify-between text-xs py-0.5">
                                  <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    {it.nombre}
                                  </span>
                                  <span className="text-[10px] text-slate-400 italic">
                                    Atendido por colega
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Fórmulas técnicas y diagnóstico reservados al especialista asignado.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Botón de Cierre */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition active:scale-95 cursor-pointer shadow-md"
          >
            Entendido / Cerrar Detalle
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
