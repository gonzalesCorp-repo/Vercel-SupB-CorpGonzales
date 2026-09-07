'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, Sparkles, RefreshCw, Scissors, UserCheck, 
  CheckCircle2, ArrowRight, MessageSquare, AlertCircle, ChevronRight 
} from 'lucide-react';
import { obtenerAgentesDisponibles, Agente } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { reproducirChimeNuevaOrden } from '@/lib/audio/chime';
import { registrarLog } from '@/services/logger';

interface TabColaProps {
  miNombre: string;
  estacionNombre?: string;
  onClienteSeleccionado?: () => void;
}

type TipoFiltro = 'Todos' | 'Estilismo' | 'Cosmiatria';

function clasificarEspecialidad(agente: Agente): ('Estilismo' | 'Cosmiatria')[] {
  const result: ('Estilismo' | 'Cosmiatria')[] = [];
  const esp = (agente.especialidad || '').toLowerCase();

  // 1. Cabello / Estilismo / Barbería
  if (
    esp.includes('estil') ||
    esp.includes('barber') ||
    esp.includes('corte') ||
    esp.includes('color') ||
    esp.includes('capilar') ||
    esp.includes('alisado') ||
    esp.includes('peinado') ||
    !esp
  ) {
    result.push('Estilismo');
  }

  // 2. Uñas / Piel / Cosmiatría / Maquillaje
  if (
    esp.includes('cosm') ||
    esp.includes('uña') ||
    esp.includes('piel') ||
    esp.includes('maquillaje') ||
    esp.includes('mani') ||
    esp.includes('pedi') ||
    esp.includes('facial') ||
    esp.includes('ceja') ||
    esp.includes('pestaña') ||
    esp.includes('spa') ||
    esp.includes('podolog')
  ) {
    result.push('Cosmiatria');
  }

  if (result.length === 0) result.push('Estilismo');
  return result;
}

