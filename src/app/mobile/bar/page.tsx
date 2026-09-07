'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BarWorkspaceView } from '@/components/bar/BarWorkspaceView';

export default function MobileBarPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Barra de Navegación Superior para Retorno */}
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <Link
          href="/mobile/operacion"
          className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Estación</span>
        </Link>
        <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
          Módulo Bar
        </span>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1">
        <BarWorkspaceView />
      </main>
    </div>
  );
}
