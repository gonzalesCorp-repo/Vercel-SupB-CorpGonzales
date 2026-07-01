'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';
import { registrarIngresoCentral } from '@/services/lab';

const supabase = createClient();

export default function IngresoCentralPanel() {
  const [bienes, setBienes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [referencia, setReferencia] = useState('FACT-001');
  const [carrito, setCarrito] = useState<any[]>([]);
  const { sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Cargar bienes (insumos) para el buscador
    const loadBienes = async () => {
      const { data } = await supabase.from('bienes').select('*').in('tipo_bien', ['producto', 'insumo']).limit(50);
      if (data) setBienes(data);
    };
    loadBienes();
  }, []);

  const filteredBienes = search.length > 2 
    ? bienes.filter(b => b.nombre.toLowerCase().includes(search.toLowerCase()))
    : [];

  const addToCart = (bien: any) => {
    const exists = carrito.find(c => c.bien_id === bien.id);
    if (exists) {
      setCarrito(carrito.map(c => c.bien_id === bien.id ? { ...c, cantidad: c.cantidad + 1, subtotal: (c.cantidad + 1) * c.costo_unitario } : c));
    } else {
      setCarrito([...carrito, { 
        bien_id: bien.id, 
        nombre: bien.nombre,
        costo_unitario: bien.precio_venta || 0, // En un sistema real sería el costo de compra
        cantidad: 1,
        subtotal: bien.precio_venta || 0
      }]);
    }
    setSearch('');
  };

  const updateQuantity = (id: string, qty: number) => {
    setCarrito(carrito.map(c => c.bien_id === id ? { ...c, cantidad: qty, subtotal: qty * c.costo_unitario } : c));
  };

  const remove = (id: string) => {
    setCarrito(carrito.filter(c => c.bien_id !== id));
  };

  const handleIngreso = async () => {
    if (carrito.length === 0) return;
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let userId = null;
      if (user) {
        const { data: ag } = await supabase.from('agentes').select('id').eq('email', user.email).single();
        if (ag) userId = ag.id;
      }

      await registrarIngresoCentral(carrito, referencia, userId || '');
      showAlert('Ingreso registrado con éxito en Almacén Central', 'success');
      setCarrito([]);
    } catch (e: any) {
      showAlert(e.message || 'Error registrando ingreso', 'error');
    }
    setIsProcessing(false);
  };

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="p-6 h-full flex gap-6">
      {/* Columna Izquierda: Documento y Buscador */}
      <div className="w-1/3 space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="block text-xs font-bold text-slate-700 mb-2">1. DOCUMENTO DE REFERENCIA</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm bg-white"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative">
          <label className="block text-xs font-bold text-slate-700 mb-2">2. FILTRAR E INGRESAR</label>
          <input 
            type="text" 
            placeholder="Buscar Insumo (mín 3 letras)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
          />
          {filteredBienes.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 shadow-lg rounded mt-1 z-10 max-h-64 overflow-auto">
              {filteredBienes.map(b => (
                <div 
                  key={b.id} 
                  className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                  onClick={() => addToCart(b)}
                >
                  <p className="font-semibold text-sm">{b.nombre}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Detalle de Recepción */}
      <div className="w-2/3 flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white">
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-700">3. DETALLE DE RECEPCIÓN</h3>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr>
                <th className="pb-2">Producto</th>
                <th className="pb-2 text-right">Costo U.</th>
                <th className="pb-2 text-center">Cant.</th>
                <th className="pb-2 text-right">Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carrito.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Agrega productos desde el buscador
                  </td>
                </tr>
              ) : (
                carrito.map(item => (
                  <tr key={item.bien_id}>
                    <td className="py-3 font-medium text-slate-700">{item.nombre}</td>
                    <td className="py-3 text-right">
                      <input 
                        type="number" 
                        value={item.costo_unitario}
                        onChange={(e) => setCarrito(carrito.map(c => c.bien_id === item.bien_id ? {...c, costo_unitario: Number(e.target.value), subtotal: c.cantidad * Number(e.target.value)} : c))}
                        className="w-20 border rounded px-2 py-1 text-right text-sm"
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input 
                        type="number" 
                        value={item.cantidad}
                        onChange={(e) => updateQuantity(item.bien_id, Number(e.target.value))}
                        className="w-16 border rounded px-2 py-1 text-center text-sm"
                      />
                    </td>
                    <td className="py-3 text-right font-semibold">S/. {item.subtotal.toFixed(2)}</td>
                    <td className="py-3 text-center text-rose-500 cursor-pointer" onClick={() => remove(item.bien_id)}>X</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="mb-4">
            <p className="text-xs text-slate-500 font-semibold mb-1">TOTAL CARRITO</p>
            <p className="text-2xl font-bold text-slate-700">S/. {total.toFixed(2)}</p>
          </div>
          <button 
            onClick={handleIngreso}
            disabled={isProcessing || carrito.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 rounded shadow-sm transition-colors mb-2"
          >
            {isProcessing ? 'Procesando...' : 'Ingreso Directo (Stock Central)'}
          </button>
        </div>
      </div>
    </div>
  );
}
