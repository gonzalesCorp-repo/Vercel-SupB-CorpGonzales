'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, UserCircle2, ArrowRight, Edit2, XCircle, CheckSquare, ShieldAlert } from 'lucide-react';
import { obtenerOatcsActivosDelDia, OATC, MotivoCancelacion, obtenerMotivosCancelacion, agregarMotivoCancelacion } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '@/components/ui/Modal';
import { Plus } from 'lucide-react';

interface ActiveOATCsTableProps {
  onGenerarOrden?: () => void;
}

export default function ActiveOATCsTable({ onGenerarOrden }: ActiveOATCsTableProps) {
  const [oatcs, setOatcs] = useState<OATC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  
  // Modal states
  const [selectedOatc, setSelectedOatc] = useState<OATC | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [motivos, setMotivos] = useState<MotivoCancelacion[]>([]);
  const [selectedMotivoId, setSelectedMotivoId] = useState<string>('');
  const [detalleCancelacion, setDetalleCancelacion] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  
  const supabase = createClient();

  const cargarDatos = async () => {
    setIsLoading(true);
    const [dataOatcs, dataMotivos] = await Promise.all([
      obtenerOatcsActivosDelDia(),
      obtenerMotivosCancelacion()
    ]);
    setOatcs(dataOatcs);
    setMotivos(dataMotivos);
    setIsLoading(false);
  };

  const handlePreCobro = async (oatcId: string) => {
    const { error } = await supabase
      .from('oatc')
      .update({ estado_proceso: 'PRE_COBRADO' })
      .eq('id', oatcId);
    
    if (!error) {
      cargarDatos();
      setIsModalOpen(false);
    }
  };
  
  const handleCancelar = async (oatcId: string) => {
    if (!selectedMotivoId) {
      alert('Por favor, selecciona un motivo de cancelación.');
      return;
    }
    
    if (!confirm('¿Estás seguro de que deseas cancelar esta atención?')) return;
    
    setIsCanceling(true);

    // Primero, liberar al agente si hay uno asignado
    const oatc = oatcs.find(o => o.id === oatcId);
    if (oatc?.agente_id) {
      await supabase.from('agentes').update({ estado: 'DISPONIBLE' }).eq('id', oatc.agente_id);
    }
    
    // Luego cancelar la OATC
    const { error } = await supabase
      .from('oatc')
      .update({ 
        estado_proceso: 'CANCELADO', 
        hora_fin_atencion: new Date().toISOString(),
        motivo_cancelacion_id: selectedMotivoId,
        detalle_cancelacion: detalleCancelacion.trim() || null
      })
      .eq('id', oatcId);
      
    if (!error) {
      cargarDatos();
      setIsModalOpen(false);
      setSelectedMotivoId('');
      setDetalleCancelacion('');
    }
    setIsCanceling(false);
  };
  
  const openDetails = (oatc: OATC) => {
    setSelectedOatc(oatc);
    setIsModalOpen(true);
  };

  useEffect(() => {
    cargarDatos();

    const channel = supabase.channel('realtime-oatc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => {
        cargarDatos();
      })
      .subscribe();

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

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

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-800 text-lg">Atenciones Activas</h3>
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
              {oatcs.length} en sala
            </span>
          </div>
          {onGenerarOrden && (
            <button 
              onClick={onGenerarOrden}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Generar Orden de Atención</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Cargando atenciones...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Servicio</th>
                  <th className="px-6 py-3">Agente Asignado</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Tiempo</th>
                  <th className="px-6 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {oatcs.map((oatc) => (
                  <tr key={oatc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <UserCircle2 className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-slate-700">{oatc.cliente_nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {getServicios(oatc.punto_partida)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {oatc.agente_nombre || 'POR ASIGNAR'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                        (oatc.estado_proceso === 'ESPERA' || oatc.estado_proceso === 'ASESORIA') ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {(oatc.estado_proceso === 'ESPERA' || oatc.estado_proceso === 'ASESORIA') ? (
                          <><Clock className="w-3.5 h-3.5"/> {oatc.estado_proceso === 'ASESORIA' ? 'Asesoría' : 'En Espera'}</>
                        ) : (
                          <><CheckCircle2 className="w-3.5 h-3.5"/> {oatc.estado_proceso}</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {oatc.created_at ? getTiempoTranscurrido(oatc.created_at) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {oatc.estado_proceso === 'ASESORANDO' && (
                          <button 
                            onClick={() => handlePreCobro(oatc.id!)}
                            className="p-1.5 text-orange-500 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors border border-orange-100 bg-orange-50/50 shadow-sm flex items-center gap-1 text-xs font-bold"
                            title="Enviar a Pre-Cobro"
                          >
                            <CheckSquare className="w-4 h-4" />
                            <span className="hidden sm:inline">Pre-Cobrar</span>
                          </button>
                        )}
                        {oatc.estado_proceso === 'PRE_COBRADO' && (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-md">
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

            <div>
              <h4 className="text-sm text-slate-500 font-medium mb-2">Servicios Solicitados</h4>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                {selectedOatc.punto_partida?.map((srv: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700">{srv.nombre}</span>
                    <span className="text-slate-500">x1</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm text-slate-500 font-medium mb-2">Agente Asignado</h4>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <UserCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-700">{selectedOatc.agente_nombre || 'Sin asignar'}</p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{selectedOatc.estado_proceso}</p>
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
                onClick={() => handleCancelar(selectedOatc.id!)}
                className="flex-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCanceling || !selectedMotivoId}
              >
                {isCanceling ? 'Cancelando...' : <><XCircle className="w-4 h-4" /> Cancelar Atención</>}
              </button>
              
              {(selectedOatc.estado_proceso === 'ASESORANDO' || selectedOatc.estado_proceso === 'ASESORIA') && (
                <button 
                  onClick={() => handlePreCobro(selectedOatc.id!)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" /> Enviar a Caja
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
