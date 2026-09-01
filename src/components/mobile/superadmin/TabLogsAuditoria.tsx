'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Filter, RefreshCw, Clock, 
  User, Shield, AlertCircle, Database, CheckCircle2 
} from 'lucide-react';
import { obtenerLogs } from '@/services/logger';
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

interface TabLogsAuditoriaProps {
  sedeId?: string;
}

export function TabLogsAuditoria({ sedeId }: TabLogsAuditoriaProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [filtroModulo, setFiltroModulo] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  const modulos = ['TODOS', 'AUTH', 'CAJA', 'RECEPCION', 'LAB', 'SUPERADMIN_FIX'];

  const cargarLogs = async () => {
    setLoading(true);
    const data = await obtenerLogs(60);
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarLogs();
  }, []);

  const logsFiltrados = logs.filter(log => {
    const coincideModulo = filtroModulo === 'TODOS' || (log.modulo || '').toUpperCase().includes(filtroModulo);
    const coincideBusqueda = busqueda === '' || 
      (log.accion || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (log.usuario_email || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (log.modulo || '').toLowerCase().includes(busqueda.toLowerCase());
    return coincideModulo && coincideBusqueda;
  });

  const getTiempoTranscurrido = (dateStr: string) => {
    try {
      return formatDistanceToNowStrict(new Date(dateStr), { locale: es, addSuffix: true });
    } catch (e) {
      return 'recientemente';
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Logs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Auditoría en Tiempo Real</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Trazabilidad de operaciones y acciones críticas</p>
            </div>
          </div>

          <button onClick={cargarLogs}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/20 active:scale-95 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por usuario, acción o módulo..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Pestañas de Filtro por Módulo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {modulos.map((m) => (
            <button key={m}
              onClick={() => setFiltroModulo(m)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition ${
                filtroModulo === m
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-2.5 shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Cargando feed de auditoría...</div>
        ) : logsFiltrados.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No se encontraron eventos con los filtros actuales.</div>
        ) : (
          logsFiltrados.map((log) => (
            <div
              key={log.id}
              className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {log.modulo || 'SISTEMA'}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {log.created_at ? getTiempoTranscurrido(log.created_at) : 'reciente'}
                </span>
              </div>

              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {log.accion}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-900">
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <User className="w-3 h-3 text-slate-500" /> {log.usuario_email}
                </span>
                {log.sedes?.nombre && (
                  <span className="text-purple-300 font-medium">
                    {log.sedes.nombre}
                  </span>
                )}
              </div>

              {log.detalles && Object.keys(log.detalles).length > 0 && (
                <div className="bg-slate-100 dark:bg-slate-900/80 p-2 rounded-xl text-[10px] font-mono text-slate-500 dark:text-slate-400 overflow-x-auto">
                  {JSON.stringify(log.detalles)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
