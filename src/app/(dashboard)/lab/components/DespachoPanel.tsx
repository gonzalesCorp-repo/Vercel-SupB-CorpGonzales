'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';
import { obtenerPedidosPendientesLab } from '@/services/lab';

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
      // Marcar como despachado
      await supabase.from('lab_pedidos').update({ estado: 'DESPACHADO' }).eq('id', pedidoId);
      showAlert('Pedido despachado correctamente', 'success');
      loadPedidos();
    } catch (e: any) {
      showAlert(e.message, 'error');
    }
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Panel Izquierdo: Órdenes Pendientes */}
      <div className="w-1/2 bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Órdenes de Servicio <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{pedidos.length}</span>
          </h2>
          <div className="flex gap-2">
            <button className="text-xs bg-indigo-600 text-white px-3 py-1 rounded">Pendientes</button>
            <button className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200">Todas</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto border-t border-slate-100 pt-4 space-y-4">
          {loading ? (
             <div className="text-sm text-slate-500 text-center py-12">Cargando órdenes...</div>
          ) : pedidos.length === 0 ? (
             <div className="text-sm text-slate-500 text-center py-12">No hay órdenes pendientes de despacho.</div>
          ) : (
            pedidos.map(ped => (
              <div key={ped.id} className="border border-slate-200 rounded p-3 flex justify-between items-center bg-slate-50">
                <div>
                  <p className="font-semibold text-sm">OATC #{ped.oatc?.secuencia || '...'}</p>
                  <p className="text-xs text-slate-500">Agente: {ped.oatc?.agente_id || '...'}</p>
                </div>
                <button 
                  onClick={() => despachar(ped.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-sm font-medium"
                >
                  Despachar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Panel Derecho: Historial (Hoy) */}
      <div className="w-1/2 bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Historial de Despachos (Hoy)</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Buscar OATC..." className="border border-slate-300 rounded px-3 py-1.5 text-sm flex-1" />
          <input type="text" placeholder="Agente..." className="border border-slate-300 rounded px-3 py-1.5 text-sm flex-1" />
        </div>
        
        <div className="flex-1 overflow-auto border-t border-slate-100 pt-4">
          <div className="text-sm text-slate-500 text-center py-12">
            El historial se mostrará aquí.
          </div>
        </div>
      </div>
    </div>
  );
}
