'use client';

import React from 'react';
import { Sparkles, Dna, Check, ChevronRight } from 'lucide-react';
import { LuminaHqPluginConfig } from '@/types/clienteLifestyle';

interface ClienteHeaderShellProps {
  nombreCliente: string;
  pluginLumina: LuminaHqPluginConfig;
  onTogglePluginLumina: () => void;
  sedeNombre?: string;
}

export function ClienteHeaderShell({
  nombreCliente,
  pluginLumina,
  onTogglePluginLumina,
  sedeNombre = 'Gloss Salón & Relax'
}: ClienteHeaderShellProps) {
  // Saludo según hora del día
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const primerNombre = nombreCliente.split(' ')[0] || 'Invitado(a)';

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-colors px-4 py-3">
      <div className="flex items-center justify-between">
        
        {/* Saludo consciente & Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[1.5px] shrink-0">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center font-black text-pink-500 text-xs">
              {primerNombre.charAt(0)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                {saludo}, {primerNombre} 🌿
              </h1>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {pluginLumina.activo ? 'LuminaHQ Biocare Sanctuary' : `${sedeNombre} • Lifestyle`}
            </p>
          </div>
        </div>

        {/* Badge Interactivo de Conmutación Marca Blanca / + LuminaHQ */}
        <button
          type="button"
          onClick={onTogglePluginLumina}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider transition-all cursor-pointer active:scale-95 border ${
            pluginLumina.activo
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
          title="Haz clic para alternar entre Marca Blanca y + LuminaHQ"
        >
          {pluginLumina.activo ? (
            <>
              <Dna className="w-3 h-3 text-purple-500" />
              <span>+ LuminaHQ</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3 text-slate-400" />
              <span>Marca Blanca</span>
            </>
          )}
        </button>

      </div>
    </header>
  );
}
