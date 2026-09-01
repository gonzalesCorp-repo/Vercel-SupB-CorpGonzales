'use client';

import React from 'react';
import { UserX, X, Calendar } from 'lucide-react';

interface ModalRechazoAsesoriaProps {
  isOpen: boolean;
  onClose: () => void;
  motivoSeleccionado: string;
  setMotivoSeleccionado: (v: string) => void;
  detalleInput: string;
  setDetalleInput: (v: string) => void;
  onConfirmarRechazo: (agendarCita: boolean) => void;
  isProcessing: boolean;
  motivosList: string[];
}

export function ModalRechazoAsesoria({
  isOpen,
  onClose,
  motivoSeleccionado,
  setMotivoSeleccionado,
  detalleInput,
  setDetalleInput,
  onConfirmarRechazo,
  isProcessing,
  motivosList
}: ModalRechazoAsesoriaProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-400">
            <UserX className="w-5 h-5" />
            <h4 className="text-sm font-black text-white">Cancelar / No Acepta Proforma</h4>
          </div>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Motivo del Rechazo:</label>
            <select
              value={motivoSeleccionado}
              onChange={(e) => setMotivoSeleccionado(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors rounded-xl text-xs text-white outline-none"
            >
              {motivosList.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Detalles adicionales (opcional):</label>
            <textarea
              value={detalleInput}
              onChange={(e) => setDetalleInput(e.target.value)}
              placeholder="ej. El cliente solo disponía de 30 min o el presupuesto superó los S/ 150..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors rounded-xl text-xs text-white outline-none min-h-[60px]"
            />
          </div>

          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-2">
            <p className="text-[11px] text-indigo-300 font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> ¿Deseas agendar para otra fecha?
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Guardará un Lead de recuperación en el CRM vinculado a tu cartera para retomar contacto por WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => onConfirmarRechazo(true)}
              disabled={isProcessing}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5" /> Cancelar y Agendar Cita CRM
            </button>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={() => onConfirmarRechazo(false)}
              disabled={isProcessing}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30"
            >
              Confirmar Rechazo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
