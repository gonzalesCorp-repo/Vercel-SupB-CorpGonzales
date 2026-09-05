'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Wallet, ArrowDownCircle, ArrowUpCircle, Award, 
  Printer, CheckCircle2, Clock, ShieldAlert, Plus, 
  DollarSign, RefreshCw, HelpCircle, FileText, ChevronRight 
} from 'lucide-react';
import { CuentaFinanciera, MovimientoTesoreria } from '@/types/finanzas';
import { 
  obtenerCuentasFinancieras, 
  obtenerMovimientosTesoreria, 
  registrarMovimientoTesoreria 
} from '@/services/finanzas';
import { imprimirReciboEgresoFinanzas } from '@/services/impresionTermica';
import { useUIStore } from '@/store/useUIStore';
import Link from 'next/link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sedeId?: string;
  cajeroNombre?: string;
  onOperacionCompletada?: () => void;
}

export function OperacionesCajaDrawer({
  isOpen,
  onClose,
  sedeId,
  cajeroNombre,
  onOperacionCompletada
}: Props) {
  const [cuentaCajaChica, setCuentaCajaChica] = useState<CuentaFinanciera | null>(null);
  const [movimientosTurno, setMovimientosTurno] = useState<MovimientoTesoreria[]>([]);
  const [cargando, setCargando] = useState(true);

  // Formulario rápido
  const [modoForm, setModoForm] = useState<'NINGUNO' | 'GASTO' | 'INGRESO'>('NINGUNO');
  const [monto, setMonto] = useState<number>(0);
  const [concepto, setConcepto] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [categoria, setCategoria] = useState<string>('CAJA_CHICA_OPERATIVO');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [guardando, setGuardando] = useState(false);

  const { showAlert } = useUIStore();

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [cuentas, movs] = await Promise.all([
        obtenerCuentasFinancieras(sedeId),
        obtenerMovimientosTesoreria({ sedeId })
      ]);

      // Buscar cuenta de caja chica
      const cc = cuentas.find(c => c.tipo_cuenta === 'CAJA_CHICA') || cuentas[0] || null;
      setCuentaCajaChica(cc);
      setMovimientosTurno(movs || []);
    } catch (e) {
      console.error('Error cargando datos de operaciones de caja:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
      setModoForm('NINGUNO');
      setMonto(0);
      setConcepto('');
      setBeneficiario('');
    }
  }, [isOpen, sedeId]);

  if (!isOpen) return null;

  const handleGuardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaCajaChica || monto <= 0 || !concepto.trim()) {
      showAlert('Por favor completa el monto y concepto de la operación.', 'error');
      return;
    }

    setGuardando(true);
    try {
      const esGasto = modoForm === 'GASTO';
      await registrarMovimientoTesoreria({
        cuentaId: cuentaCajaChica.id,
        tipoMovimiento: esGasto ? 'EGRESO' : 'INGRESO',
        categoria: esGasto ? (categoria as any) : 'REPOSICION_FONDO',
        monto,
        descripcion: concepto.trim(),
        beneficiarioNombre: beneficiario.trim() || undefined,
        comprobanteAdjuntoUrl: comprobanteUrl.trim() || undefined,
        registradoPor: cajeroNombre || 'Cajero POS',
        sedeId
      });

      showAlert(`¡${esGasto ? 'Gasto' : 'Ingreso'} de S/ ${monto.toFixed(2)} registrado con éxito!`, 'success');
      setModoForm('NINGUNO');
      setMonto(0);
      setConcepto('');
      setBeneficiario('');
      await cargarDatos();
      if (onOperacionCompletada) onOperacionCompletada();
    } catch (err: any) {
      showAlert('Error al registrar: ' + err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleReimprimir = async (mov: MovimientoTesoreria) => {
    try {
      await imprimirReciboEgresoFinanzas({
        numeroEgreso: mov.id,
        categoria: mov.categoria,
        concepto: mov.descripcion,
        beneficiario: mov.beneficiario_nombre || 'Proveedor / Personal',
        monto: Number(mov.monto),
        cuentaNombre: cuentaCajaChica?.nombre || 'Caja Chica',
        registradoPor: mov.registrado_por,
        autorizadoPor: mov.autorizado_por
      });
      showAlert('¡Voucher enviado a la impresora térmica!', 'success');
    } catch (e: any) {
      showAlert('Error al imprimir voucher: ' + e.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          
          {/* Header Drawer */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Operaciones Diarias de Caja
                </h2>
                <p className="text-[11px] text-slate-500">
                  Gastos menores, compras urgentes e ingresos del turno.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Scrollable */}
          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            
            {/* Card Saldo Caja Chica */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-4 rounded-3xl text-white shadow-lg shadow-indigo-500/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 block">
                  {cuentaCajaChica?.nombre || 'Caja Chica Mostrador'}
                </span>
                <p className="text-2xl font-black mt-0.5">
                  S/ {Number(cuentaCajaChica?.saldo_actual || 0).toFixed(2)}
                </p>
                <span className="text-[10px] text-indigo-200 font-medium">
                  Saldo disponible para operaciones inmediatas
                </span>
              </div>
              <button
                type="button"
                onClick={cargarDatos}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-2xl transition"
                title="Recargar saldo"
              >
                <RefreshCw className={`w-4 h-4 text-white ${cargando ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Botones de Acción Rápida */}
            {modoForm === 'NINGUNO' ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setModoForm('GASTO');
                    setCategoria('CAJA_CHICA_OPERATIVO');
                  }}
                  className="p-3.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl text-left transition flex flex-col justify-between cursor-pointer"
                >
                  <ArrowDownCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mb-1.5" />
                  <div>
                    <strong className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                      ➕ Gasto Menor
                    </strong>
                    <span className="text-[10px] text-rose-700/80 dark:text-rose-400">
                      Hielo, limpieza, delivery, pasajes
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModoForm('INGRESO');
                    setCategoria('REPOSICION_FONDO');
                  }}
                  className="p-3.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-left transition flex flex-col justify-between cursor-pointer"
                >
                  <ArrowUpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1.5" />
                  <div>
                    <strong className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                      💵 Ingreso No-Venta
                    </strong>
                    <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
                      Reposición, vuelto o aporte
                    </span>
                  </div>
                </button>

                {/* Enlace Delegado a Liquidaciones Staff */}
                <Link
                  href="/finanzas/liquidaciones-staff"
                  onClick={onClose}
                  className="col-span-2 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-800 dark:text-white block">
                        👥 Liquidar Staff de Piso
                      </strong>
                      <span className="text-[10px] text-slate-400">
                        Herramienta delegada para liquidación de estilistas
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            ) : (
              /* Formulario Rápido de Registro */
              <form onSubmit={handleGuardarMovimiento} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${modoForm === 'GASTO' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {modoForm === 'GASTO' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                    {modoForm === 'GASTO' ? 'Registrar Gasto de Caja Chica' : 'Registrar Ingreso a Caja Chica'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModoForm('NINGUNO')}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div>
                  <label htmlFor="op-caja-monto" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Monto (S/)
                  </label>
                  <input
                    id="op-caja-monto"
                    name="monto"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={monto || ''}
                    onChange={(e) => setMonto(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="op-caja-concepto" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Concepto / Motivo
                  </label>
                  <input
                    id="op-caja-concepto"
                    name="concepto"
                    type="text"
                    required
                    placeholder="Ej. Compra de 2 bolsas de hielo"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="op-caja-beneficiario" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Beneficiario / Proveedor (Opcional)
                  </label>
                  <input
                    id="op-caja-beneficiario"
                    name="beneficiario"
                    type="text"
                    placeholder="Ej. Bodega Don Lucho / Taxi"
                    value={beneficiario}
                    onChange={(e) => setBeneficiario(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModoForm('NINGUNO')}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
                  >
                    Volver
                  </button>

                  <button
                    type="submit"
                    disabled={guardando}
                    className={`px-4 py-1.5 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 ${
                      modoForm === 'GASTO' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {guardando ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Movimientos del Turno */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Movimientos del Turno ({movimientosTurno.length})
                </span>
                <span className="text-[10px] text-indigo-600 font-bold">
                  Bandeja Cuadre
                </span>
              </div>

              {movimientosTurno.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  No hay movimientos registrados en este turno.
                </div>
              ) : (
                <div className="space-y-2">
                  {movimientosTurno.slice(0, 10).map(mov => {
                    const isEgreso = mov.tipo_movimiento === 'EGRESO';
                    return (
                      <div
                        key={mov.id}
                        className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isEgreso ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {isEgreso ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                          </div>
                          <div>
                            <strong className="text-slate-800 dark:text-slate-100 block text-xs">
                              {mov.descripcion}
                            </strong>
                            <span className="text-[10px] text-slate-400">
                              {mov.beneficiario_nombre || mov.registrado_por} • {mov.fecha_movimiento}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <strong className={`text-xs font-black ${isEgreso ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isEgreso ? '-' : '+'} S/ {Number(mov.monto).toFixed(2)}
                          </strong>

                          {isEgreso && (
                            <button
                              type="button"
                              onClick={() => handleReimprimir(mov)}
                              title="Reimprimir Voucher Térmico"
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Operaciones delegadas a Caja POS • Vaikuntha ERP
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
