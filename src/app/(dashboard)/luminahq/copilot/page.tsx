'use client';

import React from 'react';
import { Sparkles, Bot, Zap, MessageSquare, TrendingUp, Cpu, Lightbulb } from 'lucide-react';
import Link from 'next/link';

export default function LuminaCopilotPage() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Banner Cabecera */}
      <div className="bg-gradient-to-r from-slate-900 via-fuchsia-950 to-slate-900 border border-fuchsia-500/30 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LuminaHQ AI Plug-in Oficial</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            Copiloto V.AI & Motor de Cross-Selling
          </h1>
          <p className="text-sm text-slate-300">
            Asistente conversacional de salón para recomendaciones en tiempo real de productos de mantenimiento y up-selling para el staff.
          </p>
        </div>
      </div>

      {/* Grid de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/50 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Asistente de Fórmula Química</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Cálculo de neutralización de reflejos cálidos no deseados según la altura de tono del cliente.
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
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Recomendador de Retail</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Sugerencia de shampoos sin sal y mascarillas ácidas post-servicio directamente en la App Móvil del Staff.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
              ⚡ En espera de integración SDK
            </span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Alertas Predictivas de Retención</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Detecta clientes con más de 25 días sin retoque de raíz o tratamiento de hidratación para disparar WhatsApps.
            </p>
          </div>
          <div className="pt-2">
            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50">
              ⚡ En espera de integración SDK
            </span>
          </div>
        </div>

      </div>

      {/* Tarjeta de Control */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-fuchsia-500" />
            Integración con Gamificación & Ventas
          </h2>
          <Link
            href="/caja/productividad"
            className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-bold hover:underline"
          >
            Productividad de Staff ➔
          </Link>
        </div>
        <p className="text-xs text-gray-600 dark:text-slate-300">
          Las recomendaciones del Copiloto V.AI se conectarán automáticamente a las comisiones y monedas de gamificación del colaborador en el momento en que se confirme la venta cruzada.
        </p>
      </div>

    </div>
  );
}
