'use client';

import React from 'react';
import { Emisor, SerieComprobante } from '@/types/caja';

interface ComprobanteSelectorProps {
  emisores: Emisor[];
  series: SerieComprobante[];
  selectedEmisorId: string;
  setSelectedEmisorId: (id: string) => void;
  selectedTipo: string;
  setSelectedTipo: (tipo: string) => void;
  selectedSerieId: string;
  setSelectedSerieId: (id: string) => void;
}

export function ComprobanteSelector({
  emisores,
  series,
  selectedEmisorId,
  setSelectedEmisorId,
  selectedTipo,
  setSelectedTipo,
  selectedSerieId,
  setSelectedSerieId,
}: ComprobanteSelectorProps) {
  const handleEmisorChange = (emisorId: string) => {
    setSelectedEmisorId(emisorId);
    const defSerie = series.find(
      (s) => s.emisor_id === emisorId && s.tipo_comprobante === selectedTipo
    );
    setSelectedSerieId(defSerie ? defSerie.id : '');
  };

  const handleTipoChange = (tipo: string) => {
    setSelectedTipo(tipo);
    const defSerie = series.find(
      (s) => s.emisor_id === selectedEmisorId && s.tipo_comprobante === tipo
    );
    setSelectedSerieId(defSerie ? defSerie.id : '');
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
        Datos del Comprobante
      </h4>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            Emisor (Razón Social)
          </label>
          <select
            value={selectedEmisorId}
            onChange={(e) => handleEmisorChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium outline-none"
          >
            {emisores.map((emi) => (
              <option key={emi.id} value={emi.id}>
                {emi.razon_social} (RUC: {emi.ruc})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
            <select
              value={selectedTipo}
              onChange={(e) => handleTipoChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium outline-none"
            >
              <option value="BOLETA">Boleta</option>
              <option value="FACTURA">Factura</option>
              <option value="TICKET">Ticket Interno</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">Serie</label>
            <select
              value={selectedSerieId}
              onChange={(e) => setSelectedSerieId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium outline-none"
            >
              {series
                .filter(
                  (s) => s.emisor_id === selectedEmisorId && s.tipo_comprobante === selectedTipo
                )
                .map((ser) => (
                  <option key={ser.id} value={ser.id}>
                    {ser.serie} (Sig: {(ser.correlativo_actual + 1).toString().padStart(6, '0')})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
