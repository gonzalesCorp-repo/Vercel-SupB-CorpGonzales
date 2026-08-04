'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, CalendarPlus, X } from 'lucide-react';

export interface StaffAgendaTabProps {
  isLoading: boolean;
  cargarDatosMobile: () => void;
  showAddCitaModal: boolean;
  setShowAddCitaModal: (b: boolean) => void;
  newCitaForm: any;
  setNewCitaForm: (f: any) => void;
  handleCrearCita: (e: React.FormEvent) => void;
}

export default function StaffAgendaTab({
  isLoading,
  cargarDatosMobile,
  showAddCitaModal,
  setShowAddCitaModal,
  newCitaForm,
  setNewCitaForm,
  handleCrearCita
}: StaffAgendaTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          TOTAL DE REGISTROS: <span className="text-purple-400">4</span>
        </span>
        <button 
          onClick={cargarDatosMobile}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-purple-400 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
        </button>
      </div>

      <button 
        onClick={() => setShowAddCitaModal(true)}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" /> Registrar Cita
      </button>

      <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 block pt-2">
        HISTÓRICO
      </span>

      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">📅 15/02/2026</span>
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase">COMPLETADA</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-slate-100">👤 Cliente: <span className="font-normal text-slate-300">yolanda</span></p>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">CITA</span>
            </div>
            <p className="text-xs text-slate-400">💼 Colorimetria</p>
            <p className="text-xs text-slate-400 pt-1">📅 Cita: 15/02/2026 a las 9:00 AM</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">📅 27/01/2026</span>
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase">COMPLETADA</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-slate-100">👤 Cliente: <span className="font-normal text-slate-300">Nelly Flores</span></p>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">CITA</span>
            </div>
            <p className="text-xs text-slate-400">💼 Corte y diseño</p>
            <p className="text-xs text-slate-400 pt-1">📅 Cita: 27/01/2026 a las 11:00 AM</p>
          </div>
        </div>
      </div>

      {/* Modal Registrar Cita */}
      <AnimatePresence>
        {showAddCitaModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-slate-100"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm text-slate-100 flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4 text-purple-400" /> Agendar Nueva Cita
                </h3>
                <button onClick={() => setShowAddCitaModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCrearCita} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nombre del Cliente *</label>
                  <input 
                    type="text"
                    required
                    value={newCitaForm.clienteNombre}
                    onChange={e => setNewCitaForm({ ...newCitaForm, clienteNombre: e.target.value })}
                    placeholder="Ej. Yolanda Flores"
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Servicio Solicitado</label>
                  <select 
                    value={newCitaForm.servicio}
                    onChange={e => setNewCitaForm({ ...newCitaForm, servicio: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-purple-500 font-bold"
                  >
                    <option value="Colorimetria">Colorimetría</option>
                    <option value="Corte y Diseño">Corte y Diseño</option>
                    <option value="Peinados y Cepillados">Peinados y Cepillados</option>
                    <option value="Manicure">Manicure</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Fecha</label>
                    <input 
                      type="date"
                      value={newCitaForm.fecha}
                      onChange={e => setNewCitaForm({ ...newCitaForm, fecha: e.target.value })}
                      className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Hora</label>
                    <input 
                      type="time"
                      value={newCitaForm.hora}
                      onChange={e => setNewCitaForm({ ...newCitaForm, hora: e.target.value })}
                      className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all mt-2"
                >
                  Confirmar y Agendar
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
