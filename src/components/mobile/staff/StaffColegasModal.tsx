'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users2, X } from 'lucide-react';
import { Agente } from '@/services/recepcion';

export interface StaffColegasModalProps {
  isOpen: boolean;
  onClose: () => void;
  colegas: Agente[];
  filtroEspecialidad: string;
  setFiltroEspecialidad: (esp: string) => void;
  agenteId?: string;
  agente?: any;
}

export default function StaffColegasModal({
  isOpen,
  onClose,
  colegas,
  filtroEspecialidad,
  setFiltroEspecialidad,
  agenteId
}: StaffColegasModalProps) {
  const colegasFiltrados = colegas.filter(c => {
    if (filtroEspecialidad === 'TODAS') return true;
    return (c as any).especialidad?.toUpperCase().includes(filtroEspecialidad.toUpperCase());
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
        >
          <motion.div 
            initial={{ y: 50, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 50, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Disponibilidad del Equipo</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Posición Global y por Especialidad</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtro por Especialidades */}
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-2">
              {['TODAS', 'COLORIMETRIA', 'CORTE', 'PEINADOS', 'MANICURE'].map(esp => (
                <button key={esp}
                  onClick={() => setFiltroEspecialidad(esp)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase whitespace-nowrap transition-all ${
                    filtroEspecialidad === esp 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-700/60'
                  }`}
                >
                  {esp}
                </button>
              ))}
            </div>

            {/* Lista de Colegas en Piso */}
            <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
              {colegasFiltrados.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">No hay operarios en esta especialidad.</p>
              ) : (
                colegasFiltrados.map((col, idx) => {
                  const isSelf = agenteId && col.id === agenteId;
                  return (
                    <div 
                      key={col.id} 
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        isSelf 
                          ? 'bg-indigo-950/60 border-indigo-500/50 shadow-md' 
                          : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center border ${
                          isSelf ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {col.nombre} {isSelf && <span className="text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded">TÚ</span>}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {(col as any).especialidad || 'Estilista / Barbería'}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                        col.estado === 'DISPONIBLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        col.estado === 'OCUPADO' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {col.estado}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
