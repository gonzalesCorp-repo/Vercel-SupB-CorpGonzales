'use client';

import React from 'react';
import { Plus, FileText, Sparkles, Layers, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WindowState } from './DesktopWindow';

interface DesktopTaskbarProps {
  windows: WindowState[];
  onToggleWindow: (id: string) => void;
  onNewWindow: () => void;
}

export function DesktopTaskbar({
  windows,
  onToggleWindow,
  onNewWindow
}: DesktopTaskbarProps) {
  if (windows.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-2 rounded-2xl max-w-[90vw] overflow-x-auto select-none">
      
      {/* Botón rápido "+ Nueva Orden" */}
      <button
        onClick={onNewWindow}
        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-lg shadow-indigo-600/30 shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Nueva Orden</span>
      </button>

      <div className="h-6 w-[1px] bg-slate-700 mx-1 shrink-0" />

      {/* Lista de Ventanas Abiertas */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
        <AnimatePresence>
          {windows.map((win) => {
            const isFront = !win.isMinimized;
            return (
              <motion.button
                key={win.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => onToggleWindow(win.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                  isFront
                    ? 'bg-slate-800 text-white border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/50'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${isFront ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="max-w-[130px] truncate">
                  {win.clientLabel ? win.clientLabel : win.title}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${isFront ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'}`} />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="text-[10px] text-slate-500 font-bold px-2 shrink-0">
        {windows.length} {windows.length === 1 ? 'borrador' : 'borradores'}
      </div>
    </div>
  );
}
