'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Users, CreditCard, Receipt, Search, Plus, 
  CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft, 
  Clock, ShieldCheck, Printer, RefreshCw, X 
} from 'lucide-react';
import { 
  obtenerResumenCuentasPorCobrar, 
  registrarAbonoDeuda, 
  ClienteCuentaCorriente 
} from '@/services/cuentasCorrientes';
import { useUIStore } from '@/store/useUIStore';
import { TipoComprobanteFiscal } from '@/services/sunatPSE';
import { imprimirTicketTermicoHtml } from '@/lib/hardware/thermalPrinter';

export default function CuentasPorCobrarPage() {
  const [clientes, setClientes] = useState<ClienteCuentaCorriente[]>([]);
  const [totalPorCobrar, setTotalPorCobrar] = useState(0);
  const [clientesConDeuda, setClientesConDeuda] = useState(0);
  const [totalAbonosMes, setTotalAbonosMes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'SALDO_PENDIENTE' | 'LIMITE_EXCEDIDO' | 'AL_DIA'>('TODOS');

  // Modal de Abono
  const [modalAbonoOpen, setModalAbonoOpen] = useState(false);
  const [clienteAbonar, setClienteAbonar] = useState<ClienteCuentaCorriente | null>(null);
  const [montoAbono, setMontoAbono] = useState<number>(0);
  const [metodoPagoAbono, setMetodoPagoAbono] = useState<string>('EFECTIVO');
  const [emitirComprobante, setEmitirComprobante] = useState<boolean>(true);
  const [tipoCompAbono, setTipoCompAbono] = useState<TipoComprobanteFiscal>('BOLETA');
  const [isProcessingAbono, setIsProcessingAbono] = useState(false);

  const { showAlert } = useUIStore();

  const cargarDatos = async () => {
    setLoading(true);
    const res = await obtenerResumenCuentasPorCobrar();
    setClientes(res.clientes);
    setTotalPorCobrar(res.totalPorCobrar);
    setClientesConDeuda(res.clientesConDeuda);
    setTotalAbonosMes(res.totalAbonosMes);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAbrirAbono = (cli: ClienteCuentaCorriente) => {
    setClienteAbonar(cli);
    setMontoAbono(cli.saldo_deudor);
    setMetodoPagoAbono('EFECTIVO');
    setEmitirComprobante(true);
    setTipoCompAbono(cli.cliente_doc.length === 11 ? 'FACTURA' : 'BOLETA');
    setModalAbonoOpen(true);
  };

  const handleConfirmarAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteAbonar || montoAbono <= 0) return;

    setIsProcessingAbono(true);
    try {
      const res = await registrarAbonoDeuda({
        clienteId: clienteAbonar.cliente_id,
        clienteNombre: clienteAbonar.cliente_nombre,
        clienteDoc: clienteAbonar.cliente_doc,
        montoAbono,
        metodoPago: metodoPagoAbono,
        emitirComprobante,
        tipoComprobante: tipoCompAbono
      });

      if (res.ok) {
        showAlert(`¡Abono de S/ ${montoAbono.toFixed(2)} registrado con éxito! ${res.comprobanteNumero ? `(CPE: ${res.comprobanteNumero})` : ''}`, 'success');
        
        if (emitirComprobante && res.comprobanteNumero) {
          imprimirTicketTermicoHtml({
            tipo: 'COMPROBANTE_SUNAT',
            numeroDocumento: res.comprobanteNumero,
            clienteNombre: clienteAbonar.cliente_nombre,
            clienteDniRuc: clienteAbonar.cliente_doc,
            colaboradorNombre: 'Cajero POS',
            items: [{
              nombre: 'Abono / Liquidación Cuenta Corriente',
              cantidad: 1,
              precioUnitario: montoAbono,
              subtotal: montoAbono
            }],
            total: montoAbono,
            metodoPago: metodoPagoAbono,
            mensajePie: `Liquidación de Crédito | Saldo Restante: S/ ${res.nuevoSaldo.toFixed(2)}`
          }, 80);
        }

        setModalAbonoOpen(false);
        cargarDatos();
      } else {
        showAlert(res.error || 'Error al procesar abono', 'error');
      }
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    } finally {
      setIsProcessingAbono(false);
    }
  };

  const filtrados = clientes.filter(c => {
    const matchTexto = !filtroTexto || 
      c.cliente_nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      c.cliente_doc.includes(filtroTexto);
    const matchEstado = filtroEstado === 'TODOS' || c.estado_credito === filtroEstado;
    return matchTexto && matchEstado;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-in fade-in">
      
      {/* Header & KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 shadow-inner">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                Cuentas por Cobrar & Créditos
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  Cuentas Corrientes
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control de clientes deudores, líneas de crédito y liquidaciones con emisión fiscal SUNAT.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={cargarDatos}
          className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-2xl transition cursor-pointer self-start md:self-auto"
          title="Recargar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total por Cobrar (Deuda Total)</span>
          <p className="text-2xl font-black font-mono text-rose-500">
            S/ {totalPorCobrar.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400">Distribuido en {clientesConDeuda} clientes</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Clientes con Saldo Deudor</span>
          <p className="text-2xl font-black font-mono text-amber-500">
            {clientesConDeuda} <span className="text-xs font-sans font-bold text-slate-400">clientes</span>
          </p>
          <p className="text-[10px] text-slate-400">Con créditos activos en el ERP</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Abonos Recaudados este Mes</span>
          <p className="text-2xl font-black font-mono text-emerald-500">
            S/ {totalAbonosMes.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400">Liquidaciones cobradas en caja</p>
        </div>
      </div>

      {/* Filtros & Tabla de Cuentas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por cliente o DNI/RUC..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['TODOS', 'SALDO_PENDIENTE', 'LIMITE_EXCEDIDO', 'AL_DIA'] as const).map((est) => (
              <button
                key={est}
                type="button"
                onClick={() => setFiltroEstado(est)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${
                  filtroEstado === est
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {est === 'TODOS' ? 'Todos' : est === 'SALDO_PENDIENTE' ? 'Con Saldo' : est === 'LIMITE_EXCEDIDO' ? 'Excedidos' : 'Al Día'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-[10px] uppercase">
                <th className="pb-2.5">Cliente / Documento</th>
                <th className="pb-2.5">Contacto</th>
                <th className="pb-2.5 text-center">Límite Crédito</th>
                <th className="pb-2.5 text-center">Saldo Deudor</th>
                <th className="pb-2.5 text-center">Estado</th>
                <th className="pb-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 animate-pulse">
                    Cargando cuentas corrientes...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron clientes con el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filtrados.map((cli) => (
                  <tr key={cli.cliente_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{cli.cliente_nombre}</p>
                      <p className="text-[10px] font-mono text-slate-400">{cli.cliente_doc}</p>
                    </td>

                    <td className="py-3 text-slate-500">
                      {cli.cliente_telefono || '-'}
                    </td>

                    <td className="py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      S/ {cli.limite_credito.toFixed(2)}
                    </td>

                    <td className="py-3 text-center font-mono font-black text-rose-500">
                      {cli.saldo_deudor > 0 ? `S/ ${cli.saldo_deudor.toFixed(2)}` : 'S/ 0.00'}
                    </td>

                    <td className="py-3 text-center">
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                        cli.estado_credito === 'SALDO_PENDIENTE'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                          : cli.estado_credito === 'LIMITE_EXCEDIDO'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {cli.estado_credito === 'SALDO_PENDIENTE' ? 'Pendiente' :
                         cli.estado_credito === 'LIMITE_EXCEDIDO' ? 'Excedido' : 'Al Día'}
                      </span>
                    </td>

                    <td className="py-3 text-right">
                      {cli.saldo_deudor > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleAbrirAbono(cli)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                          Abonar Deuda →
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">Sin deuda</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Registrar Abono con Emisión Fiscal */}
      {modalAbonoOpen && clienteAbonar && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleConfirmarAbono} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black text-white">Registrar Abono / Liquidación</h3>
                  <p className="text-[10px] text-slate-400">Cliente: {clienteAbonar.cliente_nombre}</p>
                </div>
              </div>
              <button type="button" onClick={() => setModalAbonoOpen(false)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resumen Deuda */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo Pendiente:</span>
                <span className="text-xl font-black font-mono text-rose-500">S/ {clienteAbonar.saldo_deudor.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => setMontoAbono(clienteAbonar.saldo_deudor)}
                className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-500/30"
              >
                Pagar Todo
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Monto a Abonar (S/):</label>
              <input
                type="number"
                value={montoAbono}
                onChange={(e) => setMontoAbono(Math.max(1, Number(e.target.value)))}
                min={1}
                max={clienteAbonar.saldo_deudor}
                step={0.5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm font-mono font-black text-emerald-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Medio de Pago:</label>
                <select
                  value={metodoPagoAbono}
                  onChange={(e) => setMetodoPagoAbono(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-white"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta POS</option>
                  <option value="YAPE">Yape / Plin</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Comprobante Fiscal:</label>
                <select
                  value={tipoCompAbono}
                  onChange={(e) => setTipoCompAbono(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-white"
                >
                  <option value="BOLETA">Boleta Electrónica</option>
                  <option value="FACTURA">Factura Electrónica</option>
                  <option value="NOTA_VENTA">Nota de Venta</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Emitir Comprobante SUNAT PSE al liquidar</label>
              <input
                type="checkbox"
                checked={emitirComprobante}
                onChange={(e) => setEmitirComprobante(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setModalAbonoOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProcessingAbono || montoAbono <= 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isProcessingAbono ? 'Procesando...' : 'Confirmar Abono & Liquidar'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
