'use client';

import React from 'react';
import { 
  ArrowLeft, Briefcase, Beaker, Coffee, Clock, CreditCard, Play, Power, ChevronRight 
} from 'lucide-react';
import { ColaboradorKiosk, KioskStaffTab } from './types';
import { TipoMovimientoAsistencia } from '@/services/asistencias';

export interface KioskStaffStationProps {
  colaboradorActivo: ColaboradorKiosk;
  onCambiarColaborador: () => void;
  estacionSeleccionada: string;
  setEstacionSeleccionada: (v: string) => void;
  staffTab: KioskStaffTab;
  setStaffTab: (tab: KioskStaffTab) => void;
  loadingOatc: boolean;
  oatcActiva: any;
  onSolicitarPreCobro: () => void;
  labInsumo: string;
  setLabInsumo: (v: string) => void;
  labGramos: string;
  setLabGramos: (v: string) => void;
  labOxidante: string;
  setLabOxidante: (v: string) => void;
  labEnviando: boolean;
  onEnviarLab: (e: React.FormEvent) => void;
  barEnviando: boolean;
  onEnviarBar: (bebida: string) => void;
  onSolicitarPinParaMarcacion: (tipo: TipoMovimientoAsistencia) => void;
}

export function KioskStaffStation({
  colaboradorActivo,
  onCambiarColaborador,
  estacionSeleccionada,
  setEstacionSeleccionada,
  staffTab,
  setStaffTab,
  loadingOatc,
  oatcActiva,
  onSolicitarPreCobro,
  labInsumo,
  setLabInsumo,
  labGramos,
  setLabGramos,
  labOxidante,
  setLabOxidante,
  labEnviando,
  onEnviarLab,
  barEnviando,
  onEnviarBar,
  onSolicitarPinParaMarcacion
}: KioskStaffStationProps) {
  return (
    <div className="space-y-4 select-none">
      
      {/* Header de Estación */}
      <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 rounded-3xl border border-indigo-500/40 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-black text-lg">
            {colaboradorActivo.nombre.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">{colaboradorActivo.nombre}</h3>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full font-bold uppercase">
                {colaboradorActivo.rol}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Estado: <strong className="text-emerald-400">{colaboradorActivo.estado_operativo || 'DISPONIBLE'}</strong> • {estacionSeleccionada}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCambiarColaborador}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cambiar Especialista</span>
        </button>
      </div>

      {/* Barra de Pestañas Táctiles */}
      <div className="flex gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
        {[
          { id: 'oatc' as const, label: '🪑 Mi Estación & OATC', icon: Briefcase },
          { id: 'lab' as const, label: '🧪 Pedir Insumos Lab', icon: Beaker },
          { id: 'bar' as const, label: '🍹 Bar & Cafetería', icon: Coffee },
          { id: 'turno' as const, label: '🚨 Turno & Asistencia', icon: Clock }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStaffTab(tab.id)}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
              staffTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Mi Estación & OATC Activa */}
      {staffTab === 'oatc' && (
        <div className="space-y-4">
          {loadingOatc ? (
            <div className="p-12 text-center text-slate-400 font-bold">Cargando orden de atención...</div>
          ) : oatcActiva ? (
            <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Cliente en Atención</span>
                  <h4 className="text-xl font-black text-white mt-0.5">{oatcActiva.cliente_nombre || 'Cliente General'}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">OATC: #{oatcActiva.id?.slice(0, 8)}</span>
                </div>

                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase">
                  {oatcActiva.estado_proceso || 'EN_PROCESO'}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Servicios en Curso</span>
                <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  {oatcActiva.servicios && oatcActiva.servicios.length > 0 ? (
                    oatcActiva.servicios.map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-200">• {s.nombre}</span>
                        <span className="font-mono text-emerald-400 font-bold">S/ {Number(s.precio || 0).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Servicios generales asignados.</p>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-black text-white">
                    <span>Total OATC:</span>
                    <span className="text-sm text-emerald-400">S/ {Number(oatcActiva.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffTab('lab')}
                  className="p-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Beaker className="w-4 h-4 text-purple-400" />
                  <span>Pedir Insumos Lab</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStaffTab('bar')}
                  className="p-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Pedir Bebida Bar</span>
                </button>

                <button
                  type="button"
                  onClick={onSolicitarPreCobro}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/20 cursor-pointer col-span-2 sm:col-span-1 active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Solicitar Pre-Cobro</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">Estación Disponible</h4>
                <p className="text-xs text-slate-400 mt-1">No tienes clientes en atención activa en este momento.</p>
              </div>

              <div className="max-w-xs mx-auto space-y-2 text-left">
                <label htmlFor="kiosk_sillon_cabina" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  🪑 Seleccionar Sillón / Cabina
                </label>
                <select
                  id="kiosk_sillon_cabina"
                  name="kiosk_sillon_cabina"
                  value={estacionSeleccionada}
                  onChange={(e) => setEstacionSeleccionada(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white font-bold cursor-pointer"
                >
                  <option value="Sillón #01 (Entrada)">Sillón #01 (Entrada)</option>
                  <option value="Sillón #02 (Corte Clásico)">Sillón #02 (Corte Clásico)</option>
                  <option value="Sillón #04 (Central)">Sillón #04 (Central)</option>
                  <option value="Cabina Odontológica #02">Cabina Odontológica #02</option>
                  <option value="Mesa de Lavado / Prep">Mesa de Lavado / Prep</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Pedir Insumos Lab */}
      {staffTab === 'lab' && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Beaker className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Formulación de Insumos para Laboratorio</h4>
                <p className="text-[10px] text-slate-400">
                  {oatcActiva ? `Para: ${oatcActiva.cliente_nombre}` : 'Para la estación actual'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={onEnviarLab} className="space-y-3.5">
            <div>
              <label htmlFor="kiosk_lab_insumo" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Insumo / Tinte / Cosmecéutico
              </label>
              <input
                id="kiosk_lab_insumo"
                name="kiosk_lab_insumo"
                type="text"
                value={labInsumo}
                onChange={(e) => setLabInsumo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="kiosk_lab_gramos" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Gramos Tinte / Base (g)
                </label>
                <input
                  id="kiosk_lab_gramos"
                  name="kiosk_lab_gramos"
                  type="number"
                  value={labGramos}
                  onChange={(e) => setLabGramos(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label htmlFor="kiosk_lab_oxidante" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Gramos Oxidante / Activador (g)
                </label>
                <input
                  id="kiosk_lab_oxidante"
                  name="kiosk_lab_oxidante"
                  type="number"
                  value={labOxidante}
                  onChange={(e) => setLabOxidante(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={labEnviando}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {labEnviando ? 'Enviando a Laboratorio...' : '🧪 Enviar Formulación en Gramos al Despacho'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Bar & Cafetería */}
      {staffTab === 'bar' && (
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Bar & Cafetería de Cortesía</h4>
                <p className="text-[10px] text-slate-400">Solicita bebidas para el cliente en estación</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              '☕ Café Espresso Americano',
              '☕ Capuchino con Canela',
              '🧃 Jugo de Naranja Natural',
              '💧 Agua Mineral San Mateo',
              '🍵 Té Verde Antioxidante',
              '🥂 Cocktail de Bienvenida VIP'
            ].map(bebida => (
              <button
                key={bebida}
                type="button"
                disabled={barEnviando}
                onClick={() => onEnviarBar(bebida)}
                className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 rounded-2xl text-left transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <span className="text-xs font-bold text-white block">{bebida}</span>
                <span className="text-[9px] text-amber-400 font-bold block mt-1">Cortesía Salón</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Control de Turno & Asistencia */}
      {staffTab === 'turno' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Control de Turno & Asistencia</h4>
                <p className="text-[10px] text-slate-400">Marcaciones físicas protegidas por PIN de especialista</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onSolicitarPinParaMarcacion('ENTRADA')}
              className="p-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Iniciar Turno (PIN)</span>
            </button>

            <button
              type="button"
              onClick={() => onSolicitarPinParaMarcacion('INICIO_REFRIGERIO')}
              className="p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>Refrigerio (PIN)</span>
            </button>

            <button
              type="button"
              onClick={() => onSolicitarPinParaMarcacion('FIN_REFRIGERIO')}
              className="p-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 text-cyan-400" />
              <span>Retornar a Piso (PIN)</span>
            </button>

            <button
              type="button"
              onClick={() => onSolicitarPinParaMarcacion('SALIDA')}
              className="p-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Power className="w-4 h-4 text-rose-400" />
              <span>Marcar Salida (PIN)</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
