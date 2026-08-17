'use client';

import React, { useState } from 'react';
import { X, Beaker, Send, Plus, Sparkles } from 'lucide-react';

interface ModalSolicitarInsumosLabProps {
  isOpen: boolean;
  onClose: () => void;
  onEnviarPedido: (insumoTexto: string) => void;
}

export function ModalSolicitarInsumosLab({
  isOpen,
  onClose,
  onEnviarPedido
}: ModalSolicitarInsumosLabProps) {
  const [insumoTexto, setInsumoTexto] = useState('Tinte 7.1 Rubio Cenizo (45g) + Oxigenta 20V (60ml)');
  const [presets] = useState([
    'Tinte 7.1 Rubio Cenizo (45g) + Oxigenta 20V (60ml)',
    'Polvo Decolorante Plex (30g) + Oxigenta 30V (60ml)',
    'Matizador Orgánico 9.1 (30g) + Revelador 10V (60ml)',
    'Ampolla Fusio-Dose Reconstructora (1 dosis)'
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumoTexto.trim()) return;
    onEnviarPedido(insumoTexto.trim());
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-800 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-sky-400" />
            <h4 className="text-sm font-black text-white">Solicitar Insumos al Lab</h4>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Fórmula / Insumos Requeridos:
            </label>
            <textarea
              rows={3}
              value={insumoTexto}
              onChange={(e) => setInsumoTexto(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-3 text-xs placeholder:text-slate-500 focus:outline-none focus:border-sky-500 shadow-inner resize-none font-medium"
              placeholder="Ej. Tinte 7.1 (45g) + Oxigenta 20V (60ml)..."
              required
            />
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" /> Fórmulas Frecuentes:
            </p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInsumoTexto(preset)}
                  className={`w-full text-left p-2 rounded-xl border text-[11px] font-semibold transition ${
                    insumoTexto === preset
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-950/70 text-slate-400 border-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-sky-950 active:scale-95 transition"
            >
              <Send className="w-3.5 h-3.5" /> Enviar Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
