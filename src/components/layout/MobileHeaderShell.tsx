'use client';

import React from 'react';
import { Toolbar, ToolbarButton } from '../ui/motion-primitives/toolbar';
import { Search, LogOut, Radio, User } from 'lucide-react';

export interface MobileHeaderShellProps {
  agenteNombre: string;
  estacionNombre?: string;
  estadoOperativo?: string;
  badgeLabel: string;
  badgeBg: string;
  badgeDot: string;
  isNfcListening?: boolean;
  isNfcSupported?: boolean;
  onOpenTurno: () => void;
  onOpenSearch: () => void;
  onLogout: () => void;
  onOpenCuenta: () => void;
}

export function MobileHeaderShell({
  agenteNombre,
  estacionNombre = 'Estación de Piso',
  estadoOperativo = 'DISPONIBLE',
  badgeLabel,
  badgeBg,
  badgeDot,
  isNfcListening = false,
  isNfcSupported = false,
  onOpenTurno,
  onOpenSearch,
  onLogout,
  onOpenCuenta,
}: MobileHeaderShellProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-900 px-4 py-2.5 space-y-1.5 font-sans">
      <div className="flex items-center justify-between gap-3">
        {/* Colaborador Avatar & Info */}
        <div
          onClick={onOpenCuenta}
          className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              {agenteNombre ? agenteNombre.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            {/* Status Dot */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${badgeDot}`}
            />
          </div>

          <div className="leading-tight">
            <h1 className="text-xs font-black text-white truncate max-w-[130px] sm:max-w-[200px]">
              {agenteNombre}
            </h1>
            <p className="text-[10px] text-slate-400 truncate max-w-[130px] sm:max-w-[200px]">
              {estacionNombre}
            </p>
          </div>
        </div>

        {/* Toolbar de Acciones Rápidas */}
        <div className="flex items-center gap-2">
          {/* Badge Estado */}
          <button
            onClick={onOpenTurno}
            className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${badgeBg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badgeDot} animate-pulse`} />
            <span>{badgeLabel.split(' ')[0]}</span>
          </button>

          <Toolbar>
            <ToolbarButton
              icon={<Search className="w-3.5 h-3.5" />}
              onClick={onOpenSearch}
              title="Búsqueda rápida"
            />
            <ToolbarButton
              icon={<LogOut className="w-3.5 h-3.5" />}
              onClick={onLogout}
              title="Cerrar sesión"
            />
          </Toolbar>
        </div>
      </div>

      {/* Sensor NFC en vivo */}
      {isNfcSupported && isNfcListening && (
        <div className="flex items-center justify-between text-[9px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20">
          <span className="flex items-center gap-1 font-semibold">
            <Radio className="w-2.5 h-2.5 animate-pulse" /> Antena NFC activa
          </span>
          <span className="text-slate-400">Toca tag para marcar</span>
        </div>
      )}
    </header>
  );
}
