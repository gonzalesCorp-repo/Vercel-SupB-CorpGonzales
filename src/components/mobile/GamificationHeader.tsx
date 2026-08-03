'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Gem } from 'lucide-react'

// types
export interface GamificationHeaderProps {
  agente: any
  profile: {
    xp_total: number
    nivel: number
    titulo: string
    streak_asistencia: number
    monedas: number
  }
  sedeNombre: string
}

export default function GamificationHeader({
  agente,
  profile,
  sedeNombre,
}: GamificationHeaderProps) {
  const { xp_total, nivel, titulo, streak_asistencia, monedas } = profile

  // Basic calculation for next level
  const xp_current_level = (nivel - 1) * 1000
  const xp_next_level = nivel * 1000
  const progress = Math.min(100, Math.max(0, ((xp_total - xp_current_level) / (xp_next_level - xp_current_level)) * 100))

  return (
    <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        {/* Left: Avatar & Info */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-indigo-500 overflow-hidden flex items-center justify-center">
              {agente?.avatar_url ? (
                <img src={agente.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-slate-300">
                  {agente?.nombre?.charAt(0) || 'A'}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-xs font-black px-1.5 py-0.5 rounded-full border border-slate-950">
              {nivel}
            </div>
          </div>
          <div>
            <h2 className="text-slate-100 font-bold leading-tight">{agente?.nombre || 'Agente'}</h2>
            <p className="text-slate-400 text-xs">{sedeNombre}</p>
          </div>
        </div>

        {/* Right: Streak & Coins */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <motion.div
              animate={streak_asistencia > 5 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Flame className={streak_asistencia > 0 ? "text-orange-500" : "text-slate-600"} size={18} />
            </motion.div>
            <span className="text-slate-200 font-bold text-sm">{streak_asistencia}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Gem className="text-cyan-400" size={18} />
            <span className="text-slate-200 font-bold text-sm">{monedas}</span>
          </div>
        </div>
      </div>

      {/* Progress & Badge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex items-center space-x-2">
            <span className="text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              {titulo}
            </span>
          </div>
          <span className="text-slate-400">
            {xp_total} / {xp_next_level} XP
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          />
        </div>
      </div>
    </div>
  )
}
