'use client';

import React from 'react';
import { Sparkles, Scan, Camera, Activity, Cpu, ShieldCheck, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';

export default function LuminaDiagnosticoPage() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Banner Cabecera */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LuminaHQ AI Plug-in Oficial</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            Diagnóstico Capilar & Dérmico Asistido por IA
          </h1>
          <p className="text-sm text-slate-300">
            Escaneo espectral, evaluación de porosidad capilar, densidad folicular y estado dérmico integrado al expediente del cliente.
          </p>
        </div>
      </div>

      {/* Estado del Plug-in & Placeholder de Alta Gama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Escáner Dermatoscópico</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Conexión por Web Bluetooth con microcámaras capilares y lámparas de Wood de 200x.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
              ⚡ En espera de integración SDK
            </span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Score de Salud & Porosidad</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Cálculo predictivo del tiempo de exposición y compatibilidad con decoloraciones y tintes.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
              ⚡ En espera de integración SDK
            </span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Recomendación Protocolar</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Sugerencia automática de fórmulas químicas para el Laboratorio y productos retail de venta cruzada.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
              ⚡ En espera de integración SDK
            </span>
          </div>
        </div>

      </div>

      {/* Tarjeta de Arquitectura */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500" />
            Arquitectura de Integración Plug-in LuminaHQ
          </h2>
          <Link
            href="/admin/config"
            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Configuración del Plug-in ➔
          </Link>
        </div>
        <p className="text-xs text-gray-600 dark:text-slate-300">
          Este módulo se encuentra alojado y preparado como un plug-in modular de primera clase en Vaikuntha ERP. La conexión con los endpoints neuronales de LuminaHQ se activará una vez completado el núcleo transaccional.
        </p>
      </div>

    </div>
  );
}
