'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Coffee, Sparkles, CheckCircle2, Clock, UserCheck, AlertTriangle, 
  RefreshCw, Volume2, VolumeX, Package, Check, ArrowLeft, Send
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { reproducirChimeNuevaOrden } from '@/lib/audio/chime';
import { registrarLog } from '@/services/logger';

interface InsumoBar {
  id: string;
  nombre: string;
  categoria: 'CAFE' | 'INFUSION' | 'BEBIDA_DIA' | 'AGUA' | 'SUMINISTRO';
  estado: 'DISPONIBLE' | 'BAJO' | 'AGOTADO';
  icono: string;
}

const INSUMOS_DEFAULT: InsumoBar[] = [
  { id: '1', nombre: 'Café en Grano (Expreso Especial)', categoria: 'CAFE', estado: 'DISPONIBLE', icono: '☕' },
  { id: '2', nombre: 'Leche Fresca & Vegetal (Almendras)', categoria: 'CAFE', estado: 'DISPONIBLE', icono: '🥛' },
  { id: '3', nombre: 'Té Verde & Jazmín', categoria: 'INFUSION', estado: 'DISPONIBLE', icono: '🍃' },
  { id: '4', nombre: 'Manzanilla & Hierba Luisa', categoria: 'INFUSION', estado: 'DISPONIBLE', icono: '🌼' },
  { id: '5', nombre: 'Bebida del Día (Frutas de Estación & Jarabe)', categoria: 'BEBIDA_DIA', estado: 'DISPONIBLE', icono: '🍹' },
  { id: '6', nombre: 'Agua Mineral (Con y Sin Gas)', categoria: 'AGUA', estado: 'DISPONIBLE', icono: '💧' },
  { id: '7', nombre: 'Hielo Filtrado', categoria: 'SUMINISTRO', estado: 'DISPONIBLE', icono: '🧊' },
  { id: '8', nombre: 'Copas & Tazas Térmicas Limpias', categoria: 'SUMINISTRO', estado: 'DISPONIBLE', icono: '🍸' },
];

