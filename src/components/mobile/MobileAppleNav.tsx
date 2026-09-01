'use client';

import React from 'react';
import { Calendar, Users, Layers, DollarSign, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export type MainHubTab = 'agenda' | 'cartera' | 'estacion' | 'liquidacion' | 'cuenta';

interface MobileAppleNavProps {
  activeHub: MainHubTab;
  onSelectHub: (hub: MainHubTab) => void;
}

export function MobileAppleNav({ activeHub, onSelectHub }: MobileAppleNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-900 px-3 pt-2 pb-2.5 safe-bottom max-w-md mx-auto select-none shadow-2xl transition-colors duration-200">
      <div className="flex items-center justify-around">
        
        {/* 1. Agenda */}
        <button onClick={() => onSelectHub('agenda')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all relative cursor-pointer ${
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
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all relative cursor-pointer ${
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

        {/* 3. ESTACIÓN (Hero Central Elevado) */}
        <button onClick={() => onSelectHub('estacion')}
          className="flex flex-col items-center -mt-5 relative group cursor-pointer"
        >
          <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all ${
            activeHub === 'estacion'
              ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-purple-600/40 scale-105 ring-4 ring-white dark:ring-slate-950'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 ring-4 ring-white dark:ring-slate-950'
          }`}>
            <Layers className="w-6 h-6" />
          </div>
          <span className={`text-[10px] font-black tracking-tight mt-1 ${
            activeHub === 'estacion' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}>
            Estación
          </span>
        </button>

        {/* 4. Liquidación */}
        <button onClick={() => onSelectHub('liquidacion')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all relative cursor-pointer ${
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
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all relative cursor-pointer ${
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
