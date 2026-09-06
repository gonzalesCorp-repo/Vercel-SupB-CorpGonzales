'use client';

import React, { useState } from 'react';
import { Sparkles, QrCode, ShieldCheck, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StitchHolographicVipCardProps {
  cliente: {
    nombre: string;
    dni?: string;
    rango_vip?: string;
    puntos_lumina?: number;
  };
  beneficioTexto?: string;
}

export function StitchHolographicVipCard({
  cliente,
  beneficioTexto = '10% de beneficio en fórmulas botánicas y retail'
}: StitchHolographicVipCardProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const puntos = cliente.puntos_lumina || 380;
  const rango = cliente.rango_vip || (puntos > 500 ? 'Platino VIP' : puntos > 250 ? 'Oro VIP' : 'Miembro Frecuente');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] p-6 text-white shadow-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 border border-white/20"
      >
        {/* Halos holográficos de fondo */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-pink-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                  {rango}
                </span>
              </div>
              <h3 className="text-xl font-black mt-2 tracking-tight">{cliente.nombre}</h3>
              <p className="text-xs text-slate-300 font-mono">DNI: {cliente.dni || 'Sin registrar'}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white transition shadow-lg flex flex-col items-center gap-1 cursor-pointer active:scale-95"
            >
              <QrCode className="w-6 h-6 text-pink-300" />
              <span className="text-[9px] font-bold">Pase Kiosko</span>
            </button>
          </div>

          <div className="flex justify-between items-end pt-3 border-t border-white/10">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Saldo de Autocuidado
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-black text-amber-300 font-mono">{puntos}</span>
                <span className="text-xs font-bold text-slate-300">Puntos Conscientes</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Beneficio Activo
              </span>
              <span className="text-xs font-bold text-emerald-300 block max-w-[150px] truncate">
                {beneficioTexto}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal Pase QR Kiosko */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Pase Digital de Auto-Checkin
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Muestra este código ante la cámara del Kiosko de la sede al ingresar para registrar tu llegada.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner border border-slate-200">
                <div className="w-44 h-44 border-4 border-slate-900 rounded-xl flex flex-col items-center justify-center bg-slate-950 text-white font-mono p-2">
                  <QrCode className="w-24 h-24 text-white mb-2" />
                  <span className="text-[10px] font-black tracking-widest text-pink-400">
                    DNI: {cliente.dni || 'VIP'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar Pase
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
