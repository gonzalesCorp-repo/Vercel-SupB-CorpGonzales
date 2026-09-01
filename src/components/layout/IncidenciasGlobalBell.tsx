'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Scale, Calendar, CheckCircle2, X, ChevronRight, ShieldAlert, Sparkles } from 'lucide-react';
import { Incidencia, obtenerIncidenciasActivas, marcarIncidenciaLeida, suscribirIncidencias } from '@/services/incidencias';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function IncidenciasGlobalBell() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = suscribirIncidencias((lista) => {
      setIncidencias(lista);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const noLeidas = incidencias.filter(i => !i.leido);

  return (
    <div className="relative" ref={wrapperRef}>
      
      {/* Botón de Campana / Buzón de Incidencias */}
      <button onClick={() => setIsOpen(!isOpen)}
        title="Buzón de Incidencias Operativas (Cobertura & Insumos)"
        className="relative p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-2xl transition-all border border-slate-800"
      >
        <Bell className="w-4 h-4 text-slate-300" />
        {noLeidas.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-pulse shadow-md shadow-rose-500/40">
            {noLeidas.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel de Incidencias */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Buzón de Incidencias Operativas
              </h4>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
              {noLeidas.length} pendientes
            </span>
          </div>

          {/* Lista de Incidencias */}
          <div className="p-3 space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar">
            {incidencias.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No hay incidencias reportadas en este momento.
              </div>
            ) : (
              incidencias.map((inc) => {
                const isCobertura = inc.tipo === 'COBERTURA_AGENDA';

                return (
                  <div
                    key={inc.id}
                    className={`p-3 rounded-2xl border transition-all space-y-2 ${
                      !inc.leido
                        ? isCobertura
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-rose-950/20 border-rose-500/40'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isCobertura ? (
                          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Scale className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <h5 className="text-xs font-bold text-slate-100 leading-tight">
                          {inc.titulo}
                        </h5>
                      </div>

                      {!inc.leido && (
                        <button onClick={() => marcarIncidenciaLeida(inc.id)}
                          title="Marcar como atendido"
                          className="text-[10px] text-slate-400 hover:text-emerald-400 font-bold shrink-0"
                        >
                          ✓ Atender
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {inc.descripcion}
                    </p>

                    {inc.accionSugerida && (
                      <div className="text-[10px] font-bold bg-slate-900 p-2 rounded-xl border border-slate-800 text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>Sugerencia: {inc.accionSugerida}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 font-mono">
                      <span>Por: {inc.origenAgenteNombre} ({inc.origenAgenteRol || 'STAFF'})</span>
                      <span>Hace {formatDistanceToNow(new Date(inc.fecha), { locale: es })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
}
