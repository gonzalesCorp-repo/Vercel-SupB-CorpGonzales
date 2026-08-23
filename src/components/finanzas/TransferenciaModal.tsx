'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CuentaFinanciera } from '@/types/finanzas';
import { ejecutarTransferenciaCuentas } from '@/services/finanzas';
import { useUIStore } from '@/store/useUIStore';
import { ArrowRightLeft, Landmark, DollarSign } from 'lucide-react';

interface TransferenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cuentas: CuentaFinanciera[];
  sedeId?: string;
  onTransferenciaRealizada: () => void;
}

export function TransferenciaModal({
  isOpen,
  onClose,
  cuentas,
  sedeId,
  onTransferenciaRealizada
}: TransferenciaModalProps) {
  const [cuentaOrigenId, setCuentaOrigenId] = useState<string>(cuentas[0]?.id || '');
  const [cuentaDestinoId, setCuentaDestinoId] = useState<string>(cuentas[1]?.id || cuentas[0]?.id || '');
  const [monto, setMonto] = useState<number>(0);
  const [comision, setComision] = useState<number>(0);
  const [descripcion, setDescripcion] = useState('');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showAlert } = useUIStore();

  const ctaOrigen = cuentas.find(c => c.id === cuentaOrigenId) || cuentas[0];
  const ctaDestino = cuentas.find(c => c.id === cuentaDestinoId) || cuentas[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuentaOrigenId || !cuentaDestinoId) {
      showAlert('Selecciona las cuentas de origen y destino', 'error');
      return;
    }
    if (cuentaOrigenId === cuentaDestinoId) {
      showAlert('La cuenta de origen y destino deben ser distintas', 'error');
      return;
    }
    if (monto <= 0) {
      showAlert('El monto debe ser mayor a 0', 'error');
      return;
    }
    if (ctaOrigen && Number(ctaOrigen.saldo_actual) < (monto + comision)) {
      showAlert(`Saldo insuficiente en ${ctaOrigen.nombre} (Disponible: S/ ${Number(ctaOrigen.saldo_actual).toFixed(2)})`, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await ejecutarTransferenciaCuentas({
        cuentaOrigenId,
        cuentaDestinoId,
        monto,
        comision,
        descripcion: descripcion || `Traslado de ${ctaOrigen?.nombre} a ${ctaDestino?.nombre}`,
        numeroOperacion,
        registradoPor: 'Administración',
        sedeId
      });

      showAlert(`¡Transferencia de S/ ${monto.toFixed(2)} ejecutada con éxito!`, 'success');
      onTransferenciaRealizada();
      onClose();
    } catch (err: any) {
      showAlert('Error al transferir: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔄 Transferencia entre Cuentas (Caja y Bancos)">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
        
        {/* Selector de Cuentas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
              Cuenta de Origen (Sale dinero)
            </label>
            <select
              value={cuentaOrigenId}
              onChange={(e) => setCuentaOrigenId(e.target.value)}
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
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
              Cuenta de Destino (Ingresa dinero)
            </label>
            <select
              value={cuentaDestinoId}
              onChange={(e) => setCuentaDestinoId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
            >
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Disp: S/ {Number(c.saldo_actual).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Monto & Comisión */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Monto a Trasladar (S/.)</label>
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
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Comisión Bancaria / ITF (Opcional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={comision || ''}
              onChange={(e) => setComision(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
            />
          </div>
        </div>

        {/* N° Operación Bancaria */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
            N° de Operación Bancaria / Voucher
          </label>
          <input
            type="text"
            value={numeroOperacion}
            onChange={(e) => setNumeroOperacion(e.target.value)}
            placeholder="Ej. OP-9821831"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
          />
        </div>

        {/* Motivo / Detalle */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Motivo del Traslado</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej. Depósito de recaudación de efectivo de fin de semana a BCP..."
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none"
          />
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
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            {isSubmitting ? 'Transfiriendo...' : 'Ejecutar Transferencia'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
