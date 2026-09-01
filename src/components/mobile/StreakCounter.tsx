'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Snowflake } from 'lucide-react'

export interface StreakCounterProps {
  streak: number
  streakMax: number
}

export default function StreakCounter({ streak, streakMax }: StreakCounterProps) {
  const isZero = streak === 0

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-slate-100 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Background glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 blur-3xl rounded-full ${isZero ? 'bg-blue-500/10' : 'bg-orange-500/20'}`} />

      <motion.div
        animate={!isZero ? { scale: [1, 1.1, 1], rotate: [-2, 2, -2] } : {}}
        transition={!isZero ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
        className="relative z-10"
      >
        {isZero ? (
          <Snowflake className="text-blue-400 w-16 h-16 mb-2" />
        ) : (
          <Flame className="text-orange-500 w-16 h-16 mb-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
        )}
      </motion.div>

      <div className="relative z-10 text-center">
        {isZero ? (
          <>
            <h3 className="text-slate-700 dark:text-slate-300 font-bold text-lg mb-1">Sin racha</h3>
            <p className="text-slate-500 text-sm">❄️ Inicia tu racha hoy</p>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-center space-x-1">
              <span className="text-5xl font-black text-slate-900 dark:text-slate-100">{streak}</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">días</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">días consecutivos</p>
          </>
        )}
      </div>

      {!isZero && streakMax > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50 w-full text-center relative z-10">
          <p className="text-xs text-slate-500">Mejor racha: <span className="text-slate-700 dark:text-slate-300 font-bold">{streakMax}</span> días</p>
        </div>
      )}
    </motion.div>
  )
}
