'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';
import { transferirAlmacen } from '@/services/lab';

const supabase = createClient();

export default function TransferenciaPanel() {
  const [stockCentral, setStockCentral] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();

  useEffect(() => {
    const loadStock = async () => {
      if (!sedeActiva) return;
      const { data } = await supabase
        .from('almacen_principal')
        .select('*, bienes(nombre, categoria, tipo_bien)')
        .eq('sede_id', sedeActiva.id)
        .gt('stock', 0);
        
      if (data) {
        setStockCentral(data.map(d => ({
          ...d,
          cantidad_mover: 0
        })));
      }
    };
    loadStock();
  }, [sedeActiva]);

  const filteredStock = stockCentral.filter(s => {
    if (!search) return true;
    const term = search.toLowerCase();
    return s.bienes?.nombre?.toLowerCase().includes(term) || s.sku?.toLowerCase().includes(term);
  });

  const updateCantMover = (id: string, qty: number) => {
    setStockCentral(stockCentral.map(s => s.id === id ? { ...s, cantidad_mover: qty } : s));
  };

  const handleTransfer = async () => {
    const toTransfer = stockCentral.filter(s => s.cantidad_mover > 0);
    if (toTransfer.length === 0) return;
    
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let userId = null;
      if (user) {
        const { data: ag } = await supabase.from('agentes').select('id').eq('email', user.email).single();
        if (ag) userId = ag.id;
      }

      await transferirAlmacen(toTransfer, userId || '');
      showAlert('Traslado a laboratorio exitoso', 'success');
      
      // Reset cant mover and refetch or locally subtract
      setStockCentral(stockCentral.map(s => {
        const tr = toTransfer.find(t => t.id === s.id);
        if (tr) {
          return { ...s, stock: s.stock - tr.cantidad_mover, cantidad_mover: 0 };
        }
        return s;
      }));
    } catch (e: any) {
      showAlert(e.message || 'Error transfiriendo stock', 'error');
    }
    setIsProcessing(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <span className="text-indigo-500">⇄</span> Movimiento Interno (Central ➔ Lab)
      </h2>
      
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 space-y-4">
        <div>
          <input 
            type="text" 
            placeholder="Buscar por Nombre, SKU o Tipo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
          />
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden mb-6 flex flex-col h-96">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-center">Stock Central</th>
                <th className="px-4 py-3 text-center">Cant. a Mover</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No hay productos en stock central o no coinciden con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredStock.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{item.bienes?.nombre || 'Desconocido'}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">{item.stock}</td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number" 
                        min="0"
                        max={item.stock}
                        value={item.cantidad_mover}
                        onChange={(e) => updateCantMover(item.id, Number(e.target.value))}
                        className="w-20 border rounded px-2 py-1 text-center text-sm"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button 
            onClick={handleTransfer}
            disabled={isProcessing || stockCentral.every(s => s.cantidad_mover <= 0)}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2 rounded font-medium text-sm transition-colors"
          >
            {isProcessing ? 'Procesando...' : 'CONFIRMAR TRASLADO MASIVO AL LAB'}
          </button>
        </div>
      </div>
    </div>
  );
}
