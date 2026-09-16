'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Coffee, Sparkles, CheckCircle2, Send, Clock, X, Plus, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

interface ModalPedidoBarInSituProps {
  isOpen: boolean;
  onClose: () => void;
  oatcId?: string;
  clienteId?: string;
  clienteNombre?: string | null;
  estacionNombre?: string;
  agenteNombre?: string;
}

export function ModalPedidoBarInSitu({
  isOpen,
  onClose,
  oatcId,
  clienteId,
  clienteNombre,
  estacionNombre = 'Estación de Piso',
  agenteNombre = 'Staff'
}: ModalPedidoBarInSituProps) {
  const [pedido, setPedido] = useState({
    cafe: 0,
    infusion: 0,
    tipoInfusion: 'Manzanilla',
    bebidaDia: 0,
    agua: 0
  });

  const [enviando, setEnviando] = useState(false);
  const [enviadoExitoso, setEnviadoExitoso] = useState(false);
  const [pedidosActivosOatc, setPedidosActivosOatc] = useState<any[]>([]);

  const supabase = createClient();
  const sedeId = useAppStore((state) => state.sedeActiva?.id);

  const cargarPedidosOatc = useCallback(async () => {
    if (!sedeId) return;
    try {
      let query = supabase
        .from('cola_peticiones')
        .select('*')
        .eq('sede_id', sedeId)
        .eq('tipo', 'BAR_BEBIDA')
        .in('estado', ['PENDIENTE', 'EN_PREPARACION', 'LISTO'])
        .order('created_at', { ascending: false });

      if (oatcId) {
        query = query.or(`metadata->>oatc_id.eq.${oatcId},cliente_nombre.eq.${clienteNombre || ''}`);
      }

      const { data } = await query;
      setPedidosActivosOatc(data || []);
    } catch (e) {
      console.warn('Error cargando pedidos activos de OATC:', e);
    }
  }, [sedeId, oatcId, clienteNombre, supabase]);

  useEffect(() => {
    if (isOpen) {
      cargarPedidosOatc();
    }
  }, [isOpen, cargarPedidosOatc]);

  if (!isOpen) return null;

  const modificarCantidad = (item: 'cafe' | 'infusion' | 'bebidaDia' | 'agua', delta: number) => {
    setPedido((prev) => ({
      ...prev,
      [item]: Math.max(0, prev[item] + delta)
    }));
  };

  const totalItems = pedido.cafe + pedido.infusion + pedido.bebidaDia + pedido.agua;

  const handleEnviarPedido = async () => {
    if (totalItems === 0 || !sedeId) return;
    setEnviando(true);
    try {
      const resumen: string[] = [];
      if (pedido.cafe > 0) resumen.push(`${pedido.cafe}x Café Expreso`);
      if (pedido.infusion > 0) resumen.push(`${pedido.infusion}x Infusión (${pedido.tipoInfusion})`);
      if (pedido.bebidaDia > 0) resumen.push(`${pedido.bebidaDia}x Bebida del Día`);
      if (pedido.agua > 0) resumen.push(`${pedido.agua}x Agua`);

      await supabase.from('cola_peticiones').insert([{
        sede_id: sedeId,
        tipo: 'BAR_BEBIDA',
        solicitante_nombre: agenteNombre,
        cliente_nombre: clienteNombre || 'Cliente en Silla',
        detalle: `Pedido Bar: ${resumen.join(', ')}`,
        estado: 'PENDIENTE',
        metadata: { 
          oatc_id: oatcId || null,
          cliente_id: clienteId || null,
          pedido, 
          estacion: estacionNombre,
          items: resumen,
          total_items: totalItems,
          fecha_hora: new Date().toISOString() 
        }
      }]);

      setEnviando(false);
      setEnviadoExitoso(true);
      setPedido({ cafe: 0, infusion: 0, tipoInfusion: 'Manzanilla', bebidaDia: 0, agua: 0 });
      await cargarPedidosOatc();
      setTimeout(() => {
        setEnviadoExitoso(false);
      }, 2500);
    } catch (e) {
      console.error('Error enviando comanda in-situ de bar:', e);
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 text-xl shadow-md">
              🍹
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Bebidas de Cortesía</h3>
                <span className="text-[9px] bg-amber-500/20 text-amber-500 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-full border border-amber-500/30">
                  Bar & Lounge
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                Para: <strong className="text-slate-900 dark:text-white">{clienteNombre || 'Cliente en Silla'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback de envío */}
        {enviadoExitoso && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>¡Comanda enviada a la barra! El barman la preparará de inmediato.</span>
          </div>
        )}

        {/* Pedidos activos para este cliente */}
        {pedidosActivosOatc.length > 0 && (
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              Comandas en curso para este cliente ({pedidosActivosOatc.length})
            </span>
            <div className="space-y-1.5">
              {pedidosActivosOatc.map((cmd) => (
                <div key={cmd.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-950 p-2 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {cmd.detalle?.replace('Pedido Bar: ', '') || 'Bebidas'}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    cmd.estado === 'LISTO'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : cmd.estado === 'EN_PREPARACION'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {cmd.estado === 'LISTO' ? 'Listo 🍹' : cmd.estado === 'EN_PREPARACION' ? 'Preparando...' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selector de Bebidas */}
        <div className="space-y-2">
          {/* Café */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">☕</span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Café Expreso</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Grano recién molido</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => modificarCantidad('cafe', -1)}
                disabled={pedido.cafe === 0}
                className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold active:scale-90 transition disabled:opacity-30 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center text-xs font-black font-mono text-slate-900 dark:text-white">
                {pedido.cafe}
              </span>
              <button
                type="button"
                onClick={() => modificarCantidad('cafe', 1)}
                className="w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold active:scale-90 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Infusión */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🫖</span>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Infusión Caliente</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Hierbas y tés relajantes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => modificarCantidad('infusion', -1)}
                  disabled={pedido.infusion === 0}
                  className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold active:scale-90 transition disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-xs font-black font-mono text-slate-900 dark:text-white">
                  {pedido.infusion}
                </span>
                <button
                  type="button"
                  onClick={() => modificarCantidad('infusion', 1)}
                  className="w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold active:scale-90 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {pedido.infusion > 0 && (
              <div className="flex gap-1 pt-1 overflow-x-auto">
                {['Manzanilla', 'Anís', 'Té Verde', 'Hierba Luisa'].map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setPedido((prev) => ({ ...prev, tipoInfusion: tipo }))}
                    className={`text-[10px] px-2 py-1 rounded-lg border font-bold transition whitespace-nowrap cursor-pointer ${
                      pedido.tipoInfusion === tipo
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bebida del Día */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🍹</span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Bebida del Día</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Frutas de estación & cóctel sin alcohol</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => modificarCantidad('bebidaDia', -1)}
                disabled={pedido.bebidaDia === 0}
                className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold active:scale-90 transition disabled:opacity-30 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center text-xs font-black font-mono text-slate-900 dark:text-white">
                {pedido.bebidaDia}
              </span>
              <button
                type="button"
                onClick={() => modificarCantidad('bebidaDia', 1)}
                className="w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold active:scale-90 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Agua */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💧</span>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Agua Mineral</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Fría o al tiempo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => modificarCantidad('agua', -1)}
                disabled={pedido.agua === 0}
                className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold active:scale-90 transition disabled:opacity-30 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center text-xs font-black font-mono text-slate-900 dark:text-white">
                {pedido.agua}
              </span>
              <button
                type="button"
                onClick={() => modificarCantidad('agua', 1)}
                className="w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold active:scale-90 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Botonera Enviar */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleEnviarPedido}
            disabled={totalItems === 0 || enviando}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition disabled:opacity-40 cursor-pointer"
          >
            {enviando ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {totalItems > 0 ? `Enviar Pedido al Bar (${totalItems} items)` : 'Selecciona una bebida'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
