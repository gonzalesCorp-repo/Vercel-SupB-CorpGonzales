'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Scissors, Package, CheckCircle2, Clock, 
  Send, Calendar, AlertCircle, RefreshCw, ChevronRight, FileText
} from 'lucide-react';
import { 
  obtenerConfiguracionRemunerativa, 
  obtenerVentasAuditadasPorColaborador, 
  solicitarLiquidacionStaff,
  obtenerLiquidaciones
} from '@/services/liquidaciones';
import { 
  AgenteConfigRemunerativa, 
  ItemVentaAuditoria, 
  LiquidacionPersonal 
} from '@/types/liquidaciones';
import { useUIStore } from '@/store/useUIStore';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface StaffLiquidacionesTabProps {
  agente: any;
  sedeId?: string;
}

export default function StaffLiquidacionesTab({ agente, sedeId }: StaffLiquidacionesTabProps) {
  const [periodoFiltro, setPeriodoFiltro] = useState<'HOY' | 'AYER' | 'SEMANA' | 'MES' | 'CUSTOM'>('HOY');
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [config, setConfig] = useState<AgenteConfigRemunerativa | null>(null);
  const [ventas, setVentas] = useState<ItemVentaAuditoria[]>([]);
  const [misLiquidaciones, setMisLiquidaciones] = useState<LiquidacionPersonal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [solicitando, setSolicitando] = useState(false);

  const { showAlert } = useUIStore();

  const handleCambiarPeriodo = (tipo: 'HOY' | 'AYER' | 'SEMANA' | 'MES' | 'CUSTOM') => {
    setPeriodoFiltro(tipo);
    const hoy = new Date();
    if (tipo === 'HOY') {
      const f = hoy.toISOString().split('T')[0];
      setFechaInicio(f);
      setFechaFin(f);
    } else if (tipo === 'AYER') {
      const ayer = subDays(hoy, 1).toISOString().split('T')[0];
      setFechaInicio(ayer);
      setFechaFin(ayer);
    } else if (tipo === 'SEMANA') {
      setFechaInicio(startOfWeek(hoy, { weekStartsOn: 1 }).toISOString().split('T')[0]);
      setFechaFin(endOfWeek(hoy, { weekStartsOn: 1 }).toISOString().split('T')[0]);
    } else if (tipo === 'MES') {
      setFechaInicio(startOfMonth(hoy).toISOString().split('T')[0]);
      setFechaFin(endOfMonth(hoy).toISOString().split('T')[0]);
    }
  };

  const cargarDatos = async () => {
    if (!agente?.id) return;
    setCargando(true);
    try {
      const [conf, vAuditadas, liqs] = await Promise.all([
        obtenerConfiguracionRemunerativa(agente.id, agente.rol),
        obtenerVentasAuditadasPorColaborador(agente.id, agente.nombre, fechaInicio, fechaFin),
        obtenerLiquidaciones({ agenteId: agente.id })
      ]);

      setConfig(conf);
      setVentas(vAuditadas || []);
      setMisLiquidaciones(liqs || []);
    } catch (e) {
      console.error('Error cargando liquidaciones mobile:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [agente?.id, fechaInicio, fechaFin]);

  // Cálculos de pendientes
  const ventasPendientes = ventas.filter(v => !v.esta_liquidado);
  const totalVentasPendientes = ventasPendientes.reduce((acc, v) => acc + v.monto_venta, 0);
  const totalComisionPendiente = ventasPendientes.reduce((acc, v) => acc + v.monto_comision, 0);

  const handleSolicitar = async () => {
    if (ventasPendientes.length === 0 && config?.tipo_remuneracion === 'SOLO_COMISIONES') {
      showAlert('No tienes atenciones ni comisiones pendientes por liquidar en el período seleccionado.', 'error');
      return;
    }

    setSolicitando(true);
    try {
      await solicitarLiquidacionStaff({
        agenteId: agente.id,
        agenteNombre: agente.nombre,
        agenteRol: agente.rol || 'STAFF',
        periodoInicio: fechaInicio,
        periodoFin: fechaFin,
        solicitadoPor: agente.nombre,
        sedeId
      });

      showAlert('¡Solicitud de liquidación enviada a Caja exitosamente!', 'success');
      cargarDatos();
    } catch (err: any) {
      showAlert('Error al solicitar liquidación: ' + err.message, 'error');
    } finally {
      setSolicitando(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 text-slate-800 dark:text-slate-100">
      
      {/* Selector de Período Rápido */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
          Período a Liquidar
        </span>

        <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
          <button type="button"
            onClick={() => handleCambiarPeriodo('HOY')}
            className={`py-2 rounded-xl transition cursor-pointer ${
              periodoFiltro === 'HOY' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Hoy
          </button>
          <button type="button"
            onClick={() => handleCambiarPeriodo('AYER')}
            className={`py-2 rounded-xl transition cursor-pointer ${
              periodoFiltro === 'AYER' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Ayer
          </button>
          <button type="button"
            onClick={() => handleCambiarPeriodo('SEMANA')}
            className={`py-2 rounded-xl transition cursor-pointer ${
              periodoFiltro === 'SEMANA' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Semana
          </button>
          <button type="button"
            onClick={() => handleCambiarPeriodo('MES')}
            className={`py-2 rounded-xl transition cursor-pointer ${
              periodoFiltro === 'MES' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Mes
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>Rango: {fechaInicio} al {fechaFin}</span>
          <button onClick={cargarDatos} className="text-indigo-500 font-bold flex items-center gap-1 cursor-pointer">
            <RefreshCw className={`w-3 h-3 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      {/* Card de Resumen de Comisiones Pendientes */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
              Comisión Neta Pendiente
            </span>
            <h2 className="text-3xl font-black mt-0.5">
              S/ {totalComisionPendiente.toFixed(2)}
            </h2>
          </div>

          <div className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold">
            {config?.porcentaje_comision_servicios || 40}% Servicios
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs">
          <span>{ventasPendientes.length} atenciones pendientes</span>
          <span>Ventas Totales: S/ {totalVentasPendientes.toFixed(2)}</span>
        </div>

        {/* Botón de Solicitud */}
        <button type="button"
          disabled={solicitando || (ventasPendientes.length === 0 && config?.tipo_remuneracion === 'SOLO_COMISIONES')}
          onClick={handleSolicitar}
          className="w-full py-3 bg-white hover:bg-slate-50 text-indigo-700 text-xs font-black rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{solicitando ? 'Enviando...' : '📤 Solicitar Liquidación a Caja'}</span>
        </button>
      </div>

      {/* Detalle de Atenciones: Pendientes vs Ya Liquidados */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center justify-between">
          <span>Auditoría de Servicios ({ventas.length})</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Antiduplicidad activa</span>
        </h3>

        {ventas.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No registras atenciones finalizadas en este rango de fechas.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {ventas.map((v, idx) => (
              <div
                key={v.origen_id || idx}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs transition ${
                  v.esta_liquidado
                    ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                    : 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-800/40 text-slate-800 dark:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    v.esta_liquidado 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {v.tipo === 'SERVICIO' ? <Scissors className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                  </div>

                  <div className="truncate">
                    <p className="font-bold truncate">{v.descripcion}</p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                      {format(new Date(v.fecha), 'dd/MM HH:mm', { locale: es })} • {v.cliente_nombre || 'Cliente'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 block">
                    +S/ {v.monto_comision.toFixed(2)}
                  </span>
                  {v.esta_liquidado ? (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded-full">
                      ✓ Liquidado
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.2 rounded-full">
                      Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de Mis Solicitudes de Liquidación */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2.5">
        <h3 className="font-bold text-slate-800 dark:text-slate-900 dark:text-white text-xs uppercase tracking-wider">
          Mis Liquidaciones Anteriores ({misLiquidaciones.length})
        </h3>

        {misLiquidaciones.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">Aún no tienes liquidaciones solicitadas.</p>
        ) : (
          <div className="space-y-2">
            {misLiquidaciones.slice(0, 5).map((l) => (
              <div
                key={l.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 block text-[11px]">
                    {l.numero_correlativo}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {l.periodo_inicio} al {l.periodo_fin}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-black text-slate-900 dark:text-white block">
                    S/ {Number(l.monto_total_neto).toFixed(2)}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    l.estado === 'PAGADO'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {l.estado === 'PAGADO' ? '✅ Pagado' : '⏳ En Caja'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
