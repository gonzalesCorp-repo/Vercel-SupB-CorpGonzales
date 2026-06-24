'use client';

import { useState, useEffect } from 'react';
import { Beaker, Search, RefreshCw, Layers, AlertCircle } from 'lucide-react';
import { obtenerOrdenesEnTranscurso } from '@/services/despacho';
import { OATC } from '@/services/recepcion';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';

export default function DespachoPage() {
  const [ordenes, setOrdenes] = useState<OATC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Despacho de Laboratorio</h1>
          <p className="text-sm text-gray-500 mt-1">Monitorea los servicios en transcurso y prepara los insumos necesarios.</p>
        </div>
        <button 
          onClick={cargarOrdenes} 
          disabled={isLoading}
          className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Órdenes en Transcurso */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" /> 
                Clientes en Cabina (En Transcurso)
              </h3>
              <span className="text-xs bg-purple-100 text-purple-800 py-1 px-2.5 rounded-full font-bold">
                {ordenes.length} activos
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : ordenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-70">
                  <Beaker className="w-16 h-16 text-gray-300 mb-3" />
                  <p className="font-medium text-lg text-gray-600">Sin clientes en proceso</p>
                  <p className="text-sm">No hay agentes asesorando clientes en este momento.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {ordenes.map(orden => (
                    <div key={orden.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-purple-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-gray-400">#{orden.id?.split('-')[0]}</span>
                        <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                          {orden.estado_proceso}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-gray-900 text-lg mb-1">{orden.cliente_nombre}</h4>
                      <p className="text-sm text-purple-600 font-medium mb-4 flex items-center gap-1.5">
                        Agente: {orden.agente_nombre || 'Sin asignar'}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase">Servicios Solicitados:</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {orden.punto_partida?.map((item: any, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                              {item.nombre}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400 text-right">
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

        {/* Columna Derecha: Pedidos (Placeholder) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Pedidos Urgentes</h3>
            </div>
            
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-500 mb-2">Aquí aparecerán las solicitudes de insumos (tintes, shampoo) enviadas por los agentes desde sus cabinas.</p>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">En construcción</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
