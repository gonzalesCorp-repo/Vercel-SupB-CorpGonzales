'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, X, RefreshCw, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface StaffHistoricoViewProps {
  agente: any;
  fechaDesde?: string;
  setFechaDesde?: (f: string) => void;
  fechaHasta?: string;
  setFechaHasta?: (f: string) => void;
  onClose?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function StaffHistoricoView({
  agente,
  fechaDesde: propFechaDesde,
  setFechaDesde: propSetFechaDesde,
  fechaHasta: propFechaHasta,
  setFechaHasta: propSetFechaHasta,
  onClose
}: StaffHistoricoViewProps) {
  const today = new Date().toISOString().split('T')[0];
  const [localDesde, setLocalDesde] = useState(propFechaDesde || today);
  const [localHasta, setLocalHasta] = useState(propFechaHasta || today);
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fechaDesde = propFechaDesde || localDesde;
  const fechaHasta = propFechaHasta || localHasta;
  const setFechaDesde = propSetFechaDesde || setLocalDesde;
  const setFechaHasta = propSetFechaHasta || setLocalHasta;

  const supabase = createClient();

  const cargarHistorico = async () => {
    if (!agente?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from('oatc')
        .select('*')
        .or(`agente_id.eq.${agente.id},agente_nombre.ilike.%${agente.nombre}%`)
        .gte('created_at', `${fechaDesde}T00:00:00`)
        .lte('created_at', `${fechaHasta}T23:59:59`)
        .order('created_at', { ascending: false });

      setRegistros(data || []);
    } catch (e) {
      console.error('Error cargando histórico de staff:', e);
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorico();
  }, [agente?.id, fechaDesde, fechaHasta]);

  const handleLimpiarFiltro = () => {
    setFechaDesde(today);
    setFechaHasta(today);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xl transition-colors">
        <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> HISTÓRICO DE PRODUCCIÓN
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filtrar Rango */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl transition-colors">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> FILTRAR RANGO DE PRODUCCIÓN
          </span>
          <button onClick={handleLimpiarFiltro}
            className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 px-2.5 py-1 rounded-full hover:bg-pink-100 dark:hover:bg-pink-500/20 transition cursor-pointer"
          >
            Hoy
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Desde:</label>
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={e => setFechaDesde(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">Hasta:</label>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={e => setFechaHasta(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          TOTAL DE REGISTROS: <span className="text-indigo-600 dark:text-indigo-400">{registros.length}</span>
        </span>
        <button onClick={cargarHistorico} 
          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refrescar
        </button>
      </div>

      {/* Lista Histórico */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">Cargando órdenes históricas...</div>
        ) : registros.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
            <History className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto opacity-50" />
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">Sin órdenes en este rango</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">No se encontraron órdenes registradas para las fechas seleccionadas.</p>
          </div>
        ) : (
          registros.map((item) => (
            <div key={item.id} className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-md transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    #{item.codigo_ticket || item.id.substring(0, 6)}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                  </span>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                  item.estado_proceso === 'FINALIZADO'
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30'
                    : item.estado_proceso === 'CANCELADO'
                    ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30'
                    : 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30'
                }`}>
                  {item.estado_proceso || 'ORDEN'}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  👤 Cliente: <span className="text-slate-900 dark:text-white font-black">{item.cliente_nombre || 'Cliente General'}</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  🕒 Fecha: {item.created_at ? new Date(item.created_at).toLocaleDateString('es-PE') : 'Hoy'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
