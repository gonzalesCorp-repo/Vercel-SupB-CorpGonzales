'use client';

import { useState, useEffect } from 'react';
import { obtenerStockUbicacion } from '@/services/lab';
import { useAppStore } from '@/store/useAppStore';

export default function StockPanel() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { sedeActiva } = useAppStore();

  useEffect(() => {
    const loadStock = async () => {
      if (!sedeActiva) return;
      setLoading(true);
      const data = await obtenerStockUbicacion();
      setStock(data);
      setLoading(false);
    };
    loadStock();
  }, [sedeActiva]);
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Existencias Actuales y Ubicación</h2>
        <input 
          type="text" 
          placeholder="Filtrar por nombre o ubicación..." 
          className="border border-slate-300 rounded px-4 py-2 text-sm w-64"
        />
      </div>
      
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Producto / Marca</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3 text-center">Stock Central</th>
              <th className="px-4 py-3 text-center">Stock Lab</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Cargando inventario...
                </td>
              </tr>
            ) : stock.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No hay inventario registrado.
                </td>
              </tr>
            ) : (
              stock.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">{item.sku}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{item.producto}</p>
                    <p className="text-xs text-slate-500">{item.marca}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{item.ubicacion}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{item.stock_central}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-700">{item.stock_lab}</td>
                  <td className="px-4 py-3 text-center">
                    {item.stock_central + item.stock_lab <= item.stock_minimo ? (
                      <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-1 rounded">BAJO</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-1 rounded">OK</span>
                    )}
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
