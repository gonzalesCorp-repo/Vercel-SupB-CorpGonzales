'use client';

import React, { useState } from 'react';
import { CreditCard, Printer } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Emisor, OatcCaja, PagoMixto, SerieComprobante } from '@/types/caja';
import { ComprobanteSelector } from './ComprobanteSelector';
import { PagoMixtoForm } from './PagoMixtoForm';
import { ThermalPrinterHubModal } from './ThermalPrinterHubModal';

interface CobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTicket: OatcCaja | null;
  isProcessing: boolean;
  handleProcesarCobro: () => Promise<void>;
  pagosMixtos: PagoMixto[];
  setPagosMixtos: React.Dispatch<React.SetStateAction<PagoMixto[]>>;
  emisores: Emisor[];
  series: SerieComprobante[];
  selectedEmisorId: string;
  setSelectedEmisorId: (id: string) => void;
  selectedTipo: string;
  setSelectedTipo: (tipo: string) => void;
  selectedSerieId: string;
  setSelectedSerieId: (id: string) => void;
}

export function CobroModal({
  isOpen,
  onClose,
  selectedTicket,
  isProcessing,
  handleProcesarCobro,
  pagosMixtos,
  setPagosMixtos,
  emisores,
  series,
  selectedEmisorId,
  setSelectedEmisorId,
  selectedTipo,
  setSelectedTipo,
  selectedSerieId,
  setSelectedSerieId,
}: CobroModalProps) {
  const [showPrinterHub, setShowPrinterHub] = useState(false);

  if (!selectedTicket) return null;

  const totalCalculado = selectedTicket.total_calculado || 0;
  const totalPagado = pagosMixtos.reduce((acc, p) => acc + (p.monto || 0), 0);
  const isButtonDisabled = isProcessing || Math.abs(totalCalculado - totalPagado) > 0.01;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Liquidación de Orden" maxWidth="max-w-md">
        <div className="mt-4">
          {/* Botón rápido para configurar impresora térmica */}
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setShowPrinterHub(true)}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-500" />
              <span>Configurar Impresora Térmica</span>
            </button>
          </div>

          {/* Selector de Comprobante (Emisor, Tipo, Serie) */}
          <ComprobanteSelector
            emisores={emisores}
            series={series}
            selectedEmisorId={selectedEmisorId}
            setSelectedEmisorId={setSelectedEmisorId}
            selectedTipo={selectedTipo}
            setSelectedTipo={setSelectedTipo}
            selectedSerieId={selectedSerieId}
            setSelectedSerieId={setSelectedSerieId}
          />

          {/* Detalle de Consumo */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Detalle de Consumo
            </h4>
            <ul className="space-y-2 mb-4">
              {(selectedTicket.punto_partida || []).map((item: any, i: number) => (
                <li key={i} className="flex justify-between text-sm text-slate-700 font-medium">
                  <span>
                    {item.cantidad || 1}x {item.servicio}
                  </span>
                  <span>${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-800">TOTAL</span>
              <span className="text-3xl font-black text-emerald-600">
                ${totalCalculado.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Formulario de Pagos Mixtos */}
          <PagoMixtoForm
            pagosMixtos={pagosMixtos}
            setPagosMixtos={setPagosMixtos}
            totalCalculado={totalCalculado}
          />

          {/* Botón de Confirmación */}
          <button
            onClick={handleProcesarCobro}
            disabled={isButtonDisabled}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-lg cursor-pointer active:scale-98"
          >
            <CreditCard className="w-6 h-6" />
            {isProcessing ? 'Procesando pago...' : 'Confirmar Pago Recibido'}
          </button>
        </div>
      </Modal>

      {/* Hub de Impresión Térmica Modal */}
      <ThermalPrinterHubModal
        isOpen={showPrinterHub}
        onClose={() => setShowPrinterHub(false)}
        sedeId={selectedTicket.sede_id}
      />
    </>
  );
}
