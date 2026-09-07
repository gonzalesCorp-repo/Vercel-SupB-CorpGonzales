'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { KioskModo } from './types';
import { TenantBranding } from '@/config/branding';

export interface KioskHeaderProps {
  branding: TenantBranding;
  modo: KioskModo;
  onVolverHome: () => void;
}

export function KioskHeader({ branding, modo, onVolverHome }: KioskHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-4 select-none">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20 overflow-hidden">
          <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden">
            {branding.logoUrl ? (
              <Image 
                src={branding.logoUrl} 
                alt={branding.brandName} 
                width={48}
                height={48}
                priority
                className="w-full h-full object-cover rounded-2xl" 
              />
            ) : (
              <span className="text-white font-black text-xl">{branding.logoLetter}</span>
            )}
          </div>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            {branding.brandName} Totem
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full uppercase">
              Dual Kiosk 2.0
            </span>
          </h1>
          <p className="text-xs text-slate-400">Terminal VIP de Clientes & Estación Operativa de Staff</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {modo !== 'HOME' && (
          <button
            type="button"
            onClick={onVolverHome}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </button>
        )}
        <Link
          href="/login"
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white px-3 py-2 rounded-xl text-xs transition-all"
        >
          Salir al Login
        </Link>
      </div>
    </div>
  );
}
