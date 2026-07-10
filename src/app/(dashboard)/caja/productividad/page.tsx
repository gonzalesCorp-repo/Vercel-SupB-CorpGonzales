'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

const supabase = createClient();

interface AgentProd {
  agente_id: string;
  nombre: string;
  total_servicios: number;
  total_recaudado: number;
  comision_estimada: number;
}

export default function CajaProductividadPage() {
  const [productividad, setProductividad] = useState<AgentProd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sedeActiva = useAppStore((state) => state.sedeActiva);

  useEffect(() => {
    if (sedeActiva) {
      loadDailyProductivity();
    }
  }, [sedeActiva]);

  const loadDailyProductivity = async () => {
    setIsLoading(true);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: oatcs } = await supabase
      .from('oatc')
      .select('*')
      .eq('sede_id', sedeActiva!.id)
      .eq('estado_proceso', 'FINALIZADO') // Solo los pagados/finalizados
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (oatcs) {
      const prodMap = new Map<string, AgentProd>();
      
      oatcs.forEach((oatc: any) => {
        if (!oatc.agente_id) return;
        
        if (!prodMap.has(oatc.agente_id)) {
          prodMap.set(oatc.agente_id, {
            agente_id: oatc.agente_id,
            nombre: oatc.agente_nombre || 'Desconocido',
            total_servicios: 0,
            total_recaudado: 0,
            comision_estimada: 0
          });
        }
        
        const current = prodMap.get(oatc.agente_id)!;
        
        // El punto de partida ahora tiene la comision_porcentaje congelada
        const items = Array.isArray(oatc.punto_partida) ? oatc.punto_partida : [];
        let ticketTotal = 0;
        let ticketComision = 0;
        let cantItems = 0;

        items.forEach((item: any) => {
          const precio = Number(item.precio) || Number(item.precio_venta) || 0;
          const cantidad = Number(item.cantidad) || 1;
          const subtotalItem = precio * cantidad;
          const comisionPorc = Number(item.comision_porcentaje) || 0;

          ticketTotal += subtotalItem;
          ticketComision += subtotalItem * (comisionPorc / 100);
          cantItems += cantidad;
        });

        current.total_servicios += cantItems;
        current.total_recaudado += ticketTotal;
        current.comision_estimada += ticketComision;
      });

      // Ordenar por total recaudado
      const ranking = Array.from(prodMap.values()).sort((a, b) => b.total_recaudado - a.total_recaudado);
      setProductividad(ranking);
    }
    
    setIsLoading(false);
  };

  const totalRecaudacion = productividad.reduce((sum, p) => sum + p.total_recaudado, 0);

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-indigo-600 bg-indigo-100 rounded-lg p-1" />
          Productividad Diaria
        </h1>
        <p className="text-slate-500 mt-2">Monitoreo en tiempo real del rendimiento del personal en el turno actual.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Recaudación Total</p>
            <p className="text-3xl font-black text-slate-800">S/ {totalRecaudacion.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Personal Activo</p>
            <p className="text-3xl font-black text-slate-800">{productividad.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Fecha</p>
            <p className="text-xl font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Ranking del Turno</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Operativo / Agente</th>
                <th className="p-4 font-bold border-b border-slate-200 text-center">Servicios</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Recaudado</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Participación</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right text-emerald-600">Comisión Estimada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Calculando...</td></tr>
              ) : productividad.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay atenciones finalizadas hoy.</td></tr>
              ) : (
                productividad.map((agente, idx) => {
                  const participacion = totalRecaudacion > 0 ? (agente.total_recaudado / totalRecaudacion) * 100 : 0;
                  return (
                    <tr key={agente.agente_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className={`font-black text-lg w-6 text-center ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-300'}`}>
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">{agente.nombre}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-medium text-slate-600">
                        {agente.total_servicios}
                      </td>
                      <td className="p-4 text-right font-black text-slate-800">
                        S/ {agente.total_recaudado.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-bold text-slate-500">{participacion.toFixed(1)}%</span>
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${participacion}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-black text-emerald-600">
                        S/ {agente.comision_estimada.toFixed(2)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
