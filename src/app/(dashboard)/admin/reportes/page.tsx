'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { obtenerMeticasGlobales, KPIReporte } from '@/services/admin';

export default function ReportesPage() {
  const [metricas, setMetricas] = useState<KPIReporte | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cargarMetricas = async () => {
    setIsLoading(true);
    const data = await obtenerMeticasGlobales();
    setMetricas(data);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarMetricas();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard General</h1>
        <p className="text-sm text-gray-500 mt-1">Visión general de las métricas y desempeño del negocio.</p>
      </div>

      {isLoading ? (
        <div className="text-center p-10 text-gray-500">Cargando métricas...</div>
      ) : metricas ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KPI 1 */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Total Ingresos Brutos</p>
              <h3 className="text-2xl font-black text-gray-900">S/ {metricas.totalVentas.toFixed(2)}</h3>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Tickets Atendidos</p>
              <h3 className="text-2xl font-black text-gray-900">{metricas.ticketsAtendidos}</h3>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">Ticket Promedio</p>
              <h3 className="text-2xl font-black text-gray-900">S/ {metricas.ticketPromedio.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Placeholder para gráficos */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" /> Rendimiento de Agentes
          </h3>
          <div className="h-64 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
            [Gráfico de Barras - En construcción]
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" /> Servicios Estrella
          </h3>
          <div className="h-64 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
            [Gráfico Circular - En construcción]
          </div>
        </div>
      </div>
    </div>
  );
}
