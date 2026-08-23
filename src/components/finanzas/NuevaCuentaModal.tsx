'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { TipoCuentaFinanciera } from '@/types/finanzas';
import { crearCuentaFinanciera } from '@/services/finanzas';
import { useUIStore } from '@/store/useUIStore';
import { Landmark, Wallet, CreditCard, DollarSign } from 'lucide-react';

interface NuevaCuentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  sedeId?: string;
  onCuentaCreada: () => void;
}

export function NuevaCuentaModal({ isOpen, onClose, sedeId, onCuentaCreada }: NuevaCuentaModalProps) {
  const [nombre, setNombre] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuentaFinanciera>('BANCO');
  const [bancoEntidad, setBancoEntidad] = useState('BCP');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [moneda, setMoneda] = useState('PEN');
  const [saldoInicial, setSaldoInicial] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showAlert } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      showAlert('Por favor ingresa un nombre para la cuenta', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await crearCuentaFinanciera({
        nombre,
        tipo_cuenta: tipoCuenta,
        banco_entidad: bancoEntidad,
        numero_cuenta: numeroCuenta,
        moneda,
        saldo_actual: Number(saldoInicial || 0),
        sede_id: sedeId,
        estado: 'ACTIVO'
      });

      showAlert(`¡Cuenta "${nombre}" registrada con éxito!`, 'success');
      onCuentaCreada();
      onClose();
    } catch (err: any) {
      showAlert('Error al crear cuenta: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏛️ Nueva Cuenta Financiera (Caja / Banco)">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
        
        {/* Nombre de la Cuenta */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
            Nombre Identificador de la Cuenta
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. BCP Cta Corriente Soles, Caja Chica Sede 1..."
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tipo de Cuenta & Entidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tipo de Cuenta</label>
            <select
              value={tipoCuenta}
              onChange={(e) => setTipoCuenta(e.target.value as TipoCuentaFinanciera)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
            >
              <option value="CAJA_CHICA">💵 Caja Chica (Efectivo)</option>
              <option value="BANCO">🏛️ Cuenta Bancaria</option>
              <option value="BILLETERA_DIGITAL">📱 Billetera Digital (Yape/Plin)</option>
              <option value="PASARELA_POS">💳 Pasarela / Terminal POS</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Entidad / Banco</label>
            <input
              type="text"
              required
              value={bancoEntidad}
              onChange={(e) => setBancoEntidad(e.target.value)}
              placeholder="Ej. BCP, BBVA, Interbank, Yape, Efectivo..."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
            />
          </div>
        </div>

        {/* Número de Cuenta / CCI */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
            Número de Cuenta / Teléfono / CCI (Opcional)
          </label>
          <input
            type="text"
            value={numeroCuenta}
            onChange={(e) => setNumeroCuenta(e.target.value)}
            placeholder="Ej. 193-98231234-0-12 ó 987654321"
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
          />
        </div>

        {/* Saldo Inicial & Moneda */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Saldo Inicial (S/.)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(parseFloat(e.target.value) || 0)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Moneda</label>
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
            >
              <option value="PEN">PEN (Soles - S/.)</option>
              <option value="USD">USD (Dólares - $)</option>
            </select>
          </div>
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
            {isSubmitting ? 'Guardando...' : 'Crear Cuenta'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
