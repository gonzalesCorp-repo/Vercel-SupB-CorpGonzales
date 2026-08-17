'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Square, Minimize2, GripHorizontal, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface WindowState {
  id: string;
  title: string;
  clientLabel?: string;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
}

interface DesktopWindowProps {
  window: WindowState;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  children: React.ReactNode;
}

export function DesktopWindow({
  window: win,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  children
}: DesktopWindowProps) {
  const [position, setPosition] = useState(win.position);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setPosition(win.position);
  }, [win.position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !win.isMaximized) {
        setPosition({
          x: Math.max(10, Math.min(e.clientX - dragStart.current.x, globalThis.window.innerWidth - 350)),
          y: Math.max(60, Math.min(e.clientY - dragStart.current.y, globalThis.window.innerHeight - 150))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      globalThis.window.addEventListener('mousemove', handleMouseMove);
      globalThis.window.addEventListener('mouseup', handleMouseUp);
    } else {
      globalThis.window.removeEventListener('mousemove', handleMouseMove);
      globalThis.window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      globalThis.window.removeEventListener('mousemove', handleMouseMove);
      globalThis.window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, win.isMaximized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus(win.id);
    if (!win.isMaximized) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  if (win.isMinimized) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.2 }}
      onMouseDown={() => onFocus(win.id)}
      style={{
        left: win.isMaximized ? 20 : position.x,
        top: win.isMaximized ? 80 : position.y,
        width: win.isMaximized ? 'calc(100vw - 40px)' : '520px',
        height: win.isMaximized ? 'calc(100vh - 120px)' : 'auto',
        maxHeight: win.isMaximized ? 'calc(100vh - 120px)' : '85vh',
        zIndex: win.zIndex
      }}
      className={`fixed bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-indigo-950/20 border border-slate-200 dark:border-slate-800 flex flex-col transition-all overflow-hidden ${
        isDragging ? 'opacity-95 shadow-3xl' : ''
      }`}
    >
      {/* Title bar estilo Mac/Windows Glass */}
      <div
        className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-move bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 select-none group"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {win.title}
              {win.clientLabel && (
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  {win.clientLabel}
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Window Action Controls */}
        <div className="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
          {/* Minimizar */}
          <button
            title="Minimizar a barra de tareas"
            onClick={() => onMinimize(win.id)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximizar / Restaurar */}
          <button
            title={win.isMaximized ? 'Restaurar tamaño' : 'Maximizar'}
            onClick={() => onMaximize(win.id)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors"
          >
            {win.isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          </button>

          {/* Cerrar / Descartar */}
          <button
            title="Cerrar ventana"
            onClick={() => onClose(win.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenido Formulario */}
      <div className="p-4 flex-1 min-h-0 overflow-y-auto bg-white dark:bg-slate-900">
        {children}
      </div>
    </motion.div>
  );
}
