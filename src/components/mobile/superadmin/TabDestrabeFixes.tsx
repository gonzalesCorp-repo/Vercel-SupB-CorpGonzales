'use client';

import React, { useState } from 'react';
import { 
  Wrench, ShieldAlert, CheckCircle2, AlertOctagon, 
  Trash2, RefreshCw, XCircle, Unlock, ArrowRight, UserCheck, 
  Sparkles, Power
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { registrarLog } from '@/services/logger';
import { useUIStore } from '@/store/useUIStore';

interface TabDestrabeFixesProps {
  sedeId?: string;
  oatcsActivas: any[];
  onActionComplete: () => void;
}

export function TabDestrabeFixes({ sedeId, oatcsActivas, onActionComplete }: TabDestrabeFixesProps) {
  const { showAlert } = useUIStore();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [estaciones, setEstaciones] = useState<any[]>([]);
  const [loadingEstaciones, setLoadingEstaciones] = useState(false);

  const cargarEstaciones = React.useCallback(async () => {
    if (!sedeId) return;
    setLoadingEstaciones(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('estaciones_piso')
      .select('*')
      .eq('sede_id', sedeId);
    setEstaciones(data || []);
    setLoadingEstaciones(false);
  }, [sedeId]);

  React.useEffect(() => {
    cargarEstaciones();
  }, [cargarEstaciones]);

  // Acción 1: Liberar Estación Específica
  const handleLiberarEstacion = async (estacionId: string, nombreEstacion: string) => {
    setLoadingAction(`estacion_${estacionId}`);
    try {
      const supabase = createClient();
      await supabase
        .from('estaciones_piso')
        .update({
          estado_ocupacion: 'LIBRE',
          oatc_id_actual: null,
          agente_id_actual: null,
          cliente_nombre_actual: null
        })
        .eq('id', estacionId);

      await registrarLog('SUPERADMIN_FIX', `Liberó manualmente la estación ${nombreEstacion}`);
      showAlert(`Estación ${nombreEstacion} liberada correctamente.`, 'success');
      cargarEstaciones();
      onActionComplete();
    } catch (e: any) {
      showAlert(`Error liberando estación: ${e?.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Acción 2: Forzar Liberación de TODAS las Estaciones de la Sede
  const handleLiberarTodasEstaciones = async () => {
    if (!sedeId) return;
    if (!window.confirm('¿Seguro que deseas liberar TODAS las estaciones de piso de esta sede?')) return;

    setLoadingAction('liberar_todas');
    try {
      const supabase = createClient();
      await supabase
        .from('estaciones_piso')
        .update({
          estado_ocupacion: 'LIBRE',
          oatc_id_actual: null,
          agente_id_actual: null,
          cliente_nombre_actual: null
        })
        .eq('sede_id', sedeId);

      await registrarLog('SUPERADMIN_FIX', `Liberó TODAS las estaciones de piso de la sede`);
      showAlert('Todas las estaciones han sido liberadas.', 'success');
      cargarEstaciones();
      onActionComplete();
    } catch (e: any) {
      showAlert(`Error: ${e?.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Acción 3: Forzar Cierre / Finalización de OATC Atascada
  const handleForzarCierreOatc = async (oatcId: string, clienteNombre: string) => {
    setLoadingAction(`oatc_${oatcId}`);
    try {
      const supabase = createClient();
      await supabase
        .from('oatc')
        .update({
          estado_proceso: 'FINALIZADO',
          estado_pago: 'PAGADO',
          hora_fin_atencion: new Date().toISOString()
        })
        .eq('id', oatcId);

      await supabase
        .from('oatc_tickets')
        .update({ estado_ticket: 'FINALIZADO' })
        .eq('oatc_id', oatcId);

      await registrarLog('SUPERADMIN_FIX', `Forzó cierre de OATC para ${clienteNombre}`);
      showAlert(`OATC de ${clienteNombre} finalizada con éxito.`, 'success');
      onActionComplete();
    } catch (e: any) {
      showAlert(`Error finalizando OATC: ${e?.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Acción 4: Forzar Cancelación de OATC
  const handleForzarCancelarOatc = async (oatcId: string, clienteNombre: string) => {
    setLoadingAction(`cancel_${oatcId}`);
    try {
      const supabase = createClient();
      await supabase
        .from('oatc')
        .update({
          estado_proceso: 'CANCELADO',
          estado_pago: 'Anulado',
          detalle_cancelacion: 'Cancelado remotamente por SuperAdmin en contingencia'
        })
        .eq('id', oatcId);

      await supabase
        .from('oatc_tickets')
        .update({ estado_ticket: 'CANCELADO' })
        .eq('oatc_id', oatcId);

      await registrarLog('SUPERADMIN_FIX', `Forzó cancelación de OATC para ${clienteNombre}`);
      showAlert(`OATC de ${clienteNombre} cancelada.`, 'success');
      onActionComplete();
    } catch (e: any) {
      showAlert(`Error cancelando OATC: ${e?.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Destrabe */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">Destrabe Quirúrgico Remoto</h2>
            <p className="text-[11px] text-slate-400">Acciones de desbloqueo inmediato para piso y caja</p>
          </div>
        </div>
      </div>

      {/* 1. Destrabe de Estaciones de Piso */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Unlock className="w-4 h-4 text-cyan-400" /> Estaciones de Piso ({estaciones.length})
          </h3>

          <button
            onClick={handleLiberarTodasEstaciones}
            disabled={loadingAction === 'liberar_todas' || estaciones.length === 0}
            className="text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-xl hover:bg-rose-500/30 active:scale-95 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Power className="w-3 h-3" /> Liberar Todas
          </button>
        </div>

        <div className="space-y-2">
          {estaciones.length === 0 ? (
            <p className="text-xs text-slate-500 p-3 bg-slate-950/50 rounded-2xl text-center">
              No hay estaciones configuradas en esta sede.
            </p>
          ) : (
            estaciones.map((est) => {
              const estaOcupada = est.estado_ocupacion === 'OCUPADO';
              return (
                <div
                  key={est.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span>{est.nombre || `Estación #${est.numero}`}</span>
                      <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${
                        estaOcupada ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {est.estado_ocupacion || 'LIBRE'}
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {estaOcupada ? `Cliente: ${est.cliente_nombre_actual || 'Atención en curso'}` : 'Lista para asignación'}
                    </p>
                  </div>

                  {estaOcupada && (
                    <button
                      onClick={() => handleLiberarEstacion(est.id, est.nombre || `Estación #${est.numero}`)}
                      disabled={loadingAction === `estacion_${est.id}`}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 font-bold text-[10px] active:scale-95 transition cursor-pointer"
                    >
                      {loadingAction === `estacion_${est.id}` ? 'Liberando...' : 'Liberar'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Destrabe de Órdenes de Atención (OATCs) Activas */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-400" /> Órdenes Activas en Sede ({oatcsActivas.length})
        </h3>

        <div className="space-y-2">
          {oatcsActivas.length === 0 ? (
            <p className="text-xs text-slate-500 p-3 bg-slate-950/50 rounded-2xl text-center">
              No hay órdenes activas pendientes en esta sede.
            </p>
          ) : (
            oatcsActivas.map((o) => (
              <div
                key={o.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{o.cliente_nombre || 'Cliente'}</h4>
                    <p className="text-[10px] text-slate-400">
                      Staff: {o.agente_nombre || 'Sin asignar'} • Fase: <span className="text-purple-300 font-bold">{o.estado_proceso}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    {o.estado_pago || 'Pendiente'}
                  </span>
                </div>

                {/* Botones de acción rápida */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                  <button
                    onClick={() => handleForzarCierreOatc(o.id, o.cliente_nombre)}
                    disabled={loadingAction === `oatc_${o.id}`}
                    className="flex-1 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] hover:bg-emerald-500/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Forzar Cierre
                  </button>

                  <button
                    onClick={() => handleForzarCancelarOatc(o.id, o.cliente_nombre)}
                    disabled={loadingAction === `cancel_${o.id}`}
                    className="flex-1 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px] hover:bg-rose-500/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3 h-3" /> Forzar Cancelar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
