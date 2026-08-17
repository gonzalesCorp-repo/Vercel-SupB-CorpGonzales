'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Package, Archive, ClipboardList, Leaf, CheckCircle2, AlertTriangle, Scale, RefreshCw } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

export default function DespachoMobileView({ agente, sedeId }: { agente: any; sedeId: string }) {
  const [tab, setTab] = useState<'prep' | 'stock' | 'kardex'>('prep');
  const [pedidosPrep, setPedidosPrep] = useState<any[]>([]);
  const [stockLab, setStockLab] = useState<any[]>([]);
  const [movimientosKardex, setMovimientosKardex] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { showAlert } = useUIStore();

  useEffect(() => {
    if (tab === 'prep') fetchPrep();
    if (tab === 'stock') fetchStock();
    if (tab === 'kardex') fetchKardex();
  }, [tab, sedeId]);

  const fetchPrep = async () => {
    setLoading(true);
    // Consultar pedidos de insumos y órdenes en curso
    const { data: pedidos } = await supabase
      .from('pedidos_insumos')
      .select('*')
      .eq('sede_id', sedeId)
      .in('estado', ['PENDIENTE', 'EN_PROCESO'])
      .order('created_at', { ascending: false });

    const { data: oatcs } = await supabase
      .from('oatc')
      .select('id, cliente_nombre, agente_nombre, punto_partida, created_at')
      .eq('sede_id', sedeId)
      .eq('estado_proceso', 'EN_CURSO')
      .order('created_at', { ascending: false });

    const items: any[] = [];
    if (pedidos) {
      pedidos.forEach((p: any) => {
        items.push({
          id: p.id,
          tipo: 'PEDIDO_INSUMO',
          titulo: p.insumo_solicitado,
          solicitante: p.agente_nombre || 'Staff',
          created_at: p.created_at,
          raw: p
        });
      });
    }

    if (oatcs) {
      oatcs.forEach((o: any) => {
        const srvs = Array.isArray(o.punto_partida) 
          ? o.punto_partida 
          : o.punto_partida?.servicios || [];
        
        srvs.forEach((s: any) => {
          items.push({
            id: `${o.id}-${s.id || s.nombre}`,
            oatc_id: o.id,
            tipo: 'ORDEN_SERVICIO',
            titulo: s.nombre || 'Servicio Técnico',
            solicitante: o.agente_nombre || 'Staff',
            cliente: o.cliente_nombre,
            created_at: o.created_at
          });
        });
      });
    }

    setPedidosPrep(items);
    setLoading(false);
  };

  const fetchStock = async () => {
    setLoading(true);
    const { data: labStock } = await supabase
      .from('almacen_laboratorio')
      .select('id, bien_id, stock_actual, stock_en_uso, bienes(id, nombre, categoria)')
      .eq('sede_id', sedeId)
      .order('stock_actual', { ascending: true });

    if (labStock) setStockLab(labStock);
    setLoading(false);
  };

  const fetchKardex = async () => {
    setLoading(true);
    const { data: movs } = await supabase
      .from('inventario_movimientos')
      .select('id, tipo_movimiento, cantidad, descripcion, fecha_hora, bienes(nombre)')
      .eq('sede_id', sedeId)
      .order('fecha_hora', { ascending: false })
      .limit(25);

    if (movs) setMovimientosKardex(movs);
    setLoading(false);
  };

  const handleDespacharPedido = async (item: any) => {
    if (item.tipo === 'PEDIDO_INSUMO') {
      await supabase
        .from('pedidos_insumos')
        .update({ estado: 'DESPACHADO' })
        .eq('id', item.id);
    }
    showAlert(`Insumo preparado y notificado a ${item.solicitante}`, 'success');
    fetchPrep();
  };

  return (
    <div className="space-y-4">
      {/* Gamification / Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-4 shadow-lg text-white mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-amber-200" />
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-amber-200">Despacho & Laboratorio WMS</p>
              <p className="text-sm font-bold">Pesaje IoT en gramos, sub-recetas y stock</p>
            </div>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-bold">
            {pedidosPrep.length} Pendientes
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-md">
        <button onClick={() => setTab('prep')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 transition ${tab === 'prep' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'}`}>
          <Package className="w-4 h-4" /> Prep ({pedidosPrep.length})
        </button>
        <button onClick={() => setTab('stock')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 transition ${tab === 'stock' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'}`}>
          <Archive className="w-4 h-4" /> Stock Lab ({stockLab.length})
        </button>
        <button onClick={() => setTab('kardex')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 transition ${tab === 'kardex' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'}`}>
          <ClipboardList className="w-4 h-4" /> Kardex
        </button>
      </div>

      {/* Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        
        {/* TAB 1: PREPARACIÓN Y PESAJE */}
        {tab === 'prep' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-slate-500 py-8 text-xs font-bold">Cargando pedidos de laboratorio...</div>
            ) : pedidosPrep.length === 0 ? (
              <div className="text-center text-slate-400 py-10 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                ✨ No hay fórmulas o pedidos de insumos pendientes de despacho
              </div>
            ) : (
              pedidosPrep.map((item) => (
                <div key={item.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                          {item.tipo === 'PEDIDO_INSUMO' ? '🧪 PEDIDO INSUMO' : '💈 FORMULACIÓN'}
                        </span>
                        <p className="font-bold text-xs text-white">{item.titulo}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Solicitado por: <span className="text-indigo-300 font-bold">{item.solicitante}</span> {item.cliente && `• Cliente: ${item.cliente}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDespacharPedido(item)}
                    className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950 flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Despachado / Entregado
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: STOCK EN GRAMOS / ML DE LABORATORIO */}
        {tab === 'stock' && (
          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center text-slate-500 py-8 text-xs font-bold">Cargando stock de laboratorio...</div>
            ) : stockLab.length === 0 ? (
              <div className="text-center text-slate-400 py-8 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                No hay stock registrado en el taller de esta sede
              </div>
            ) : (
              stockLab.map((item) => {
                const stock = Number(item.stock_actual || 0);
                const isBajo = stock < 50;
                return (
                  <div key={item.id} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-md">
                    <div>
                      <p className="font-bold text-xs text-white">{item.bienes?.nombre || 'Insumo Químico'}</p>
                      <p className="text-[10px] text-slate-400">{item.bienes?.categoria || 'General'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black ${isBajo ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {stock} g/ml
                      </span>
                      {isBajo && (
                        <p className="text-[9px] text-rose-300 font-bold flex items-center gap-0.5 justify-end">
                          <AlertTriangle className="w-2.5 h-2.5" /> Stock Bajo
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: KARDEX Y MOVIMIENTOS */}
        {tab === 'kardex' && (
          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center text-slate-500 py-8 text-xs font-bold">Cargando movimientos de kardex...</div>
            ) : movimientosKardex.length === 0 ? (
              <div className="text-center text-slate-400 py-8 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                No hay movimientos de inventario registrados recientemente
              </div>
            ) : (
              movimientosKardex.map((mov) => (
                <div key={mov.id} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded">
                        {mov.tipo_movimiento || 'DESPACHO'}
                      </span>
                      <p className="font-bold text-xs text-white">{mov.bienes?.nombre || mov.descripcion || 'Movimiento'}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {mov.fecha_hora ? new Date(mov.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-amber-400">{mov.cantidad} g/u</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
}
