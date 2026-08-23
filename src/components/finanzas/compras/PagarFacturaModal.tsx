'use client';

import React, { useState } from 'react';
import { 
  X, CheckCircle2, DollarSign, Building2, CreditCard, 
  ArrowRight, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { FacturaCompra } from '@/types/facturasCompras';
import { CuentaFinanciera } from '@/types/finanzas';
import { pagarFacturaCompra } from '@/services/facturasCompras';
import { useUIStore } from '@/store/useUIStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  factura: FacturaCompra | null;
  cuentas: CuentaFinanciera[];
  sedeId?: string;
  adminNombre?: string;
  onPagoCompletado?: () => void;
}

export function PagarFacturaModal({
  isOpen,
  onClose,
  factura,
  cuentas,
  sedeId,
  adminNombre,
  onPagoCompletado
}: Props) {
  const [montoAbono, setMontoAbono] = useState<number>(factura ? Number(factura.saldo_pendiente) : 0);
  const [cuentaId, setCuentaId] = useState<string>(cuentas[0]?.id || '');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [notas, setNotas] = useState('');
  const [procesando, setProcesando] = useState(false);
  const { showAlert } = useUIStore();

  React.useEffect(() => {
    if (factura) {
      setMontoAbono(Number(factura.saldo_pendiente));
    }
  }, [factura]);

  if (!isOpen || !factura) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoAbono <= 0 || !cuentaId) {
      showAlert('Por favor ingresa un monto válido y selecciona la cuenta de origen.', 'error');
      return;
    }

    if (montoAbono > Number(factura.saldo_pendiente)) {
      showAlert(`El monto no puede exceder el saldo pendiente de S/ ${Number(factura.saldo_pendiente).toFixed(2)}.`, 'error');
      return;
    }

    setProcesando(true);
    try {
      await pagarFacturaCompra({
        facturaId: factura.id,
        cuentaId,
        montoAbono,
        numeroOperacion: numeroOperacion.trim() || undefined,
        notas: notas.trim() || undefined,
        adminNombre: adminNombre || 'Administrador',
        sedeId
      });

      showAlert(`¡Abono de S/ ${montoAbono.toFixed(2)} registrado con éxito!`, 'success');
      if (onPagoCompletado) onPagoCompletado();
      onClose();
    } catch (err: any) {
      showAlert('Error al procesar pago: ' + err.message, 'error');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white">
                Pagar Factura a Proveedor
              </h2>
              <p className="text-xs text-slate-500">
                {factura.tipo_comprobante} #{factura.serie}-{factura.numero} • {factura.proveedor_razon_social}
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Card Resumen de Saldo */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Factura</span>
              <strong className="text-xs font-black text-slate-800 dark:text-slate-100">
                S/ {Number(factura.total).toFixed(2)}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pagado</span>
              <strong className="text-xs font-black text-emerald-600">
                S/ {Number(factura.monto_pagado).toFixed(2)}
              </strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Pendiente</span>
              <strong className="text-xs font-black text-rose-600">
                S/ {Number(factura.saldo_pendiente).toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Monto de Abono */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Monto a Pagar (S/)
            </label>
            <input
              type="number"
              step="0.01"
              max={Number(factura.saldo_pendiente)}
              required
              value={montoAbono}
              onChange={(e) => setMontoAbono(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-sm font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Cuenta Financiera de Salida */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cuenta de Origen (Egreso)
            </label>
            <select
              required
              value={cuentaId}
              onChange={(e) => setCuentaId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Saldo: S/ {Number(c.saldo_actual).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* N° Operación / Voucher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              N° Operación / Referencia Bancaria
            </label>
            <input
              type="text"
              placeholder="Ej. OP-9831204"
              value={numeroOperacion}
              onChange={(e) => setNumeroOperacion(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-white outline-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={procesando}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{procesando ? 'Procesando...' : 'Confirmar Pago'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
