'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Users2, Play, Plus, CreditCard, CheckCircle, Ban, AlertTriangle, X } from 'lucide-react';
import { obtenerMotivosCancelacion, MotivoCancelacion } from '@/services/recepcion';

export interface StaffTurnoTabProps {
  tickets: any[];
  isLoading: boolean;
  cargarDatosMobile: () => void;
  estadoActual: string;
  miPosicionEnCola: number;
  setShowColegasModal: (b: boolean) => void;
  ticketActivo: any;
  handleIniciarAtencion: (id: string) => void;
  handleOpenAddService: (ticket: any) => void;
  handleSolicitarPreCobro: (id: string) => void;
  handleFinalizarAtencion: () => void;
  handleSolicitarCancelacion: (ticketId: string, motivoId: string, detalle: string) => void;
  handleUpdateItemPrecio?: (itemIdx: number, newPrice: number) => void;
}

export default function StaffTurnoTab({
  tickets,
  isLoading,
  cargarDatosMobile,
  estadoActual,
  miPosicionEnCola,
  setShowColegasModal,
  ticketActivo,
  handleIniciarAtencion,
  handleOpenAddService,
  handleSolicitarPreCobro,
  handleFinalizarAtencion,
  handleSolicitarCancelacion,
  handleUpdateItemPrecio
}: StaffTurnoTabProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivos, setMotivos] = useState<MotivoCancelacion[]>([]);
  const [selectedMotivoId, setSelectedMotivoId] = useState('');
  const [cancelDetalle, setCancelDetalle] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  useEffect(() => {
    async function loadMotivos() {
      const data = await obtenerMotivosCancelacion();
      setMotivos(data);
      if (data.length > 0) setSelectedMotivoId(data[0].id);
    }
    loadMotivos();
  }, []);

  const isEnCurso = ticketActivo?.estado_proceso === 'EN_CURSO';
  const isAsesoria = !isEnCurso && (ticketActivo?.estado_proceso === 'ASESORIA' || ticketActivo?.estado_proceso === 'ESPERA' || ticketActivo?.estado_proceso === 'PENDIENTE_INICIO');
  const isPendingCancel = ticketActivo?.cambios_pendientes?.tipo === 'SOLICITUD_CANCELACION' || ticketActivo?.estado_proceso === 'PENDIENTE_CANCELACION';

  const onSubmitCancel = async () => {
    if (!ticketActivo || !selectedMotivoId) return;
    setIsSubmittingCancel(true);
    await handleSolicitarCancelacion(ticketActivo.id, selectedMotivoId, cancelDetalle);
    setIsSubmittingCancel(false);
    setShowCancelModal(false);
    setCancelDetalle('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          ATENCIONES EN CURSO: <span className="text-indigo-400">{tickets.length}</span>
        </span>
        <button 
          onClick={cargarDatosMobile}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
        </button>
      </div>

      {/* Tarjeta de Estado Actual + Posición del Turno + Botón Colegas */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex justify-between items-center shadow-xl">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ESTADO ACTUAL</span>
          <h3 className="text-xl font-black text-emerald-400 mt-0.5">{estadoActual}</h3>
          
          <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
            <span>🎯 Tu Posición en Piso:</span>
            <span className="text-white font-black text-sm">#{miPosicionEnCola > 0 ? miPosicionEnCola : 1}</span>
          </div>
        </div>

        <button 
          onClick={() => setShowColegasModal(true)}
          className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl border border-indigo-400/30 shadow-lg shadow-indigo-600/30 active:scale-90 transition flex flex-col items-center gap-0.5"
          title="Ver Disponibilidad del Equipo"
        >
          <Users2 className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Equipo</span>
        </button>
      </div>

      {/* Tarjeta de Atención Activa / Asesoría */}
      {ticketActivo ? (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
          {/* Header Estado */}
          <div className="flex justify-between items-start">
            <div>
              {isPendingCancel ? (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-fit animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> Cancelación Pendiente (Recepción)
                </span>
              ) : isAsesoria ? (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                  📌 En Asesoría / Por Iniciar
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                  ⚡ Atención Activa en Curso
                </span>
              )}
              <h2 className="text-2xl font-black text-white mt-2">{ticketActivo.cliente_nombre}</h2>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              {ticketActivo.codigo_ticket || 'OATC-LIVE'}
            </span>
          </div>

          {/* Servicios contratados */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Servicios / Productos:</span>
              {isEnCurso && (
                <button 
                  onClick={() => handleOpenAddService(ticketActivo)}
                  className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" /> Agregar Servicios
                </button>
              )}
            </div>
            {ticketActivo.punto_partida?.map((srv: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-sm font-semibold text-slate-200 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="truncate pr-2">{srv.nombre}</span>
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400">S/</span>
                  <input 
                    type="number" 
                    value={srv.precio ?? srv.monto ?? srv.precio_venta ?? 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (handleUpdateItemPrecio) {
                        handleUpdateItemPrecio(idx, val);
                      }
                    }}
                    className="w-16 font-bold text-indigo-400 text-xs bg-transparent focus:outline-none text-right"
                    step="0.5 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Botones según Gobernanza del Flujo */}
          <div className="space-y-2 pt-1">
            {/* Si está en Asesoría, mostrar Botón INICIAR ATENCIÓN */}
            {isAsesoria && !isPendingCancel && (
              <button 
                onClick={() => handleIniciarAtencion(ticketActivo.id)}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> Comenzar Atención Ahora
              </button>
            )}

            {/* Si está EN CURSO, mostrar PRE-COBRAR y FINALIZAR */}
            {isEnCurso && !isPendingCancel && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleSolicitarPreCobro(ticketActivo.id)}
                  className="py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" /> Pre-Cobrar
                </button>
                <button 
                  onClick={handleFinalizarAtencion}
                  className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Finalizar
                </button>
              </div>
            )}

            {/* Botón Solicitar Cancelación (Disponible en cualquier momento) */}
            {!isPendingCancel && (
              <button 
                onClick={() => setShowCancelModal(true)}
                className="w-full py-2.5 bg-slate-950 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs rounded-xl border border-slate-800 hover:border-red-900/50 transition flex items-center justify-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" /> Solicitar Cancelación a Recepción
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xl">
          <span className="text-4xl block">📂</span>
          <h3 className="font-bold text-slate-200 text-base">Sin atenciones activas</h3>
          <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
            No tienes turnos o clientes asignados en este momento.
          </p>
        </div>
      )}

      {/* Modal de Cancelación con Registro de Motivos */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-red-400 flex items-center gap-2">
                  <Ban className="w-5 h-5" /> SOLICITAR CANCELACIÓN
                </h3>
                <button onClick={() => setShowCancelModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Selecciona el motivo de la cancelación. Esta solicitud pasará al panel de <strong>Recepción</strong> para su aprobación.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Motivo de Cancelación</label>
                <select 
                  value={selectedMotivoId} 
                  onChange={(e) => setSelectedMotivoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                >
                  {motivos.map(m => (
                    <option key={m.id} value={m.id}>{m.motivo}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Detalle adicional (opcional)</label>
                <textarea 
                  value={cancelDetalle}
                  onChange={(e) => setCancelDetalle(e.target.value)}
                  placeholder="Explicación del problema o desistimiento del cliente..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button onClick={() => setShowCancelModal(false)} className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl">
                  Cancelar
                </button>
                <button 
                  onClick={onSubmitCancel} 
                  disabled={isSubmittingCancel}
                  className="py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-1"
                >
                  {isSubmittingCancel ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