export function BarWorkspaceView() {
  const [comandas, setComandas] = useState<any[]>([]);
  const [insumos, setInsumos] = useState<InsumoBar[]>(INSUMOS_DEFAULT);
  const [audioActivo, setAudioActivo] = useState(true);
  const [tabActivo, setTabActivo] = useState<'COMANDAS' | 'INSUMOS'>('COMANDAS');
  const [cargando, setCargando] = useState(true);

  const supabase = createClient();
  const sedeId = useAppStore((state) => state.sedeActiva?.id);

  // Nombre del Barman / Operador actual
  const [barmanNombre, setBarmanNombre] = useState<string>('Barman');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('vaikuntha_user_email') || '';
      const name = localStorage.getItem('vaikuntha_user_name') || email.split('@')[0] || 'Barman';
      setBarmanNombre(name);

      // Cargar estado de insumos persistido
      const savedInsumos = localStorage.getItem('bar_insumos_stock');
      if (savedInsumos) {
        try {
          setInsumos(JSON.parse(savedInsumos));
        } catch (e) {}
      }
    }
  }, []);

  const cargarComandas = useCallback(async () => {
    if (!sedeId) return;
    try {
      const { data } = await supabase
        .from('cola_peticiones')
        .select('*')
        .eq('sede_id', sedeId)
        .eq('tipo', 'BAR_BEBIDA')
        .in('estado', ['PENDIENTE', 'EN_PREPARACION', 'LISTO'])
        .order('created_at', { ascending: true });

      setComandas(data || []);
    } catch (e) {
      console.warn('Error cargando comandas de bar:', e);
    } finally {
      setCargando(false);
    }
  }, [sedeId, supabase]);

  useEffect(() => {
    cargarComandas();

    const channel = supabase.channel('realtime-bar-workspace')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_peticiones', filter: `tipo=eq.BAR_BEBIDA` }, (payload: any) => {
        cargarComandas();
        if (payload.eventType === 'INSERT') {
          if (audioActivo) {
            try {
              reproducirChimeNuevaOrden();
            } catch (e) {}
          }
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarComandas, audioActivo, supabase]);

  // Acción 1: Tomar Pedido (Agenciar)
  const handleAgenciarPedido = async (pedidoId: string) => {
    try {
      await supabase
        .from('cola_peticiones')
        .update({
          estado: 'EN_PREPARACION',
          resolved_by: barmanNombre,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId);

      await registrarLog('BAR_AGENCIADO', `${barmanNombre} comenzó la preparación de la comanda ${pedidoId}`);
      await cargarComandas();
    } catch (e) {
      console.error('Error agenciando pedido:', e);
    }
  };

  // Acción 2: Marcar como Listo
  const handleMarcarListo = async (pedidoId: string) => {
    try {
      await supabase
        .from('cola_peticiones')
        .update({
          estado: 'LISTO',
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoId);

      await registrarLog('BAR_LISTO', `Comanda ${pedidoId} marcada como lista por ${barmanNombre}`);
      await cargarComandas();
    } catch (e) {
      console.error('Error marcando pedido listo:', e);
    }
  };

  // Acción 3: Marcar como Entregado
  const handleMarcarEntregado = async (pedidoId: string) => {
    try {
      await supabase
        .from('cola_peticiones')
        .update({
          estado: 'ENTREGADO',
          resolved_at: new Date().toISOString()
        })
        .eq('id', pedidoId);

      await registrarLog('BAR_ENTREGADO', `Comanda ${pedidoId} entregada al cliente.`);
      await cargarComandas();
    } catch (e) {
      console.error('Error finalizando entrega:', e);
    }
  };

  // Toggle de Insumo (DISPONIBLE -> BAJO -> AGOTADO -> DISPONIBLE)
  const handleCambiarEstadoInsumo = (insumoId: string) => {
    setInsumos((prev) => {
      const next = prev.map((item) => {
        if (item.id !== insumoId) return item;
        const nuevoEstado = 
          item.estado === 'DISPONIBLE' ? 'BAJO' :
          item.estado === 'BAJO' ? 'AGOTADO' : 'DISPONIBLE';
        return { ...item, estado: nuevoEstado as any };
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('bar_insumos_stock', JSON.stringify(next));
      }
      return next;
    });
  };

  const comandasPendientes = comandas.filter((c) => c.estado === 'PENDIENTE');
  const comandasEnProceso = comandas.filter((c) => c.estado === 'EN_PREPARACION');
  const comandasListas = comandas.filter((c) => c.estado === 'LISTO');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 pb-24 space-y-4 max-w-4xl mx-auto font-sans">
      
      {/* Header del Workspace de Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 text-2xl shadow-md">
            🍹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 dark:text-white">Workspace de Bar & Cafetería</h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                En vivo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Operador en barra: <strong className="text-slate-900 dark:text-white">{barmanNombre}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Audio */}
          <button
            type="button"
            onClick={() => setAudioActivo(!audioActivo)}
            title={audioActivo ? 'Alertas sonoras activas' : 'Alertas silenciadas'}
            className={`p-2.5 rounded-2xl border transition active:scale-95 cursor-pointer ${
              audioActivo
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {audioActivo ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Refrescar */}
          <button
            type="button"
            onClick={cargarComandas}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Principales: Comandas vs Insumos */}
      <div className="flex gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => setTabActivo('COMANDAS')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
            tabActivo === 'COMANDAS'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Comandas Activas ({comandas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActivo('INSUMOS')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
            tabActivo === 'INSUMOS'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Stock Insumos ({insumos.filter(i => i.estado !== 'DISPONIBLE').length} alertas)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: COMANDAS EN VIVO */}
      {/* ========================================================================= */}
      {tabActivo === 'COMANDAS' && (
        <div className="space-y-4 animate-in fade-in">
          {comandas.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-2 shadow-sm">
              <div className="text-3xl">☕</div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Sin comandas pendientes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No hay pedidos de bebidas en cola en este momento. Las nuevas comandas solicitadas desde las estaciones aparecerán aquí con alerta sonora en tiempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {comandas.map((cmd) => {
                const minutosEspera = Math.max(1, Math.floor((Date.now() - new Date(cmd.created_at).getTime()) / 60000));
                const esPreparando = cmd.estado === 'EN_PREPARACION';
                const esListo = cmd.estado === 'LISTO';
                const esPendiente = cmd.estado === 'PENDIENTE';

                return (
                  <div
                    key={cmd.id}
                    className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 shadow-sm space-y-3 transition-all ${
                      esListo
                        ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : esPreparando
                        ? 'border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
                          📍 {cmd.metadata?.estacion || 'Estación de Piso'}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                          {cmd.cliente_nombre || 'Cliente en Silla'}
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          Solicitado por: <strong>{cmd.solicitante_nombre || 'Staff'}</strong>
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {minutosEspera} min
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border mt-1 inline-block ${
                          esListo
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : esPreparando
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}>
                          {esListo ? '🍹 Listo' : esPreparando ? '👨‍🍳 En Preparación' : '⏳ Pendiente'}
                        </span>
                      </div>
                    </div>

                    {/* Detalle de Bebidas */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                      {cmd.detalle?.replace('Pedido Bar: ', '') || 'Bebidas de cortesía'}
                    </div>

                    {/* Indicador de quién agenció */}
                    {cmd.resolved_by && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Agenciado por: <strong>{cmd.resolved_by}</strong></span>
                      </div>
                    )}

                    {/* Botonera de Acción para el Barman */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {esPendiente && (
                        <button
                          type="button"
                          onClick={() => handleAgenciarPedido(cmd.id)}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition active:scale-95 cursor-pointer shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Tomar Pedido (Agenciar)</span>
                        </button>
                      )}

                      {esPreparando && (
                        <button
                          type="button"
                          onClick={() => handleMarcarListo(cmd.id)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar como Listo</span>
                        </button>
                      )}

                      {esListo && (
                        <button
                          type="button"
                          onClick={() => handleMarcarEntregado(cmd.id)}
                          className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Confirmar Entrega</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: GESTIÓN DE INSUMOS DE BAR */}
      {/* ========================================================================= */}
      {tabActivo === 'INSUMOS' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
              Control Rápido de Disponibilidad
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Toca cualquier insumo para alternar su estado entre: <strong className="text-emerald-600 dark:text-emerald-400">Disponible</strong>, <strong className="text-amber-600 dark:text-amber-400">Bajo Stock</strong> o <strong className="text-rose-600 dark:text-rose-400">Agotado</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {insumos.map((ins) => {
              const esDisponible = ins.estado === 'DISPONIBLE';
              const esBajo = ins.estado === 'BAJO';
              const esAgotado = ins.estado === 'AGOTADO';

              return (
                <div
                  key={ins.id}
                  onClick={() => handleCambiarEstadoInsumo(ins.id)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer select-none transition active:scale-98 ${
                    esAgotado
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60'
                      : esBajo
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ins.icono}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {ins.nombre}
                      </h4>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">
                        {ins.categoria}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border ${
                    esAgotado
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                      : esBajo
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                  }`}>
                    {ins.estado}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
