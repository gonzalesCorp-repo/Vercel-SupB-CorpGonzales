'use client';

import { DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface CajaResumenCardsProps {
  totalRecaudado: number;
  cantPorCobrar: number;
  cantCobradas: number;
  promedioTicket: number;
}

export function CajaResumenCards({
  totalRecaudado,
  cantPorCobrar,
  cantCobradas,
  promedioTicket,
}: CajaResumenCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Recaudado */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Recaudado</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">
            ${totalRecaudado.toFixed(2)}
          </h3>
        </div>
        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Por Cobrar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Por Cobrar</p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">
            {cantPorCobrar}
          </h3>
        </div>
        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      {/* Cobradas */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cobros Realizados</p>
          <h3 className="text-2xl font-black text-indigo-600 mt-1">
            {cantCobradas}
          </h3>
        </div>
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>

      {/* Ticket Promedio */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Promedio</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">
            ${promedioTicket.toFixed(2)}
          </h3>
        </div>
        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 border border-purple-100">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
