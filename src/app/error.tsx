'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertOctagon, RotateCcw, Home, RefreshCw, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Registrar el error para auditoría y observabilidad
    console.error('[Global Error Boundary]:', error);
  }, [error]);

  const handleHardReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-rose-500 selection:text-white">
      {/* Glow / Ambient background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-rose-500/10 dark:bg-rose-600/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 text-center">
        {/* Icon & Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 mb-6 shadow-inner">
          <AlertOctagon className="w-8 h-8 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/50 mb-3">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          Fallo de Aplicación Detectado
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
          Ha ocurrido un problema inesperado
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
          Se ha interceptado una anomalía que impidió renderizar esta vista. Puedes intentar restaurar el estado o volver al panel principal.
        </p>

        {/* Digest Info */}
        {error.digest && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 mb-6">
            <Terminal className="w-3.5 h-3.5 opacity-70" />
            <span>ID Incidencia: {error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reintentar Acción
          </button>

          <button
            type="button"
            onClick={handleHardReload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar Página
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" />
            Inicio
          </Link>
        </div>

        {/* Expandable Technical Details */}
        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
          >
            <span>Detalles técnicos del error</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDetails && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-48 border border-slate-800 shadow-inner">
              <p className="font-semibold text-rose-400 mb-1">
                {error.name || 'Error'}: {error.message || 'Sin mensaje de error especificado'}
              </p>
              {error.stack && (
                <pre className="text-[11px] text-slate-400 whitespace-pre-wrap break-all mt-2">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
