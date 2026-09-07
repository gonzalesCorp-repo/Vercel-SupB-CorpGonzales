'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Coffee, Sparkles, CheckCircle2, Send, Clock, UserCheck, ExternalLink, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';

interface TabBarProps {
  clienteNombre?: string | null;
  estacionNombre?: string;
  agenteNombre?: string;
}

export function TabBar({ clienteNombre, estacionNombre = 'Estación de Piso', agenteNombre = 'Staff' }: TabBarProps) {
  const [pedido, setPedido] = useState({
    cafe: 0,
    infusion: 0,
    tipoInfusion: 'Manzanilla',
    bebidaDia: 0,
    agua: 0
  });

  const [enviando, setEnviando] = useState(false);
  const [enviadoExitoso, setEnviadoExitoso] = useState(false);
  const [pedidosActivos, setPedidosActivos] = useState<any[]>([]);

  const supabase = createClient();
  const sedeId = useAppStore((state) => state.sedeActiva?.id);

  const cargarPedidosActivos = useCallback(async () => {
    if (!sedeId) return;
    try {
      const { data } = await supabase
        .from('cola_peticiones')
        .select('*')
        .eq('sede_id', sedeId)
        .eq('tipo', 'BAR_BEBIDA')
        .in('estado', ['PENDIENTE', 'EN_PREPARACION', 'LISTO'])
        .order('created_at', { ascending: false });

      // Filtrar los pedidos que pertenecen a este agente o estación
      const mios = (data || []).filter((p: any) => 
        (p.solicitante_nombre && p.solicitante_nombre.toLowerCase().includes(agenteNombre.toLowerCase())) ||
        (clienteNombre && p.cliente_nombre && p.cliente_nombre.toLowerCase().includes(clienteNombre.toLowerCase())) ||
        (p.metadata?.estacion === estacionNombre)
      );

      setPedidosActivos(mios);
    } catch (e) {
      console.warn('Error cargando pedidos activos de bar:', e);
    }
  }, [sedeId, agenteNombre, clienteNombre, estacionNombre, supabase]);

  useEffect(() => {
    cargarPedidosActivos();

    const channel = supabase.channel(`realtime-bar-pedidos-${agenteNombre}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_peticiones', filter: `tipo=eq.BAR_BEBIDA` }, () => {
        cargarPedidosActivos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarPedidosActivos, agenteNombre, supabase]);

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
          pedido, 
          estacion: estacionNombre,
          items: resumen,
          fecha_hora: new Date().toISOString() 
        }
      }]);

      setEnviando(false);
      setEnviadoExitoso(true);
      setPedido({ cafe: 0, infusion: 0, tipoInfusion: 'Manzanilla', bebidaDia: 0, agua: 0 });
      await cargarPedidosActivos();
      setTimeout(() => setEnviadoExitoso(false), 3500);
    } catch (e) {
      console.error('Error enviando pedido al bar:', e);
      setEnviando(false);
    }
  };

  const handleMarcarEntregado = async (pedidoId: string) => {
    try {
      await supabase
        .from('cola_peticiones')
        .update({ estado: 'ENTREGADO', resolved_at: new Date().toISOString() })
        .eq('id', pedidoId);
      await cargarPedidosActivos();
    } catch (e) {
      console.error('Error marcando pedido como entregado:', e);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 w-full">
      
      {/* Cabecera & Enlace al Workspace de Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-3xl shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30">
            Servicio de Cortesía
          </span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">🍹 Bar & Cafetería</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Para: <strong className="text-slate-900 dark:text-white">{clienteNombre || 'Cliente en Silla'}</strong> ({estacionNombre})
          </p>
        </div>

        <Link
          href="/mobile/bar"
          className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-2xl border border-amber-500/30 flex items-center gap-1.5 transition active:scale-95"
        >
          <span>Workspace</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {enviadoExitoso && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>¡Pedido enviado al Bar! Se ha generado la comanda para preparación.</span>
        </div>
      )}

      {/* 🏷️ TARJETA DE PEDIDOS ACTIVOS EN BAR (CON QUIÉN ESTÁ AGENCIANDO) */}
      {pedidosActivos.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block px-1">
            Pedidos Activos en Bar ({pedidosActivos.length})
          </span>

          {pedidosActivos.map((p) => {
            const agenciador = p.resolved_by;
            const esPreparando = p.estado === 'EN_PREPARACION';
            const esListo = p.estado === 'LISTO';
            const itemsDetalle = p.detalle?.replace('Pedido Bar: ', '') || 'Bebidas de cortesía';

            return (
              <div
                key={p.id}
                className={`p-4 rounded-3xl border shadow-sm space-y-2.5 transition-all ${
                  esListo
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/50'
                    : esPreparando
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-500/50'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {itemsDetalle}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Para: {p.cliente_nombre} • {p.metadata?.estacion || 'Estación'}
                    </span>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                    esListo
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                      : esPreparando
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}>
                    {esListo ? '🍹 Listo para entrega' : esPreparando ? '👨‍🍳 En preparación' : '⏳ En espera'}
                  </span>
                </div>

                {/* Banner de Agenciador (Quién está preparando) */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {esPreparando ? (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        Agenciando bebida: <strong className="font-black">{agenciador || 'Barman de Turno'}</strong>
                      </span>
                    ) : esListo ? (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Preparado por: <strong className="font-black">{agenciador || 'Bar'}</strong>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        En cola de barra esperando asignación
                      </span>
                    )}
                  </div>

                  {esListo && (
                    <button
                      type="button"
                      onClick={() => handleMarcarEntregado(p.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Recibido</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de Bebidas Disponibles */}
      <div className="space-y-2.5">
        
        {/* Café */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            ☕ Café Expreso / Americano
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => modificarCantidad('cafe', -1)}
              className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
            >
              -
            </button>
            <span className="text-xs font-mono font-black text-slate-900 dark:text-white w-4 text-center">{pedido.cafe}</span>
            <button
              type="button"
              onClick={() => modificarCantidad('cafe', 1)}
              className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Infusión */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              🍵 Infusión Caliente
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => modificarCantidad('infusion', -1)}
                className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-mono font-black text-slate-900 dark:text-white w-4 text-center">{pedido.infusion}</span>
              <button
                type="button"
                onClick={() => modificarCantidad('infusion', 1)}
                className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {pedido.infusion > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 animate-in fade-in">
              <label htmlFor="variedad_infusion_bar" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase">Variedad:</label>
              <select
                id="variedad_infusion_bar"
                name="variedad_infusion_bar"
                value={pedido.tipoInfusion}
                onChange={(e) => setPedido({ ...pedido, tipoInfusion: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-xs rounded-xl p-2 font-semibold outline-none"
              >
                <option value="Manzanilla">🌼 Manzanilla</option>
                <option value="Té Verde">🍃 Té Verde</option>
                <option value="Anís">🌱 Anís & Hierbas</option>
              </select>
            </div>
          )}
        </div>

        {/* Bebida del Día */}
        <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 p-3.5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
              🍹 Bebida del Día
            </span>
            <span className="text-[9px] bg-purple-200/60 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded-md">
              Especial
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => modificarCantidad('bebidaDia', -1)}
              className="w-8 h-8 bg-purple-100 dark:bg-slate-800 text-purple-900 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-purple-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
            >
              -
            </button>
            <span className="text-xs font-mono font-black text-purple-950 dark:text-white w-4 text-center">{pedido.bebidaDia}</span>
            <button
              type="button"
              onClick={() => modificarCantidad('bebidaDia', 1)}
              className="w-8 h-8 bg-purple-100 dark:bg-slate-800 text-purple-900 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-purple-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Agua Mineral */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            💧 Agua Mineral / Con Gas
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => modificarCantidad('agua', -1)}
              className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
            >
              -
            </button>
            <span className="text-xs font-mono font-black text-slate-900 dark:text-white w-4 text-center">{pedido.agua}</span>
            <button
              type="button"
              onClick={() => modificarCantidad('agua', 1)}
              className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

      </div>

      {/* Botón de Enviar Pedido */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleEnviarPedido}
          disabled={totalItems === 0 || enviando}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{enviando ? 'Enviando...' : `Enviar Pedido al Bar (${totalItems})`}</span>
        </button>
      </div>

    </div>
  );
}
