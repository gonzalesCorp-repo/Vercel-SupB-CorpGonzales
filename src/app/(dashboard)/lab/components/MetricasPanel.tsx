'use client';

import { BarChart3, TrendingUp, AlertCircle, PackageCheck, Zap } from 'lucide-react';

export default function MetricasPanel() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-500" />
          Métricas y Reportes
        </h1>
        <p className="text-slate-500 mt-2">Visualiza el rendimiento del laboratorio y el estado del inventario en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <PackageCheck className="w-6 h-6" />
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Órdenes Despachadas</h3>
            <p className="text-3xl font-black text-slate-800">142</p>
            <p className="text-xs text-slate-400 mt-2">En los últimos 30 días</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <span className="bg-rose-50 text-rose-600 text-xs font-bold px-2.5 py-1 rounded-full">
              Atención
            </span>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Insumos Críticos</h3>
            <p className="text-3xl font-black text-slate-800">8</p>
            <p className="text-xs text-slate-400 mt-2">Items con stock menor a 10</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <Zap className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Tiempo de Respuesta</h3>
            <p className="text-3xl font-black text-slate-800">4.2<span className="text-lg text-slate-500 font-medium">min</span></p>
            <p className="text-xs text-slate-400 mt-2">Promedio desde solicitud a despacho</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">Valor de Inventario</h3>
            <p className="text-3xl font-black text-slate-800"><span className="text-lg text-slate-500 font-medium mr-1">S/.</span>12,450</p>
            <p className="text-xs text-slate-400 mt-2">Costo estimado en sede activa</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
        <BarChart3 className="w-16 h-16 text-slate-200 mb-4" />
        <h3 className="text-lg font-medium text-slate-600 mb-2">Métricas Detalladas</h3>
        <p className="text-sm max-w-md text-center">
          Los gráficos detallados de consumo por categoría y proyección de compras se integrarán en una fase futura conectando con la base de datos completa.
        </p>
      </div>
    </div>
  );
}
