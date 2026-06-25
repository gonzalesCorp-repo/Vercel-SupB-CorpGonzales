'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  RefreshCcw, 
  ShieldCheck, 
  Users, 
  Activity,
  AlertCircle
} from 'lucide-react';

export default function RecepcionReportesPage() {
  const [fecha, setFecha] = useState('2026-06-24');
  
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-2 rounded-lg">
            <span className="font-bold text-xl px-1">G</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">GestiOn-Pro Corporate Overview</h1>
            <p className="text-xs text-slate-500">Control de Operaciones Modular en Salones de Belleza</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha Operación</label>
            <div className="relative">
              <input 
                type="date" 
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="pl-3 pr-8 py-1.5 border border-slate-200 rounded-md text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Filtrar por Asesor</label>
            <select className="px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-700 bg-white min-w-[180px] focus:ring-2 focus:ring-blue-500 outline-none">
              <option>[ Todos los Asesores ]</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Filtrar por Categoría</label>
            <select className="px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-700 bg-white min-w-[180px] focus:ring-2 focus:ring-blue-500 outline-none">
              <option>[ Todas las Categorías ]</option>
            </select>
          </div>

          <button className="mt-4 p-2 border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center gap-2 mt-8 mb-4">
        <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
        <h2 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Área de Recepción y Control de Turnos</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 relative overflow-hidden">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">1. Balance de Atenciones</h3>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-black text-slate-800">32</span>
            <span className="text-sm font-semibold text-emerald-500">Ok</span>
            <span className="text-slate-300 mx-1">/</span>
            <span className="text-lg font-bold text-red-500">1</span>
            <span className="text-sm font-semibold text-red-500">Fallas</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Efectividad de Resolución:</span>
            <span className="font-bold text-slate-800">97%</span>
          </div>
          <div className="absolute top-5 right-5 text-emerald-100 bg-emerald-50 p-2 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 relative">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">2. Personal en Sala por Especialidad</h3>
          <p className="text-[10px] text-slate-400 mb-5">Especialidades validadas con la hoja Agentes</p>
          
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Estilismo: 10
            </span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full border border-indigo-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Cosmiatría: 3
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full border border-slate-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
              Administración: 2
            </span>
          </div>
          <div className="absolute top-5 right-5 text-blue-100 bg-blue-50 p-2 rounded-lg">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 relative">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">3. Flujo Global / Turnos</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-black text-slate-800">33</span>
            <span className="text-sm font-medium text-slate-500">movimientos</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Clientes: 18
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Turnos: 14
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Asesorías: 1
            </div>
          </div>
          <div className="absolute top-5 right-5 text-indigo-100 bg-indigo-50 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Auditoria Table */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            4. Distribución de Reclamos por Categoría (Detalle de Auditoría)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                <tr>
                  <th className="pb-3 font-semibold">Categoría (Col I)</th>
                  <th className="pb-3 font-semibold">Tipo OATC (Col C)</th>
                  <th className="pb-3 font-semibold">Agente (Col G)</th>
                  <th className="pb-3 font-semibold">Naturaleza (Col F)</th>
                  <th className="pb-3 font-semibold text-center">Estatus</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr className="border-b border-slate-50">
                  <td className="py-3 pr-2">Solo preguntaba el precio</td>
                  <td className="py-3 pr-2">Peinados y cepillados</td>
                  <td className="py-3 pr-2">Ruperto Chuquizuta Inga</td>
                  <td className="py-3 pr-2">
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Asesoría</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">1</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-2 max-w-[50%] leading-tight">
              <span>🏆</span>
              5. Ranking de Atenciones por Estilista / Asesor
            </h3>
            
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold uppercase text-slate-500 max-w-[40%]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-sm"></span>Cliente</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm"></span>Turno</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-sm"></span>Especial/Prod/SC</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-sm"></span>Asesoría/Cita</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-sm"></span>Error/Corrección</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Rank 1 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span className="text-xs font-bold text-slate-700">Jessica Huaman</span>
                </div>
                <span className="text-xs font-bold text-slate-800">5 Atenciones</span>
              </div>
              <div className="w-full h-3 flex rounded-full overflow-hidden mb-1">
                <div className="bg-emerald-500 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: '80%' }}>4</div>
                <div className="bg-blue-600 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: '20%' }}>1</div>
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 rounded border border-emerald-100">4 Cliente</span>
                <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded border border-blue-100">1 Turno</span>
              </div>
            </div>

            {/* Rank 2 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span className="text-xs font-bold text-slate-700">Margot Lavado</span>
                </div>
                <span className="text-xs font-bold text-slate-800">4 Atenciones</span>
              </div>
              <div className="w-full h-3 flex rounded-full overflow-hidden mb-1">
                <div className="bg-blue-500 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: '50%' }}>2</div>
                <div className="bg-emerald-500 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: '50%' }}>2</div>
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded border border-blue-100">2 Turno</span>
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 rounded border border-emerald-100">2 Cliente</span>
              </div>
            </div>

            {/* Rank 3 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span className="text-xs font-bold text-slate-700">Cocó Pacheco</span>
                </div>
                <span className="text-xs font-bold text-slate-800">4 Atenciones</span>
              </div>
              <div className="w-full h-3 flex rounded-full overflow-hidden mb-1">
                <div className="bg-emerald-500 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: '50%' }}>2</div>
                <div className="bg-blue-500 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: '50%' }}>2</div>
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 rounded border border-emerald-100">2 Cliente</span>
                <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded border border-blue-100">2 Turno</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Section Footer */}
      <div className="flex items-center gap-2 mt-8 mb-4">
        <div className="w-4 h-4 bg-emerald-500 rounded-sm flex items-center justify-center text-[10px] font-bold text-white">$</div>
        <h2 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Área de Ventas (Sala y Retail ERP)</h2>
      </div>

    </div>
  );
}
