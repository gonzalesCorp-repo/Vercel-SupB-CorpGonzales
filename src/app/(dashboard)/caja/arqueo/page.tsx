'use client';

import React, { useState } from 'react';
import { ConteoCiego, procesarArqueoCiego, ResultadoArqueo } from '@/services/arqueo';
import { Banknote, CreditCard, Calculator, ShieldCheck, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ArqueoCiegoPage() {
  const [conteo, setConteo] = useState<ConteoCiego>({
    billetes200: 0,
    billetes100: 0,
    billetes50: 0,
    billetes20: 0,
    billetes10: 0,
    monedas5: 0,
    monedas2: 0,
    monedas1: 0,
    monedasCentimos: 0,
    totalVouchersTarjeta: 0,
    totalVouchersDigitales: 0
  });

  const [notas, setNotas] = useState('');
  const [resultado, setResultado] = useState<ResultadoArqueo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ConteoCiego, value: number) => {
    setConteo(prev => ({ ...prev, [field]: Math.max(0, value) }));
  };

  const handleArqueo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await procesarArqueoCiego(conteo, notas);
      setResultado(res);
    } catch (err: any) {
      alert(`Error al procesar arqueo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
              <Calculator className="w-6 h-6" />
            </div>
            <span>Arqueo Ciego de Caja</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1 font-medium">
            Realiza el conteo físico a ciegas de efectivo y vouchers al cierre de turno.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
          <ShieldCheck className="w-4 h-4" /> Modo Auditoría Ciega
        </div>
      </div>

      <form onSubmit={handleArqueo} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna 1: Billetes */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Banknote className="w-5 h-5 text-emerald-500" /> Conteo de Billetes
          </h2>
          <div className="space-y-3">
            {[200, 100, 50, 20, 10].map((den) => (
              <div key={den} className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Billetes S/. {den}</span>
                <input
                  type="number"
                  min="0"
                  value={conteo[`billetes${den}` as keyof ConteoCiego] || ''}
                  onChange={(e) => handleChange(`billetes${den}` as keyof ConteoCiego, parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 text-center font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500 transition"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Columna 2: Monedas y Vouchers */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CreditCard className="w-5 h-5 text-cyan-500" /> Monedas & Vouchers
          </h2>
          <div className="space-y-3">
            {[5, 2, 1].map((den) => (
              <div key={den} className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Monedas S/. {den}</span>
                <input
                  type="number"
                  min="0"
                  value={conteo[`monedas${den}` as keyof ConteoCiego] || ''}
                  onChange={(e) => handleChange(`monedas${den}` as keyof ConteoCiego, parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 text-center font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500 transition"
                />
              </div>
            ))}

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Monedas Céntimos (Total S/.)</span>
              <input
                type="number"
                step="0.10"
                min="0"
                value={conteo.monedasCentimos || ''}
                onChange={(e) => handleChange('monedasCentimos', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-24 text-center font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Vouchers Tarjeta (Total S/.)</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={conteo.totalVouchersTarjeta || ''}
                onChange={(e) => handleChange('totalVouchersTarjeta', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-24 text-center font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Yape / Plin (Total S/.)</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={conteo.totalVouchersDigitales || ''}
                onChange={(e) => handleChange('totalVouchersDigitales', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-24 text-center font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Columna 3: Cierre y Acciones */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white mb-3">Cierre de Arqueo</h2>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Notas de Cierre / Observaciones
            </label>
            <textarea
              rows={4}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Billete falso retenido o voucher pendiente..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-white text-xs shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--active-theme-primary, #10b981)' }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>Ejecutar Arqueo Ciego</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Resultados de Arqueo */}
      {resultado && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">Resultado del Arqueo Auditado</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comparativa entre conteo ciego físico y transacciones registradas.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Monto Físico Declarado</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">S/ {resultado.totalDeclarado.toFixed(2)}</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Monto Teórico Sistema</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">S/ {resultado.totalEsperadoSistema.toFixed(2)}</span>
            </div>
            <div className={`p-4 rounded-2xl border ${Math.abs(resultado.diferencia) < 0.01 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
              <span className="text-[10px] font-bold uppercase block">Varianza (Diferencia)</span>
              <span className="text-lg font-black">
                {resultado.diferencia >= 0 ? `+ S/ ${resultado.diferencia.toFixed(2)}` : `- S/ ${Math.abs(resultado.diferencia).toFixed(2)}`}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