export function TabCola({ miNombre, estacionNombre, onClienteSeleccionado }: TabColaProps) {
  const [modoVista, setModoVista] = useState<'CLIENTES' | 'ROTACION'>('CLIENTES');
  const [filtro, setFiltro] = useState<TipoFiltro>('Todos');
  const [agentesEnPiso, setAgentesEnPiso] = useState<Agente[]>([]);
  const [clientesOatc, setClientesOatc] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [estimandoOatcId, setEstimandoOatcId] = useState<string | null>(null);

  const supabase = createClient();

  const cargarColaEnVivo = async () => {
    try {
      // 1. Cargar Clientes en Espera desde OATC
      const { data: oatcs } = await supabase
        .from('oatc')
        .select('*')
        .in('estado_proceso', ['EN_ESPERA', 'RECEPCIONADO'])
        .order('created_at', { ascending: true });

      setClientesOatc(oatcs || []);

      // 2. Cargar Rotación de Colaboradores en Piso
      const dataAgentes = await obtenerAgentesDisponibles();
      const enPiso = dataAgentes.filter(a => a.estadoOperativo !== 'FUERA_DE_TURNO');
      setAgentesEnPiso(enPiso);
    } catch (e) {
      console.warn('Error cargando cola en vivo:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarColaEnVivo();

    const channel = supabase.channel('realtime-tab-cola-dual')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarColaEnVivo())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias_turnos' }, () => cargarColaEnVivo())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => cargarColaEnVivo())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Regla de Visibilidad OATC:
  // Clientes asignados a este estilista + órdenes sin asignar (abiertas para todos los estilistas en turno)
  const clientesVisibles = clientesOatc.filter(o => {
    const esAsignadoAMi = o.agente_nombre && o.agente_nombre.toLowerCase().includes(miNombre.toLowerCase());
    const esAbierto = !o.agente_nombre || o.agente_nombre.trim() === '' || !o.agente_id;
    return esAsignadoAMi || esAbierto;
  });

  // Tomar cliente de la cola para atender en sillón
  const handleAtenderEnMiSillon = async (oatc: any) => {
    try {
      await supabase.from('oatc').update({
        agente_nombre: miNombre,
        estado_proceso: 'ASESORIA',
        hora_inicio_atencion: new Date().toISOString()
      }).eq('id', oatc.id);

      try {
        reproducirChimeNuevaOrden();
      } catch (e) {}

      await registrarLog('WFM_OATC_TOMADO', `${miNombre} tomó la orden de ${oatc.cliente_nombre} en ${estacionNombre || 'Estación'}`);
      if (onClienteSeleccionado) onClienteSeleccionado();
    } catch (e) {
      console.error('Error atendiendo cliente:', e);
    }
  };

  // Enviar tiempo estimado de respuesta o sugerencia de reagendamiento
  const handleEstimarTiempo = async (oatcId: string, minutos: number | string, accion: 'TIEMPO' | 'REAGENDAR') => {
    try {
      await supabase.from('oatc').update({
        cambios_pendientes: {
          tipo: accion === 'REAGENDAR' ? 'SUGERENCIA_REAGENDAR' : 'TIEMPO_ESTIMADO',
          estimado_minutos: minutos,
          informado_por: miNombre,
          fecha: new Date().toISOString()
        }
      }).eq('id', oatcId);

      setEstimandoOatcId(null);
      await cargarColaEnVivo();
    } catch (e) {
      console.error('Error enviando tiempo estimado:', e);
    }
  };

  // Rotación y filtrados de colegas
  const filtrados = agentesEnPiso.filter(c => {
    if (filtro === 'Todos') return true;
    const cats = clasificarEspecialidad(c);
    return cats.includes(filtro);
  });

  const miAgenteEnPiso = agentesEnPiso.find(c => 
    c.nombre.toLowerCase().includes(miNombre.toLowerCase()) || 
    miNombre.toLowerCase().includes(c.nombre.toLowerCase())
  );
  const estoyEnPiso = !!miAgenteEnPiso;

  const miIndex = filtrados.findIndex(c => 
    c.nombre.toLowerCase().includes(miNombre.toLowerCase()) || 
    miNombre.toLowerCase().includes(c.nombre.toLowerCase())
  );
  const miPosicion = miIndex >= 0 ? miIndex + 1 : null;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Selector Dual: Clientes en Espera vs Rotación de Turnos */}
      <div className="flex gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => setModoVista('CLIENTES')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            modoVista === 'CLIENTES'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Clientes en Espera ({clientesVisibles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setModoVista('ROTACION')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            modoVista === 'ROTACION'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Rotación Staff</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: CLIENTES EN ESPERA (public.oatc) */}
      {/* ========================================================================= */}
      {modoVista === 'CLIENTES' && (
        <div className="space-y-3 animate-in fade-in">
          {clientesVisibles.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl border border-emerald-200 dark:border-emerald-800/40">
                ✨
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Lobby Despejado</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  No hay clientes en espera en recepción en este momento. Revisa la rotación de turnos para consultar tu posición de atención a demanda.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModoVista('ROTACION')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                Ver Rotación de Turnos
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {clientesVisibles.map((oatc) => {
                const esMio = oatc.agente_nombre && oatc.agente_nombre.toLowerCase().includes(miNombre.toLowerCase());
                const servicios = Array.isArray(oatc.punto_partida) 
                  ? oatc.punto_partida.map((p: any) => p.nombre).filter(Boolean).join(', ')
                  : 'Servicio de Salón';
                
                const inicioEspera = new Date(oatc.created_at).getTime();
                const minutosEspera = Math.max(1, Math.floor((Date.now() - inicioEspera) / 60000));

                return (
                  <div
                    key={oatc.id}
                    className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 shadow-sm space-y-3 transition-all ${
                      esMio
                        ? 'border-indigo-500/50 bg-indigo-50/20 dark:bg-indigo-950/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {oatc.cliente_nombre || 'Cliente en Espera'}
                          </h4>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            esMio 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          }`}>
                            {esMio ? 'Asignado a ti' : 'Disponible para atención'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
                          {servicios}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          {minutosEspera} min
                        </span>
                        <span className="text-[9px] text-slate-400 block uppercase">
                          {oatc.tipo_demanda === 'cliente' ? 'Cita Preferente' : 'Por Turno'}
                        </span>
                      </div>
                    </div>

                    {/* Fila de Acciones Rápidas */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleAtenderEnMiSillon(oatc)}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>🛋️ Atender en mi Sillón</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setEstimandoOatcId(estimandoOatcId === oatc.id ? null : oatc.id)}
                        className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>Estimar</span>
                      </button>
                    </div>

                    {/* Panel Expandible de Estimación de Tiempo / Reagendamiento */}
                    {estimandoOatcId === oatc.id && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Informar tiempo estimado al cliente y recepción:
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEstimarTiempo(oatc.id, 5, 'TIEMPO')}
                            className="py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl hover:border-indigo-500"
                          >
                            +5 min
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEstimarTiempo(oatc.id, 15, 'TIEMPO')}
                            className="py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl hover:border-indigo-500"
                          >
                            +15 min
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEstimarTiempo(oatc.id, 30, 'TIEMPO')}
                            className="py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl hover:border-indigo-500"
                          >
                            +30 min
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEstimarTiempo(oatc.id, 'Reagendar', 'REAGENDAR')}
                            className="py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl hover:bg-rose-100"
                          >
                            Reagendar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: ROTACIÓN DE TURNOS DE COLABORADORES EN PISO */}
      {/* ========================================================================= */}
      {modoVista === 'ROTACION' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Banner de Posición o Fuera de Turno */}
          {estoyEnPiso && miPosicion ? (
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white p-5 rounded-3xl shadow-xl shadow-indigo-950/30 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">
                Posición de Turno en Sede
              </span>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-xs text-indigo-100 font-medium">Estás en el turno:</p>
                  <p className="text-3xl font-black mt-0.5">#{miPosicion} de {filtrados.length}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl border border-white/20">
                  👥
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  Estado: Fuera de Turno
                </span>
                <span className="text-xl">🚪</span>
              </div>
              <div className="mt-2.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">No estás en la rotación activa</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Actualmente figuras fuera de jornada. Para ingresar a la asignación de atenciones, marca llegada en Puerta Principal o solicita inicio de turno.
                </p>
              </div>
            </div>
          )}

          {/* Filtros de Especialidad */}
          <div className="flex gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFiltro('Todos')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                filtro === 'Todos'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({agentesEnPiso.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('Estilismo')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                filtro === 'Estilismo'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ✂️ Estilismo
            </button>
            <button
              type="button"
              onClick={() => setFiltro('Cosmiatria')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                filtro === 'Cosmiatria'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              💅 Cosmiatría
            </button>
          </div>

          {/* Lista de Colaboradores en Piso */}
          <div className="space-y-2">
            {filtrados.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-xs text-slate-500">
                No hay colaboradores activos en esta especialidad.
              </div>
            ) : (
              filtrados.map((c, index) => {
                const pos = index + 1;
                const esTu = c.nombre.toLowerCase().includes(miNombre.toLowerCase()) || miNombre.toLowerCase().includes(c.nombre.toLowerCase());
                const estadoOp = c.estadoOperativo || 'DISPONIBLE';
                const categorias = clasificarEspecialidad(c);
                const tagLabel = categorias.length > 1 
                  ? '✂️ Estilismo & 💅 Cosmiatría' 
                  : categorias[0] === 'Estilismo' 
                  ? '✂️ Estilismo (Cabello)' 
                  : '💅 Cosmiatría (Uñas & Piel)';

                return (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      esTu
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                        : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                        esTu ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {pos}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {c.nombre}
                          {esTu && (
                            <span className="text-[9px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded-md">
                              Tú
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {tagLabel}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      estadoOp === 'DISPONIBLE'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : estadoOp === 'OCUPADO'
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                        : estadoOp === 'EN_REFRIGERIO'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}>
                      {estadoOp === 'OCUPADO' ? 'EN ATENCIÓN' : estadoOp === 'EN_REFRIGERIO' ? 'EN REFRIGERIO' : 'DISPONIBLE'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
