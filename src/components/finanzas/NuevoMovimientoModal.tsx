'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CuentaFinanciera, TipoMovimientoTesoreria, CategoriaMovimientoTesoreria } from '@/types/finanzas';
import { registrarMovimientoTesoreria, UMBRAL_APROBACION_EGRESO } from '@/services/finanzas';
import { imprimirReciboEgresoFinanzas } from '@/services/impresionTermica';
import { useUIStore } from '@/store/useUIStore';
import { ArrowDownCircle, ArrowUpCircle, Printer, AlertTriangle, FileText } from 'lucide-react';

interface NuevoMovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cuentas: CuentaFinanciera[];
  sedeId?: string;
  onMovimientoRegistrado: () => void;
}

export function NuevoMovimientoModal({ 
  isOpen, 
  onClose, 
  cuentas, 
  sedeId, 
  onMovimientoRegistrado 
}: NuevoMovimientoModalProps) {
  const [tipo, setTipo] = useState<TipoMovimientoTesoreria>('EGRESO');
  const [cuentaId, setCuentaId] = useState<string>(cuentas[0]?.id || '');
  const [categoria, setCategoria] = useState<CategoriaMovimientoTesoreria>('CAJA_CHICA_OPERATIVO');
  const [monto, setMonto] = useState<number>(0);
  const [descripcion, setDescripcion] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [imprimirTicket, setImprimirTicket] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showAlert } = useUIStore();

  // Cuenta seleccionada
  const cuentaSel = cuentas.find(c => c.id === cuentaId) || cuentas[0];
  const superaUmbral = tipo === 'EGRESO' && monto > UMBRAL_APROBACION_EGRESO;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaId) {
      showAlert('Selecciona una cuenta de origen/destino', 'error');
      return;
    }
    if (monto <= 0) {
      showAlert('El monto debe ser mayor a 0', 'error');
      return;
    }
    if (!descripcion.trim()) {
      showAlert('Ingresa el concepto o descripción del movimiento', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const mov = await registrarMovimientoTesoreria({
        cuentaId,
        tipoMovimiento: tipo,
        categoria,
        monto,
        descripcion,
        beneficiarioNombre: beneficiario || (tipo === 'EGRESO' ? 'Gasto de Caja' : 'Fondo Sede'),
        numeroOperacionVoucher: numeroComprobante,
        registradoPor: 'Administración',
        sedeId
      });

      showAlert(`¡${tipo} de S/ ${monto.toFixed(2)} registrado exitosamente!`, 'success');

      // Impresión térmica si está marcada
      if (imprimirTicket && tipo === 'EGRESO') {
        try {
          await imprimirReciboEgresoFinanzas({
            numeroEgreso: mov.id,
            categoria,
            concepto: descripcion,
            beneficiario: beneficiario || 'Personal / Proveedor',
            monto,
            cuentaNombre: cuentaSel?.nombre || 'Caja Chica',
            registradoPor: 'Administración'
          });
        } catch (printErr) {
          console.warn('No se pudo imprimir automáticamente:', printErr);
        }
      }

      onMovimientoRegistrado();
      onClose();
    } catch (err: any) {
      showAlert('Error al registrar movimiento: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="💸 Registrar Movimiento de Tesorería">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
        
        {/* Selector Tipo: Ingreso vs Egreso */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setTipo('EGRESO');
              setCategoria('CAJA_CHICA_OPERATIVO');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tipo === 'EGRESO'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Egreso / Gasto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipo('INGRESO');
              setCategoria('REPOSICION_FONDO');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tipo === 'INGRESO'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Ingreso / Fondo</span>
          </button>
        </div>

        {/* Cuenta & Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
              {tipo === 'EGRESO' ? 'Cuenta de Origen (Debitar)' : 'Cuenta de Destino (Abonar)'}
            </label>
            <select
              value={cuentaId}
              onChange={(e) => setCuentaId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
            >
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Saldo: S/ {Number(c.saldo_actual).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaMovimientoTesoreria)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
            >
              {tipo === 'EGRESO' ? (
                <>
                  <option value="CAJA_CHICA_OPERATIVO">📦 Gasto Caja Chica (Café, Limpieza, Taxi)</option>
                  <option value="PAGO_PROVEEDOR">🏢 Pago a Proveedor / Factura</option>
                  <option value="SERVICIOS_BASICOS">💡 Servicios Básicos (Luz, Agua, Internet)</option>
                  <option value="ADELANTO_SUELDO">💵 Adelanto de Sueldo a Personal</option>
                  <option value="OTROS_EGRESOS">📑 Otros Egresos</option>
                </>
              ) : (
                <>
                  <option value="REPOSICION_FONDO">🏦 Reposición / Apertura de Fondo Caja Chica</option>
                  <option value="OTROS_INGRESOS">💰 Aporte de Capital / Otros Ingresos</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Monto & Beneficiario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Monto (S/.)</label>
            <input
              type="number"
              step="0.01"
              min="0.10"
              required
              value={monto || ''}
              onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
              {tipo === 'EGRESO' ? 'Beneficiario / Proveedor' : 'Depositante / Origen'}
            </label>
            <input
              type="text"
              value={beneficiario}
              onChange={(e) => setBeneficiario(e.target.value)}
              placeholder="Ej. Distribuidora Central, Juan Pérez..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
            />
          </div>
        </div>

        {/* Concepto / Descripción */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Concepto / Detalle del Gasto</label>
          <input
            type="text"
            required
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Compra de bidón de agua y artículos de limpieza..."
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
          />
        </div>

        {/* N° Comprobante o Factura Física */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
            N° Boleta / Factura / Recibo Físico (Opcional)
          </label>
          <input
            type="text"
            value={numeroComprobante}
            onChange={(e) => setNumeroComprobante(e.target.value)}
            placeholder="Ej. F001-00234 o Recibo #45"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
          />
        </div>

        {/* Alerta de Aprobación si supera S/ 200 */}
        {superaUmbral && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Alerta de Gobernanza:</strong> Los egresos mayores a S/ {UMBRAL_APROBACION_EGRESO}.00 quedarán en estado <strong>PENDIENTE DE APROBACIÓN</strong> hasta ser autorizados por un Superadmin.
            </span>
          </div>
        )}

        {/* Checkbox Impresión Térmica */}
        {tipo === 'EGRESO' && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={imprimirTicket}
                onChange={(e) => setImprimirTicket(e.target.checked)}
                className="rounded border-slate-400 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <span>🖨️ Imprimir Voucher Térmico de Recibo de Egreso</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">58mm / 80mm</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-md ${
              tipo === 'EGRESO'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {isSubmitting ? 'Registrando...' : (tipo === 'EGRESO' ? 'Registrar Egreso' : 'Registrar Ingreso')}
          </button>
        </div>

      </form>
    </Modal>
  );
}
