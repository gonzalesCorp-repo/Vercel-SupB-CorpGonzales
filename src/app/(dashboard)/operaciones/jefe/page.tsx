'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, Activity, ArrowRightLeft, CheckCircle2, XCircle, AlertTriangle, 
  Clock, Users, Beaker, Zap, Coffee, ChevronRight, Sliders, RefreshCw, Armchair 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';
import { obtenerEstacionesConSLA, EstacionSLAInfo } from '@/services/wfm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PanelJefeOperativoPage() {
  const [estaciones, setEstaciones] = useState<EstacionSLAInfo[]>([]);
  const [solicitudesLab, setSolicitudesLab] = useState<any[]>([]);
  const [solicitudesWfm, setSolicitudesWfm] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { showAlert } = useUIStore();
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const supabase = createClient();

  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      // 1. Cargar estaciones reales con cálculo de SLA
      const ests = await obtenerEstacionesConSLA(sedeActiva?.id);
      setEstaciones(ests);

      // 2. Cargar solicitudes pendientes de cola_peticiones
      let queryPeticiones = supabase
        .from('cola_peticiones')
        .select(`
          id, 
          estado, 
          created_at, 
          tipo_id,
          agente_id,
          oatc_id,
          agentes:agente_id (id, nombre),
          oatc:oatc_id (id, cliente_nombre, agente_nombre),
          config_peticiones:tipo_id (id, nombre, color)
        `)
        .eq('estado', 'PENDIENTE')
        .order('created_at', { ascending: true });

      if (sedeActiva?.id) {
        queryPeticiones = queryPeticiones.or(`sede_id.eq.${sedeActiva.id},sede_id.is.null`);
      }

      const { data: peticiones, error: errPet } = await queryPeticiones;

      if (!errPet && peticiones) {
        // Separar solicitudes de insumo vs solicitudes WFM
        const lab: any[] = [];
        const wfm: any[] = [];

        peticiones.forEach((p: any) => {
          const nombreTipo = p.config_peticiones?.nombre?.toLowerCase() || '';
          if (nombreTipo.includes('insumo') || nombreTipo.includes('tinte') || nombreTipo.includes('taller') || nombreTipo.includes('bar')) {
            lab.push(p);
          } else {
            wfm.push(p);
          }
        });

        setSolicitudesLab(lab);
        setSolicitudesWfm(wfm);
      }
    } catch (err) {
      console.error('Error cargando panel jefe operativo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();

    const interval = setInterval(cargarDatos, 30000);

    const channel = supabase.channel('realtime-jefe-operativo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estaciones_piso' }, () => cargarDatos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cola_peticiones' }, () => cargarDatos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarDatos())
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [sedeActiva?.id]);

  const handleResolverPeticion = async (id: string, nuevoEstado: 'APROBADO' | 'RECHAZADO') => {
    try {
      const { error } = await supabase
        .from('cola_peticiones')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) {
        showAlert('Error al actualizar la solicitud.', 'error');
        return;
      }

      showAlert(`Solicitud ${nuevoEstado === 'APROBADO' ? 'aprobada' : 'rechazada'} correctamente.`, 'success');
      cargarDatos();
    } catch (e) {
      console.error(e);
      showAlert('Error inesperado al resolver.', 'error');
    }
  };

  const handleReasignarEstacion = async (estacionId: string, nombreActual: string) => {
    const nuevoAgente = prompt(`Reasignar especialista para ${nombreActual}:`);
    if (!nuevoAgente || !nuevoAgente.trim()) return;

    try {
      const { error } = await supabase
        .from('estaciones_piso')
        .update({ agente_nombre_actual: nuevoAgente.trim() })
        .eq('id', estacionId);

      if (error) {
        showAlert('Error al reasignar especialista.', 'error');
        return;
      }

      showAlert(`Estación reasignada a ${nuevoAgente.trim()}`, 'success');
      cargarDatos();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Header Jefe Operativo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3.5 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              Panel del Jefe Operativo / Piso
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                Supervisión SLA
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor de estaciones físicas en vivo, alertas de tiempo y aprobaciones operativas.
            </p>
          </div>
        </div>

        <button 
          onClick={cargarDatos}
          className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer" 
          title="Sincronizar con Base de Datos"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grid 1: Semáforo de Estaciones en Vivo */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" /> Semáforo de Estaciones Físicas (SLA)
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
            {estaciones.length} estaciones monitoreadas
          </span>
        </div>

        {estaciones.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No hay estaciones configuradas para esta sede. Configúralas en el módulo WFM / Plano.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {estaciones.map((e) => {
              const ocupado = e.estado_ocupacion === 'OCUPADO' || e.estado_ocupacion === 'SERVICIO' || e.estado_ocupacion === 'ASESORIA';

              return (
                <div 
                  key={e.id}
                  className={`p-4 rounded-2xl border space-y-3 transition-all ${
                    ocupado
                      ? e.alertaColor === 'ROJO' 
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-sm' 
                        : e.alertaColor === 'AMARILLO' 
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-sm' 
                        : 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-white truncate">
                      {e.nombre}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                      ocupado
                        ? e.alertaColor === 'ROJO' 
                          ? 'bg-rose-600 text-white animate-pulse' 
                          : e.alertaColor === 'AMARILLO' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {ocupado ? `${e.tiempoMinutos}m / ${e.slaMaxMinutos}m SLA` : 'Libre'}
                    </span>
                  </div>

                  {ocupado ? (
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Cliente:</span>
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {e.cliente_nombre_actual || 'En Atención'}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        Staff: <strong className="text-indigo-600 dark:text-indigo-400">{e.agente_nombre_actual || 'Staff'}</strong>
                      </p>

                      {/* Barra de Progreso SLA */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mt-2">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            e.alertaColor === 'ROJO' ? 'bg-rose-600' : e.alertaColor === 'AMARILLO' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${e.progresoPorcentaje}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-xs text-slate-400 font-bold italic flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Disponible
                    </div>
                  )}

                  {ocupado && (
                    <button
                      onClick={() => handleReasignarEstacion(e.id, e.nombre)}
                      className="w-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Reasignar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid 2: Colas de Aprobación Inmediata (Taller & WFM) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Columna A: Solicitudes de Insumos / Taller */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Beaker className="w-5 h-5 text-sky-600" /> Solicitudes de Insumos al Taller (ODI)
            </h2>
            <span className="text-[11px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 px-2.5 py-0.5 rounded-full">
              {solicitudesLab.length} pendientes
            </span>
          </div>

          <div className="space-y-3">
            {solicitudesLab.map((s) => (
              <div key={s.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-800 dark:text-white">
                    {s.agentes?.nombre || s.oatc?.agente_nombre || 'Staff'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {format(new Date(s.created_at), 'hh:mm a', { locale: es })}
                  </span>
                </div>
                <p className="text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 p-2.5 rounded-xl border border-sky-200 dark:border-sky-800">
                  {s.config_peticiones?.nombre || 'Solicitud de Insumo / Preparación en Taller'}
                  {s.oatc?.cliente_nombre && <span className="block text-[11px] text-sky-600 mt-0.5">Cliente: {s.oatc.cliente_nombre}</span>}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleResolverPeticion(s.id, 'APROBADO')}
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar Insumo
                  </button>
                  <button
                    onClick={() => handleResolverPeticion(s.id, 'RECHAZADO')}
                    className="px-3 bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-700 text-slate-600 dark:text-slate-300 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {solicitudesLab.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 font-medium italic">
                No hay pedidos pendientes de laboratorio o insumos.
              </div>
            )}
          </div>
        </div>

        {/* Columna B: Solicitudes WFM (Pausas / Refrigerios) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-600" /> Solicitudes WFM de Personal
            </h2>
            <span className="text-[11px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
              {solicitudesWfm.length} pendientes
            </span>
          </div>

          <div className="space-y-3">
            {solicitudesWfm.map((w) => (
              <div key={w.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-800 dark:text-white">
                    {w.agentes?.nombre || 'Colaborador'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {format(new Date(w.created_at), 'hh:mm a', { locale: es })}
                  </span>
                </div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  Petición: {w.config_peticiones?.nombre || 'Pausa / Descanso WFM'}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleResolverPeticion(w.id, 'APROBADO')}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Autorizar Pausa
                  </button>
                  <button
                    onClick={() => handleResolverPeticion(w.id, 'RECHAZADO')}
                    className="px-3 bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-700 text-slate-600 dark:text-slate-300 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {solicitudesWfm.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 font-medium italic">
                No hay peticiones de pausa o descanso pendientes.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
