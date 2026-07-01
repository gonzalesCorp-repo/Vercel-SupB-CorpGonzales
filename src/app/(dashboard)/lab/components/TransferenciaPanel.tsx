'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';
import { transferirAlmacen } from '@/services/lab';
import { ArrowRightLeft, Search, CheckCircle, Package } from 'lucide-react';

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

  const toTransferCount = stockCentral.filter(s => s.cantidad_mover > 0).length;

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
    <div className="flex flex-col h-full gap-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <ArrowRightLeft className="w-8 h-8 text-indigo-500" />
          Transferencia Lab
        </h1>
        <p className="text-slate-500 mt-2">Mueve stock desde el Almacén Principal hacia el inventario rápido del Laboratorio.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por Nombre, SKU o Tipo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-500">Items seleccionados:</span>
              <span className="ml-2 font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{toTransferCount}</span>
            </div>
            <button 
              onClick={handleTransfer}
              disabled={isProcessing || toTransferCount === 0}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirmar Traslado
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50/30">
          {filteredStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Package className="w-12 h-12 text-slate-200 mb-4" />
              <p>No hay productos en stock central o no coinciden con la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStock.map(item => (
                <div key={item.id} className={`bg-white border rounded-xl p-5 transition-all ${item.cantidad_mover > 0 ? 'border-indigo-300 shadow-md ring-1 ring-indigo-50' : 'border-slate-200 shadow-sm hover:border-indigo-100'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-slate-800 line-clamp-2 leading-tight">{item.bienes?.nombre || 'Desconocido'}</h3>
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-mono px-2 py-1 rounded flex-shrink-0">
                      {item.sku}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-slate-500">Stock Central</div>
                    <div className="font-bold text-slate-700 text-lg bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{item.stock}</div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Cantidad a trasladar</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range"
                        min="0"
                        max={item.stock}
                        value={item.cantidad_mover}
                        onChange={(e) => updateCantMover(item.id, Number(e.target.value))}
                        className="flex-1 accent-indigo-600"
                      />
                      <input 
                        type="number" 
                        min="0"
                        max={item.stock}
                        value={item.cantidad_mover}
                        onChange={(e) => updateCantMover(item.id, Number(e.target.value))}
                        className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-center text-sm font-semibold text-indigo-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
