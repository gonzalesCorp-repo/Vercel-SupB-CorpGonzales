'use client';

import React, { useState, useEffect } from 'react';
import { 
  Landmark, Wallet, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, 
  Plus, Users, Award, ShieldAlert, CheckCircle2, Clock, Printer, 
  FileText, Search, RefreshCw, DollarSign, CreditCard, ChevronRight,
  TrendingUp, TrendingDown, Layers, Building2, HelpCircle
} from 'lucide-react';
import { 
  CuentaFinanciera, 
  MovimientoTesoreria, 
  TipoMovimientoTesoreria 
} from '@/types/finanzas';
import { 
  obtenerCuentasFinancieras, 
  obtenerMovimientosTesoreria, 
  aprobarRechazarEgreso 
} from '@/services/finanzas';
import { obtenerTodosLosAgentes } from '@/services/agentes';
import { imprimirReciboEgresoFinanzas } from '@/services/impresionTermica';
import { NuevaCuentaModal } from './NuevaCuentaModal';
import { NuevoMovimientoModal } from './NuevoMovimientoModal';
import { TransferenciaModal } from './TransferenciaModal';
import { LiquidarStaffModal } from './LiquidarStaffModal';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function FinanzasDashboardView() {
  const [tabActiva, setTabActiva] = useState<'CUENTAS' | 'MOVIMIENTOS' | 'LIQUIDACIONES' | 'TRANSFERENCIAS'>('CUENTAS');
  const [cuentas, setCuentas] = useState<CuentaFinanciera[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoTesoreria[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');

  // Modales
  const [modalNuevaCuentaOpen, setModalNuevaCuentaOpen] = useState(false);
  const [modalNuevoMovimientoOpen, setModalNuevoMovimientoOpen] = useState(false);
  const [modalTransferenciaOpen, setModalTransferenciaOpen] = useState(false);
  const [modalLiquidarStaffOpen, setModalLiquidarStaffOpen] = useState(false);

  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [listaCuentas, listaMovs, listaAgentes] = await Promise.all([
        obtenerCuentasFinancieras(sedeActiva?.id),
        obtenerMovimientosTesoreria({ sedeId: sedeActiva?.id }),
        obtenerTodosLosAgentes()
      ]);

      setCuentas(listaCuentas || []);
      setMovimientos(listaMovs || []);
      setStaffList((listaAgentes || []).filter((a: any) => a.estado === 'ACTIVO'));
    } catch (e) {
      console.error('Error cargando finanzas:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [sedeActiva]);

  // Cálculos Consolidados
  const saldoTotalConsolidado = cuentas.reduce((acc, c) => acc + Number(c.saldo_actual || 0), 0);
  const totalIngresos = movimientos
    .filter(m => m.tipo_movimiento === 'INGRESO' && m.estado_aprobacion !== 'RECHAZADO')
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);
  const totalEgresos = movimientos
    .filter(m => m.tipo_movimiento === 'EGRESO' && m.estado_aprobacion === 'APROBADO')
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);
  const egresosPendientes = movimientos.filter(m => m.estado_aprobacion === 'PENDIENTE_SUPERADMIN');

  // Filtrado de Movimientos
  const movimientosFiltrados = movimientos.filter(m => {
    const cumpleTipo = filtroTipo === 'TODOS' || m.tipo_movimiento === filtroTipo;
    const cumpleBusqueda = !filtroBusqueda || 
      m.descripcion.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      (m.beneficiario_nombre && m.beneficiario_nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())) ||
      (m.cuenta_nombre && m.cuenta_nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()));
    return cumpleTipo && cumpleBusqueda;
  });

  const handleAprobarEgreso = async (movId: string, decision: 'APROBADO' | 'RECHAZADO') => {
    try {
      await aprobarRechazarEgreso(movId, decision, 'Superadmin');
      showAlert(`Movimiento ${decision === 'APROBADO' ? 'aprobado' : 'rechazado'} con éxito.`, 'success');
      cargarDatos();
    } catch (err: any) {
      showAlert('Error al procesar: ' + err.message, 'error');
    }
  };

  const handleReimprimirVoucher = async (mov: MovimientoTesoreria) => {
    try {
      await imprimirReciboEgresoFinanzas({
        numeroEgreso: mov.id,
        categoria: mov.categoria,
        concepto: mov.descripcion,
        beneficiario: mov.beneficiario_nombre || 'Personal / Proveedor',
        monto: Number(mov.monto),
        cuentaNombre: mov.cuenta_nombre || 'Caja Chica',
        registradoPor: mov.registrado_por,
        autorizadoPor: mov.autorizado_por
      });
      showAlert('¡Voucher enviado a la impresora térmica!', 'success');
    } catch (e: any) {
      showAlert('Error al imprimir voucher: ' + e.message, 'error');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans p-2 md:p-4 animate-in fade-in">
      
      {/* Header Bar de Finanzas */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Control de Tesorería & Caja y Bancos
          </span>
          <h1 className="text-xl font-black text-slate-800 dark:text-white mt-1 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-600" /> Finanzas, Caja Chica & Bancos
          </h1>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setModalNuevoMovimientoOpen(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>➕ Nuevo Gasto / Ingreso</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTransferenciaOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-2xl transition border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>🔄 Transferir Fondos</span>
          </button>

          <button
            type="button"
            onClick={() => setModalLiquidarStaffOpen(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-xs font-bold rounded-2xl transition border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>👥 Liquidar Staff</span>
          </button>

          <button
            type="button"
            onClick={cargarDatos}
            title="Recargar datos"
            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards de Tesorería */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Total Consolidado */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Saldo Consolidado</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            S/ {saldoTotalConsolidado.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            En {cuentas.length} cuentas activas
          </span>
        </div>

        {/* Total Ingresos No-Venta */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Ingresos / Fondos</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            S/ {totalIngresos.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Reposiciones y aportes
          </span>
        </div>

        {/* Total Egresos */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Egresos & Gastos</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            S/ {totalEgresos.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Caja chica y pagos
          </span>
        </div>

        {/* Egresos Pendientes de Aprobación */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Por Aprobar (&gt; S/200)</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {egresosPendientes.length}
          </p>
          <span className="text-[10px] text-amber-600/80 font-bold">
            {egresosPendientes.length > 0 ? 'Requieren Superadmin' : 'Todo al día'}
          </span>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTabActiva('CUENTAS')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            tabActiva === 'CUENTAS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Cuentas & Bancos ({cuentas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('MOVIMIENTOS')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            tabActiva === 'MOVIMIENTOS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Movimientos & Caja Chica ({movimientos.length})</span>
          {egresosPendientes.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {egresosPendientes.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('LIQUIDACIONES')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            tabActiva === 'LIQUIDACIONES'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Liquidaciones Staff WFM</span>
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}

      {/* TAB 1: CUENTAS & BANCOS */}
      {tabActiva === 'CUENTAS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              Cuentas Financieras Configuradas
            </h3>
            <button
              type="button"
              onClick={() => setModalNuevaCuentaOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cuenta / Caja</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cuentas.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl text-indigo-600 dark:text-indigo-400">
                      {c.tipo_cuenta === 'CAJA_CHICA' && <Wallet className="w-5 h-5" />}
                      {c.tipo_cuenta === 'BANCO' && <Landmark className="w-5 h-5" />}
                      {c.tipo_cuenta === 'BILLETERA_DIGITAL' && <DollarSign className="w-5 h-5" />}
                      {c.tipo_cuenta === 'PASARELA_POS' && <CreditCard className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {c.nombre}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold block">
                        {c.banco_entidad} • {c.tipo_cuenta}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full">
                    {c.estado}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                    Saldo Disponible
                  </span>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    S/ {Number(c.saldo_actual).toFixed(2)}
                  </p>
                </div>

                {c.numero_cuenta && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono">
                    N°: {c.numero_cuenta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MOVIMIENTOS & CAJA CHICA */}
      {tabActiva === 'MOVIMIENTOS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3">
          
          {/* Barra de Filtros */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  placeholder="Buscar por concepto o beneficiario..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
              >
                <option value="TODOS">Todos los Tipos</option>
                <option value="EGRESO">Solo Egresos</option>
                <option value="INGRESO">Solo Ingresos</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setModalNuevoMovimientoOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Gasto / Ingreso</span>
            </button>
          </div>

          {/* Tabla de Movimientos */}
          <div className="overflow-x-auto">
            {movimientosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No hay movimientos registrados con los filtros aplicados.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Tipo & Categoría</th>
                    <th className="px-4 py-3">Concepto / Beneficiario</th>
                    <th className="px-4 py-3">Cuenta</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {movimientosFiltrados.map((mov) => {
                    const isEgreso = mov.tipo_movimiento === 'EGRESO';
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {format(new Date(mov.fecha_movimiento), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {isEgreso ? (
                              <ArrowDownCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            ) : (
                              <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {mov.categoria}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 dark:text-slate-100">{mov.descripcion}</div>
                          {mov.beneficiario_nombre && (
                            <span className="text-[10px] text-slate-400">Benef: {mov.beneficiario_nombre}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                          {mov.cuenta_nombre}
                        </td>
                        <td className={`px-4 py-3 text-right font-black ${isEgreso ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isEgreso ? '-' : '+'} S/ {Number(mov.monto).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {mov.estado_aprobacion === 'APROBADO' ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] rounded-full border border-emerald-200 dark:border-emerald-800">
                              Aprobado
                            </span>
                          ) : mov.estado_aprobacion === 'PENDIENTE_SUPERADMIN' ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                              Por Aprobar
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px] rounded-full border border-rose-200 dark:border-rose-800">
                              Rechazado
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {mov.estado_aprobacion === 'PENDIENTE_SUPERADMIN' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAprobarEgreso(mov.id, 'APROBADO')}
                                  className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold"
                                  title="Aprobar Egreso Mayor"
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAprobarEgreso(mov.id, 'RECHAZADO')}
                                  className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[10px] font-bold"
                                  title="Rechazar Egreso"
                                >
                                  ✕
                                </button>
                              </>
                            )}

                            {isEgreso && (
                              <button
                                type="button"
                                onClick={() => handleReimprimirVoucher(mov)}
                                title="Reimprimir Voucher Térmico"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LIQUIDACIONES STAFF & WFM */}
      {tabActiva === 'LIQUIDACIONES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              Colaboradores Disponibles para Liquidación
            </h3>
            <button
              type="button"
              onClick={() => setModalLiquidarStaffOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Liquidar a Especialista</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {staffList.map((st) => (
              <div
                key={st.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                    {st.nombre.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {st.nombre}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      {st.rol || 'STAFF'} • {st.especialidad || 'Estilista'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalLiquidarStaffOpen(true)}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl transition border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                >
                  Pagar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALES */}
      {modalNuevaCuentaOpen && (
        <NuevaCuentaModal
          isOpen={modalNuevaCuentaOpen}
          onClose={() => setModalNuevaCuentaOpen(false)}
          sedeId={sedeActiva?.id}
          onCuentaCreada={cargarDatos}
        />
      )}

      {modalNuevoMovimientoOpen && (
        <NuevoMovimientoModal
          isOpen={modalNuevoMovimientoOpen}
          onClose={() => setModalNuevoMovimientoOpen(false)}
          cuentas={cuentas}
          sedeId={sedeActiva?.id}
          onMovimientoRegistrado={cargarDatos}
        />
      )}

      {modalTransferenciaOpen && (
        <TransferenciaModal
          isOpen={modalTransferenciaOpen}
          onClose={() => setModalTransferenciaOpen(false)}
          cuentas={cuentas}
          sedeId={sedeActiva?.id}
          onTransferenciaRealizada={cargarDatos}
        />
      )}

      {modalLiquidarStaffOpen && (
        <LiquidarStaffModal
          isOpen={modalLiquidarStaffOpen}
          onClose={() => setModalLiquidarStaffOpen(false)}
          staffList={staffList}
          cuentas={cuentas}
          sedeId={sedeActiva?.id}
          onLiquidacionCompletada={cargarDatos}
        />
      )}

    </div>
  );
}
