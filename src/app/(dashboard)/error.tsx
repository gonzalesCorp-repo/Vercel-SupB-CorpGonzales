'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, CheckCircle2, RefreshCw, Terminal, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Registrar el error específico del módulo para depuración y telemetría
    console.error('[Dashboard Module Error]:', error);
  }, [error]);

  const handleFullRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-900/5 dark:shadow-black/30 transition-all">
        
        {/* Status Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sesión Activa & Datos Seguros</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Incidencia en este módulo</span>
          </div>
        </div>

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 mb-4">
          <Layers className="w-7 h-7" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Ocurrió una interrupción temporal en este módulo
        </h2>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-6">
          Tu sesión permanece abierta y segura en el sistema. Hubo un error de renderizado en esta vista específica, pero puedes intentar recargar el componente sin perder tu sesión activa.
        </p>

        {error.digest && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 mb-6">
            <Terminal className="w-3.5 h-3.5 opacity-70" />
            <span>Digest: {error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Recargar Componente
          </button>

          <button
            type="button"
            onClick={handleFullRefresh}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refrescar Navegador
          </button>
        </div>

        {/* Collapsible Error Details */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
          >
            <span>Ver diagnóstico técnico</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showDetails && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-40 border border-slate-800">
              <p className="font-semibold text-rose-400 mb-1">
                {error.name || 'Error'}: {error.message || 'Sin mensaje de error'}
              </p>
              {error.stack && (
                <pre className="text-[11px] text-slate-400 whitespace-pre-wrap break-all mt-1">
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
