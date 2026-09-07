'use client';

import React from 'react';
import { Crown, Briefcase } from 'lucide-react';

export interface KioskHeroWelcomeProps {
  branding: any;
  onSelectModo: (modo: 'CLIENTE' | 'STAFF') => void;
}

export function KioskHeroWelcome({ branding, onSelectModo }: KioskHeroWelcomeProps) {
  return (
    <div className="my-auto max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 py-10 select-none">
      
      {/* Opción 1: CLIENTE VIP */}
      <button
        type="button"
        onClick={() => onSelectModo('CLIENTE')}
        aria-label="Confirmar llegada como Cliente VIP y acceder a experiencia de bienestar"
        className="group relative text-left bg-gradient-to-br from-purple-900/30 via-slate-900 to-slate-900 border border-purple-500/30 hover:border-purple-500/80 focus-visible:border-purple-500 focus-visible:ring-4 focus-visible:ring-purple-500/40 rounded-3xl p-8 space-y-6 cursor-pointer transition-all duration-300 shadow-2xl hover:scale-[1.02] active:scale-[0.99] outline-none"
      >
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
          <Crown className="w-8 h-8 text-amber-300" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">
            Experiencia VIP & Santuario de Bienestar
          </span>
          <h2 className="text-3xl font-black text-white">Soy Cliente</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Bienvenida a tu santuario. Confirma tu llegada, solicita tu café de especialidad o infusión zen de cortesía y acumula tus <strong className="text-purple-300">{branding?.loyalty?.pointsName || 'LuminaCoins'}</strong>.
          </p>
        </div>
        <div className="pt-4 flex items-center text-sm font-bold text-purple-400 gap-2">
          <span>✨ Confirmar Mi Llegada</span> →
        </div>
      </button>

      {/* Opción 2: STAFF */}
      <button
        type="button"
        onClick={() => onSelectModo('STAFF')}
        aria-label="Abrir terminal operativa para Equipo y Especialistas Staff"
        className="group relative text-left bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/40 hover:border-indigo-500/90 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/40 rounded-3xl p-8 space-y-6 cursor-pointer transition-all duration-300 shadow-2xl hover:scale-[1.02] active:scale-[0.99] outline-none"
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
          <Briefcase className="w-8 h-8 text-indigo-400" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">
            Para Especialistas & Concierge
          </span>
          <h2 className="text-3xl font-black text-white">Soy Equipo / Staff</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Terminal de servicio con acceso PIN: marca tu asistencia, gestiona atenciones en sillón, formula en laboratorio e interactúa con Opal AI.
          </p>
        </div>
        <div className="pt-4 flex items-center text-sm font-bold text-indigo-400 gap-2">
          <span>Abrir Estación Operativa</span> →
        </div>
      </button>

    </div>
  );
}
