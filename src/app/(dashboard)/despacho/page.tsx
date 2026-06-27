'use client';

import { useState, useEffect } from 'react';
import { Beaker, Search, RefreshCw, Layers, AlertCircle, Plus, Send, CheckCircle2 } from 'lucide-react';
import { obtenerOrdenesEnTranscurso } from '@/services/despacho';
import { OATC } from '@/services/recepcion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import BotonAsistencia from '@/components/wfm/BotonAsistencia';

export default function DespachoPage() {
  const [ordenes, setOrdenes] = useState<OATC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    cabina: '',
    agente: '',
    insumos: '',
    urgencia: 'NORMAL'
  });

  const cargarOrdenes = async () => {
    setIsLoading(true);
    const data = await obtenerOrdenesEnTranscurso();
    setOrdenes(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarOrdenes();
    
    // Realtime Suscripción
    const channel = supabase.channel('realtime-despacho')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarOrdenes())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_insumos' }, () => cargarOrdenes())
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSolicitudSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg('Solicitud enviada al laboratorio correctamente.');
      setNuevaSolicitud({ cabina: '', agente: '', insumos: '', urgencia: 'NORMAL' });
      
      setTimeout(() => {
        setSuccessMsg('');
        setIsModalOpen(false);
      }, 2000);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600 shadow-sm">
            <Beaker className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Despacho y Laboratorio</h1>
            <p className="text-sm text-slate-500">Monitorea los servicios en transcurso y prepara los insumos necesarios.</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <BotonAsistencia />
          <button 
            onClick={cargarOrdenes} 
            disabled={isLoading}
            className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-4 py-2.5 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-50 font-semibold h-[46px]"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Órdenes en Transcurso */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" /> 
                Clientes en Proceso
              </h3>
              <span className="text-xs bg-purple-100 text-purple-800 py-1 px-3 rounded-full font-bold">
                {ordenes.length} activos
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : ordenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 opacity-70">
                  <Beaker className="w-16 h-16 text-slate-300 mb-3" />
                  <p className="font-bold text-lg text-slate-700">Sin clientes en proceso</p>
                  <p className="text-sm">No hay agentes asesorando clientes en este momento.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {ordenes.map(orden => (
                    <div key={orden.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-slate-400">#{orden.id?.split('-')[0]}</span>
                        <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                          {orden.estado_proceso}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-slate-900 text-lg mb-1">{orden.cliente_nombre}</h4>
                      <p className="text-sm text-purple-600 font-bold mb-4 flex items-center gap-1.5">
                        Agente: {orden.agente_nombre || 'Sin asignar'}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Servicios Solicitados:</p>
                        <ul className="text-sm text-slate-700 space-y-1.5 font-medium">
                          {orden.punto_partida?.map((item: any, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-300"></div>
                              {item.nombre}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-[11px] font-semibold text-slate-400 text-right">
                          Inició {orden.created_at ? formatDistanceToNow(new Date(orden.created_at), { addSuffix: true, locale: es }) : 'hace un momento'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Pedidos */}
        <div className="lg:col-span-1 space-y-6">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 text-white bg-purple-600 p-4 rounded-2xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20 font-bold text-lg"
          >
            <Plus className="w-6 h-6" />
            Nueva Solicitud Rápida
          </button>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Pedidos Urgentes</h3>
            </div>
            
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
              <p className="text-sm text-slate-500 mb-3 font-medium">Aquí aparecerán las solicitudes de insumos (tintes, mezclas) enviadas por los agentes desde sus cabinas.</p>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-3 py-1 rounded-full bg-white">En construcción</span>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Nueva Solicitud */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Solicitud Rápida a Laboratorio"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSolicitudSubmit} className="space-y-4 mt-4">
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100 text-sm flex items-center justify-center gap-2 font-bold mb-4">
              <CheckCircle2 className="w-5 h-5" />
              {successMsg}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Cabina / Zona *</label>
              <input 
                type="text" 
                value={nuevaSolicitud.cabina}
                onChange={e => setNuevaSolicitud({...nuevaSolicitud, cabina: e.target.value})}
                className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                required
                placeholder="Ej. Cabina 3"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Urgencia</label>
              <select 
                value={nuevaSolicitud.urgencia}
                onChange={e => setNuevaSolicitud({...nuevaSolicitud, urgencia: e.target.value})}
                className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white"
              >
                <option value="NORMAL">Normal</option>
                <option value="URGENTE">Urgente</option>
                <option value="CRITICO">Crítico (Prioridad)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Agente Solicitante *</label>
            <input 
              type="text" 
              value={nuevaSolicitud.agente}
              onChange={e => setNuevaSolicitud({...nuevaSolicitud, agente: e.target.value})}
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              required
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Insumos Requeridos *</label>
            <textarea 
              value={nuevaSolicitud.insumos}
              onChange={e => setNuevaSolicitud({...nuevaSolicitud, insumos: e.target.value})}
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none"
              rows={4}
              required
              placeholder="Ej. Tinte 7.1 con peróxido de 20 vol..."
            ></textarea>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="w-1/3 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !nuevaSolicitud.cabina || !nuevaSolicitud.insumos}
              className="w-2/3 bg-purple-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-md shadow-purple-600/20 flex justify-center items-center gap-2"
            >
              {isSubmitting ? 'Enviando...' : <><Send className="w-4 h-4" /> Enviar Solicitud</>}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
