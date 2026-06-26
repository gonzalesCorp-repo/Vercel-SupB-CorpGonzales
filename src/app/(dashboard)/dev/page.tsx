'use client';

import { useState, useEffect, useMemo } from 'react';
import { Terminal, Activity, RefreshCw, Server, AlertCircle, Search } from 'lucide-react';
import { obtenerLogs } from '@/services/logger';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DevPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
        cargarLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getLogColor = (modulo: string) => {
    switch (modulo) {
      case 'RECEPCION': return 'text-pink-600 bg-pink-100 dark:text-pink-300 dark:bg-pink-900/30';
      case 'WFM': return 'text-teal-600 bg-teal-100 dark:text-teal-300 dark:bg-teal-900/30';
      case 'DESPACHO': return 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30';
      case 'OPERACIONES': return 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30';
      case 'CAJA': return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30';
      case 'ADMIN': return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const term = searchTerm.toLowerCase();
      return (
        log.modulo.toLowerCase().includes(term) ||
        log.accion.toLowerCase().includes(term) ||
        (log.usuario_email && log.usuario_email.toLowerCase().includes(term))
      );
    });
  }, [logs, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 dark:bg-slate-800 dark:border-slate-600">
            <Terminal className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Panel del Desarrollador</h1>
            <p className="text-gray-400 text-sm mt-1 dark:text-slate-400">Monitoreo del Sistema y Registro de Actividad (System Logs)</p>
          </div>
        </div>
        <button 
          onClick={cargarLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 text-sm font-semibold rounded-lg border border-gray-700 transition-colors disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refrescar Logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* Tarjeta de Servidor */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">Estado del ERP</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-slate-400">Supabase DB</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-400">ONLINE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-slate-400">Realtime WSS</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-400">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-slate-400">Total Logs</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-200">{logs.length} capturados</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 dark:text-blue-400" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">Auditoría en Vivo</h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed dark:text-blue-400/80">
                  Todos los movimientos son registrados aquí para propósitos de debugging y analítica de seguridad.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[700px] dark:bg-slate-800 dark:border-slate-700">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center dark:bg-slate-800/80 dark:border-slate-700">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 dark:text-slate-200">
                <Activity className="w-5 h-5 text-gray-500 dark:text-slate-400" /> 
                Últimos Eventos (Live)
              </h3>
              
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar módulo, acción o email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-64 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50/30 p-0 dark:bg-slate-900/50">
              {isLoading && logs.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-10 text-center text-gray-500 dark:text-slate-500">No hay registros que coincidan con tu búsqueda.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-100 sticky top-0 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Fecha/Hora</th>
                      <th className="px-5 py-3">Módulo</th>
                      <th className="px-5 py-3">Usuario</th>
                      <th className="px-5 py-3">Acción</th>
                      <th className="px-5 py-3">Sede</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-indigo-50/50 transition-colors dark:hover:bg-indigo-900/20">
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap dark:text-slate-400">
                          {format(new Date(log.created_at), "dd MMM HH:mm:ss", { locale: es })}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getLogColor(log.modulo)}`}>
                            {log.modulo}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-700 truncate max-w-[150px] dark:text-slate-300" title={log.usuario_email}>
                          {log.usuario_email.split('@')[0]}
                        </td>
                        <td className="px-5 py-3 text-gray-900 dark:text-slate-200">
                          {log.accion}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 truncate max-w-[120px] dark:text-slate-500">
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
