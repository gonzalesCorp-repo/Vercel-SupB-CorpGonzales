'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';
import { obtenerPedidosPendientesLab } from '@/services/lab';
import { PackageSearch, Clock, CheckCircle } from 'lucide-react';

const supabase = createClient();

export default function DespachoPanel() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();

  useEffect(() => {
    loadPedidos();
  }, [sedeActiva]);

  const loadPedidos = async () => {
    if (!sedeActiva) return;
    setLoading(true);
    const data = await obtenerPedidosPendientesLab();
    setPedidos(data);
    setLoading(false);
  };

  const despachar = async (pedidoId: string) => {
    try {
      await supabase.from('lab_pedidos').update({ estado: 'DESPACHADO' }).eq('id', pedidoId);
      showAlert('Pedido despachado correctamente', 'success');
      loadPedidos();
    } catch (e: any) {
      showAlert(e.message, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <PackageSearch className="w-8 h-8 text-indigo-500" />
          Despacho (ODI)
        </h1>
        <p className="text-slate-500 mt-2">Gestiona las solicitudes de insumos enviadas por los agentes desde piso.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Panel Izquierdo: Órdenes Pendientes */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col flex-1 min-h-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                Órdenes Pendientes 
                <span className="bg-rose-100 text-rose-600 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {pedidos.length}
                </span>
              </h2>
            </div>
            
            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {loading ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-4"></div>
                   Cargando órdenes...
                 </div>
              ) : pedidos.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400">
                   <CheckCircle className="w-12 h-12 text-slate-200 mb-4" />
                   <p>No hay órdenes pendientes de despacho.</p>
                 </div>
              ) : (
                pedidos.map(ped => (
                  <div key={ped.id} className="bg-slate-50 border border-slate-100 rounded-xl p-5 hover:border-indigo-100 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-700 text-lg">OATC #{ped.oatc?.secuencia || '...'}</span>
                          <span className="bg-amber-100 text-amber-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendiente
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">Agente ID: <span className="font-mono text-xs">{ped.oatc?.agente_id || '...'}</span></p>
                      </div>
                    </div>
                    <div className="flex justify-end border-t border-slate-200/60 pt-4 mt-2">
                      <button 
                        onClick={() => despachar(ped.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                      >
                        Despachar Insumos
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Panel Derecho: Historial (Hoy) */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col flex-1 min-h-0">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Historial de Despachos (Hoy)</h2>
            <div className="flex gap-3 mb-6">
              <input type="text" placeholder="Buscar OATC..." className="border border-slate-200 bg-slate-50 rounded-lg px-4 py-2.5 text-sm flex-1 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
              <input type="text" placeholder="Agente..." className="border border-slate-200 bg-slate-50 rounded-lg px-4 py-2.5 text-sm flex-1 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
            </div>
            
            <div className="flex-1 overflow-auto border-t border-slate-100 pt-6">
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>El historial de hoy aparecerá aquí.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
