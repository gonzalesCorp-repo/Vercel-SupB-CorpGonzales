'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { History, X, RefreshCw } from 'lucide-react';

export interface StaffHistoricoViewProps {
  agente: any;
  fechaDesde: string;
  setFechaDesde: (f: string) => void;
  fechaHasta: string;
  setFechaHasta: (f: string) => void;
  onClose?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function StaffHistoricoView({
  agente,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  onClose,
  onRefresh,
  isLoading = false
}: StaffHistoricoViewProps) {
  const handleLimpiarFiltro = () => {
    const today = new Date().toISOString().split('T')[0];
    setFechaDesde(today);
    setFechaHasta(today);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" /> HISTÓRICO DE PRODUCCIÓN
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filtrar Rango */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            📅 FILTRAR RANGO DE PRODUCCIÓN
          </span>
          <button 
            onClick={handleLimpiarFiltro}
            className="text-[10px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-full hover:bg-pink-500/20 transition"
          >
            Limpiar Filtro
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Desde:</label>
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={e => setFechaDesde(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Hasta:</label>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={e => setFechaHasta(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          TOTAL DE REGISTROS: <span className="text-indigo-400">3</span>
        </span>
        {onRefresh && (
          <button onClick={onRefresh} className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
          </button>
        )}
      </div>

      {/* Lista Histórico */}
      <div className="space-y-3">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">#18</span>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">7:11 PM</span>
            </div>
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">TURNO</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-300">👤 Nombre: <span className="text-white font-black">POR ASIGNAR</span></p>
            <p className="text-[11px] text-slate-400">🕒 Orden: 02/08/2026 • 3:41 PM</p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">#9</span>
              <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">CANCELADO: 12:58 PM</span>
            </div>
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">TURNO</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-300">👤 Nombre: <span className="text-white font-black">POR ASIGNAR</span></p>
            <p className="text-[11px] text-slate-400">🕒 Orden: 02/08/2026 • 12:56 PM • <span className="text-amber-400 font-bold">⚠️ Motivo: p...</span></p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">#cita 04:00</span>
              <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">CANCELADO: 4:43 PM</span>
            </div>
            <span className="text-[10px] font-black text-purple-400 bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full">CITA</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-300">👤 Nombre: <span className="text-white font-black">Eliana</span></p>
            <p className="text-[11px] text-slate-400">🕒 Orden: 02/08/2026 • 12:01 PM • <span className="text-amber-400 font-bold">⚠️ Motivo: c...</span></p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
