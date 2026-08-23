'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, Clock, AlertTriangle, Building2, 
  ArrowRight, ShieldCheck, DollarSign, FileText, RefreshCw,
  Search, Check, Sparkles
} from 'lucide-react';
import { LoteLiquidacionPOS } from '@/types/pasarelasPOS';
import { 
  obtenerLotesLiquidacionPOS, 
  conciliarLotePOS 
} from '@/services/pasarelasPOS';
import { useUIStore } from '@/store/useUIStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sedeId?: string;
  adminNombre?: string;
  onConciliacionCompletada?: () => void;
}

export function ConciliacionLotesPosModal({
  isOpen,
  onClose,
  sedeId,
  adminNombre,
  onConciliacionCompletada
}: Props) {
  const [lotes, setLotes] = useState<LoteLiquidacionPOS[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('EN_TRANSITO');
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteLiquidacionPOS | null>(null);
  
  // Inputs del formulario de conciliación
  const [montoNetoReal, setMontoNetoReal] = useState<number>(0);
  const [numeroOperacion, setNumeroOperacion] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const { showAlert } = useUIStore();

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await obtenerLotesLiquidacionPOS({ sedeId });
      setLotes(data);
    } catch (e) {
      console.error('Error cargando lotes POS:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargar();
      setLoteSeleccionado(null);
    }
  }, [isOpen, sedeId]);

  if (!isOpen) return null;

  const handleSeleccionarLote = (l: LoteLiquidacionPOS) => {
    setLoteSeleccionado(l);
    setMontoNetoReal(Number(l.monto_neto_estimado || 0));
    setNumeroOperacion('');
    setNotas('');
  };

  const varianza = loteSeleccionado 
    ? Number((montoNetoReal - Number(loteSeleccionado.monto_neto_estimado)).toFixed(2))
    : 0;

  const comisionReal = loteSeleccionado
    ? Number((Number(loteSeleccionado.monto_bruto_total) - montoNetoReal).toFixed(2))
    : 0;

  const handleConfirmarConciliacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteSeleccionado) return;

    if (montoNetoReal <= 0) {
      showAlert('Por favor ingresa el monto neto real depositado por el procesador.', 'error');
      return;
    }

    setProcesando(true);
    try {
      await conciliarLotePOS({
        loteId: loteSeleccionado.id,
        montoNetoReal,
        numeroOperacion: numeroOperacion.trim() || undefined,
        notas: notas.trim() || undefined,
        adminNombre: adminNombre || 'Administrador',
        sedeId
      });

      showAlert(`¡Lote POS conciliado exitosamente! Se acreditó S/ ${montoNetoReal.toFixed(2)} en la cuenta bancaria.`, 'success');
      setLoteSeleccionado(null);
      await cargar();
      if (onConciliacionCompletada) onConciliacionCompletada();
    } catch (err: any) {
      showAlert('Error en la conciliación: ' + err.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  const lotesFiltrados = lotes.filter(l => {
    if (filtroEstado === 'TODOS') return true;
    return l.estado === filtroEstado;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                Conciliación de Lotes POS & Fondos en Tránsito (D+1)
              </h2>
              <p className="text-xs text-slate-500">
                Audita los depósitos bancarios de Izipay/Niubiz, detecta varianzas y liquida a tu cuenta corriente.
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

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Panel de Conciliación Activo */}
          {loteSeleccionado ? (
            <form onSubmit={handleConfirmarConciliacion} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-indigo-200 dark:border-indigo-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
                    Conciliando Lote #{loteSeleccionado.id.slice(0, 8)}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {loteSeleccionado.pasarela_nombre} • Fecha {loteSeleccionado.fecha_lote} ({loteSeleccionado.cantidad_transacciones} ventas)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLoteSeleccionado(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium"
                >
                  Volver a la lista
                </button>
              </div>

              {/* Comparativa Resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bruto Cobrado</span>
                  <strong className="text-sm text-slate-800 dark:text-white font-black">
                    S/ {Number(loteSeleccionado.monto_bruto_total).toFixed(2)}
                  </strong>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Comisión Estimada</span>
                  <strong className="text-sm text-rose-600 font-black">
                    S/ {Number(loteSeleccionado.comision_estimada).toFixed(2)}
                  </strong>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Neto Esperado</span>
                  <strong className="text-sm text-indigo-600 dark:text-indigo-400 font-black">
                    S/ {Number(loteSeleccionado.monto_neto_estimado).toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Form Inputs de Depósito Real */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-white mb-1">
                    Monto Neto Real Depositado en Banco (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={montoNetoReal}
                    onChange={(e) => setMontoNetoReal(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-emerald-600 font-black focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Verifica el estado de cuenta en tu app bancaria (BCP/BBVA).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-white mb-1">
                    N° de Operación / Referencia Bancaria
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. OP-78234190"
                    value={numeroOperacion}
                    onChange={(e) => setNumeroOperacion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Auditoría de Varianza / Diferencia en Tiempo Real */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                Math.abs(varianza) === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : Math.abs(varianza) <= 1.00
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    {Math.abs(varianza) === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      Auditoría de Varianza: {Math.abs(varianza) === 0 ? 'Liquidación Exacta (Sin Diferencias)' : `Diferencia de S/ ${varianza.toFixed(2)}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Comisión Real Retenida: <strong>S/ {comisionReal.toFixed(2)}</strong> • Se transferirá <strong>S/ {montoNetoReal.toFixed(2)}</strong> a la cuenta corriente.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={procesando}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{procesando ? 'Conciliando...' : 'Confirmar & Depositar'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Lista de Lotes POS */
            <div className="space-y-4">
              
              {/* Filtros de Estado */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {(['EN_TRANSITO', 'CONCILIADO_DEPOSITADO', 'TODOS'] as const).map(est => (
                    <button
                      key={est}
                      type="button"
                      onClick={() => setFiltroEstado(est)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        filtroEstado === est
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {est === 'EN_TRANSITO' ? 'En Tránsito (Pendientes)' : est === 'CONCILIADO_DEPOSITADO' ? 'Conciliados' : 'Todos'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={cargar}
                  className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl transition"
                  title="Recargar lotes"
                >
                  <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Grid de Lotes */}
              {lotesFiltrados.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">
                    No hay lotes POS con el filtro seleccionado.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lotesFiltrados.map(lote => {
                    const esEnTransito = lote.estado === 'EN_TRANSITO';
                    return (
                      <div
                        key={lote.id}
                        className="bg-white dark:bg-slate-800/80 p-4 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between gap-3 hover:border-indigo-400 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                {lote.pasarela_nombre}
                              </h4>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                esEnTransito
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {esEnTransito ? 'En Tránsito (D+1)' : 'Depositado'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Lote del {lote.fecha_lote} • {lote.cantidad_transacciones} operaciones
                            </span>
                          </div>

                          {esEnTransito && (
                            <button
                              type="button"
                              onClick={() => handleSeleccionarLote(lote)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                            >
                              Conciliar
                            </button>
                          )}
                        </div>

                        {/* Desglose Financiero */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl text-[10px]">
                          <div>
                            <span className="text-slate-400 uppercase font-medium block text-[9px]">Bruto</span>
                            <strong className="text-slate-800 dark:text-slate-200">
                              S/ {Number(lote.monto_bruto_total).toFixed(2)}
                            </strong>
                          </div>

                          <div>
                            <span className="text-slate-400 uppercase font-medium block text-[9px]">Comisión</span>
                            <strong className="text-rose-600">
                              S/ {Number(lote.comision_estimada).toFixed(2)}
                            </strong>
                          </div>

                          <div>
                            <span className="text-slate-400 uppercase font-medium block text-[9px]">Neto Esperado</span>
                            <strong className="text-emerald-600 font-bold">
                              S/ {Number(lote.monto_neto_estimado).toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        {!esEnTransito && lote.monto_neto_real_depositado && (
                          <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2">
                            <span>Real Depositado: <strong>S/ {Number(lote.monto_neto_real_depositado).toFixed(2)}</strong></span>
                            <span className="text-emerald-600 font-bold">Op: {lote.numero_operacion_bancaria || 'Verificado'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            La conciliación debita la cuenta puente y acredita el neto real en tu cuenta corriente.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
