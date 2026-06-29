'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, UserCircle2, ArrowRight, Edit2, XCircle, CheckSquare } from 'lucide-react';
import { obtenerOatcsActivosDelDia, OATC } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ActiveOATCsTable() {
  const [oatcs, setOatcs] = useState<OATC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const supabase = createClient();

  const cargarDatos = async () => {
    setIsLoading(true);
    const data = await obtenerOatcsActivosDelDia();
    setOatcs(data);
    setIsLoading(false);
  };

  const handlePreCobro = async (oatcId: string) => {
    const { error } = await supabase
      .from('oatc')
      .update({ estado_proceso: 'PRE_COBRADO' })
      .eq('id', oatcId);
    
    if (!error) {
      cargarDatos();
    }
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
      // Usar formatDistanceToNowStrict con 'now' para forzar re-render
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-lg">Atenciones Activas</h3>
        <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
          {oatcs.length} en sala
        </span>
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
                      
                      <button className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors" title="Ver Detalles">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button title="Cancelar" className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors">
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
  );
}
