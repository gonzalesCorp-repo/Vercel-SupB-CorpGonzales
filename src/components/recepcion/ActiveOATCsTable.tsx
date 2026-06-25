'use client';

import React from 'react';
import { Clock, CheckCircle2, UserCircle2, ArrowRight } from 'lucide-react';

const MOCK_ACTIVE_OATCS = [
  { id: '1', cliente: 'María López', agente: 'Jessica Huaman', servicio: 'Corte', tiempo: '10 min', estado: 'EN PROCESO' },
  { id: '2', cliente: 'Juan Pérez', agente: 'En Espera', servicio: 'Barbería', tiempo: '5 min', estado: 'ESPERANDO' },
  { id: '3', cliente: 'Sofía Castro', agente: 'Margot Lavado', servicio: 'Tinte', tiempo: '45 min', estado: 'EN PROCESO' },
];

export default function ActiveOATCsTable() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-lg">Atenciones Activas</h3>
        <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
          {MOCK_ACTIVE_OATCS.length} en sala
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Servicio</th>
              <th className="px-6 py-3">Agente Asignado</th>
              <th className="px-6 py-3">Tiempo</th>
              <th className="px-6 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_ACTIVE_OATCS.map((oatc) => (
              <tr key={oatc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <UserCircle2 className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-700">{oatc.cliente}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {oatc.servicio}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                    oatc.estado === 'ESPERANDO' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {oatc.agente}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {oatc.tiempo}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {MOCK_ACTIVE_OATCS.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          No hay atenciones activas en este momento.
        </div>
      )}
    </div>
  );
}
