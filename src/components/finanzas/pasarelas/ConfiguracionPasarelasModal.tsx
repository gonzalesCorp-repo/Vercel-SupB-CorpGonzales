'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Sliders, Plus, Save, CreditCard, ShieldCheck, 
  HelpCircle, AlertCircle, Percent, DollarSign, ArrowRight 
} from 'lucide-react';
import { 
  ConfigPasarelaPago, 
  MedioPagoPasarela, 
  TipoAcreditacionPasarela 
} from '@/types/pasarelasPOS';
import { CuentaFinanciera } from '@/types/finanzas';
import { 
  obtenerPasarelasConfiguradas, 
  guardarConfiguracionPasarela, 
  calcularComisionPasarela 
} from '@/services/pasarelasPOS';
import { useUIStore } from '@/store/useUIStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cuentas: CuentaFinanciera[];
  sedeId?: string;
  onConfiguracionGuardada?: () => void;
}

export function ConfiguracionPasarelasModal({
  isOpen,
  onClose,
  cuentas,
  sedeId,
  onConfiguracionGuardada
}: Props) {
  const [pasarelas, setPasarelas] = useState<ConfigPasarelaPago[]>([]);
  const [pasarelaEditando, setPasarelaEditando] = useState<Partial<ConfigPasarelaPago> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const { showAlert } = useUIStore();

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await obtenerPasarelasConfiguradas(sedeId);
      setPasarelas(data);
    } catch (e) {
      console.error('Error cargando pasarelas:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargar();
    }
  }, [isOpen, sedeId]);

  if (!isOpen) return null;

  const handleCrearNueva = () => {
    setPasarelaEditando({
      sede_id: sedeId || 'general',
      nombre: '',
      medio_pago: 'TARJETA_CREDITO',
      porcentaje_comision: 3.25,
      costo_fijo_transaccion: 0.00,
      aplica_igv_comision: true,
      dias_liquidacion: 1,
      tipo_acreditacion: 'EN_TRANSITO_LOTE',
      cuenta_puente_id: cuentas.find(c => c.tipo_cuenta === 'CAJA_CHICA')?.id || cuentas[0]?.id,
      cuenta_destino_id: cuentas.find(c => c.tipo_cuenta === 'BANCO')?.id || cuentas[0]?.id,
      activo: true
    });
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasarelaEditando || !pasarelaEditando.nombre?.trim() || !pasarelaEditando.cuenta_destino_id) {
      showAlert('Por favor completa el nombre y la cuenta bancaria de destino.', 'error');
      return;
    }

    setGuardando(true);
    try {
      await guardarConfiguracionPasarela(pasarelaEditando);
      showAlert('¡Configuración de pasarela guardada con éxito!', 'success');
      setPasarelaEditando(null);
      await cargar();
      if (onConfiguracionGuardada) onConfiguracionGuardada();
    } catch (err: any) {
      showAlert('Error al guardar: ' + err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Simulación de ejemplo para S/ 100 de venta
  const simulacion = pasarelaEditando ? calcularComisionPasarela(100, {
    porcentaje_comision: Number(pasarelaEditando.porcentaje_comision || 0),
    costo_fijo_transaccion: Number(pasarelaEditando.costo_fijo_transaccion || 0),
    aplica_igv_comision: Boolean(pasarelaEditando.aplica_igv_comision)
  }) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white">
                Ruteo de Pagos & Comisiones de Pasarelas POS
              </h2>
              <p className="text-xs text-slate-500">
                Programa las tasas de Izipay, Niubiz, Yape y el flujo de fondos a tus cuentas bancarias.
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
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Vista Formulario de Edición */}
          {pasarelaEditando ? (
            <form onSubmit={handleGuardar} className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  {pasarelaEditando.id ? 'Editar Regla de Pasarela' : 'Nueva Regla de Pasarela POS'}
                </h3>
                <button
                  type="button"
                  onClick={() => setPasarelaEditando(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium"
                >
                  Cancelar Edición
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre de la Pasarela */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Identificador
                  </label>
                  <input
                    type="text"
                    required
                    value={pasarelaEditando.nombre || ''}
                    onChange={(e) => setPasarelaEditando({ ...pasarelaEditando, nombre: e.target.value })}
                    placeholder="Ej. Izipay POS Mostrador"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Medio de Pago */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Medio de Pago Asociado
                  </label>
                  <select
                    value={pasarelaEditando.medio_pago || 'TARJETA_CREDITO'}
                    onChange={(e) => setPasarelaEditando({ ...pasarelaEditando, medio_pago: e.target.value as MedioPagoPasarela })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="TARJETA_CREDITO">Tarjeta de Crédito (POS)</option>
                    <option value="TARJETA_DEBITO">Tarjeta de Débito (POS)</option>
                    <option value="BILLETERA_DIGITAL">Billetera Digital (Yape / Plin)</option>
                    <option value="EFECTIVO">Efectivo Mostrador</option>
                    <option value="TRANSFERENCIA">Transferencia Bancaria Directa</option>
                  </select>
                </div>

                {/* % Comisión */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tasa de Comisión (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={pasarelaEditando.porcentaje_comision ?? 0}
                      onChange={(e) => setPasarelaEditando({ ...pasarelaEditando, porcentaje_comision: Number(e.target.value) })}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <Percent className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Ej. 3.25 para Izipay o 2.85 para Débito
                  </span>
                </div>

                {/* Costo Fijo por Transacción */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Costo Fijo por Operación (S/)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pasarelaEditando.costo_fijo_transaccion ?? 0}
                      onChange={(e) => setPasarelaEditando({ ...pasarelaEditando, costo_fijo_transaccion: Number(e.target.value) })}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    S/ 0.00 para la mayoría de POS físicos
                  </span>
                </div>
              </div>

              {/* Toggles de Impuestos y Liquidación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pasarelaEditando.aplica_igv_comision ?? true}
                    onChange={(e) => setPasarelaEditando({ ...pasarelaEditando, aplica_igv_comision: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white block">
                      Aplicar IGV (18%) a la comisión
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Izipay y Niubiz facturan IGV sobre su comisión.
                    </span>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-white mb-1">
                    Esquema de Acreditación
                  </label>
                  <select
                    value={pasarelaEditando.tipo_acreditacion || 'EN_TRANSITO_LOTE'}
                    onChange={(e) => setPasarelaEditando({ ...pasarelaEditando, tipo_acreditacion: e.target.value as TipoAcreditacionPasarela })}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-medium"
                  >
                    <option value="EN_TRANSITO_LOTE">En Tránsito (D+1 / Lote con Conciliación)</option>
                    <option value="INMEDIATA">Inmediata (Abono directo al cobrar)</option>
                  </select>
                </div>
              </div>

              {/* Ruteo de Cuentas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pasarelaEditando.tipo_acreditacion === 'EN_TRANSITO_LOTE' && (
                  <div>
                    <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                      Cuenta Puente (Fondos en Tránsito)
                    </label>
                    <select
                      value={pasarelaEditando.cuenta_puente_id || ''}
                      onChange={(e) => setPasarelaEditando({ ...pasarelaEditando, cuenta_puente_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-slate-800 dark:text-white font-medium outline-none cursor-pointer"
                    >
                      {cuentas.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.banco_entidad})
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Donde reposa el saldo antes del depósito bancario.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    Cuenta Bancaria Destino Final
                  </label>
                  <select
                    required
                    value={pasarelaEditando.cuenta_destino_id || ''}
                    onChange={(e) => setPasarelaEditando({ ...pasarelaEditando, cuenta_destino_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-slate-800 dark:text-white font-medium outline-none cursor-pointer"
                  >
                    {cuentas.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.banco_entidad})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Cuenta corriente donde finalmente se acredita el neto.
                  </span>
                </div>
              </div>

              {/* Simulación en Vivo */}
              {simulacion && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 block">
                      Simulación en Vivo (Por cada S/ 100.00 cobrados)
                    </span>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                      Comisión: <strong className="text-rose-600">S/ {simulacion.comisionTotal.toFixed(2)}</strong> ({simulacion.porcentajeEfectivo}%) • Acredita Neto: <strong className="text-emerald-600">S/ {simulacion.montoNeto.toFixed(2)}</strong>
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{guardando ? 'Guardando...' : 'Guardar Regla'}</span>
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* Lista de Pasarelas Configuradas */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pasarelas & Medios de Pago Activos ({pasarelas.length})
                </span>
                <button
                  type="button"
                  onClick={handleCrearNueva}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Pasarela</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {pasarelas.map(p => {
                  const sim = calcularComisionPasarela(100, p);
                  return (
                    <div
                      key={p.id}
                      className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-3 hover:border-indigo-400 dark:hover:border-indigo-600 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {p.nombre}
                            </h4>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                              p.tipo_acreditacion === 'INMEDIATA' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {p.tipo_acreditacion === 'INMEDIATA' ? 'Inmediato' : 'D+1 En Tránsito'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {p.medio_pago} • {p.porcentaje_comision}% {p.aplica_igv_comision ? '+ IGV' : ''}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPasarelaEditando(p)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-600 transition cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>

                      {/* Flujo de Cuentas */}
                      <div className="text-[10px] font-medium text-slate-500 bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase">Destino</span>
                          <strong className="text-slate-700 dark:text-slate-200">{p.cuenta_destino_nombre || 'Cuenta Bancaria'}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[9px] uppercase">Neto por S/ 100</span>
                          <strong className="text-emerald-600 font-bold">S/ {sim.montoNeto.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Las comisiones y varianzas se registran automáticamente en los asientos de Tesorería.
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
