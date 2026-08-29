'use client';

import { useState, useEffect, useMemo } from 'react';
import { Terminal, Activity, RefreshCw, Server, AlertCircle, Search, ShieldCheck } from 'lucide-react';
import { obtenerLogs } from '@/services/logger';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BulkUploader } from '@/components/ui/BulkUploader';
import { TemplateDownloader } from '@/components/ui/TemplateDownloader';

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

    const channelName = `realtime-logs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, () => {
        cargarLogs();
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('Error removiendo canal logs:', e);
      }
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
    <div className="max-w-7xl mx-auto space-y-6 font-sans animate-in fade-in duration-300 p-4 md:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-emerald-500 shadow-inner">
            <Terminal className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Panel del Desarrollador</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium">Monitoreo del Sistema y Registro de Actividad (System Logs)</p>
          </div>
        </div>
        <button
          onClick={cargarLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50 text-white cursor-pointer"
          style={{ backgroundColor: 'var(--active-theme-primary, #10b981)' }}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refrescar Logs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Stats and Info */}
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Server className="w-5 h-5 text-indigo-500" /> Estado del ERP
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-bold">Supabase DB</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">ONLINE</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-bold">Realtime WSS</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-bold">Total Logs</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">{logs.length} capturados</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Activity className="w-5 h-5 text-amber-500" /> Gestión de Entorno
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Carga inicial de sedes y estructura del sistema.</p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <BulkUploader tableName="sedes" title="Importar Sedes Excel" />
              <TemplateDownloader />
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/30 p-5 rounded-3xl text-xs space-y-2 text-indigo-700 dark:text-indigo-300">
            <div className="flex items-center gap-2 font-black">
              <AlertCircle className="w-4 h-4" /> Auditoría en Vivo
            </div>
            <p className="font-medium text-[11px] leading-relaxed">
              Todos los movimientos son registrados aquí para propósitos de debugging y analítica de seguridad.
            </p>
          </div>
        </div>

        {/* Right Side: Logs Table */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl flex flex-col h-[650px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" /> Últimos Eventos (Live)
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar módulo, acción o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                  <th className="py-2.5 px-3 font-black">Fecha/Hora</th>
                  <th className="py-2.5 px-3 font-black">Módulo</th>
                  <th className="py-2.5 px-3 font-black">Usuario</th>
                  <th className="py-2.5 px-3 font-black">Acción</th>
                  <th className="py-2.5 px-3 font-black">Sede</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {log.created_at ? format(new Date(log.created_at), 'dd MMM HH:mm:ss', { locale: es }) : '-'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider ${getLogColor(log.modulo)}`}>
                        {log.modulo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 whitespace-nowrap font-mono text-[11px]">
                      {log.usuario_email?.split('@')[0] || 'Sistema'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {log.accion}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px] whitespace-nowrap">
                      {log.sede_id ? log.sede_id.slice(0, 8) : 'Global'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
