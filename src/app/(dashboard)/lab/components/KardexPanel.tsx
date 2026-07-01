'use client';

import { useState, useEffect } from 'react';
import { obtenerKardex } from '@/services/lab';
import { useAppStore } from '@/store/useAppStore';

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Kardex: Historial de Movimientos</h2>
        <input 
          type="text" 
          placeholder="Filtrar por SKU o Tipo..." 
          className="border border-slate-300 rounded px-4 py-2 text-sm w-64"
        />
      </div>
      
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800 text-slate-200 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Fecha / Hora</th>
              <th className="px-4 py-3">SKU / Producto</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Cant.</th>
              <th className="px-4 py-3">Almacén</th>
              <th className="px-4 py-3">Responsable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Cargando kardex...
                </td>
              </tr>
            ) : movimientos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No hay movimientos registrados.
                </td>
              </tr>
            ) : (
              movimientos.map((mov, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(mov.fecha_hora).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{mov.bienes?.nombre || 'Desconocido'}</p>
                    <p className="text-xs text-slate-500 font-mono">{mov.bien_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                      {mov.tipo_movimiento}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">
                    {mov.cantidad}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {mov.origen} ➔ {mov.destino}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {mov.agentes?.nombre || 'Sistema'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
