'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, X, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { validarPinGerencialOpal } from '@/services/opalMobileService';

export interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agenteId: string;
  titulo?: string;
  descripcion?: string;
  accion: 'PAGO_LIQUIDACION' | 'ANULACION_COMPROBANTE' | 'CAMBIO_TURNO_FORZADO';
}

export function AdminPinModal({
  isOpen,
  onClose,
  onSuccess,
  agenteId,
  titulo = 'Autorización Gerencial Requerida',
  descripcion = 'Ingresa tu PIN de 4 dígitos para autorizar esta operación.',
  accion
}: AdminPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);

  if (!isOpen) return null;

  const handleTecla = (num: string) => {
    if (pin.length < 4) {
      const nuevoPin = pin + num;
      setPin(nuevoPin);
      setError('');
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(30);
      }
      if (nuevoPin.length === 4) {
        verificar(nuevoPin);
      }
    }
  };

  const handleBorrar = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(20);
    }
  };

  const verificar = async (pinAValidar: string) => {
    setVerificando(true);
    try {
      const res = await validarPinGerencialOpal({
        pin_ingresado: pinAValidar,
        agente_id: agenteId,
        accion_solicitada: accion
      });

      if (res.autorizado) {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.([40, 40, 40]);
        }
        setPin('');
        setError('');
        onSuccess();
        onClose();
      } else {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(200);
        }
        setError(res.mensaje);
        setPin('');
      }
    } catch (e: any) {
      setError('Error al validar PIN.');
      setPin('');
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 text-center relative"
      >
        <button
          type="button"
          onClick={() => {
            setPin('');
            setError('');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icono y Título */}
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {titulo}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-4 leading-relaxed">
            {descripcion}
          </p>
        </div>

        {/* Círculos Indicadores de PIN */}
        <div className="flex justify-center items-center gap-4 py-2">
          {[0, 1, 2, 3].map(idx => {
            const digitado = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all ${
                  digitado
                    ? 'bg-indigo-600 scale-110 shadow-md shadow-indigo-500/50'
                    : 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="text-xs text-rose-500 font-bold flex items-center justify-center gap-1.5 animate-shake">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Teclado Numérico Stitch 44px+ */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              disabled={verificando}
              onClick={() => handleTecla(num)}
              className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black text-xl flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setPin('');
              setError('');
            }}
            disabled={verificando || pin.length === 0}
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/40 text-slate-400 font-bold text-xs flex items-center justify-center transition active:scale-95 disabled:opacity-30 cursor-pointer"
          >
            Limpiar
          </button>

          <button
            type="button"
            disabled={verificando}
            onClick={() => handleTecla('0')}
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black text-xl flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            0
          </button>

          <button
            type="button"
            disabled={verificando || pin.length === 0}
            onClick={handleBorrar}
            className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-300 flex items-center justify-center transition active:scale-95 disabled:opacity-30 cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {verificando && (
          <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 pt-1 font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Validando autorización...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
