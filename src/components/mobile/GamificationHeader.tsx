import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Gem, LogOut } from 'lucide-react'

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
  onLogout?: () => void
}

export default function GamificationHeader({
  agente,
  profile,
  sedeNombre,
  onLogout,
}: GamificationHeaderProps) {
  const { xp_total, nivel, titulo, streak_asistencia, monedas } = profile

  // Basic calculation for next level
  const xp_current_level = (nivel - 1) * 1000
  const xp_next_level = nivel * 1000
  const progress = Math.min(100, Math.max(0, ((xp_total - xp_current_level) / (xp_next_level - xp_current_level)) * 100))

  return (
    <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 pb-3">
      <div className="flex items-center justify-between mb-3 gap-2">
        {/* Left: Avatar & Info */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-indigo-500 overflow-hidden flex items-center justify-center">
              {agente?.avatar_url ? (
                <img src={agente.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                  {agente?.nombre?.charAt(0) || 'A'}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-xs font-black px-1.5 py-0.5 rounded-full border border-slate-950">
              {nivel}
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="text-slate-900 dark:text-slate-100 font-bold leading-tight truncate">{agente?.nombre || 'Agente'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{sedeNombre}</p>
          </div>
        </div>

        {/* Right: Streak & Coins & Logout Button */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="flex items-center space-x-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <motion.div
              animate={streak_asistencia > 5 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Flame className={streak_asistencia > 0 ? "text-orange-500" : "text-slate-600"} size={16} />
            </motion.div>
            <span className="text-slate-900 dark:text-slate-200 font-bold text-xs">{streak_asistencia}</span>
          </div>
          <div className="flex items-center space-x-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <Gem className="text-cyan-400" size={16} />
            <span className="text-slate-900 dark:text-slate-200 font-bold text-xs">{monedas}</span>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all flex items-center gap-1 text-[11px] font-bold shrink-0 cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          )}
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
          <span className="text-slate-500 dark:text-slate-400">
            {xp_total} / {xp_next_level} XP
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
