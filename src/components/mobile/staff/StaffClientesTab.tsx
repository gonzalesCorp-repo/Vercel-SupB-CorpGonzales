'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, UserPlus, X } from 'lucide-react';

export interface StaffClientesTabProps {
  queryCliente: string;
  setQueryCliente: (q: string) => void;
  clientesEncontrados: any[];
  showAddClienteModal: boolean;
  setShowAddClienteModal: (b: boolean) => void;
  newClienteForm: any;
  setNewClienteForm: (f: any) => void;
  handleCrearCliente: (e: React.FormEvent) => void;
}

export default function StaffClientesTab({
  queryCliente,
  setQueryCliente,
  clientesEncontrados,
  showAddClienteModal,
  setShowAddClienteModal,
  newClienteForm,
  setNewClienteForm,
  handleCrearCliente
}: StaffClientesTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl">
        <div className="relative">
          <input 
            type="text" 
            value={queryCliente}
            onChange={e => setQueryCliente(e.target.value)}
            placeholder="DNI, Nombre, Apellido, Celular..." 
            className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 pl-10 pr-4 py-3.5 rounded-2xl text-xs border border-slate-800 focus:outline-none focus:border-emerald-500 transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          CLIENTES ENCONTRADOS: <span className="text-emerald-400">{clientesEncontrados.length}</span>
        </span>
      </div>

      <button 
        onClick={() => setShowAddClienteModal(true)}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" /> Agregar nuevo cliente
      </button>

      {clientesEncontrados.length > 0 ? (
        <div className="space-y-3 pt-2">
          {clientesEncontrados.map(c => (
            <div key={c.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center shadow-lg">
              <div>
                <h4 className="font-bold text-slate-100 text-sm">{c.nombre}</h4>
                <p className="text-xs text-slate-400 mt-0.5">DNI: {c.dni || 'N/A'} • Cel: {c.celular || 'N/A'}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                CRM
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xl">
          <span className="text-4xl block">📂</span>
          <h3 className="font-bold text-slate-200 text-base">Sin asignaciones</h3>
          <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
            No se encontraron registros para la búsqueda ingresada.
          </p>
        </div>
      )}

      {/* Modal Agregar Cliente CRM */}
      <AnimatePresence>
        {showAddClienteModal && (
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
                  <UserPlus className="w-4 h-4 text-emerald-400" /> Nuevo Cliente CRM
                </h3>
                <button onClick={() => setShowAddClienteModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCrearCliente} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nombre Completo *</label>
                  <input 
                    type="text"
                    required
                    value={newClienteForm.nombre}
                    onChange={e => setNewClienteForm({ ...newClienteForm, nombre: e.target.value })}
                    placeholder="Ej. Yolanda Flores"
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">DNI / Identificación</label>
                  <input 
                    type="text"
                    value={newClienteForm.dni}
                    onChange={e => setNewClienteForm({ ...newClienteForm, dni: e.target.value })}
                    placeholder="Ej. 74839201"
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Celular / WhatsApp</label>
                  <input 
                    type="text"
                    value={newClienteForm.celular}
                    onChange={e => setNewClienteForm({ ...newClienteForm, celular: e.target.value })}
                    placeholder="Ej. 987654321"
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition-all mt-2"
                >
                  Guardar Cliente
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
