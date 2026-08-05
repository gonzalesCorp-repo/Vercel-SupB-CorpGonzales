'use client';

import { Calendar, RefreshCw } from 'lucide-react';
import { translateEstado } from '@/lib/utils';

export interface OperacionesHistorialTabProps {
  historialTickets: any[];
  fechaInicio: string;
  setFechaInicio: (f: string) => void;
  fechaFin: string;
  setFechaFin: (f: string) => void;
  isLoadingHistorial: boolean;
}

export default function OperacionesHistorialTab({
  historialTickets,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  isLoadingHistorial
}: OperacionesHistorialTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Historial de Atenciones Finalizadas
          </h3>
          <p className="text-sm text-gray-500">Registro histórico de OATCs por rango de fecha.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 text-sm">
            <span className="text-xs font-bold text-gray-500 uppercase">Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-transparent font-medium text-gray-700 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 text-sm">
            <span className="text-xs font-bold text-gray-500 uppercase">Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="bg-transparent font-medium text-gray-700 outline-none"
            />
          </div>
        </div>
      </div>

      {isLoadingHistorial ? (
        <div className="flex justify-center items-center py-12 text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mr-2" /> Cargando historial...
        </div>
      ) : historialTickets.length === 0 ? (
        <div className="text-center py-12 text-gray-400 font-medium">
          No se encontraron registros en el rango seleccionado.
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Fecha / Hora</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Atendido por</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Servicios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historialTickets.map((ticket, index) => (
                <tr key={ticket.id || index} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">{ticket.cliente_nombre || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600">{ticket.agente_nombre || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full uppercase">
                      {translateEstado(ticket.estado_proceso || 'FINALIZADO')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.punto_partida && Array.isArray(ticket.punto_partida) ? (
                      <span className="text-xs text-gray-600">
                        {ticket.punto_partida.map((s: any) => s.nombre).join(', ')}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
