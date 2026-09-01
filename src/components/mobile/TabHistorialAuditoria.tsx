'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, CheckCircle2, XCircle, Beaker, DollarSign, Search, Sparkles, Scale, AlertTriangle, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TabHistorialAuditoriaProps {
  agenteId?: string;
  agenteNombre?: string;
}

export function TabHistorialAuditoria({ agenteId, agenteNombre }: TabHistorialAuditoriaProps) {
  const [subTab, setSubTab] = useState<'atenciones' | 'insumos' | 'precios'>('atenciones');
  const [searchCliente, setSearchCliente] = useState('');
  const [atenciones, setAtenciones] = useState<any[]>([]);
  const [insumosList, setInsumosList] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const supabase = createClient();
      
      // 1. Cargar atenciones OATC
      let query = supabase
        .from('oatc')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (agenteId) {
        query = query.eq('agente_id', agenteId);
      } else if (agenteNombre) {
        query = query.ilike('agente_nombre', `%${agenteNombre}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        setAtenciones(data);
      }

      // 2. Cargar insumos y fórmulas solicitadas al Lab
      const { data: dataInsumos } = await supabase
        .from('pedidos_insumos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setInsumosList(dataInsumos || []);
    } catch (e) {
      console.warn('Error cargando historial de atenciones en móvil:', e);
      setInsumosList([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [agenteId, agenteNombre]);

  const atencionesFiltradas = atenciones.filter(a =>
    !searchCliente || 
    (a.cliente_nombre && a.cliente_nombre.toLowerCase().includes(searchCliente.toLowerCase()))
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
            Auditoría de Turno
          </span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Historial de Operaciones</h3>
        </div>

        <button
          onClick={cargarDatos}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          title="Recargar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Segmented Control */}
      <div className="flex gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setSubTab('atenciones')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subTab === 'atenciones' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Atenciones ({atenciones.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('insumos')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subTab === 'insumos' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <Beaker className="w-3.5 h-3.5" /> Lab & Insumos
        </button>

        <button
          type="button"
          onClick={() => setSubTab('precios')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subTab === 'precios' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" /> Cortesías
        </button>
      </div>

      {/* 1. Sub-Tab: Atenciones Reales */}
      {subTab === 'atenciones' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchCliente}
              onChange={(e) => setSearchCliente(e.target.value)}
              placeholder="Buscar por nombre de cliente..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {cargando ? (
            <div className="text-center py-8 text-xs text-slate-500 font-bold">
              Consultando historial de órdenes de atención...
            </div>
          ) : atencionesFiltradas.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
              No se encontraron atenciones registradas para este colaborador.
            </div>
          ) : (
            atencionesFiltradas.map((a) => {
              let montoTotal = 0;
              if (a.punto_partida) {
                if (Array.isArray(a.punto_partida)) {
                  montoTotal = a.punto_partida.reduce((acc: number, item: any) => acc + (Number(item.precio || item.precio_venta || 0)), 0);
                } else if (a.punto_partida.servicios && Array.isArray(a.punto_partida.servicios)) {
                  montoTotal = a.punto_partida.servicios.reduce((acc: number, item: any) => acc + (Number(item.precio || item.precio_venta || 0)), 0);
                }
              }

              return (
                <div
                  key={a.id}
                  className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between shadow-md"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-white">{a.cliente_nombre || 'Cliente'}</h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        a.estado_proceso === 'FINALIZADO' 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : a.estado_proceso === 'CANCELADO'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {a.estado_proceso}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {Array.isArray(a.punto_partida) 
                        ? a.punto_partida.map((p: any) => p.nombre).join(' + ') 
                        : 'Servicio en Salón'}
                    </p>

                    <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>

                  {montoTotal > 0 && (
                    <span className="text-xs font-black text-amber-400 font-mono">
                      S/ {montoTotal.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. Sub-Tab: Insumos Lab IoT */}
      {subTab === 'insumos' && (
        <div className="space-y-2.5 animate-in fade-in">
          <div className="bg-sky-950/30 border border-sky-500/30 p-3 rounded-2xl flex items-center gap-2 text-sky-300 text-xs font-medium">
            <Scale className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Fórmulas químicas despachadas en gramos por balanza IoT.</span>
          </div>

          {insumosList.map((i) => (
            <div key={i.id} className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2 shadow-md">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-100">{i.insumo_solicitado}</h4>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  i.estado === 'DESPACHADO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {i.estado || 'PENDIENTE'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {i.created_at ? new Date(i.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 3. Sub-Tab: Cortesías */}
      {subTab === 'precios' && (
        <div className="space-y-2.5 animate-in fade-in">
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Cortesías de fidelización y descuentos aplicados.</span>
          </div>

          {atenciones.flatMap(a => {
            const srvs = Array.isArray(a.punto_partida) ? a.punto_partida : (a.punto_partida?.servicios || []);
            return srvs
              .filter((s: any) => s.es_cortesia || Number(s.precio || s.precio_venta || 0) === 0)
              .map((s: any, idx: number) => ({
                id: `${a.id}_cortesia_${idx}`,
                cliente: a.cliente_nombre || 'Cliente General',
                servicio: s.nombre || 'Cortesía de Estación',
                motivo: s.motivo_cortesia || 'Fidelización de Cartera',
                fecha: a.created_at
              }));
          }).length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Sin cortesías registradas</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Los servicios otorgados como cortesía aparecerán aquí.</p>
            </div>
          ) : (
            atenciones.flatMap(a => {
              const srvs = Array.isArray(a.punto_partida) ? a.punto_partida : (a.punto_partida?.servicios || []);
              return srvs
                .filter((s: any) => s.es_cortesia || Number(s.precio || s.precio_venta || 0) === 0)
                .map((s: any, idx: number) => (
                  <div key={`${a.id}_cortesia_${idx}`} className="p-3.5 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center shadow-xs transition-colors">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.nombre || 'Cortesía de Estación'}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{a.cliente_nombre || 'Cliente'} • {s.motivo_cortesia || 'Fidelización'}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                      S/ 0.00 (Cortesía)
                    </span>
                  </div>
                ));
            })
          )}
        </div>
      )}

    </div>
  );
}
