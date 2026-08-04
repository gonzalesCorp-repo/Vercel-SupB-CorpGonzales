'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Users2 } from 'lucide-react';

export interface StaffTurnoTabProps {
  tickets: any[];
  isLoading: boolean;
  cargarDatosMobile: () => void;
  estadoActual: string;
  miPosicionEnCola: number;
  setShowColegasModal: (b: boolean) => void;
  ticketActivo: any;
  handleSolicitarPreCobro: (id: string) => void;
  handleFinalizarAtencion: () => void;
}

export default function StaffTurnoTab({
  tickets,
  isLoading,
  cargarDatosMobile,
  estadoActual,
  miPosicionEnCola,
  setShowColegasModal,
  ticketActivo,
  handleSolicitarPreCobro,
  handleFinalizarAtencion
}: StaffTurnoTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          ATENCIONES EN CURSO: <span className="text-indigo-400">{tickets.length}</span>
        </span>
        <button 
          onClick={cargarDatosMobile}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
        </button>
      </div>

      {/* Tarjeta de Estado Actual + Posición del Turno + Botón Colegas */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex justify-between items-center shadow-xl">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ESTADO ACTUAL</span>
          <h3 className="text-xl font-black text-emerald-400 mt-0.5">{estadoActual}</h3>
          
          <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
            <span>🎯 Tu Posición en Piso:</span>
            <span className="text-white font-black text-sm">#{miPosicionEnCola > 0 ? miPosicionEnCola : 1}</span>
          </div>
        </div>

        <button 
          onClick={() => setShowColegasModal(true)}
          className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-2xl border border-indigo-400/30 shadow-lg shadow-indigo-600/30 active:scale-90 transition flex flex-col items-center gap-0.5"
          title="Ver Disponibilidad del Equipo"
        >
          <Users2 className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase">Equipo</span>
        </button>
      </div>

      {/* Lista de Atenciones */}
      {ticketActivo ? (
        <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 space-y-4 shadow-2xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                ⚡ Atención Activa
              </span>
              <h2 className="text-2xl font-black text-white mt-2">{ticketActivo.cliente_nombre}</h2>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              {ticketActivo.codigo_ticket || 'OATC-LIVE'}
            </span>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Servicios:</span>
            {ticketActivo.punto_partida?.map((srv: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-sm font-semibold text-slate-200">
                <span>{srv.nombre}</span>
                <span className="text-indigo-400 font-bold">${srv.precio}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => handleSolicitarPreCobro(ticketActivo.id)}
              className="py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-600/30 active:scale-95 transition-all"
            >
              Pre-Cobrar
            </button>
            <button 
              onClick={handleFinalizarAtencion}
              className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
            >
              Finalizar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xl">
          <span className="text-4xl block">📂</span>
          <h3 className="font-bold text-slate-200 text-base">Sin asignaciones</h3>
          <p className="text-xs text-slate-400 max-w-[240px] mx-auto">
            No se encontraron tareas registradas para el rango seleccionado.
          </p>
        </div>
      )}
    </motion.div>
  );
}
