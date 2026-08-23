'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, DollarSign, Clock, CheckCircle2, 
  Printer, Plus, Search, RefreshCw, Sliders, FileText, ArrowRight,
  Eye, Calendar, Check, Landmark, Building2
} from 'lucide-react';
import { LiquidacionPersonal } from '@/types/liquidaciones';
import { CuentaFinanciera } from '@/types/finanzas';
import { 
  obtenerLiquidaciones, 
  solicitarLiquidacionStaff 
} from '@/services/liquidaciones';
import { obtenerCuentasFinancieras } from '@/services/finanzas';
import { obtenerTodosLosAgentes } from '@/services/agentes';
import { ConfiguracionRemuneracionModal } from './ConfiguracionRemuneracionModal';
import { PagarLiquidacionModal } from './PagarLiquidacionModal';
import { DetalleLiquidacionModal } from './DetalleLiquidacionModal';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';

export function LiquidacionesSoporteView() {
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionPersonal[]>([]);
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [soporteList, setSoporteList] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');

  // Modales
  const [agenteConfigSel, setAgenteConfigSel] = useState<any | null>(null);
  const [liquidacionPagarSel, setLiquidacionPagarSel] = useState<LiquidacionPersonal | null>(null);
  const [liquidacionDetalleSel, setLiquidacionDetalleSel] = useState<LiquidacionPersonal | null>(null);

  // Formulario rápido de corte
  const [periodoInicio, setPeriodoInicio] = useState<string>(new Date().toISOString().split('T')[0]);
  const [periodoFin, setPeriodoFin] = useState<string>(new Date().toISOString().split('T')[0]);

  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [liqs, ctas, agentes] = await Promise.all([
        obtenerLiquidaciones({ rolGrupo: 'SOPORTE', sedeId: sedeActiva?.id }),
        obtenerCuentasFinancieras(sedeActiva?.id),
        obtenerTodosLosAgentes()
      ]);

      setLiquidaciones(liqs || []);
      setCuentas(ctas || []);
      setSoporteList((agentes || []).filter((a: any) => 
        a.estado === 'ACTIVO' && (a.rol === 'SOPORTE' || a.rol === 'CAJA' || a.rol === 'ADMIN' || a.rol === 'JEFE_OPERATIVO' || a.rol === 'RECEPCION')
      ));
    } catch (e) {
      console.error('Error cargando liquidaciones soporte:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [sedeActiva]);

  const handleGenerarCorteSoporte = async (agente: any) => {
    try {
      await solicitarLiquidacionStaff({
        agenteId: agente.id,
        agenteNombre: agente.nombre,
        agenteRol: agente.rol || 'SOPORTE',
        periodoInicio,
        periodoFin,
        solicitadoPor: 'Administración / Finanzas',
        sedeId: sedeActiva?.id
      });
      showAlert(`¡Planilla/Corte generado para ${agente.nombre}!`, 'success');
      cargarDatos();
    } catch (err: any) {
      showAlert('Error al generar corte: ' + err.message, 'error');
    }
  };

  const liquidacionesFiltradas = liquidaciones.filter(l => {
    const cumpleEstado = filtroEstado === 'TODOS' || l.estado === filtroEstado;
    const cumpleBusqueda = !filtroBusqueda || 
      l.agente_nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      l.numero_correlativo.toLowerCase().includes(filtroBusqueda.toLowerCase());
    return cumpleEstado && cumpleBusqueda;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans p-2 md:p-4 animate-in fade-in">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Herramienta Delegable • Administración & Finanzas Central
          </span>
          <h1 className="text-xl font-black text-slate-800 dark:text-white mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" /> Liquidaciones de Personal de Soporte & Administración
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarDatos}
            title="Recargar datos"
            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid de Personal de Soporte */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-indigo-500" /> Personal de Soporte, Caja & Administración ({soporteList.length})
          </h3>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Período:</span>
            <input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
              className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs outline-none"
            />
            <span className="text-slate-400 font-semibold">al</span>
            <input
              type="date"
              value={periodoFin}
              onChange={(e) => setPeriodoFin(e.target.value)}
              className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {soporteList.map((sp) => (
            <div
              key={sp.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
            >
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  {sp.nombre}
                </h4>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {sp.rol} • {sp.email}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAgenteConfigSel(sp)}
                  title="Configurar Sueldo Fijo / Quincena"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerarCorteSoporte(sp)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Generar Pago
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de Liquidaciones Soporte */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">
            Historial de Pagos a Soporte ({liquidacionesFiltradas.length})
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                placeholder="Buscar colaborador..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {liquidacionesFiltradas.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No hay liquidaciones registradas para soporte.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">Correlativo</th>
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3 text-right">Sueldo Base</th>
                  <th className="px-4 py-3 text-right">Total Neto</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {liquidacionesFiltradas.map((liq) => (
                  <tr key={liq.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-200">
                      {liq.numero_correlativo}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                      {liq.agente_nombre}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-bold text-[10px]">
                      {liq.agente_rol}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                      {liq.periodo_inicio} al {liq.periodo_fin}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">
                      S/ {Number(liq.monto_sueldo_base).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      S/ {Number(liq.monto_total_neto).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${
                        liq.estado === 'PAGADO'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 animate-pulse'
                      }`}>
                        {liq.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLiquidacionDetalleSel(liq)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {liq.estado !== 'PAGADO' && (
                          <button
                            type="button"
                            onClick={() => setLiquidacionPagarSel(liq)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition shadow-xs cursor-pointer"
                          >
                            Pagar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modales */}
      {agenteConfigSel && (
        <ConfiguracionRemuneracionModal
          isOpen={Boolean(agenteConfigSel)}
          onClose={() => setAgenteConfigSel(null)}
          agente={agenteConfigSel}
          onConfiguracionGuardada={cargarDatos}
        />
      )}

      {liquidacionPagarSel && (
        <PagarLiquidacionModal
          isOpen={Boolean(liquidacionPagarSel)}
          onClose={() => setLiquidacionPagarSel(null)}
          liquidacion={liquidacionPagarSel}
          cuentas={cuentas}
          sedeId={sedeActiva?.id}
          onPagoCompletado={cargarDatos}
        />
      )}

      {liquidacionDetalleSel && (
        <DetalleLiquidacionModal
          isOpen={Boolean(liquidacionDetalleSel)}
          onClose={() => setLiquidacionDetalleSel(null)}
          liquidacion={liquidacionDetalleSel}
        />
      )}

    </div>
  );
}
