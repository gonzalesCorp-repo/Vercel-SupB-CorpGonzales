'use client';

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { ItemTicket } from '@/services/tickets';

interface ModalEditarPrecioItemProps {
  isOpen: boolean;
  onClose: () => void;
  editItemTarget: { ticketId?: string; itemIndex: number; item: ItemTicket; esProforma?: boolean } | null;
  nuevoPrecioInput: number;
  setNuevoPrecioInput: (p: number) => void;
  motivoCortesiaInput: string;
  setMotivoCortesiaInput: (m: string) => void;
  onGuardarPrecio: () => void;
}

export function ModalEditarPrecioItem({
  isOpen,
  onClose,
  editItemTarget,
  nuevoPrecioInput,
  setNuevoPrecioInput,
  motivoCortesiaInput,
  setMotivoCortesiaInput,
  onGuardarPrecio
}: ModalEditarPrecioItemProps) {
  if (!isOpen || !editItemTarget) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-800 space-y-4 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-black text-white">Editar Precio / Cortesía</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <p className="text-xs font-bold text-white">{editItemTarget.item.nombre}</p>
            <span className="text-[10px] text-slate-400">
              Precio Base Original: S/ {Number(editItemTarget.item.precio_base || editItemTarget.item.precio_final).toFixed(2)}
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nuevo Precio (S/):</label>
            <input
              type="number"
              step="0.5"
              value={nuevoPrecioInput}
              onChange={(e) => setNuevoPrecioInput(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-white outline-none focus:border-indigo-500"
            />
          </div>

          {nuevoPrecioInput === 0 && (
            <div className="space-y-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Cortesía de Fidelización
              </span>
              <input
                type="text"
                value={motivoCortesiaInput}
                onChange={(e) => setMotivoCortesiaInput(e.target.value)}
                placeholder="Motivo de la cortesía..."
                className="w-full p-2 bg-slate-950 border border-amber-500/30 rounded-lg text-xs text-white outline-none"
              />
              <p className="text-[10px] text-amber-300/80">
                Se generará una alerta de aprobación inmediata para el supervisor en Recepción y Caja.
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onGuardarPrecio}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30"
            >
              Guardar Precio
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
