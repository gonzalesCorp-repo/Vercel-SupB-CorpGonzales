'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { LiquidacionPersonal } from '@/types/liquidaciones';
import { CuentaFinanciera } from '@/types/finanzas';
import { pagarLiquidacionPersonal } from '@/services/liquidaciones';
import { imprimirVoucherLiquidacionPersonal } from '@/services/impresionTermica';
import { useUIStore } from '@/store/useUIStore';
import { DollarSign, Printer, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';

interface PagarLiquidacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquidacion: LiquidacionPersonal;
  cuentas: CuentaFinanciera[];
  sedeId?: string;
  onPagoCompletado: () => void;
}

export function PagarLiquidacionModal({
  isOpen,
  onClose,
  liquidacion,
  cuentas,
  sedeId,
  onPagoCompletado
}: PagarLiquidacionModalProps) {
  const [cuentaId, setCuentaId] = useState<string>(cuentas[0]?.id || '');
  const [imprimirVoucher, setImprimirVoucher] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showAlert } = useUIStore();
  const cuentaSel = cuentas.find(c => c.id === cuentaId) || cuentas[0];

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaId) {
      showAlert('Selecciona una cuenta de pago', 'error');
      return;
    }
    if (cuentaSel && Number(cuentaSel.saldo_actual) < Number(liquidacion.monto_total_neto)) {
      showAlert(`Saldo insuficiente en ${cuentaSel.nombre} (Disponible: S/ ${Number(cuentaSel.saldo_actual).toFixed(2)})`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await pagarLiquidacionPersonal({
        liquidacionId: liquidacion.id,
        cuentaPagoId: cuentaId,
        cuentaPagoNombre: cuentaSel?.nombre,
        adminNombre: 'Cajero / Administración',
        sedeId
      });

      showAlert(`¡Liquidación ${liquidacion.numero_correlativo} pagada exitosamente!`, 'success');

      // Impresión térmica del voucher detallado
      if (imprimirVoucher) {
        try {
          await imprimirVoucherLiquidacionPersonal({
            numeroCorrelativo: liquidacion.numero_correlativo,
            colaboradorNombre: liquidacion.agente_nombre,
            rol: liquidacion.agente_rol,
            periodoInicio: liquidacion.periodo_inicio,
            periodoFin: liquidacion.periodo_fin,
            tipoRemuneracion: liquidacion.tipo_remuneracion,
            sueldoBase: Number(liquidacion.monto_sueldo_base || 0),
            comisionServicios: Number(liquidacion.monto_comisiones_servicios || 0),
            comisionProductos: Number(liquidacion.monto_comisiones_productos || 0),
            propinas: Number(liquidacion.monto_propinas || 0),
            adelantosDeducidos: Number(liquidacion.monto_adelantos_deducidos || 0),
            totalNeto: Number(liquidacion.monto_total_neto),
            cuentaPagoNombre: cuentaSel?.nombre || 'Caja Chica',
            aprobadoPor: 'Cajero / Administración',
            itemsCount: liquidacion.items?.length
          });
        } catch (errPrint) {
          console.warn('Error imprimiendo voucher térmico:', errPrint);
        }
      }

      onPagoCompletado();
      onClose();
    } catch (err: any) {
      showAlert('Error al procesar pago: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`💳 Pagar Liquidación: ${liquidacion.numero_correlativo}`}>
      <form onSubmit={handlePagar} className="space-y-4 text-slate-800 dark:text-slate-100">
        
        {/* Resumen del Colaborador & Período */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              {liquidacion.agente_nombre}
            </h4>
            <span className="text-[10px] text-slate-400 font-bold block">
              {liquidacion.agente_rol} • Período: {liquidacion.periodo_inicio} al {liquidacion.periodo_fin}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Total a Pagar</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              S/ {Number(liquidacion.monto_total_neto).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Desglose de Conceptos */}
        <div className="p-3 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl space-y-1.5 text-xs">
          {Number(liquidacion.monto_sueldo_base) > 0 && (
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Sueldo Base Acordado:</span>
              <span className="font-bold">S/ {Number(liquidacion.monto_sueldo_base).toFixed(2)}</span>
            </div>
          )}
          {Number(liquidacion.monto_comisiones_servicios) > 0 && (
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Comisiones por Servicios ({liquidacion.items?.length || 0} atenciones):</span>
              <span className="font-bold">S/ {Number(liquidacion.monto_comisiones_servicios).toFixed(2)}</span>
            </div>
          )}
          {Number(liquidacion.monto_comisiones_productos) > 0 && (
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Comisiones por Venta Retail:</span>
              <span className="font-bold">S/ {Number(liquidacion.monto_comisiones_productos).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Selector de Cuenta de Pago */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
            Cuenta de Pago (Sale el dinero)
          </label>
          <select
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
          >
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} (Saldo Disp: S/ {Number(c.saldo_actual).toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Checkbox Impresión Térmica */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={imprimirVoucher}
              onChange={(e) => setImprimirVoucher(e.target.checked)}
              className="rounded border-slate-400 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <span>🖨️ Imprimir Voucher Térmico para Firma Física</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">58mm / 80mm</span>
        </div>

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
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {isSubmitting ? 'Procesando Pago...' : 'Confirmar y Pagar'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
