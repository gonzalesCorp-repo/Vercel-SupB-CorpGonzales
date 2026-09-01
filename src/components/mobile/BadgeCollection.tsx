'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock } from 'lucide-react'

export interface BadgeDef {
  id: string
  nombre: string
  icono: string
  descripcion: string
  xp_required: number
}

export interface BadgeCollectionProps {
  earnedBadges: string[]
  allBadges: BadgeDef[]
}

export default function BadgeCollection({ earnedBadges, allBadges }: BadgeCollectionProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null)

  return (
    <div className="bg-slate-100 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-5">
      <h3 className="text-slate-900 dark:text-slate-100 font-black text-lg mb-4">Insignias</h3>
      
      <div className="grid grid-cols-4 gap-4">
        {allBadges.map((badge, index) => {
          const isEarned = earnedBadges.includes(badge.id)
          
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => isEarned ? setSelectedBadge(badge === selectedBadge ? null : badge) : null}
              className="relative flex flex-col items-center group cursor-pointer"
            >
              <div 
                className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 transition-all duration-300 relative
                  ${isEarned 
                    ? 'bg-indigo-500/20 border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-110' 
                    : 'bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 grayscale opacity-60'
                  }
                `}
              >
                {badge.icono}
                {!isEarned && (
                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900/60 rounded-full flex items-center justify-center">
                    <Lock className="text-slate-500 dark:text-slate-400 w-6 h-6" />
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-bold text-center leading-tight line-clamp-2 ${isEarned ? 'text-slate-700 dark:text-slate-300' : 'text-slate-600'}`}>
                {badge.nombre}
              </span>
              
              {/* Tooltip inline */}
              <AnimatePresence>
                {selectedBadge?.id === badge.id && isEarned && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute z-20 top-full mt-2 w-48 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 shadow-xl left-1/2 -translate-x-1/2"
                  >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-100 dark:bg-slate-800 border-t border-l border-slate-300 dark:border-slate-700 rotate-45" />
                    <div className="relative z-10 text-center">
                      <p className="text-slate-900 dark:text-slate-100 font-bold text-sm mb-1">{badge.nombre}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">{badge.descripcion}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
