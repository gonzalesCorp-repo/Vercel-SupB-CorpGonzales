'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, X } from 'lucide-react';

export interface StaffMetricasViewProps {
  agente: any;
  onClose?: () => void;
}

export default function StaffMetricasView({ agente, onClose }: StaffMetricasViewProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple-400" /> MÉTRICAS Y DESEMPEÑO
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Summary Banner Blue Gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-2xl space-y-4 relative overflow-hidden">
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-widest uppercase text-blue-200">DESEMPEÑO DEL PERÍODO</span>
          <h3 className="text-4xl font-black tracking-tight">14</h3>
          <p className="text-xs text-blue-100 font-medium">Atenciones Asignadas</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-blue-100 flex items-center gap-1">👥 CLIENTES ÚNICOS</span>
            <p className="text-xl font-black mt-0.5">0</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl">
            <span className="text-[10px] font-bold text-blue-100 flex items-center gap-1">📌 EFECTIVIDAD</span>
            <p className="text-xs font-bold text-blue-200 mt-1">Ver Reportes</p>
          </div>
        </div>
      </div>

      {/* Desglose de Servicios */}
      <div className="space-y-3 pt-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">DESGLOSE DE SERVICIOS</span>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400">Peinados y Cepillados</span>
            <p className="text-3xl font-black text-indigo-400 mt-1">2</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400">Colorimetría</span>
            <p className="text-3xl font-black text-purple-400 mt-1">7</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
          <span className="text-[10px] font-bold uppercase text-slate-400">Corte y Diseño</span>
          <p className="text-3xl font-black text-pink-400 mt-1">5</p>
        </div>
      </div>

      {/* Ventas e Insumos en Construcción */}
      <div className="bg-slate-900/60 border border-dashed border-slate-800 p-6 rounded-3xl text-center space-y-2">
        <span className="text-3xl block">🚧</span>
        <h4 className="font-bold text-xs text-slate-300">Ventas e Insumos</h4>
        <p className="text-[10px] text-slate-500">Módulo en construcción. Próximamente conexión con GS (Luxury/RD).</p>
      </div>
    </motion.div>
  );
}
