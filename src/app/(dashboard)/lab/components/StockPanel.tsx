'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { obtenerStockUbicacion } from '@/services/lab';
import { Layers, AlertTriangle, CheckCircle2, Box } from 'lucide-react';
import { BulkUploader } from '@/components/ui/BulkUploader';

export default function StockPanel() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const sedeActiva = useAppStore((state) => state.sedeActiva);

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
    <div className="flex flex-col h-full gap-6">
      <div className="mb-2 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-500" />
            Stock & Ubicación
          </h1>
          <p className="text-slate-500 mt-2">Visión global del inventario distribuido entre Almacén Central y Laboratorio.</p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <BulkUploader 
            tableName="almacen_principal" 
            title="Importar Stock" 
            injectSedeId={true}
            buttonClassName="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 border border-indigo-100 transition-colors shadow-sm font-semibold"
          />
          <div className="flex gap-2">
            <div className="flex items-center gap-2 text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" /> Óptimo
            </div>
            <div className="flex items-center gap-2 text-xs font-medium bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-100">
              <AlertTriangle className="w-4 h-4" /> Crítico (&lt; 10)
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col flex-1 min-h-0">
        <div className="border border-slate-100 rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Producto / Insumo</th>
                  <th className="px-6 py-4 text-center">SKU</th>
                  <th className="px-6 py-4 text-center">Central</th>
                  <th className="px-6 py-4 text-center">Laboratorio</th>
                  <th className="px-6 py-4 text-center">Total Físico</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                        Cargando inventario...
                      </div>
                    </td>
                  </tr>
                ) : stock.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Box className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      No hay inventario registrado en esta sede.
                    </td>
                  </tr>
                ) : (
                  stock.map((item, idx) => {
                    const total = (item.stock_central || 0) + (item.stock_lab || 0);
                    const isCritico = total < 10;
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{item.nombre}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.categoria} • {item.tipo_bien}</p>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 font-mono text-xs">
                          {item.sku || '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-medium border border-slate-200/50">
                            {item.stock_central || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-bold border border-indigo-100">
                            {item.stock_lab || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-800 text-base">{total}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isCritico ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-600 tooltip" title="Stock Crítico">
                              <AlertTriangle className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 tooltip" title="Stock Óptimo">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          )}
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
