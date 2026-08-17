'use client';

import React from 'react';
import { FileText, Sparkles, FolderLock, UserCheck, History, Cpu, HeartPulse } from 'lucide-react';
import Link from 'next/link';

export default function LuminaFichasPage() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Banner Cabecera */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LuminaHQ AI Plug-in Oficial</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            Fichas Clínicas Inteligentes & Expedientes
          </h1>
          <p className="text-sm text-slate-300">
            Registro biométrico, antecedentes de alergias, fórmulas químicas históricas y consentimiento informado digital.
          </p>
        </div>
      </div>

      {/* Grid de Capacidades */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <FolderLock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Expediente Cifrado E2E</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Almacenamiento seguro de alergias, sensibilidad a tintes y notas de diagnóstico confidenciales.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
              ⚡ En espera de integración SDK
            </span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Trazabilidad de Fórmulas</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Historial cronológico de proporciones de colorantes (7.1 + 8.1 + 20 vol) con fotos antes y después.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
              ⚡ En espera de integración SDK
            </span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Firma de Consentimiento</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Firma táctil digital desde el Tótem Kiosko o tablet para servicios químicos de alta decoloración.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
              ⚡ En espera de integración SDK
            </span>
          </div>
        </div>

      </div>

      {/* Tarjeta Informativa */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-500" />
            Integración con Historial de OATCs
          </h2>
          <Link
            href="/recepcion/crm"
            className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
          >
            Directorio CRM ➔
          </Link>
        </div>
        <p className="text-xs text-gray-600 dark:text-slate-300">
          Las fichas clínicas de LuminaHQ se vincularán automáticamente al DNI y número de orden de atención del cliente para enriquecer el historial técnico del staff.
        </p>
      </div>

    </div>
  );
}
