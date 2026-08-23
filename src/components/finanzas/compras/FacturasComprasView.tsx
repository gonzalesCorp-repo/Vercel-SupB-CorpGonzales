'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, CheckSquare, Plus, DollarSign, 
  AlertTriangle, Clock, CheckCircle2, ChevronLeft, ChevronRight,
  Filter, Search, Building2, CreditCard, ArrowDownCircle,
  ArrowUpCircle, RefreshCw, CheckCheck, HelpCircle
} from 'lucide-react';
import { FacturaCompra } from '@/types/facturasCompras';
import { CuentaFinanciera, MovimientoTesoreria } from '@/types/finanzas';
import { 
  obtenerFacturasCompras, 
  aceptarMovimientoEnCuadre,
  aceptarTodosEnCuadre 
} from '@/services/facturasCompras';
import { NuevaFacturaCompraModal } from './NuevaFacturaCompraModal';
import { PagarFacturaModal } from './PagarFacturaModal';
import { useUIStore } from '@/store/useUIStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  cuentas: CuentaFinanciera[];
  movimientos: MovimientoTesoreria[];
  sedeId?: string;
  adminNombre?: string;
  onMovimientoActualizado?: () => void;
}

export function FacturasComprasView({
  cuentas,
  movimientos,
  sedeId,
  adminNombre,
  onMovimientoActualizado
}: Props) {
  const [subTab, setSubTab] = useState<'LISTA' | 'CALENDARIO' | 'CUADRE'>('LISTA');
  const [facturas, setFacturas] = useState<FacturaCompra[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros de Lista
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  
  // Mes del Calendario
  const [mesActual, setMesActual] = useState(new Date());

  // Modales
  const [modalNuevaFacturaOpen, setModalNuevaFacturaOpen] = useState(false);
  const [modalPagarOpen, setModalPagarOpen] = useState(false);
  const [facturaSeleccionadaParaPagar, setFacturaSeleccionadaParaPagar] = useState<FacturaCompra | null>(null);

  const { showAlert } = useUIStore();

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await obtenerFacturasCompras({ sedeId });
      setFacturas(data);
    } catch (e) {
      console.error('Error cargando facturas compras:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [sedeId]);

  // Cálculos de KPI
  const totalPorPagar = facturas
    .filter(f => f.estado_pago !== 'PAGADO_TOTAL')
    .reduce((acc, f) => acc + Number(f.saldo_pendiente || 0), 0);

  const totalVencido = facturas
    .filter(f => f.estado_pago === 'VENCIDO' || (f.estado_pago !== 'PAGADO_TOTAL' && isPast(parseISO(f.fecha_vencimiento))))
    .reduce((acc, f) => acc + Number(f.saldo_pendiente || 0), 0);

  const totalPagado = facturas
    .reduce((acc, f) => acc + Number(f.monto_pagado || 0), 0);

  // Movimientos pendientes de cuadre del día
  const movimientosPendientesCuadre = movimientos.filter(m => !m.incluido_en_cuadre);

  // Filtrado de Facturas
  const facturasFiltradas = facturas.filter(f => {
    const cumpleEstado = filtroEstado === 'TODOS' || f.estado_pago === filtroEstado;
    const cumpleBusqueda = !busqueda || 
      f.proveedor_razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.proveedor_ruc.includes(busqueda) ||
      `${f.serie}-${f.numero}`.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleEstado && cumpleBusqueda;
  });

  const handleAbrirPagar = (f: FacturaCompra) => {
    setFacturaSeleccionadaParaPagar(f);
    setModalPagarOpen(true);
  };

  const handleAceptarCuadre = async (movId: string) => {
    try {
      await aceptarMovimientoEnCuadre(movId, adminNombre || 'Administrador');
      showAlert('Movimiento aceptado e incluido en el cuadre del día.', 'success');
      if (onMovimientoActualizado) onMovimientoActualizado();
    } catch (e: any) {
      showAlert('Error al aceptar movimiento: ' + e.message, 'error');
    }
  };

  const handleAceptarTodosCuadre = async () => {
    const ids = movimientosPendientesCuadre.map(m => m.id);
    if (ids.length === 0) return;
    try {
      await aceptarTodosEnCuadre(ids, adminNombre || 'Administrador');
      showAlert(`¡${ids.length} movimientos consolidados en el cuadre del día!`, 'success');
      if (onMovimientoActualizado) onMovimientoActualizado();
    } catch (e: any) {
      showAlert('Error: ' + e.message, 'error');
    }
  };

  // Días del calendario
  const diasDelMes = eachDayOfInterval({
    start: startOfMonth(mesActual),
    end: endOfMonth(mesActual)
  });

  return (
    <div className="space-y-5 animate-in fade-in">
      
      {/* KPI Cards de Cuentas por Pagar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Total por Pagar (AP)</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            S/ {totalPorPagar.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Facturas a 15, 30, 45 y 60 días
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Facturas Vencidas</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            S/ {totalVencido.toFixed(2)}
          </p>
          <span className="text-[10px] text-rose-600/80 font-bold">
            {totalVencido > 0 ? 'Requieren atención urgente' : 'Todo al día'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Total Liquidado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            S/ {totalPagado.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Abonos realizados a proveedores
          </span>
        </div>
      </div>

      {/* Sub-Tabs Selector & Acción Nueva Factura */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('LISTA')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'LISTA'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Facturas de Compras ({facturas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('CALENDARIO')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'CALENDARIO'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario de Pagos</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('CUADRE')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'CUADRE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Bandeja Cuadre del Día</span>
            {movimientosPendientesCuadre.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {movimientosPendientesCuadre.length}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setModalNuevaFacturaOpen(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>➕ Nueva Factura de Compra</span>
        </button>
      </div>

      {/* CONTENIDO DE SUB-TAB 1: LISTA DE FACTURAS */}
      {subTab === 'LISTA' && (
        <div className="space-y-4">
          
          {/* Filtros */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por proveedor, RUC o serie-número..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['TODOS', 'PENDIENTE', 'PAGADO_PARCIAL', 'VENCIDO', 'PAGADO_TOTAL'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFiltroEstado(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filtroEstado === st
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {st === 'TODOS' ? 'Todas' : st === 'PENDIENTE' ? 'Pendientes' : st === 'PAGADO_PARCIAL' ? 'Parciales' : st === 'VENCIDO' ? 'Vencidas' : 'Pagadas'}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Facturas */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 text-[10px] uppercase font-black">
                  <th className="px-4 py-3.5">Proveedor & RUC</th>
                  <th className="px-4 py-3.5">Comprobante</th>
                  <th className="px-4 py-3.5">Condición & Vencimiento</th>
                  <th className="px-4 py-3.5 text-right">Total Factura</th>
                  <th className="px-4 py-3.5 text-right">Saldo Pendiente</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-4 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {facturasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No hay facturas registradas con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  facturasFiltradas.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <strong className="text-slate-800 dark:text-slate-100 block">{f.proveedor_razon_social}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">RUC: {f.proveedor_ruc}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-indigo-600 font-bold">{f.tipo_comprobante}</span>
                        <span className="text-slate-600 dark:text-slate-300 block font-mono">#{f.serie}-{f.numero}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {f.condicion_pago.replace('CREDITO_', 'Crédito ')}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Vence: <strong>{f.fecha_vencimiento}</strong></span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        S/ {Number(f.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-rose-600">
                        S/ {Number(f.saldo_pendiente).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          f.estado_pago === 'PAGADO_TOTAL'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : f.estado_pago === 'VENCIDO'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {f.estado_pago === 'PAGADO_TOTAL' ? 'Pagado' : f.estado_pago === 'VENCIDO' ? 'Vencido' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {f.estado_pago !== 'PAGADO_TOTAL' && (
                          <button
                            type="button"
                            onClick={() => handleAbrirPagar(f)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                          >
                            💳 Pagar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO DE SUB-TAB 2: CALENDARIO DE PAGOS */}
      {subTab === 'CALENDARIO' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          {/* Header Calendario */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-white capitalize flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              {format(mesActual, 'MMMM yyyy', { locale: es })}
            </h3>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMesActual(new Date())}
                className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid de Días */}
          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase text-slate-400 py-1">
                {d}
              </div>
            ))}

            {diasDelMes.map(dia => {
              const strDia = format(dia, 'yyyy-MM-dd');
              const facturasDia = facturas.filter(f => f.fecha_vencimiento === strDia && f.estado_pago !== 'PAGADO_TOTAL');
              const totalDia = facturasDia.reduce((acc, f) => acc + Number(f.saldo_pendiente || 0), 0);
              const esHoy = isSameDay(dia, new Date());

              return (
                <div
                  key={strDia}
                  className={`min-h-[85px] p-2 rounded-2xl border flex flex-col justify-between transition ${
                    esHoy 
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' 
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${esHoy ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-600 dark:text-slate-400'}`}>
                      {format(dia, 'd')}
                    </span>
                    {facturasDia.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </div>

                  {totalDia > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                      <span className="block text-[9px] uppercase">{facturasDia.length} factura(s)</span>
                      <strong>S/ {totalDia.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* CONTENIDO DE SUB-TAB 3: BANDEJA DE CUADRE DEL DÍA */}
      {subTab === 'CUADRE' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-4 rounded-3xl border border-amber-200 dark:border-amber-800">
            <div>
              <h3 className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" /> Bandeja de Aprobación para el Cuadre del Día
              </h3>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400">
                Los movimientos deben ser aceptados para consolidarse en el balance y arqueo diario de caja.
              </p>
            </div>

            {movimientosPendientesCuadre.length > 0 && (
              <button
                type="button"
                onClick={handleAceptarTodosCuadre}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>✓ Aceptar Todos ({movimientosPendientesCuadre.length})</span>
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 text-[10px] uppercase font-black">
                  <th className="px-4 py-3">Tipo & Fecha</th>
                  <th className="px-4 py-3">Concepto & Beneficiario</th>
                  <th className="px-4 py-3">Cuenta Financiera</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3 text-center">Estado Cuadre</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      No hay movimientos registrados en la jornada.
                    </td>
                  </tr>
                ) : (
                  movimientos.map(m => {
                    const isIngreso = m.tipo_movimiento === 'INGRESO';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full ${
                            isIngreso 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {isIngreso ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                            {m.tipo_movimiento}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{m.fecha_movimiento}</span>
                        </td>
                        <td className="px-4 py-3">
                          <strong className="text-slate-800 dark:text-slate-100 block">{m.descripcion}</strong>
                          <span className="text-[10px] text-slate-400">{m.beneficiario_nombre || 'Interno'}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">
                          {m.cuenta_nombre || 'Caja Chica'}
                        </td>
                        <td className={`px-4 py-3 text-right font-black ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIngreso ? '+' : '-'} S/ {Number(m.monto).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {m.incluido_en_cuadre ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                              ✓ Consolidado en Cuadre
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                              ⏳ Pendiente de Aceptación
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!m.incluido_en_cuadre && (
                            <button
                              type="button"
                              onClick={() => handleAceptarCuadre(m.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl transition cursor-pointer"
                            >
                              ✓ Aceptar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MODALES */}
      {modalNuevaFacturaOpen && (
        <NuevaFacturaCompraModal
          isOpen={modalNuevaFacturaOpen}
          onClose={() => setModalNuevaFacturaOpen(false)}
          cuentas={cuentas}
          sedeId={sedeId}
          adminNombre={adminNombre}
          onFacturaCreada={cargar}
        />
      )}

      {modalPagarOpen && facturaSeleccionadaParaPagar && (
        <PagarFacturaModal
          isOpen={modalPagarOpen}
          onClose={() => {
            setModalPagarOpen(false);
            setFacturaSeleccionadaParaPagar(null);
          }}
          factura={facturaSeleccionadaParaPagar}
          cuentas={cuentas}
          sedeId={sedeId}
          adminNombre={adminNombre}
          onPagoCompletado={() => {
            cargar();
            if (onMovimientoActualizado) onMovimientoActualizado();
          }}
        />
      )}

    </div>
  );
}
