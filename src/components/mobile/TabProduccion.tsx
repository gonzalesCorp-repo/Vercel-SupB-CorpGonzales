'use client';

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, TrendingUp, Scissors } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TabProduccionProps {
  agenteId?: string;
  agenteNombre?: string;
  comisionesTotal?: number;
  serviciosTotal?: number;
}

export function TabProduccion({ 
  agenteId, 
  agenteNombre, 
  comisionesTotal = 0, 
  serviciosTotal = 0 
}: TabProduccionProps) {
  const [filtroFecha, setFiltroFecha] = useState<'Hoy' | 'Ayer' | 'Semana'>('Hoy');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadProduccion() {
      setLoading(true);
      try {
        const ahora = new Date();
        let fechaInicio = new Date();

        if (filtroFecha === 'Hoy') {
          fechaInicio.setHours(0, 0, 0, 0);
        } else if (filtroFecha === 'Ayer') {
          fechaInicio.setDate(ahora.getDate() - 1);
          fechaInicio.setHours(0, 0, 0, 0);
        } else {
          // Semana
          fechaInicio.setDate(ahora.getDate() - 7);
          fechaInicio.setHours(0, 0, 0, 0);
        }

        let query = supabase
          .from('oatc')
          .select('id, codigo_ticket, cliente_nombre, punto_partida, created_at, estado_proceso')
          .eq('estado_proceso', 'FINALIZADO')
          .gte('created_at', fechaInicio.toISOString())
          .order('created_at', { ascending: false });

        if (agenteId && agenteNombre) {
          query = query.or(`agente_id.eq.${agenteId},agente_nombre.ilike.%${agenteNombre}%`);
        }

        const { data } = await query;
        if (data) {
          const formatted = data.map((d: any) => {
            const srvs = Array.isArray(d.punto_partida) ? d.punto_partida : (d.punto_partida?.servicios || []);
            const primerSrv = srvs[0] || { nombre: 'Servicio en Estación', precio: 0, comision_porcentaje: 40 };
            const precio = Number(primerSrv.precio || primerSrv.precio_venta || 0);
            const comision = Number(((precio * (primerSrv.comision_porcentaje || 40)) / 100).toFixed(2));
            return {
              id: d.id,
              cliente: d.cliente_nombre || 'Cliente General',
              servicio: primerSrv.nombre || 'Servicio en Estación',
              hora: d.created_at ? new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy',
              monto: comision,
              estado: 'Completado'
            };
          });
          setItems(formatted);
        } else {
          setItems([]);
        }
      } catch (e) {
        console.error('Error cargando producción:', e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadProduccion();
  }, [filtroFecha, agenteId, agenteNombre]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Tarjeta de Resumen Financiero */}
      <div className="bg-gradient-to-br from-amber-500/10 via-white to-slate-50 dark:from-amber-500/20 dark:via-slate-900 dark:to-slate-900 border border-amber-500/30 p-5 rounded-3xl space-y-3 transition-colors shadow-lg">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <Award className="w-4 h-4" /> Comisiones Acumuladas
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-600 dark:text-amber-400">S/. {comisionesTotal.toFixed(2)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">({serviciosTotal} servicios)</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Tus comisiones operativas generadas en tiempo real.
        </p>
      </div>

      {/* Selector de Rango */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        {(['Hoy', 'Ayer', 'Semana'] as const).map((r) => (
          <button key={r}
            onClick={() => setFiltroFecha(r)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filtroFecha === r
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Historial de Atenciones */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
          Detalle de Servicios Realizados
        </span>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">Cargando producción...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2 shadow-xs transition-colors">
            <Scissors className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto opacity-50" />
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">Sin atenciones en este período</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Los servicios finalizados en el período seleccionado aparecerán listados aquí.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between shadow-xs transition-colors"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.cliente}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.servicio}</p>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">{item.hora}</span>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono block">
                  + S/. {item.monto.toFixed(2)}
                </span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block">
                  {item.estado}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
