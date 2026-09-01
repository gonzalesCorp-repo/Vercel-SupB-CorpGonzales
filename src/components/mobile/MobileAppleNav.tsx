'use client';

import React from 'react';
import { Calendar, Users, Layers, DollarSign, User } from 'lucide-react';
import { motion } from 'framer-motion';

export type MainHubTab = 'agenda' | 'cartera' | 'estacion' | 'liquidacion' | 'cuenta';

interface MobileAppleNavProps {
  activeHub: MainHubTab;
  onSelectHub: (hub: MainHubTab) => void;
  mostrarCartera?: boolean;
}

export function MobileAppleNav({ activeHub, onSelectHub }: MobileAppleNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-900 px-3 sm:px-6 pt-2 pb-2.5 safe-bottom w-full  select-none shadow-2xl transition-colors duration-200">
      <div className="flex items-center justify-around">
        
        {/* 1. Agenda */}
        <button onClick={() => onSelectHub('agenda')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition-all relative cursor-pointer ${
            activeHub === 'agenda'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${
            activeHub === 'agenda' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : ''
          }`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Agenda</span>
          {activeHub === 'agenda' && (
            <motion.span layoutId="navDot" className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute bottom-0" />
          )}
        </button>

        {/* 2. Cartera CRM */}
        <button onClick={() => onSelectHub('cartera')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition-all relative cursor-pointer ${
            activeHub === 'cartera'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${
            activeHub === 'cartera' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : ''
          }`}>
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Cartera</span>
          {activeHub === 'cartera' && (
            <motion.span layoutId="navDot" className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute bottom-0" />
          )}
        </button>

        {/* 3. ESTACIÓN (Hero Central Elevado y Simétrico) */}
        <button onClick={() => onSelectHub('estacion')}
          className="flex flex-col items-center -mt-5 relative group cursor-pointer px-1"
        >
          <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-xl transition-all duration-300 relative ${
            activeHub === 'estacion'
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-500/40 scale-105'
              : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-200 hover:border-indigo-500/50'
          }`}>
            <Layers className="w-6 h-6" />
            {activeHub === 'estacion' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
              </span>
            )}
          </div>
          <span className={`text-[10px] tracking-tight mt-1 font-bold ${
            activeHub === 'estacion' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}>
            Estación
          </span>
        </button>

        {/* 4. Liquidación */}
        <button onClick={() => onSelectHub('liquidacion')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition-all relative cursor-pointer ${
            activeHub === 'liquidacion'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${
            activeHub === 'liquidacion' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : ''
          }`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Liquidación</span>
          {activeHub === 'liquidacion' && (
            <motion.span layoutId="navDot" className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute bottom-0" />
          )}
        </button>

        {/* 5. Mi Cuenta */}
        <button onClick={() => onSelectHub('cuenta')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition-all relative cursor-pointer ${
            activeHub === 'cuenta'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${
            activeHub === 'cuenta' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm' : ''
          }`}>
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Mi Cuenta</span>
          {activeHub === 'cuenta' && (
            <motion.span layoutId="navDot" className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute bottom-0" />
          )}
        </button>

      </div>
    </div>
  );
}
