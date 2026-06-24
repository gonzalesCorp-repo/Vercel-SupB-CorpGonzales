'use client';

import { useState, useEffect } from 'react';
import { Terminal, Activity, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { obtenerLogs } from '@/services/logger';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DevPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const cargarLogs = async () => {
    setIsLoading(true);
    const data = await obtenerLogs(200); // Traemos los últimos 200
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarLogs();

    const channel = supabase.channel('realtime-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, () => {
        cargarLogs(); // Idealmente solo agregaríamos el nuevo a la lista, pero para seguridad y mantener el orden con la DB recargamos
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getLogColor = (modulo: string) => {
    switch (modulo) {
      case 'RECEPCION': return 'text-pink-600 bg-pink-100';
      case 'WFM': return 'text-teal-600 bg-teal-100';
      case 'DESPACHO': return 'text-purple-600 bg-purple-100';
      case 'OPERACIONES': return 'text-orange-600 bg-orange-100';
      case 'CAJA': return 'text-green-600 bg-green-100';
      case 'ADMIN': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
            <Terminal className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Panel del Desarrollador</h1>
            <p className="text-gray-400 text-sm mt-1">Monitoreo del Sistema y Registro de Actividad (System Logs)</p>
          </div>
        </div>
        <button 
          onClick={cargarLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 text-sm font-semibold rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refrescar Logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* Tarjeta de Servidor */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Estado del ERP</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Supabase DB</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">ONLINE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Realtime WSS</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Logs</span>
                <span className="text-sm font-semibold text-gray-900">{logs.length} capturados</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-blue-900">Auditoría en Vivo</h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Todos los movimientos de los módulos son registrados aquí para propósitos de debugging y analítica de seguridad.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-500" /> 
                Últimos Eventos (Live)
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50/30 p-0">
              {isLoading && logs.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-10 text-center text-gray-500">No hay registros de actividad aún.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-5 py-3">Fecha/Hora</th>
                      <th className="px-5 py-3">Módulo</th>
                      <th className="px-5 py-3">Usuario</th>
                      <th className="px-5 py-3">Acción</th>
                      <th className="px-5 py-3">Sede</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-indigo-50/50 transition-colors">
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          {format(new Date(log.created_at), "dd MMM HH:mm:ss", { locale: es })}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getLogColor(log.modulo)}`}>
                            {log.modulo}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-700 truncate max-w-[150px]" title={log.usuario_email}>
                          {log.usuario_email.split('@')[0]}
                        </td>
                        <td className="px-5 py-3 text-gray-900">
                          {log.accion}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 truncate max-w-[120px]">
                          {log.sedes?.nombre || 'Global'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
