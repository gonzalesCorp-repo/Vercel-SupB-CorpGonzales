'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2, UserCircle2, ArrowRight, Edit2, XCircle, CheckSquare, ShieldAlert, Bell, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { OATC } from '@/services/recepcion';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '@/components/ui/Modal';
import { useOATCFlow } from './hooks/useOATCFlow';
import { useOATCActions } from './hooks/useOATCActions';
import { translateEstado } from '@/lib/utils';
import { OatcPhaseStepper } from '@/components/ui/OatcPhaseStepper';
import { OatcTicket, obtenerTicketsDeOatc, aprobarValidacionTicket } from '@/services/tickets';

interface ActiveOATCsTableProps {
  onGenerarOrden?: () => void;
}

export default function ActiveOATCsTable({ onGenerarOrden }: ActiveOATCsTableProps) {
  const { oatcs, motivos, isLoading, now, cargarDatos, optimisticUpdateOatc, optimisticRemoveOatc } = useOATCFlow();
  const { isCanceling, handleApprove, submitReject, handleCancelar } = useOATCActions({
    onSuccess: cargarDatos,
    oatcs,
    onOptimisticUpdate: optimisticUpdateOatc,
    onOptimisticRemove: optimisticRemoveOatc
  });
  
  // Modal states
  const [selectedOatc, setSelectedOatc] = useState<OATC | null>(null);
  const [selectedOatcTickets, setSelectedOatcTickets] = useState<OatcTicket[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMotivoId, setSelectedMotivoId] = useState<string>('');
  const [detalleCancelacion, setDetalleCancelacion] = useState('');

  // Alertas / Approvals
  const [isAlertsMinimized, setIsAlertsMinimized] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [oatcToReject, setOatcToReject] = useState<OATC | null>(null);

  const handleRejectClick = (oatc: OATC) => {
    setOatcToReject(oatc);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const onSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await submitReject(oatcToReject, rejectReason);
    if (!error) {
      setIsRejectModalOpen(false);
      setOatcToReject(null);
    }
  };
  
  const onCancelar = async (oatcId: string) => {
    const { error } = await handleCancelar(oatcId, selectedMotivoId, detalleCancelacion);
    if (!error) {
      setIsModalOpen(false);
      setSelectedMotivoId('');
      setDetalleCancelacion('');
    }
  };
  
  const openDetails = async (oatc: OATC) => {
    setSelectedOatc(oatc);
    if (oatc.id) {
      const tks = await obtenerTicketsDeOatc(oatc.id);
      setSelectedOatcTickets(tks);
    }
    setIsModalOpen(true);
  };

  const getTiempoTranscurrido = (dateStr: string) => {
    try {
      return formatDistanceToNowStrict(new Date(dateStr), { locale: es, addSuffix: false });
    } catch (e) {
      return '...';
    }
  };

  const getServicios = (puntoPartida: any[]) => {
    if (!puntoPartida || !Array.isArray(puntoPartida)) return 'Sin servicios';
    return puntoPartida.map(p => p.nombre).join(', ');
  };

  const pendingAlerts = oatcs.filter(o => 
    o.estado_proceso === 'PENDIENTE_INICIO' || 
    o.estado_proceso === 'PENDIENTE_TERMINO' || 
    o.estado_proceso === 'PENDIENTE_PRE_COBRO' ||
    o.estado_proceso === 'PENDIENTE_CANCELACION' ||
    o.cambios_pendientes?.tipo === 'SOLICITUD_CANCELACION'
  );

  const [faseFiltro, setFaseFiltro] = useState<string>('TODOS');

  const fasesConfig = [
    { id: 'TODOS', label: 'En Piso (Activas)', count: oatcs.filter(o => o.estado_proceso !== 'CANCELADO' && o.estado_proceso !== 'FINALIZADO' && o.estado_proceso !== 'FINALIZADA').length },
    { id: 'EN_ESPERA', label: 'En Espera', count: oatcs.filter(o => o.estado_proceso === 'EN_ESPERA' || o.estado_proceso === 'ESPERA').length },
    { id: 'ASESORIA', label: 'En Asesoría', count: oatcs.filter(o => o.estado_proceso === 'ASESORIA').length },
    { id: 'EN_PROCESO', label: 'En Proceso', count: oatcs.filter(o => o.estado_proceso === 'EN_PROCESO' || o.estado_proceso === 'TRABAJANDO').length },
    { id: 'POR_COBRAR', label: 'Por Cobrar', count: oatcs.filter(o => o.estado_proceso === 'POR_COBRAR' || o.estado_proceso === 'PRE_COBRADO').length },
    { id: 'FINALIZADO', label: 'Finalizados Hoy', count: oatcs.filter(o => o.estado_proceso === 'FINALIZADO' || o.estado_proceso === 'FINALIZADA').length },
  ];

  const oatcsFiltradas = oatcs.filter(o => {
    if (faseFiltro === 'TODOS') return o.estado_proceso !== 'CANCELADO' && o.estado_proceso !== 'FINALIZADO' && o.estado_proceso !== 'FINALIZADA';
    if (faseFiltro === 'EN_ESPERA') return o.estado_proceso === 'EN_ESPERA' || o.estado_proceso === 'ESPERA';
    if (faseFiltro === 'EN_PROCESO') return o.estado_proceso === 'EN_PROCESO' || o.estado_proceso === 'TRABAJANDO';
    if (faseFiltro === 'POR_COBRAR') return o.estado_proceso === 'POR_COBRAR' || o.estado_proceso === 'PRE_COBRADO';
    if (faseFiltro === 'FINALIZADO') return o.estado_proceso === 'FINALIZADO' || o.estado_proceso === 'FINALIZADA';
    return o.estado_proceso === faseFiltro;
  });

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800 text-lg">Atenciones Activas</h3>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100">
              {oatcsFiltradas.length} en vista
            </span>
          </div>

          {/* Selector de Fases */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {fasesConfig.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFaseFiltro(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  faseFiltro === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  faseFiltro === f.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Cargando atenciones...</div>
          ) : oatcsFiltradas.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay órdenes de atención en la fase seleccionada ({fasesConfig.find(f => f.id === faseFiltro)?.label}).
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Servicio</th>
                  <th className="px-6 py-3">Agente Asignado</th>
                  <th className="px-6 py-3">Fase de Atención</th>
                  <th className="px-6 py-3">Tiempo</th>
                  <th className="px-6 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {oatcsFiltradas.map((oatc) => (
                  <tr key={oatc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <UserCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800">{oatc.cliente_nombre}</span>
                            {oatc.estado_pago === 'PAGADO' || oatc.estado_pago === 'Pagado' ? (
                              <span className="px-1.5 py-0.2 text-[9px] font-black bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full">
                                💰 PAGADO
                              </span>
                            ) : oatc.estado_pago === 'PRE_COBRADO_TOTAL' ? (
                              <span className="px-1.5 py-0.2 text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-300 rounded-full">
                                ⚡ PRE-COBRADO
                              </span>
                            ) : oatc.estado_pago === 'PARCIAL_ADELANTO' ? (
                              <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-300 rounded-full">
                                🪙 ADELANTO
                              </span>
                            ) : null}
                          </div>
                          {oatc.monto_total ? (
                            <span className="text-[10px] text-slate-400 font-mono">S/ {Number(oatc.monto_total).toFixed(2)}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {getServicios(oatc.punto_partida)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {oatc.agente_nombre || 'POR ASIGNAR'}
                    </td>
                    <td className="px-6 py-4">
                      {oatc.cambios_pendientes?.tipo === 'SOLICITUD_CANCELACION' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5" /> Sol. Cancelación
                        </span>
                      ) : (
                        <OatcPhaseStepper faseActual={oatc.estado_proceso || 'EN_ESPERA'} compacto />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {oatc.created_at ? getTiempoTranscurrido(oatc.created_at) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {oatc.estado_proceso === 'PRE_COBRADO' && (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-md mr-1">
                            EN CAJA
                          </span>
                        )}
                        
                        <button 
                          onClick={() => openDetails(oatc)}
                          className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors" 
                          title="Ver Detalles"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openDetails(oatc)}
                          title="Cancelar" 
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {!isLoading && oatcs.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No hay atenciones activas en este momento.
          </div>
        )}
      </div>

      {/* FLOATING ALERTS WIDGET (Stacked above V.AI Copilot) */}
      {pendingAlerts.length > 0 && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end">
          
          {/* Minimized Badge */}
          {isAlertsMinimized ? (
            <button 
              onClick={() => setIsAlertsMinimized(false)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative transition-transform hover:scale-105"
            >
              <Bell className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {pendingAlerts.length}
              </span>
            </button>
          ) : (
            /* Expanded Popup */
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 overflow-hidden flex flex-col max-h-[80vh] transition-all">
              <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 font-bold">
                  <Bell className="w-5 h-5 animate-pulse" />
                  Alertas del Staff ({pendingAlerts.length})
                </div>
                <button onClick={() => setIsAlertsMinimized(true)} className="hover:bg-indigo-700 p-1 rounded-lg transition-colors">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-4 space-y-3 bg-slate-50 flex-1">
                {pendingAlerts.map(alert => {
                  const isCancelRequest = alert.cambios_pendientes?.tipo === 'SOLICITUD_CANCELACION' || alert.estado_proceso === 'PENDIENTE_CANCELACION';
                  return (
                    <div key={alert.id} className={`p-3 rounded-xl border shadow-sm ${isCancelRequest ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200'}`}>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isCancelRequest ? 'text-red-600' : 'text-indigo-600'}`}>
                        {isCancelRequest
                          ? '🚫 Solicitud de Cancelación' 
                          : alert.estado_proceso === 'PENDIENTE_INICIO' 
                            ? 'Solicitud de Inicio' 
                            : alert.estado_proceso === 'PENDIENTE_PRE_COBRO' 
                              ? 'Solicitud de Pre-Cobro' 
                              : 'Solicitud de Término'}
                      </p>
                      <p className="font-bold text-slate-800 mb-2 text-xs">
                        <span className="text-slate-500 font-medium">Agente: </span>{alert.agente_nombre} <br/>
                        <span className="text-slate-500 font-medium">Cliente: </span>{alert.cliente_nombre}
                        {isCancelRequest && alert.cambios_pendientes?.detalle && (
                          <span className="block text-[11px] text-red-700 font-medium mt-1 bg-red-100/70 p-1.5 rounded">
                            Motivo: {alert.cambios_pendientes.detalle}
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleApprove(alert)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs transition-colors shadow-sm">
                          {isCancelRequest ? 'Aprobar Cancelación' : 'Aprobar'}
                        </button>
                        <button onClick={() => handleRejectClick(alert)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 rounded-lg text-xs transition-colors">Rechazar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalles de la Orden"
        maxWidth="max-w-lg"
      >
        {selectedOatc && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm text-slate-500 font-medium">Cliente</h4>
                <p className="text-lg font-bold text-slate-800">{selectedOatc.cliente_nombre}</p>
              </div>
              <div className="text-right">
                <h4 className="text-sm text-slate-500 font-medium">Tiempo Transcurrido</h4>
                <p className="text-lg font-mono font-bold text-indigo-600">
                  {selectedOatc.created_at ? getTiempoTranscurrido(selectedOatc.created_at) : '-'}
                </p>
              </div>
            </div>

            {/* Stepper Cromático de 4 Fases */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <OatcPhaseStepper faseActual={selectedOatc.estado_proceso || 'EN_ESPERA'} />
            </div>

            {/* Tickets Anidados por Colaborador */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700">Tickets de Servicio & Venta Anidados ({selectedOatcTickets.length})</h4>
              {selectedOatcTickets.length === 0 ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                  Sin tickets anidados creados todavía.
                </div>
              ) : (
                selectedOatcTickets.map((t, idx) => (
                  <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">#{idx + 1} • {t.agente_nombre} ({t.estacion_nombre || 'Estación'})</span>
                      {t.requiere_validacion && (
                        <button
                          onClick={async () => {
                            await aprobarValidacionTicket(t.id, 'Recepción');
                            if (selectedOatc?.id) {
                              const tks = await obtenerTicketsDeOatc(selectedOatc.id);
                              setSelectedOatcTickets(tks);
                            }
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg shadow-sm animate-pulse flex items-center gap-1"
                        >
                          ✓ Aprobar Cortesía S/ 0.00
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {t.items?.map((item, iIdx) => (
                        <div key={iIdx} className="flex justify-between text-xs text-slate-600">
                          <span>{item.nombre} {item.es_cortesia && <strong className="text-amber-600 font-bold">(Cortesía)</strong>}</span>
                          <span className="font-mono font-bold text-slate-800">S/ {Number(item.precio_final || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <h4 className="text-sm text-slate-500 font-medium mb-2">Agente Asignado</h4>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <UserCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">{selectedOatc.agente_nombre || 'Sin asignar'}</p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{translateEstado(selectedOatc.estado_proceso)}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm text-slate-500 font-medium mb-2">Opciones de Cancelación</h4>
              
              <select
                value={selectedMotivoId}
                onChange={(e) => setSelectedMotivoId(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-3"
              >
                <option value="">Selecciona un motivo...</option>
                {motivos.map(m => (
                  <option key={m.id} value={m.id}>{m.motivo}</option>
                ))}
              </select>

              <h4 className="text-sm text-slate-500 font-medium mb-2">Detalle adicional (opcional)</h4>
              <textarea
                value={detalleCancelacion}
                onChange={(e) => setDetalleCancelacion(e.target.value)}
                placeholder="Escribe más detalles sobre la cancelación aquí..."
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px]"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => onCancelar(selectedOatc.id!)}
                className="flex-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCanceling || !selectedMotivoId}
              >
                {isCanceling ? 'Cancelando...' : <><XCircle className="w-4 h-4" /> Cancelar Atención</>}
              </button>
              
            </div>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Rechazar Solicitud"
        maxWidth="max-w-md"
      >
        <form onSubmit={onSubmitReject} className="space-y-4 mt-2">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <h4 className="font-bold text-red-800 mb-1">Motivo del rechazo</h4>
            <p className="text-sm text-red-600 mb-3">Este mensaje será enviado al workspace del staff y bloqueará la solicitud.</p>
            <textarea
              className="w-full border-red-200 rounded-lg p-3 text-sm focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="Ej: Faltan productos, debe agregar el servicio extra primero..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Enviar Rechazo
            </button>
          </div>
        </form>
      </Modal>

    </>
  );
}
