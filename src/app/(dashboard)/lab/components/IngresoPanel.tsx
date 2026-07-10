'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';
import { registrarIngresoCentral } from '@/services/lab';
import { Download, Search, Plus, Trash2, FileText, CheckCircle2, PackageSearch } from 'lucide-react';

const supabase = createClient();

export default function IngresoCentralPanel() {
  const [bienes, setBienes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [referencia, setReferencia] = useState('FACT-001');
  const [carrito, setCarrito] = useState<any[]>([]);
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
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
        costo_unitario: bien.precio_venta || 0,
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
      setReferencia('');
    } catch (e: any) {
      showAlert(e.message || 'Error registrando ingreso', 'error');
    }
    setIsProcessing(false);
  };

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <Download className="w-8 h-8 text-indigo-500" />
          Ingreso Central
        </h1>
        <p className="text-slate-500 mt-2">Registra nuevos lotes de insumos y productos al Almacén Principal de la sede.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Columna Izquierda: Buscador */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col flex-1 min-h-0">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Catálogo de Bienes</h2>
            
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar insumo (mín 3 letras)..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="flex-1 overflow-auto -mx-2 px-2">
              {search.length <= 2 ? (
                <div className="text-center text-slate-400 text-sm mt-8">
                  Escribe al menos 3 caracteres para buscar
                </div>
              ) : filteredBienes.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-8">
                  No se encontraron coincidencias
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredBienes.map(b => (
                    <div 
                      key={b.id} 
                      className="group flex justify-between items-center p-3 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl cursor-pointer transition-all"
                      onClick={() => addToCart(b)}
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-700 group-hover:text-indigo-700">{b.nombre}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{b.sku || 'SIN-SKU'}</p>
                      </div>
                      <button className="text-indigo-600 bg-indigo-100/50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Checkout / Carrito */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden">
            
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Detalle de Recepción
              </h2>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600">Doc. Referencia:</label>
                <input 
                  type="text" 
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ej. FACT-001"
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-48 shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-white">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase font-semibold border-b border-slate-100 bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3 text-right">Costo U. (S/.)</th>
                    <th className="px-6 py-3 text-center">Cant.</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {carrito.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <PackageSearch className="w-12 h-12 text-slate-200 mb-4" />
                          <p>Aún no has agregado productos a la recepción.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    carrito.map(item => (
                      <tr key={item.bien_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-700">{item.nombre}</td>
                        <td className="px-6 py-4 text-right">
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={item.costo_unitario}
                            onChange={(e) => setCarrito(carrito.map(c => c.bien_id === item.bien_id ? {...c, costo_unitario: Number(e.target.value), subtotal: c.cantidad * Number(e.target.value)} : c))}
                            className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-right text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4 text-center flex justify-center">
                          <input 
                            type="number" 
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => updateQuantity(item.bien_id, Number(e.target.value))}
                            className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-center text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-indigo-50/30"
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">S/. {item.subtotal.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => remove(item.bien_id)}
                            className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total de la Recepción</p>
                <p className="text-3xl font-black text-slate-800">S/. {total.toFixed(2)}</p>
              </div>
              <button 
                onClick={handleIngreso}
                disabled={isProcessing || carrito.length === 0 || !referencia}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold px-8 py-3.5 rounded-xl shadow-sm transition-all flex items-center gap-2 text-base"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirmar Ingreso a Central
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
