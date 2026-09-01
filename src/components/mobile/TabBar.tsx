'use client';

import React, { useState } from 'react';
import { Coffee, Sparkles, CheckCircle2, Send, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

interface TabBarProps {
  clienteNombre?: string | null;
}

export function TabBar({ clienteNombre }: TabBarProps) {
  const [pedido, setPedido] = useState({
    cafe: 0,
    infusion: 0,
    tipoInfusion: 'Manzanilla',
    bebidaDia: 0,
    agua: 0
  });

  const [enviando, setEnviando] = useState(false);
  const [enviadoExitoso, setEnviadoExitoso] = useState(false);

  const modificarCantidad = (item: 'cafe' | 'infusion' | 'bebidaDia' | 'agua', delta: number) => {
    setPedido((prev) => ({
      ...prev,
      [item]: Math.max(0, prev[item] + delta)
    }));
  };

  const totalItems = pedido.cafe + pedido.infusion + pedido.bebidaDia + pedido.agua;

  const handleEnviarPedido = async () => {
    if (totalItems === 0) return;
    setEnviando(true);
    try {
      const supabase = createClient();
      const sedeId = useAppStore.getState().sedeActiva?.id;
      if (!sedeId) {
        setEnviando(false);
        return;
      }
      const email = typeof window !== 'undefined' ? localStorage.getItem('vaikuntha_user_email') || '' : '';

      const resumen: string[] = [];
      if (pedido.cafe > 0) resumen.push(`${pedido.cafe}x Café Expreso`);
      if (pedido.infusion > 0) resumen.push(`${pedido.infusion}x Infusión (${pedido.tipoInfusion})`);
      if (pedido.bebidaDia > 0) resumen.push(`${pedido.bebidaDia}x Bebida del Día`);
      if (pedido.agua > 0) resumen.push(`${pedido.agua}x Agua`);

      await supabase.from('cola_peticiones').insert([{
        sede_id: sedeId,
        tipo: 'BAR_BEBIDA',
        solicitante_nombre: email ? email.split('@')[0] : 'Staff de Estación',
        cliente_nombre: clienteNombre || 'Cliente en Silla',
        detalle: `Pedido Bar: ${resumen.join(', ')}`,
        estado: 'PENDIENTE',
        metadata: { pedido, fecha_hora: new Date().toISOString() }
      }]);

      setEnviando(false);
      setEnviadoExitoso(true);
      setPedido({ cafe: 0, infusion: 0, tipoInfusion: 'Manzanilla', bebidaDia: 0, agua: 0 });
      setTimeout(() => setEnviadoExitoso(false), 3500);
    } catch (e) {
      console.error('Error enviando pedido al bar:', e);
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Cabecera */}
      <div className="text-center py-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Servicio de Cortesía
        </span>
        <h3 className="text-sm font-black text-white mt-2">🍹 Bar & Cafetería</h3>
        <p className="text-xs text-slate-400">
          Ordena bebidas de cortesía para {clienteNombre ? <strong>{clienteNombre}</strong> : 'tu cliente'}.
        </p>
      </div>

      {enviadoExitoso && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>¡Pedido enviado al Bar! Tu orden está en preparación.</span>
        </div>
      )}

      {/* Lista de Bebidas */}
      <div className="space-y-2.5">
        
        {/* Café */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            ☕ Café Expreso / Americano
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => modificarCantidad('cafe', -1)}
              className="w-7 h-7 bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95"
            >
              -
            </button>
            <span className="text-xs font-mono font-black text-white w-4 text-center">{pedido.cafe}</span>
            <button
              onClick={() => modificarCantidad('cafe', 1)}
              className="w-7 h-7 bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Infusión */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              🍵 Infusión Caliente
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => modificarCantidad('infusion', -1)}
                className="w-7 h-7 bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95"
              >
                -
              </button>
              <span className="text-xs font-mono font-black text-white w-4 text-center">{pedido.infusion}</span>
              <button
                onClick={() => modificarCantidad('infusion', 1)}
                className="w-7 h-7 bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {pedido.infusion > 0 && (
            <div className="pt-2 border-t border-slate-800/80 animate-in fade-in">
              <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Variedad:</label>
              <select
                value={pedido.tipoInfusion}
                onChange={(e) => setPedido({ ...pedido, tipoInfusion: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2 font-semibold outline-none"
              >
                <option value="Manzanilla">🌼 Manzanilla</option>
                <option value="Té Verde">🍃 Té Verde</option>
                <option value="Anís">🌱 Anís & Hierbas</option>
              </select>
            </div>
          )}
        </div>

        {/* Bebida del Día */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-950/30 to-slate-900 border border-purple-500/20 p-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              🍹 Bebida del Día
            </span>
            <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.5 rounded-md">
              Especial
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => modificarCantidad('bebidaDia', -1)}
              className="w-7 h-7 bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95"
            >
              -
            </button>
            <span className="text-xs font-mono font-black text-white w-4 text-center">{pedido.bebidaDia}</span>
            <button
              onClick={() => modificarCantidad('bebidaDia', 1)}
              className="w-7 h-7 bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        {/* Agua Mineral */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            💧 Agua Mineral / Con Gas
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => modificarCantidad('agua', -1)}
              className="w-7 h-7 bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95"
            >
              -
            </button>
            <span className="text-xs font-mono font-black text-white w-4 text-center">{pedido.agua}</span>
            <button
              onClick={() => modificarCantidad('agua', 1)}
              className="w-7 h-7 bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95"
            >
              +
            </button>
          </div>
        </div>

      </div>

      {/* Botón de Enviar Pedido */}
      <div className="pt-2">
        <button
          onClick={handleEnviarPedido}
          disabled={totalItems === 0 || enviando}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-98 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>{enviando ? 'Enviando...' : `Enviar Pedido al Bar (${totalItems})`}</span>
        </button>
      </div>

    </div>
  );
}
