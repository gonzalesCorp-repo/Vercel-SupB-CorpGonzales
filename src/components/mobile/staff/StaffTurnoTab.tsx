'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Users2, Play, Plus, CreditCard, CheckCircle, Ban, AlertTriangle, X, Trash2, Edit2, Printer, Settings2 } from 'lucide-react';
import { obtenerMotivosCancelacion, MotivoCancelacion } from '@/services/recepcion';
import TouchActionButton from '@/components/mobile/ui/TouchActionButton';
import { buscarClientes, Cliente } from '@/services/clientes';
import { ThermalPrinterHubModal } from '@/components/caja/ThermalPrinterHubModal';
import { imprimirTicketAtencionStaff } from '@/services/impresionTermica';

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
  handleRemoveItem?: (itemIdx: number) => void;
  handleUpdateClienteNombre?: (newName: string, clienteId: string | null) => void;
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
  handleUpdateItemPrecio,
  handleRemoveItem,
  handleUpdateClienteNombre
}: StaffTurnoTabProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [motivos, setMotivos] = useState<MotivoCancelacion[]>([]);
  const [selectedMotivoId, setSelectedMotivoId] = useState('');
  const [cancelDetalle, setCancelDetalle] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [clientSuggestions, setClientSuggestions] = useState<Cliente[]>([]);

  useEffect(() => {
    if (ticketActivo) {
      setNewName(ticketActivo.cliente_nombre || '');
      setSelectedClienteId(ticketActivo.cliente_id || null);
    }
  }, [ticketActivo]);

  useEffect(() => {
    if (!isEditingName || !newName.trim() || newName.length < 2) {
      setClientSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const results = await buscarClientes(newName.trim(), ticketActivo?.agente_id);
      setClientSuggestions(results);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [newName, isEditingName]);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    if (handleUpdateClienteNombre) {
      await handleUpdateClienteNombre(newName.trim(), selectedClienteId);
    }
    setIsEditingName(false);
    setClientSuggestions([]);
  };

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

  // Estados de Impresión Térmica
  const [showPrinterHub, setShowPrinterHub] = useState(false);
  const [isPrintingTicket, setIsPrintingTicket] = useState(false);
  const [printFeedback, setPrintFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handlePrintTicket = async () => {
    if (!ticketActivo) return;
    setIsPrintingTicket(true);
    setPrintFeedback({ type: 'info', text: 'Imprimiendo ticket...' });
    try {
      const res = await imprimirTicketAtencionStaff(ticketActivo, undefined, undefined, ticketActivo.sede_id);
      if (res.success) {
        setPrintFeedback({ type: 'success', text: `¡Ticket impreso vía ${res.canalUsado}!` });
        setTimeout(() => setPrintFeedback(null), 3500);
      } else {
        setPrintFeedback({ type: 'error', text: res.error || 'No se pudo imprimir el ticket.' });
        setTimeout(() => setPrintFeedback(null), 4000);
      }
    } catch (e: any) {
      setPrintFeedback({ type: 'error', text: e?.message || 'Error al imprimir' });
      setTimeout(() => setPrintFeedback(null), 4000);
    } finally {
      setIsPrintingTicket(false);
    }
  };

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
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          ATENCIONES EN CURSO: <span className="text-indigo-400">{tickets.length}</span>
        </span>
        <button onClick={cargarDatosMobile}
          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
        </button>
      </div>

      {/* Tarjeta de Estado Actual + Posición del Turno + Botón Colegas */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-xl">
        <div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">ESTADO ACTUAL</span>
          <h3 className="text-xl font-black text-emerald-400 mt-0.5">{estadoActual}</h3>
          
          <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
            <span>🎯 Tu Posición en Piso:</span>
            <span className="text-white font-black text-sm">#{miPosicionEnCola > 0 ? miPosicionEnCola : 1}</span>
          </div>
        </div>

        <button onClick={() => setShowColegasModal(true)}
          className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl border border-indigo-400/30 shadow-lg shadow-indigo-600/30 active:scale-90 transition flex flex-col items-center gap-0.5 cursor-pointer"
          title="Ver Disponibilidad del Equipo"
        >
          <Users2 className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Equipo</span>
        </button>
      </div>

      {/* Tarjeta de Atención Activa / Asesoría */}
      {ticketActivo ? (
        <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-indigo-500/30 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
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
              {isEditingName ? (
                <div className="relative mt-2 w-full max-w-[280px]">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        setSelectedClienteId(null);
                      }}
                      placeholder="Nombre del cliente..."
                      className="bg-slate-50 dark:bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-bold w-full"
                      autoFocus
                    />
                    <button onClick={handleSaveName}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                    >
                      Guardar
                    </button>
                    <button onClick={() => {
                        setNewName(ticketActivo.cliente_nombre || '');
                        setSelectedClienteId(ticketActivo.cliente_id || null);
                        setIsEditingName(false);
                        setClientSuggestions([]);
                      }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                    >
                      X
                    </button>
                  </div>

                  {clientSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800">
                      {clientSuggestions.map((cli) => (
                        <div
                          key={cli.id}
                          onClick={() => {
                            setNewName(cli.nombre);
                            setSelectedClienteId(cli.id || null);
                            setClientSuggestions([]);
                          }}
                          className="px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 cursor-pointer text-left transition-colors"
                        >
                          <p className="text-xs font-bold text-white">{cli.nombre}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {cli.dni ? `DNI: ${cli.dni}` : ''} {cli.celular ? `| Cel: ${cli.celular}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{ticketActivo.cliente_nombre}</h2>
                  <button onClick={() => {
                      setNewName(ticketActivo.cliente_nombre || '');
                      setSelectedClienteId(ticketActivo.cliente_id || null);
                      setIsEditingName(true);
                    }}
                    className="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Editar nombre de cliente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {ticketActivo.codigo_ticket || 'OATC-LIVE'}
            </span>
          </div>

          {/* Servicios contratados */}
          <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Servicios / Productos:</span>
              {(isEnCurso || isAsesoria) && (
                <button onClick={() => handleOpenAddService(ticketActivo)}
                  className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Agregar Servicios
                </button>
              )}
            </div>
            {ticketActivo.punto_partida?.map((srv: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-2 bg-slate-100 dark:bg-slate-900/90 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex-1">{srv.nombre}</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-indigo-500/40 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
                    <span className="text-xs font-black text-amber-400">S/</span>
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={srv.precio ?? srv.monto ?? srv.precio_venta ?? 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (handleUpdateItemPrecio) {
                          handleUpdateItemPrecio(idx, val);
                        }
                      }}
                      className="w-16 font-mono font-black text-amber-300 text-sm bg-transparent focus:outline-none text-right"
                      step="0.5"
                    />
                  </div>
                  {handleRemoveItem && (
                    <button onClick={() => {
                        if (confirm(`¿Remover "${srv.nombre}" de la orden?`)) {
                          handleRemoveItem(idx);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar servicio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botones según Gobernanza del Flujo con TouchActionButton */}
          <div className="space-y-3 pt-1">
            {/* Si está en Asesoría, mostrar Botón INICIAR ATENCIÓN */}
            {isAsesoria && !isPendingCancel && (
              <TouchActionButton
                variant="primary"
                icon={Play}
                onClick={() => handleIniciarAtencion(ticketActivo.id)}
                className="w-full"
              >
                Comenzar Atención Ahora
              </TouchActionButton>
            )}

            {/* Si está EN CURSO, mostrar PRE-COBRAR y FINALIZAR */}
            {isEnCurso && !isPendingCancel && (
              <div className="grid grid-cols-2 gap-3">
                <TouchActionButton
                  variant="secondary"
                  icon={CreditCard}
                  onClick={() => handleSolicitarPreCobro(ticketActivo.id)}
                  className="w-full"
                >
                  Pre-Cobrar
                </TouchActionButton>

                <TouchActionButton
                  variant="primary"
                  icon={CheckCircle}
                  onClick={handleFinalizarAtencion}
                  className="w-full"
                >
                  Finalizar
                </TouchActionButton>
              </div>
            )}

            {/* Fila de Impresión de Ficha / Pre-Cuenta para Staff */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
              <TouchActionButton
                variant="secondary"
                icon={Printer}
                onClick={handlePrintTicket}
                disabled={isPrintingTicket}
                className="flex-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-700/80 border-slate-300 dark:border-slate-700 text-indigo-300"
              >
                {isPrintingTicket ? 'Imprimiendo...' : 'Imprimir Ficha / Pre-Cuenta'}
              </TouchActionButton>

              <button type="button"
                onClick={() => setShowPrinterHub(true)}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition shrink-0 cursor-pointer"
                title="Configurar Impresora Bluetooth / USB"
              >
                <Settings2 className="w-5 h-5 text-indigo-400" />
              </button>
            </div>

            {/* Feedback de Impresión */}
            {printFeedback && (
              <div className={`p-2.5 rounded-xl border text-xs text-center font-bold animate-in fade-in duration-200 ${
                printFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : printFeedback.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}>
                {printFeedback.text}
              </div>
            )}

            {/* Botón Solicitar Cancelación */}
            {!isPendingCancel && (
              <TouchActionButton
                variant="danger"
                icon={Ban}
                onClick={() => setShowCancelModal(true)}
                className="w-full"
              >
                Solicitar Cancelación a Recepción
              </TouchActionButton>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xl">
          <span className="text-4xl block">📂</span>
          <h3 className="font-bold text-slate-900 dark:text-slate-200 text-base">Sin atenciones activas</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto">
            No tienes turnos o clientes asignados en este momento.
          </p>
        </div>
      )}

      {/* Modal de Cancelación con Registro de Motivos */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-slate-900 dark:text-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-red-400 flex items-center gap-2">
                  <Ban className="w-5 h-5" /> SOLICITAR CANCELACIÓN
                </h3>
                <button onClick={() => setShowCancelModal(false)} className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona el motivo de la cancelación. Esta solicitud pasará al panel de <strong>Recepción</strong> para su aprobación.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Motivo de Cancelación</label>
                <select 
                  value={selectedMotivoId} 
                  onChange={(e) => setSelectedMotivoId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-red-500"
                >
                  {motivos.map(m => (
                    <option key={m.id} value={m.id}>{m.motivo}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Detalle adicional (opcional)</label>
                <textarea 
                  value={cancelDetalle}
                  onChange={(e) => setCancelDetalle(e.target.value)}
                  placeholder="Explicación del problema o desistimiento del cliente..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-red-500 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <TouchActionButton
                  variant="ghost"
                  onClick={() => setShowCancelModal(false)}
                >
                  Cancelar
                </TouchActionButton>
                <TouchActionButton
                  variant="danger"
                  onClick={onSubmitCancel}
                  disabled={isSubmittingCancel}
                >
                  {isSubmittingCancel ? 'Enviando...' : 'Enviar Solicitud'}
                </TouchActionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Hub de Impresión Térmica para Staff */}
      <ThermalPrinterHubModal
        isOpen={showPrinterHub}
        onClose={() => setShowPrinterHub(false)}
        sedeId={ticketActivo?.sede_id}
      />
    </motion.div>
  );
}
