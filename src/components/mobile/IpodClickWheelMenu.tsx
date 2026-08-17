'use client';

import React, { useState } from 'react';
import { BarChart3, DollarSign, Bell, Coffee, X, Disc, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export type IpodToolOption = 'historial' | 'liquidacion' | 'asistencia' | 'bar';

interface IpodClickWheelMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: IpodToolOption) => void;
}

export function IpodClickWheelMenu({ isOpen, onClose, onSelectOption }: IpodClickWheelMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tools: Array<{ id: IpodToolOption; label: string; icon: string; desc: string }> = [
    { id: 'historial', label: 'Historial & Auditoría', icon: '📊', desc: 'Atenciones, insumos IoT y precios' },
    { id: 'liquidacion', label: 'Mi Liquidación', icon: '💵', desc: 'Estado de cuenta continuo y pagos' },
    { id: 'asistencia', label: 'Asistencia NFC', icon: '🚨', desc: 'Check-in, refrigerio y salida' },
    { id: 'bar', label: 'Bar & Cafetería', icon: '🍹', desc: 'Bebidas de cortesía para clientes' }
  ];

  if (!isOpen) return null;

  const currentTool = tools[selectedIndex];

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % tools.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + tools.length) % tools.length);
  };

  const handleConfirm = () => {
    onSelectOption(currentTool.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        className="bg-gradient-to-b from-slate-900 via-slate-920 to-slate-950 w-full max-w-xs rounded-[40px] p-6 border border-slate-700/80 shadow-2xl shadow-indigo-950/50 flex flex-col items-center select-none relative"
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pantalla Superior estilo iPod */}
        <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6 shadow-inner text-center space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 border-b border-slate-900 pb-1">
            <span className="flex items-center gap-1">
              <Disc className="w-3 h-3 text-indigo-400 animate-spin" /> iPod Mini Mode
            </span>
            <span className="font-mono text-indigo-400">{selectedIndex + 1}/{tools.length}</span>
          </div>

          <div className="py-2">
            <span className="text-3xl block mb-1">{currentTool.icon}</span>
            <h3 className="text-base font-black text-white tracking-tight">{currentTool.label}</h3>
            <p className="text-[11px] text-slate-400 font-medium">{currentTool.desc}</p>
          </div>
        </div>

        {/* Rueda Táctil iPod Click Wheel Minimalista */}
        <div className="relative w-52 h-52 rounded-full bg-gradient-to-tr from-slate-800 via-slate-750 to-slate-700 border-4 border-slate-600/50 shadow-2xl flex items-center justify-center">
          
          {/* Botón Superior (Historial) */}
          <button
            onClick={() => { setSelectedIndex(0); }}
            className={`absolute top-2.5 font-bold text-[10px] uppercase tracking-widest transition-all ${
              selectedIndex === 0 ? 'text-indigo-400 font-black scale-110' : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 Historial
          </button>

          {/* Botón Derecho (Liquidación) */}
          <button
            onClick={() => { setSelectedIndex(1); }}
            className={`absolute right-2.5 font-bold text-[10px] uppercase tracking-widest transition-all ${
              selectedIndex === 1 ? 'text-emerald-400 font-black scale-110' : 'text-slate-400 hover:text-white'
            }`}
          >
            💵 Liquidación
          </button>

          {/* Botón Inferior (Asistencia) */}
          <button
            onClick={() => { setSelectedIndex(2); }}
            className={`absolute bottom-2.5 font-bold text-[10px] uppercase tracking-widest transition-all ${
              selectedIndex === 2 ? 'text-rose-400 font-black scale-110' : 'text-slate-400 hover:text-white'
            }`}
          >
            🚨 Asistencia
          </button>

          {/* Botón Izquierdo (Bar) */}
          <button
            onClick={() => { setSelectedIndex(3); }}
            className={`absolute left-3.5 font-bold text-[10px] uppercase tracking-widest transition-all ${
              selectedIndex === 3 ? 'text-amber-400 font-black scale-110' : 'text-slate-400 hover:text-white'
            }`}
          >
            🍹 Bar
          </button>

          {/* Botón Central 'SELECT' */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleConfirm}
            className="w-24 h-24 rounded-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700 shadow-xl flex flex-col items-center justify-center text-white active:bg-indigo-950 transition-all group"
          >
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400 group-hover:text-white transition-colors">
              SELECT
            </span>
            <span className="text-[9px] text-slate-500 font-bold mt-0.5">Abrir</span>
          </motion.button>
        </div>

        {/* Controles de Navegación por Giros */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl active:scale-95 transition"
          >
            ◀ Anterior
          </button>
          <button
            onClick={handleNext}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl active:scale-95 transition"
          >
            Siguiente ▶
          </button>
        </div>

      </motion.div>
    </div>
  );
}
