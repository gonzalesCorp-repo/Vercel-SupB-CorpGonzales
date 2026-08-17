'use client';

import React from 'react';
import { X, Zap } from 'lucide-react';
import { OneTapRecipeGrid, RecetaPreset } from './OneTapRecipeGrid';

interface ModalOneTapRecipesProps {
  isOpen: boolean;
  onClose: () => void;
  onSeleccionarReceta: (receta: RecetaPreset) => void;
  onNfcScanned?: (tagUid: string, taraGramos: number) => void;
}

export function ModalOneTapRecipes({
  isOpen,
  onClose,
  onSeleccionarReceta,
  onNfcScanned
}: ModalOneTapRecipesProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-4xl space-y-4 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Catálogo de Fórmulas & Recetas 1-Tap</h3>
              <p className="text-[10px] text-slate-400">Selecciona una receta frecuente para precargar todos sus componentes y taras.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <OneTapRecipeGrid
          onSeleccionarReceta={(preset) => {
            onSeleccionarReceta(preset);
            onClose();
          }}
          onNfcScanned={onNfcScanned}
        />

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
