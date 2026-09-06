'use client';

import React from 'react';
import { Bell, RefreshCw, CheckCircle2, KeyRound, UserCheck, ChevronRight } from 'lucide-react';
import { ColaboradorKiosk } from './types';

export interface KioskStaffDirectoryProps {
  solicitudesAsistencia: any[];
  loadingData: boolean;
  onRefreshStaff: () => void;
  onSolicitarPinParaPeticion: (peticion: any) => void;
  colaboradores: ColaboradorKiosk[];
  onSeleccionarColaborador: (colab: ColaboradorKiosk) => void;
}

export function KioskStaffDirectory({
  solicitudesAsistencia,
  loadingData,
  onRefreshStaff,
  onSolicitarPinParaPeticion,
  colaboradores,
  onSeleccionarColaborador
}: KioskStaffDirectoryProps) {
  return (
    <div className="space-y-6 select-none">
      
      {/* Sección 1: Solicitudes Móviles en Vivo (Validación con PIN) */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Solicitudes Móviles en Sede</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full font-bold">
                  {solicitudesAsistencia.length} pendientes
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Toca para validar tu presencia física ingresando tu PIN personal</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onRefreshStaff}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {solicitudesAsistencia.length === 0 ? (
          <div className="py-4 text-center text-slate-500 space-y-1">
            <CheckCircle2 className="w-6 h-6 mx-auto text-slate-600" />
            <p className="text-xs font-bold">No hay solicitudes móviles pendientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {solicitudesAsistencia.map((pet) => (
              <div
                key={pet.id}
                className="p-3 bg-gradient-to-br from-slate-950 to-slate-900 border border-indigo-500/40 rounded-2xl flex flex-col justify-between gap-2.5 shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-black text-xs">
                    {pet.agentes?.nombre ? pet.agentes.nombre.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{pet.agentes?.nombre || 'Colaborador'}</h4>
                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.2 rounded-full border border-indigo-500/20">
                      {pet.config_peticiones?.nombre || 'Inicio de Turno'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSolicitarPinParaPeticion(pet)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>🔒 Validar con mi PIN (Físico)</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección 2: Directorio de Especialistas para Abrir Estación */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Selecciona tu Perfil de Especialista</h3>
              <p className="text-[11px] text-slate-400">Toca tu nombre para abrir tu estación táctil de trabajo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {colaboradores.map((colab) => {
            const opState = colab.estado_operativo || 'FUERA_DE_TURNO';
            const enTurno = opState === 'DISPONIBLE' || opState === 'OCUPADO';
            const enRefrigerio = opState === 'EN_REFRIGERIO';

            return (
              <div
                key={colab.id}
                onClick={() => onSeleccionarColaborador(colab)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 group active:scale-98 ${
                  enTurno 
                    ? 'bg-slate-950/90 border-emerald-500/40 hover:border-emerald-500/90 shadow-sm shadow-emerald-500/10' 
                    : enRefrigerio
                    ? 'bg-slate-950/90 border-amber-500/40 hover:border-amber-500/90'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-black text-sm">
                    {colab.nombre.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {colab.nombre}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{colab.especialidad || colab.rol}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className={`px-2 py-0.2 rounded-full font-bold uppercase ${
                    enTurno 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : enRefrigerio
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {opState}
                  </span>
                  <span className="text-indigo-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Abrir Estación <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
