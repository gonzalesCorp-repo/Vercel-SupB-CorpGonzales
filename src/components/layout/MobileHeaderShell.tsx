'use client';

import React from 'react';
import { Toolbar, ToolbarButton } from '../ui/motion-primitives/toolbar';
import { Search, LogOut, Radio, User, ChevronDown, MapPin } from 'lucide-react';

export interface MobileHeaderShellProps {
  agenteNombre: string;
  estacionNombre?: string;
  sedeNombre?: string;
  tieneMultiSede?: boolean;
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
  onOpenSelectorSede?: () => void;
}

function sanitizarNombreEstacion(nombre?: string | null): string {
  if (!nombre) return 'Sin estación asignada';
  const trimmed = nombre.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('drive.google.com') ||
    trimmed.includes('goo.gl')
  ) {
    return 'Sin estación asignada';
  }
  return trimmed;
}

function formatearLabelEstado(label: string, estado?: string): string {
  const s = (estado || label || '').toUpperCase();
  if (s.includes('DISPONIBLE')) return 'EN TURNO';
  if (s.includes('OCUPADO')) return 'EN ATENCIÓN';
  if (s.includes('REFRIGERIO')) return 'REFRIGERIO';
  if (s.includes('FUERA') || s.includes('INACTIVO') || s.includes('DESCONECTADO')) return 'FUERA DE TURNO';
  return label;
}

export function MobileHeaderShell({
  agenteNombre,
  estacionNombre = 'Estación de Piso',
  sedeNombre,
  tieneMultiSede = false,
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
  onOpenSelectorSede,
}: MobileHeaderShellProps) {
  const estacionLimpia = sanitizarNombreEstacion(estacionNombre);
  const estadoTexto = formatearLabelEstado(badgeLabel, estadoOperativo);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 font-sans transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Colaborador Avatar & Info */}
        <div
          onClick={onOpenCuenta}
          className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform min-w-0"
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              {agenteNombre ? agenteNombre.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            {/* Status Dot */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 ${badgeDot}`}
            />
          </div>

          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[180px]">
                {agenteNombre || 'Colaborador'}
              </h1>
              {/* Micro-indicador NFC activo (sutil, no invasivo) */}
              {isNfcSupported && isNfcListening && (
                <span
                  title="Antena NFC activa: Acerca un tag físico para marcar"
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0"
                >
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px] sm:max-w-[220px]">
              <span className="truncate">{estacionLimpia}</span>
              {sedeNombre && (
                <>
                  <span className="text-slate-300 dark:text-slate-600 shrink-0">•</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (tieneMultiSede && onOpenSelectorSede) {
                        e.stopPropagation();
                        onOpenSelectorSede();
                      }
                    }}
                    className={`inline-flex items-center gap-0.5 font-bold shrink-0 truncate max-w-[90px] sm:max-w-[130px] ${
                      tieneMultiSede
                        ? 'text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer'
                        : 'text-slate-400'
                    }`}
                    title={tieneMultiSede ? "Cambiar de sede operativa" : sedeNombre}
                  >
                    <span className="truncate">{sedeNombre}</span>
                    {tieneMultiSede && <ChevronDown className="w-2.5 h-2.5 shrink-0" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar de Acciones Rápidas */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Badge Estado */}
          <button
            type="button"
            onClick={onOpenTurno}
            className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${badgeBg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badgeDot} animate-pulse`} />
            <span className="whitespace-nowrap">{estadoTexto}</span>
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
    </header>
  );
}
