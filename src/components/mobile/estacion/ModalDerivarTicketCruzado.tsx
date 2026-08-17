'use client';

import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface ModalDerivarTicketCruzadoProps {
  isOpen: boolean;
  onClose: () => void;
  destinoTicket: 'PROPIO' | 'COLEGA' | 'RECEPCION';
  setDestinoTicket: (d: 'PROPIO' | 'COLEGA' | 'RECEPCION') => void;
  colegaSeleccionadoId: string;
  setColegaSeleccionadoId: (id: string) => void;
  setColegaSeleccionadoNombre: (n: string) => void;
  colaboradoresStaff: any[];
  nuevoItemNombre: string;
  setNuevoItemNombre: (n: string) => void;
  nuevoItemTipo: 'servicio' | 'producto';
  setNuevoItemTipo: (t: 'servicio' | 'producto') => void;
  nuevoItemPrecio: number;
  setNuevoItemPrecio: (p: number) => void;
  onAbrirCatalogo: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ModalDerivarTicketCruzado({
  isOpen,
  onClose,
  destinoTicket,
  setDestinoTicket,
  colegaSeleccionadoId,
  setColegaSeleccionadoId,
  setColegaSeleccionadoNombre,
  colaboradoresStaff,
  nuevoItemNombre,
  setNuevoItemNombre,
  nuevoItemTipo,
  setNuevoItemTipo,
  nuevoItemPrecio,
  setNuevoItemPrecio,
  onAbrirCatalogo,
  onSubmit
}: ModalDerivarTicketCruzadoProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-800 space-y-4 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-black text-white">+ Añadir Ticket / Cross-Selling</h4>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          
          {/* Selector de Triple Destino */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Destino de la atención:</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDestinoTicket('PROPIO')}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                  destinoTicket === 'PROPIO' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                Para Mí
              </button>
              <button
                type="button"
                onClick={() => setDestinoTicket('COLEGA')}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                  destinoTicket === 'COLEGA' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                A Colega
              </button>
              <button
                type="button"
                onClick={() => setDestinoTicket('RECEPCION')}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                  destinoTicket === 'RECEPCION' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                A Recepción
              </button>
            </div>
          </div>

          {/* Selector de Colega si destino === COLEGA */}
          {destinoTicket === 'COLEGA' && (
            <div className="space-y-1 animate-in fade-in">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Seleccionar Colega:</label>
              <select
                value={colegaSeleccionadoId}
                onChange={(e) => {
                  setColegaSeleccionadoId(e.target.value);
                  const c = colaboradoresStaff.find(s => s.id === e.target.value);
                  if (c) setColegaSeleccionadoNombre(c.nombre);
                }}
                required
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
              >
                <option value="">Selecciona a un compañero...</option>
                {colaboradoresStaff.map((colab) => (
                  <option key={colab.id} value={colab.id}>
                    {colab.nombre} ({colab.especialidad || colab.rol})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Servicio o Producto:</label>
              <button
                type="button"
                onClick={onAbrirCatalogo}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-800/60 transition active:scale-95"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" /> Explorar Catálogo
              </button>
            </div>
            <input
              type="text"
              required
              value={nuevoItemNombre}
              onChange={(e) => setNuevoItemNombre(e.target.value)}
              placeholder="Selecciona del catálogo o escribe personalizado..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo:</label>
              <select
                value={nuevoItemTipo}
                onChange={(e) => setNuevoItemTipo(e.target.value as any)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none"
              >
                <option value="servicio">✂️ Servicio</option>
                <option value="producto">🛍️ Producto Retail</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Precio (S/):</label>
              <input
                type="number"
                step="0.5"
                value={nuevoItemPrecio}
                onChange={(e) => setNuevoItemPrecio(Number(e.target.value))}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30"
            >
              {destinoTicket === 'COLEGA' ? 'Enviar a Colega' : destinoTicket === 'RECEPCION' ? 'Enviar a Recepción' : 'Añadir a OATC'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
