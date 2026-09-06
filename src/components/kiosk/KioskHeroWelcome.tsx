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
      <div
        onClick={() => onSelectModo('CLIENTE')}
        className="group relative bg-gradient-to-br from-purple-900/30 via-slate-900 to-slate-900 border border-purple-500/30 hover:border-purple-500/80 rounded-3xl p-8 space-y-6 cursor-pointer transition-all duration-300 shadow-2xl hover:scale-[1.02] active:scale-[0.99]"
      >
        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
          <Crown className="w-8 h-8 text-amber-300" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Experiencia VIP para Clientes</span>
          <h2 className="text-3xl font-black text-white">Soy Cliente</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Registra tu llegada, consulta tu posición en sala, pide bebidas de cortesía y acumula tus <strong className="text-purple-300">{branding.loyalty?.pointsName || 'Puntos VIP'}</strong>.
          </p>
        </div>
        <div className="pt-4 flex items-center text-sm font-bold text-purple-400 gap-2">
          <span>Ingresar como Cliente</span> →
        </div>
      </div>

      {/* Opción 2: STAFF */}
      <div
        onClick={() => onSelectModo('STAFF')}
        className="group relative bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/40 hover:border-indigo-500/90 rounded-3xl p-8 space-y-6 cursor-pointer transition-all duration-300 shadow-2xl hover:scale-[1.02] active:scale-[0.99]"
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
          <Briefcase className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Para Especialistas & Equipo</span>
          <h2 className="text-3xl font-black text-white">Soy Equipo / Staff</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Estación táctil protegida por PIN: autoriza marcaciones físicas, atiende tu orden OATC, pide insumos lab y bar.
          </p>
        </div>
        <div className="pt-4 flex items-center text-sm font-bold text-indigo-400 gap-2">
          <span>Abrir Estación Operativa</span> →
        </div>
      </div>

    </div>
  );
}
