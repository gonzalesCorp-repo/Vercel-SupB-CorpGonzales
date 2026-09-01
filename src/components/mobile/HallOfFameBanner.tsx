'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Timer, Flame } from 'lucide-react'

export interface HallOfFameEntry {
  agente_id: string
  nombre: string
  xp_ciclo: number
  streak: number
  titulo: string
}

export interface HallOfFameBannerProps {
  hallOfFame: HallOfFameEntry[]
  currentAgenteId: string
  cicloFin: Date
}

export default function HallOfFameBanner({ hallOfFame, currentAgenteId, cicloFin }: HallOfFameBannerProps) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = cicloFin.getTime() - now

      if (distance < 0) {
        setTimeLeft('Ciclo finalizado')
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      setTimeLeft(`${days}d ${hours}h`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000)
    return () => clearInterval(interval)
  }, [cicloFin])

  const getPositionStyles = (index: number) => {
    switch (index) {
      case 0: return 'bg-gradient-to-br from-yellow-500/20 to-yellow-700/20 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
      case 1: return 'bg-gradient-to-br from-slate-300/20 to-slate-500/20 border-slate-300/50'
      case 2: return 'bg-gradient-to-br from-amber-600/20 to-amber-800/20 border-amber-600/50'
      default: return 'bg-slate-100 dark:bg-slate-800/50 border-slate-700'
    }
  }

  const getTrophyColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-400'
      case 1: return 'text-slate-300'
      case 2: return 'text-amber-600'
      default: return 'text-slate-500'
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Trophy className="text-yellow-400" size={20} />
          <h3 className="text-slate-900 dark:text-slate-100 font-black text-lg">Salón de la Fama</h3>
        </div>
        <div className="flex items-center space-x-1 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
          <Timer className="text-indigo-400" size={14} />
          <span className="text-slate-300 text-xs font-medium">{timeLeft}</span>
        </div>
      </div>

      <div className="space-y-3">
        {hallOfFame.slice(0, 3).map((entry, index) => {
          const isCurrentUser = entry.agente_id === currentAgenteId
          
          return (
            <motion.div
              key={entry.agente_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-2xl border backdrop-blur-sm relative overflow-hidden ${getPositionStyles(index)} ${isCurrentUser ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : ''}`}
            >
              {isCurrentUser && (
                <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none" />
              )}
              
              <div className="flex items-center space-x-3 z-10">
                <div className="font-black text-lg w-6 text-center">
                  <span className={getTrophyColor(index)}>#{index + 1}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-slate-900 dark:text-slate-100 font-bold text-sm">{entry.nombre} {isCurrentUser && '(Tú)'}</p>
                    {entry.streak > 3 && (
                      <div className="flex items-center text-orange-500 text-xs font-bold">
                        <Flame size={12} /> {entry.streak}
                      </div>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{entry.titulo}</p>
                </div>
              </div>
              
              <div className="text-right z-10">
                <p className="text-indigo-400 font-black text-sm">{entry.xp_ciclo}</p>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">XP Ciclo</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
