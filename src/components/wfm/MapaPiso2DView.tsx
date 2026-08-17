'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, User, CheckCircle2, Clock, Sparkles, Scissors, 
  Package, Wifi, AlertTriangle, ShieldCheck, RefreshCw, 
  Plus, X, ArrowRight, UserCheck, Armchair, Coffee, Eye
} from 'lucide-react';
import { 
  EstacionPiso, ZonaPiso, EstadoOcupacionEstacion,
  obtenerEstacionesPiso, asignarOatcAEstacion, liberarEstacionPiso 
} from '@/services/wfm';
import { createClient } from '@/lib/supabase/client';

interface MapaPiso2DViewProps {
  pisoActivo?: number;
}

export function MapaPiso2DView({ pisoActivo }: MapaPiso2DViewProps) {
  const [estaciones, setEstaciones] = useState<EstacionPiso[]>([]);
  const [ordenesEnEspera, setOrdenesEnEspera] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [feedback, setFeedback] = useState('');
  
  // Drawer lateral de Estación
  const [estacionSeleccionada, setEstacionSeleccionada] = useState<EstacionPiso | null>(null);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [oatcParaAsignar, setOatcParaAsignar] = useState<any | null>(null);

  const cargarDatos = async () => {
    try {
      const supabase = createClient();
      const [estList, { data: oatcList }] = await Promise.all([
        obtenerEstacionesPiso(undefined, pisoActivo),
        supabase
          .from('oatc')
          .select('*')
          .in('estado_proceso', ['EN_ESPERA', 'ASESORIA', 'EN_PROCESO', 'EN_EXPOSICION'])
          .order('created_at', { ascending: true })
      ]);

      // Filtrar sólo estaciones reales (excluir paredes estructurales)
      setEstaciones((estList || []).filter(e => e.tipo_estacion !== 'PARED'));
      setOrdenesEnEspera(oatcList || []);
    } catch (e) {
      console.error('Error cargando mapa WFM:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();

    const supabase = createClient();
    const channel = supabase.channel('realtime-mapa-wfm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estaciones_piso' }, () => cargarDatos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarDatos())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLiberar = async (estacionId: string) => {
    try {
      await liberarEstacionPiso(estacionId);
      setEstacionSeleccionada(null);
      setFeedback('¡Estación liberada y marcada como Disponible!');
      cargarDatos();
      setTimeout(() => setFeedback(''), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEjecutarAsignacion = async (oatc: any) => {
    if (!estacionSeleccionada) return;
    try {
      await asignarOatcAEstacion({
        estacionId: estacionSeleccionada.id,
        oatcId: oatc.id,
        clienteNombre: oatc.cliente_nombre,
        agenteId: oatc.agente_id,
        agenteNombre: oatc.agente_nombre || 'Staff Asignado',
        estadoOcupacion: oatc.estado_proceso === 'ASESORIA' ? 'ASESORIA' : 'SERVICIO'
      });

      setModalAsignarOpen(false);
      setEstacionSeleccionada(null);
      setFeedback(`¡${estacionSeleccionada.nombre} asignada a ${oatc.cliente_nombre}!`);
      cargarDatos();
      setTimeout(() => setFeedback(''), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  // Agrupar estaciones por zona
  const zonas: { id: ZonaPiso; titulo: string; icono: string }[] = [
    { id: 'ESTILISMO', titulo: '✂️ Zona de Corte & Estilismo Capilar', icono: '✂️' },
    { id: 'HEAD_SPA', titulo: '💆 Zona de Lavaderos & Head Spa', icono: '💆' },
    { id: 'MANICURA', titulo: '💅 Zona de Manicura & Pedicura', icono: '💅' },
    { id: 'COSMIATRIA', titulo: '🧖 Cabina de Cosmiatría & Faciales', icono: '🧖' },
    { id: 'LOUNGE', titulo: '🛋️ Sala Lounge & Zona de Espera', icono: '🛋️' }
  ];

  const getColorEstado = (estado: EstadoOcupacionEstacion) => {
    switch (estado) {
      case 'LIBRE':
        return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500';
      case 'ASESORIA':
        return 'bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400 hover:border-purple-500';
      case 'SERVICIO':
        return 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500';
      case 'ESPERA':
        return 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:border-amber-500';
      default:
        return 'bg-slate-500/10 border-slate-500/40 text-slate-400';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans p-4">
      
      {/* Header del Mapa WFM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Workforce Management (WFM)
          </span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-2 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-500" /> Mapa Visual 2D de Piso & Estaciones
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Monitoreo en tiempo real de sillones, lavaderos, cabinas y asignación táctil de piso.
          </p>
        </div>

        {/* Leyenda Cromática */}
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Libre
          </span>
          <span className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Asesoría
          </span>
          <span className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> En Servicio
          </span>
          <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Espera
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid del Plano de Piso por Zonas */}
      <div className="space-y-6">
        {zonas.map((zona) => {
          const estZona = estaciones.filter(e => e.zona === zona.id);
          if (estZona.length === 0) return null;

          return (
            <div 
              key={zona.id} 
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>{zona.titulo}</span>
                <span className="text-[10px] text-gray-400 font-bold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {estZona.length} estaciones
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {estZona.map((est) => {
                  const colorClass = getColorEstado(est.estado_ocupacion);

                  return (
                    <div
                      key={est.id}
                      onClick={() => setEstacionSeleccionada(est)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative overflow-hidden group shadow-sm active:scale-98 ${colorClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900 dark:text-white">
                          {est.nombre}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-950/80 shadow-xs">
                          {est.estado_ocupacion}
                        </span>
                      </div>

                      {est.cliente_nombre_actual ? (
                        <div className="space-y-0.5 pt-1">
                          <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {est.cliente_nombre_actual}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                            Especialista: <strong>{est.agente_nombre_actual || 'Staff'}</strong>
                          </p>
                        </div>
                      ) : (
                        <div className="pt-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Estación Disponible
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* DRAWER LATERAL DE DETALLE DE ESTACIÓN */}
      {/* ========================================================================= */}
      {estacionSeleccionada && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-end p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full max-h-[90vh] rounded-3xl p-6 border border-gray-200 dark:border-slate-800 space-y-5 shadow-2xl flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                    Estación Física
                  </span>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    {estacionSeleccionada.nombre}
                  </h3>
                </div>
                <button 
                  onClick={() => setEstacionSeleccionada(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Estado y Ocupación */}
              <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-bold">Estado Actual:</span>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${getColorEstado(estacionSeleccionada.estado_ocupacion)}`}>
                    {estacionSeleccionada.estado_ocupacion}
                  </span>
                </div>

                {estacionSeleccionada.cliente_nombre_actual ? (
                  <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-850">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Cliente en Silla:</span>
                      <strong className="text-gray-900 dark:text-white">{estacionSeleccionada.cliente_nombre_actual}</strong>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Especialista Staff:</span>
                      <strong className="text-indigo-500">{estacionSeleccionada.agente_nombre_actual || 'Staff'}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No hay atención vinculada a esta estación en este momento.
                  </p>
                )}
              </div>

              {/* Acciones de Asignación si está Libre */}
              {estacionSeleccionada.estado_ocupacion === 'LIBRE' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                    Asignar Orden en Espera a esta Estación:
                  </h4>

                  {ordenesEnEspera.length === 0 ? (
                    <p className="text-xs text-gray-400 p-3 bg-gray-50 dark:bg-slate-950 rounded-xl text-center">
                      No hay órdenes en sala de espera.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {ordenesEnEspera.map((o) => (
                        <div
                          key={o.id}
                          className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs hover:border-indigo-500 transition"
                        >
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{o.cliente_nombre}</p>
                            <span className="text-[10px] text-gray-400">#OATC-{o.id.slice(0, 4)} • {o.agente_nombre || 'Sin Staff'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEjecutarAsignacion(o)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition"
                          >
                            Asignar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botón de Liberación si está Ocupada */}
            {estacionSeleccionada.estado_ocupacion !== 'LIBRE' && (
              <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleLiberar(estacionSeleccionada.id)}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Liberar Estación Manualmente
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
