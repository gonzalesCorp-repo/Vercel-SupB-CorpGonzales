'use client';

import { Lock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export interface PinValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: string;
  setPin: (p: string) => void;
  pinError: boolean;
  handleConfirmPin: (e: React.FormEvent) => void;
  pendingAction: string | null;
  selectedOatcClienteNombre?: string;
}

export default function PinValidationModal({
  isOpen,
  onClose,
  pin,
  setPin,
  pinError,
  handleConfirmPin,
  pendingAction,
  selectedOatcClienteNombre
}: PinValidationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Autorización Requerida" maxWidth="max-w-sm">
      <form onSubmit={handleConfirmPin} className="space-y-5 mt-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-4 rounded-full text-red-600">
            <Lock className="w-8 h-8" />
          </div>
        </div>
        <h3 className="font-bold text-gray-800 text-lg">Ingrese su PIN Operativo</h3>
        <p className="text-sm text-gray-500">
          {pendingAction === 'START_ATTENTION'
            ? `Autorización para INICIAR el servicio${selectedOatcClienteNombre ? ` de ${selectedOatcClienteNombre}` : ''}.`
            : pendingAction === 'END_ATTENTION'
            ? `Autorización para TERMINAR el servicio${selectedOatcClienteNombre ? ` de ${selectedOatcClienteNombre}` : ''}.`
            : pendingAction === 'PRE_COBRO'
            ? `Autorización para PRE-COBRAR${selectedOatcClienteNombre ? ` a ${selectedOatcClienteNombre}` : ''}.`
            : `Autorización requerida.`}
        </p>

        <input
          type="password"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full text-center text-3xl tracking-[1em] font-black border-b-2 border-gray-300 focus:border-indigo-600 focus:outline-none py-2 bg-transparent"
          autoFocus
        />
        {pinError && <p className="text-red-500 text-sm font-bold">PIN incorrecto. Intente nuevamente.</p>}

        <button
          type="submit"
          className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors shadow-md"
        >
          Verificar y Continuar
        </button>
      </form>
    </Modal>
  );
}
