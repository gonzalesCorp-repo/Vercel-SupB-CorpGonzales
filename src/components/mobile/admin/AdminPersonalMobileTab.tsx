'use client';

import React, { useState } from 'react';
import { 
  Users, Scissors, Clock, CheckCircle2, Coffee, 
  AlertCircle, ShieldCheck, RefreshCw, UserCheck, Search 
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface AdminPersonalMobileTabProps {
  colaboradores: any[];
  onRefrescar: () => void;
  onSolicitarCambioEstado?: (colaborador: any, nuevoEstado: string) => void;
}

export function AdminPersonalMobileTab({
  colaboradores,
  onRefrescar,
  onSolicitarCambioEstado
}: AdminPersonalMobileTabProps) {
  const [filtro, setFiltro] = useState<'TODOS' | 'EN_ATENCION' | 'DISPONIBLE' | 'REFRIGERIO'>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  const colabsFiltrados = colaboradores.filter(c => {
    const estado = c.estado_operativo || (c.esta_ocupado ? 'EN_ATENCION' : 'DISPONIBLE');
    const coincideFiltro = filtro === 'TODOS' || estado === filtro;
    const coincideBusqueda = !busqueda || c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || c.especialidad?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideFiltro && coincideBusqueda;
  });

  const enAtencionCount = colaboradores.filter(c => (c.estado_operativo || (c.esta_ocupado ? 'EN_ATENCION' : 'DISPONIBLE')) === 'EN_ATENCION').length;
  const disponiblesCount = colaboradores.filter(c => (c.estado_operativo || (c.esta_ocupado ? 'EN_ATENCION' : 'DISPONIBLE')) === 'DISPONIBLE').length;
  const refrigerioCount = colaboradores.filter(c => c.estado_operativo === 'REFRIGERIO' || c.estado_operativo === 'INICIO_REFRIGERIO').length;

  return (
    <div className="space-y-4 animate-in fade-in">
      
      {/* Barra de Filtros Rápidos Stitch */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFiltro('TODOS')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
            filtro === 'TODOS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Todos ({colaboradores.length})
        </button>

        <button
          type="button"
          onClick={() => setFiltro('EN_ATENCION')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
            filtro === 'EN_ATENCION'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          En Sillón ({enAtencionCount})
        </button>

        <button
          type="button"
          onClick={() => setFiltro('DISPONIBLE')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
            filtro === 'DISPONIBLE'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Disponibles ({disponiblesCount})
        </button>

        <button
          type="button"
          onClick={() => setFiltro('REFRIGERIO')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 ${
            filtro === 'REFRIGERIO'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Refrigerio ({refrigerioCount})
        </button>
      </div>

      {/* Buscador de Colaboradores */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o especialidad..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* Lista de Colaboradores */}
      <div className="space-y-2.5">
        {colabsFiltrados.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No se encontraron colaboradores en este estado.
          </div>
        ) : (
          colabsFiltrados.map((c) => {
            const estado = c.estado_operativo || (c.esta_ocupado ? 'EN_ATENCION' : 'DISPONIBLE');
            const esAtencion = estado === 'EN_ATENCION';
            const esDisponible = estado === 'DISPONIBLE';
            const esRefri = estado === 'REFRIGERIO' || estado === 'INICIO_REFRIGERIO';

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      esAtencion
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        : esDisponible
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {c.nombre?.slice(0, 2).toUpperCase() || 'ST'}
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {c.nombre}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {c.especialidad || c.rol || 'Especialista'} • {c.estacion_nombre || 'Sin estación'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                    esAtencion
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 animate-pulse'
                      : esDisponible
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}>
                    {esAtencion ? '✂️ En Sillón' : esDisponible ? '🟢 Disponible' : '☕ Refrigerio'}
                  </span>
                </div>

                {/* Info de orden si está en atención */}
                {c.oatc_activa && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                      Cliente: <strong>{c.oatc_activa.cliente_nombre || 'Cliente en Salón'}</strong>
                    </span>
                    <span className="text-[10px] font-mono text-indigo-500 font-bold shrink-0">
                      {c.oatc_activa.tiempo_min || '15'} min
                    </span>
                  </div>
                )}

                {/* Acciones Rápidas Gerenciales */}
                {onSolicitarCambioEstado && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onSolicitarCambioEstado(c, esDisponible ? 'EN_ATENCION' : 'DISPONIBLE')}
                      className="text-[10px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 transition active:scale-95 cursor-pointer"
                    >
                      Ajustar Estado
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
