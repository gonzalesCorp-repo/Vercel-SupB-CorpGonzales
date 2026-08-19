'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Sparkles, CheckCircle2, Radio, Bell, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { ZonaProximidad } from '@/services/proximidad';

interface ClientProximityBannerProps {
  zona: ZonaProximidad;
  distanciaMetros: number | null;
  sedeNombre?: string;
  estilistaNombre?: string;
  servicioNombre?: string;
  horaCita?: string;
  onCheckInConfirmado?: () => void;
  onSimularDistancia?: (metros: number) => void;
  geolocalizacionActiva?: boolean;
  onActivarGps?: () => void;
}

export function ClientProximityBanner({
  zona,
  distanciaMetros,
  sedeNombre = 'Sede Principal',
  estilistaNombre = 'Tu Especialista',
  servicioNombre = 'Servicio Agendado',
  horaCita = 'Hoy',
  onCheckInConfirmado,
  onSimularDistancia,
  geolocalizacionActiva = false,
  onActivarGps
}: ClientProximityBannerProps) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [checkInRealizado, setCheckInRealizado] = useState(false);

  const handleCheckIn = () => {
    setCheckInRealizado(true);
    if (onCheckInConfirmado) onCheckInConfirmado();
  };

  return (
    <div className="w-full space-y-3">
      {/* 🎯 Banner Principal de Proximidad */}
      <AnimatePresence mode="wait">
        {zona === 'EN_PUERTA' ? (
          <motion.div
            key="en_puerta"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl shadow-emerald-950/40 border border-emerald-400/30 relative overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/15 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> ¡Llegaste a la Sede!
                </span>
                <span className="text-xs text-emerald-100 font-bold">{distanciaMetros ?? 10} m</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl border border-white/20">
                ✨
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-base font-black text-white">¡Bienvenido(a) a {sedeNombre}!</h3>
              <p className="text-xs text-emerald-50 mt-1 leading-relaxed">
                Tu cita para <strong>{servicioNombre}</strong> con <strong>{estilistaNombre}</strong> está lista. La recepción ya fue notificada de tu llegada.
              </p>
            </div>

            {!checkInRealizado ? (
              <button
                type="button"
                onClick={handleCheckIn}
                className="mt-4 w-full py-3 bg-white text-emerald-900 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition cursor-pointer hover:bg-emerald-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Confirmar Check-in VIP en Sala
              </button>
            ) : (
              <div className="mt-3 py-2.5 px-3 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-emerald-100 border border-white/20">
                <CheckCircle2 className="w-4 h-4 text-white" /> ¡Check-in Confirmado! Pasa adelante.
              </div>
            )}
          </motion.div>
        ) : zona === 'CERCANO' ? (
          <motion.div
            key="cercano"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-950/30 border border-indigo-400/30 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 text-amber-300 animate-pulse" /> A {distanciaMetros ?? 200} m
                </span>
                <span className="text-xs text-indigo-100 font-medium">{sedeNombre}</span>
              </div>
              <span className="text-lg">📍</span>
            </div>

            <p className="text-xs text-indigo-100 mt-2 font-medium">
              ¡Casi llegas! Tu especialista <strong>{estilistaNombre}</strong> ya está acondicionando tu estación.
            </p>
          </motion.div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <span>Radar de Proximidad</span>
                  {geolocalizacionActiva && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </p>
                <p className="text-[10px] text-slate-400">
                  {distanciaMetros ? `A ${distanciaMetros} m de ${sedeNombre}` : `Rumbo a tu cita (${horaCita})`}
                </p>
              </div>
            </div>

            {!geolocalizacionActiva && onActivarGps && (
              <button
                type="button"
                onClick={onActivarGps}
                className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-[10px] font-black transition cursor-pointer"
              >
                Activar Radar
              </button>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* 🛠️ Simulador de Radar para Demos y Pruebas Sandbox */}
      {onSimularDistancia && (
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-2.5 space-y-2">
          <button
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className="w-full flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider hover:text-slate-200 transition"
          >
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-indigo-400" /> Simulador de Radar GPS (Demo Sandbox)
            </span>
            {showSimulator ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showSimulator && (
            <div className="grid grid-cols-3 gap-1.5 pt-1 animate-in fade-in">
              <button
                type="button"
                onClick={() => onSimularDistancia(1000)}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-[10px] font-bold text-center active:scale-95 transition"
              >
                🚗 1 km (Camino)
              </button>
              <button
                type="button"
                onClick={() => onSimularDistancia(200)}
                className="py-1.5 px-2 bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-500/40 text-indigo-300 rounded-xl text-[10px] font-bold text-center active:scale-95 transition"
              >
                📍 200m (Cercano)
              </button>
              <button
                type="button"
                onClick={() => onSimularDistancia(10)}
                className="py-1.5 px-2 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 rounded-xl text-[10px] font-bold text-center active:scale-95 transition"
              >
                🚪 10m (Puerta/BLE)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
