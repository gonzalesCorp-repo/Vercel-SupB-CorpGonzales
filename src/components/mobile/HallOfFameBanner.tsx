'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Timer, Flame, Sparkles } from 'lucide-react';

export interface HallOfFameEntry {
  agente_id: string;
  nombre: string;
  xp_ciclo: number;
  streak: number;
  titulo: string;
}

export interface HallOfFameBannerProps {
  hallOfFame: HallOfFameEntry[];
  currentAgenteId: string;
  cicloFin: Date;
}

export default function HallOfFameBanner({ hallOfFame = [], currentAgenteId, cicloFin }: HallOfFameBannerProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = cicloFin.getTime() - now;

      if (distance < 0) {
        setTimeLeft('Ciclo finalizado');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(`${days}d ${hours}h`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [cicloFin]);

  const getPositionStyles = (index: number) => {
    switch (index) {
      case 0: return 'bg-amber-50/80 dark:bg-yellow-500/10 border-amber-300 dark:border-yellow-500/40 text-amber-950 dark:text-amber-200 shadow-sm';
      case 1: return 'bg-slate-100/80 dark:bg-slate-500/10 border-slate-300 dark:border-slate-500/40 text-slate-800 dark:text-slate-200';
      case 2: return 'bg-orange-50/80 dark:bg-amber-800/10 border-orange-300 dark:border-amber-700/40 text-orange-950 dark:text-orange-200';
      default: return 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';
    }
  };

  const getTrophyColor = (index: number) => {
    switch (index) {
      case 0: return 'text-amber-500 dark:text-yellow-400';
      case 1: return 'text-slate-500 dark:text-slate-300';
      case 2: return 'text-amber-700 dark:text-amber-600';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 overflow-hidden relative shadow-sm w-full transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-500">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-slate-100 font-black text-sm">Salón de la Fama</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Puntualidad y Producción</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <Timer className="text-indigo-600 dark:text-indigo-400" size={13} />
          <span className="text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">{timeLeft || 'Ciclo activo'}</span>
        </div>
      </div>

      {hallOfFame.length === 0 ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/60 via-purple-50/40 to-indigo-50/60 dark:from-slate-950/60 dark:to-slate-900 border border-amber-200/60 dark:border-slate-800 text-center space-y-1.5">
          <div className="text-xl">🏆</div>
          <h4 className="text-xs font-black text-slate-900 dark:text-white">Ciclo de Reconocimiento Activo</h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Sé el primero en liderar el podio del salón con tu puntualidad de turno y atenciones de hoy.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {hallOfFame.slice(0, 3).map((entry, index) => {
            const isCurrentUser = entry.agente_id === currentAgenteId;
            
            return (
              <motion.div
                key={entry.agente_id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-2xl border backdrop-blur-sm relative overflow-hidden ${getPositionStyles(index)} ${isCurrentUser ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}`}
              >
                <div className="flex items-center space-x-3 z-10">
                  <div className="font-black text-base w-6 text-center">
                    <span className={getTrophyColor(index)}>#{index + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {entry.nombre} {isCurrentUser && <span className="text-indigo-600 dark:text-indigo-400 font-bold">(Tú)</span>}
                      </p>
                      {entry.streak > 0 && (
                        <div className="flex items-center text-orange-500 text-[10px] font-bold">
                          <Flame size={11} /> {entry.streak}
                        </div>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px]">{entry.titulo || 'Especialista de Salón'}</p>
                  </div>
                </div>
                
                <div className="text-right z-10">
                  <p className="text-indigo-600 dark:text-indigo-400 font-mono font-black text-xs">{entry.xp_ciclo || 0} XP</p>
                  <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Ciclo</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
