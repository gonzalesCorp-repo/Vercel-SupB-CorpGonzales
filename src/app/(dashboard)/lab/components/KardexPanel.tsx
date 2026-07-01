'use client';

import { useState, useEffect } from 'react';
import { obtenerKardex } from '@/services/lab';
import { useAppStore } from '@/store/useAppStore';
import { Activity, ArrowDownRight, ArrowUpRight, Filter } from 'lucide-react';

export default function KardexPanel() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { sedeActiva } = useAppStore();

  useEffect(() => {
    const loadData = async () => {
      if (!sedeActiva) return;
      setLoading(true);
      const data = await obtenerKardex(200);
      setMovimientos(data);
      setLoading(false);
    };
    loadData();
  }, [sedeActiva]);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-500" />
          Kardex de Movimientos
        </h1>
        <p className="text-slate-500 mt-2">Historial inmutable de todas las transacciones de inventario en la sede.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col flex-1 min-h-0">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Filtrar por SKU, Producto o Tipo..." 
                className="pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm w-80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Mostrando últimos 200 movimientos
          </div>
        </div>
        
        <div className="border border-slate-100 rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Fecha / Hora</th>
                  <th className="px-6 py-4">Movimiento</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Ruta (Origen ➔ Destino)</th>
                  <th className="px-6 py-4 text-right">Cant.</th>
                  <th className="px-6 py-4">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                        Cargando kardex...
                      </div>
                    </td>
                  </tr>
                ) : movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No hay movimientos registrados en esta sede.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((mov, idx) => {
                    const isIngreso = mov.tipo_movimiento === 'INGRESO' || mov.destino === 'LABORATORIO';
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-medium">
                          {new Date(mov.fecha_hora).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            mov.tipo_movimiento === 'INGRESO' ? 'bg-emerald-100 text-emerald-700' :
                            mov.tipo_movimiento === 'TRANSFERENCIA' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {isIngreso ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {mov.tipo_movimiento}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{mov.bienes?.nombre || 'Desconocido'}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{mov.bien_id}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-medium flex items-center gap-2">
                          <span className="bg-slate-100 px-2 py-1 rounded">{mov.origen}</span>
                          <span className="text-slate-300">➔</span>
                          <span className="bg-slate-100 px-2 py-1 rounded">{mov.destino}</span>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold text-base ${isIngreso ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {isIngreso ? '+' : ''}{mov.cantidad}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {mov.agentes?.nombre || 'Sistema'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
