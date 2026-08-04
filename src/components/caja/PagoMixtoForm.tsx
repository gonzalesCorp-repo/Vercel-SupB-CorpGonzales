'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PagoMixto } from '@/types/caja';

interface PagoMixtoFormProps {
  pagosMixtos: PagoMixto[];
  setPagosMixtos: React.Dispatch<React.SetStateAction<PagoMixto[]>>;
  totalCalculado: number;
}

export function PagoMixtoForm({
  pagosMixtos,
  setPagosMixtos,
  totalCalculado,
}: PagoMixtoFormProps) {
  const totalPagado = pagosMixtos.reduce((acc, p) => acc + (p.monto || 0), 0);
  const restante = totalCalculado - totalPagado;
  const isExact = Math.abs(restante) < 0.01;

  const handleAddPago = () => {
    setPagosMixtos([...pagosMixtos, { metodo: 'Efectivo', monto: 0 }]);
  };

  const handleRemovePago = (index: number) => {
    const newPagos = pagosMixtos.filter((_, i) => i !== index);
    setPagosMixtos(newPagos);
  };

  const handleMetodoChange = (index: number, metodo: string) => {
    const newPagos = [...pagosMixtos];
    newPagos[index].metodo = metodo;
    setPagosMixtos(newPagos);
  };

  const handleMontoChange = (index: number, montoStr: string) => {
    const newPagos = [...pagosMixtos];
    newPagos[index].monto = parseFloat(montoStr) || 0;
    setPagosMixtos(newPagos);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Método de Pago
        </label>
        <button
          type="button"
          onClick={handleAddPago}
          className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
        >
          <Plus className="w-3 h-3 mr-1" /> Dividir Pago
        </button>
      </div>

      <div className="space-y-3">
        {pagosMixtos.map((pago, index) => (
          <div key={index} className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-xl p-2 shadow-sm">
            <select
              value={pago.metodo}
              onChange={(e) => handleMetodoChange(index, e.target.value)}
              className="flex-1 bg-transparent border-none text-sm text-slate-700 font-bold outline-none cursor-pointer"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta (Crédito/Débito)</option>
              <option value="Transferencia">Transferencia</option>
            </select>

            <div className="relative w-32">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-slate-400 font-bold">$</span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={pago.monto || ''}
                onChange={(e) => handleMontoChange(index, e.target.value)}
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
              />
            </div>

            {pagosMixtos.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemovePago(index)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Totales Resumen */}
      <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="text-slate-500 font-medium">Total Pagado:</span>
          <span className="font-bold text-slate-700">${totalPagado.toFixed(2)}</span>
        </div>
        <div className={`flex justify-between items-center text-sm font-bold ${isExact ? 'text-emerald-600' : 'text-red-500'}`}>
          <span>Restante:</span>
          <span>${restante > 0 ? restante.toFixed(2) : '0.00'}</span>
        </div>
      </div>
    </div>
  );
}
