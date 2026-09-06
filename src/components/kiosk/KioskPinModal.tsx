'use client';

import React from 'react';
import { X, KeyRound, AlertTriangle } from 'lucide-react';
import { ColaboradorKiosk } from './types';

export interface KioskPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitudParaValidar: any;
  colaboradorParaAccion: ColaboradorKiosk | null;
  tipoMovimientoParaAccion: any;
  pinIngresado: string;
  pinError: string;
  pinVerificando: boolean;
  onTeclaPin: (num: string) => void;
  onBorrarPin: () => void;
  onConfirmarPin: () => void;
}

export function KioskPinModal({
  isOpen,
  onClose,
  solicitudParaValidar,
  colaboradorParaAccion,
  tipoMovimientoParaAccion,
  pinIngresado,
  pinError,
  pinVerificando,
  onTeclaPin,
  onBorrarPin,
  onConfirmarPin
}: KioskPinModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-slate-800 space-y-4 shadow-2xl text-center relative animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-indigo-500/10">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">Validación de Presencia Física</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {solicitudParaValidar 
              ? `Autorizar: ${solicitudParaValidar.agentes?.nombre || 'Colaborador'}` 
              : `Colaborador: ${colaboradorParaAccion?.nombre || 'Especialista'}`}
          </p>
          <span className="inline-block text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full mt-1.5">
            {solicitudParaValidar?.config_peticiones?.nombre || tipoMovimientoParaAccion || 'Movimiento de Asistencia'}
          </span>
        </div>

        {pinError && (
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{pinError}</span>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-2xl py-3 text-center text-3xl font-mono tracking-widest text-indigo-400 font-bold h-14 flex items-center justify-center">
          {pinIngresado ? '• '.repeat(pinIngresado.length).trim() : <span className="text-slate-600 text-xs font-sans">Digita tu PIN (4 dígitos)...</span>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {['1','2','3','4','5','6','7','8','9','C','0','✓'].map((btn) => (
            <button
              key={btn}
              type="button"
              disabled={pinVerificando}
              onClick={() => {
                if (btn === 'C') onBorrarPin();
                else if (btn === '✓') onConfirmarPin();
                else onTeclaPin(btn);
              }}
              className={`py-3.5 rounded-2xl text-lg font-bold transition-all cursor-pointer active:scale-95 ${
                btn === '✓'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30'
                  : btn === 'C'
                  ? 'bg-slate-800 hover:bg-slate-700 text-rose-400'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-white'
              }`}
            >
              {btn === '✓' ? (pinVerificando ? '...' : '✓ Validar') : btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
