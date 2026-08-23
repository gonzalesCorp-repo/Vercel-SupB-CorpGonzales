'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CuentaFinanciera } from '@/types/finanzas';
import { liquidarComisionesStaffFinanzas } from '@/services/finanzas';
import { imprimirReciboEgresoFinanzas } from '@/services/impresionTermica';
import { useUIStore } from '@/store/useUIStore';
import { Award, UserCheck, DollarSign, Printer, CheckCircle2 } from 'lucide-react';

interface StaffItem {
  id: string;
  nombre: string;
  rol: string;
  especialidad?: string;
  comisionesPendientes?: number;
}

interface LiquidarStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffItem[];
  cuentas: CuentaFinanciera[];
  sedeId?: string;
  onLiquidacionCompletada: () => void;
}

export function LiquidarStaffModal({
  isOpen,
  onClose,
  staffList,
  cuentas,
  sedeId,
  onLiquidacionCompletada
}: LiquidarStaffModalProps) {
  const [agenteId, setAgenteId] = useState<string>(staffList[0]?.id || '');
  const [cuentaId, setCuentaId] = useState<string>(cuentas[0]?.id || '');
  const [monto, setMonto] = useState<number>(0);
  const [concepto, setConcepto] = useState('Liquidación de Comisiones & Propinas de la Semana');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [imprimirVoucher, setImprimirVoucher] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showAlert } = useUIStore();

  const agenteSel = staffList.find(s => s.id === agenteId) || staffList[0];
  const cuentaSel = cuentas.find(c => c.id === cuentaId) || cuentas[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agenteId || !agenteSel) {
      showAlert('Selecciona al colaborador a liquidar', 'error');
      return;
    }
    if (!cuentaId) {
      showAlert('Selecciona la cuenta de pago', 'error');
      return;
    }
    if (monto <= 0) {
      showAlert('El monto a liquidar debe ser mayor a 0', 'error');
      return;
    }
    if (cuentaSel && Number(cuentaSel.saldo_actual) < monto) {
      showAlert(`Saldo insuficiente en ${cuentaSel.nombre} (Disponible: S/ ${Number(cuentaSel.saldo_actual).toFixed(2)})`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const mov = await liquidarComisionesStaffFinanzas({
        agenteId: agenteSel.id,
        agenteNombre: agenteSel.nombre,
        cuentaId,
        monto,
        concepto,
        numeroOperacion,
        registradoPor: 'Administración',
        sedeId
      });

      showAlert(`¡Liquidación de S/ ${monto.toFixed(2)} pagada a ${agenteSel.nombre}!`, 'success');

      // Impresión térmica del recibo
      if (imprimirVoucher) {
        try {
          await imprimirReciboEgresoFinanzas({
            numeroEgreso: mov.id,
            categoria: 'LIQUIDACION_STAFF',
            concepto,
            beneficiario: agenteSel.nombre,
            monto,
            cuentaNombre: cuentaSel?.nombre || 'Caja Chica',
            registradoPor: 'Administración'
          });
        } catch (printErr) {
          console.warn('Error imprimiendo comprobante de liquidación:', printErr);
        }
      }

      onLiquidacionCompletada();
      onClose();
    } catch (err: any) {
      showAlert('Error al procesar liquidación: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👥 Liquidación de Comisiones a Staff (WFM)">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
        
        {/* Selector de Colaborador */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
            Colaborador / Especialista
          </label>
          <select
            value={agenteId}
            onChange={(e) => setAgenteId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.rol || 'STAFF'}) - {s.especialidad || 'Estilista'}
              </option>
            ))}
          </select>
        </div>

        {/* Cuenta de Pago & Monto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  {c.nombre} (Disp: S/ {Number(c.saldo_actual).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Monto a Liquidar (S/.)</label>
            <input
              type="number"
              step="0.01"
              min="0.50"
              required
              value={monto || ''}
              onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-black outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Concepto & N° Voucher */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Concepto de la Liquidación</label>
          <input
            type="text"
            required
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
            N° Operación Yape / Transferencia / Recibo (Opcional)
          </label>
          <input
            type="text"
            value={numeroOperacion}
            onChange={(e) => setNumeroOperacion(e.target.value)}
            placeholder="Ej. OP-12348 o Recibo Manual"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
          />
        </div>

        {/* Checkbox Impresión Térmica */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={imprimirVoucher}
              onChange={(e) => setImprimirVoucher(e.target.checked)}
              className="rounded border-slate-400 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span>🖨️ Imprimir Voucher Térmico de Liquidación firmado por Staff</span>
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
            {isSubmitting ? 'Procesando Pago...' : 'Pagar y Liquidar'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
