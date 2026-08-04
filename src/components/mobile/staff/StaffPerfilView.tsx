'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, X, Edit3, Sun, Award, Heart } from 'lucide-react';
import StreakCounter from '@/components/mobile/StreakCounter';
import HallOfFameBanner from '@/components/mobile/HallOfFameBanner';
import BadgeCollection from '@/components/mobile/BadgeCollection';
import { BADGE_CATALOG, calcularFinCiclo } from '@/lib/gamification/config';
import { useUIStore } from '@/store/useUIStore';

export interface StaffPerfilViewProps {
  agente?: any;
  gamProfile?: any;
  hallOfFame?: any[];
  setShowKudosModal?: (val: boolean) => void;
  setKudosTargetId?: (id: string) => void;
  setKudosTargetName?: (name: string) => void;
  onClose?: () => void;
  onThemeToggle?: () => void;
}

export default function StaffPerfilView({
  agente,
  gamProfile,
  hallOfFame = [],
  setShowKudosModal,
  setKudosTargetId,
  setKudosTargetName,
  onClose
}: StaffPerfilViewProps) {
  const { showAlert } = useUIStore();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-xl">
        <h2 className="text-sm font-black text-slate-100 flex items-center gap-2">
          <User className="w-5 h-5 text-pink-400" /> PERFIL DEL OPERARIO
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 🏆 Hall of Fame Banner — Octalysis CD2+CD5 */}
      {hallOfFame && hallOfFame.length > 0 && (
        <HallOfFameBanner
          hallOfFame={hallOfFame.slice(0, 3).map(h => ({
            nombre: h.nombre,
            xp_ciclo: h.xp_ciclo,
            streak: h.streak_asistencia,
            titulo: h.titulo,
            agente_id: h.agente_id
          }))}
          currentAgenteId={agente?.id || ''}
          cicloFin={calcularFinCiclo()}
        />
      )}

      {/* 🔥 Streak Counter — Octalysis CD8 */}
      {gamProfile && (
        <StreakCounter
          streak={gamProfile.streak_asistencia || 0}
          streakMax={gamProfile.streak_max || 0}
        />
      )}

      {/* Card Principal de Perfil */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xl font-black text-white">{agente?.nombre || 'Koko Vascones'}</h3>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              Sede RD | ⏰ 9:00 am - 8:00 pm
            </p>
          </div>
          <button className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold">
            Editar
          </button>
        </div>

        {/* Campos Configuración */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-400">APODO (NICKNAME)</span>
            <span className="font-black text-white flex items-center gap-1">{agente?.nombre || 'Koko Vascones'} <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-400">PIN SECRETO</span>
            <span className="font-black text-white tracking-widest flex items-center gap-1">**** <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-400">DÍA DE DESCANSO</span>
            <span className="font-black text-emerald-400 flex items-center gap-1">Lunes <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-400">DNI</span>
            <span className="font-black text-slate-400 flex items-center gap-1">--- <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-400">CELULAR</span>
            <span className="font-black text-slate-400 flex items-center gap-1">--- <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-400">CUMPLEAÑOS</span>
            <span className="font-black text-slate-400 flex items-center gap-1">--- <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
          </div>

          <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-slate-400">GÉNERO</span>
            <span className="font-black text-slate-400 flex items-center gap-1">--- <Edit3 className="w-3.5 h-3.5 text-slate-500" /></span>
          </div>
        </div>

        {/* Botón Enviar Kudos a un Compañero */}
        <button 
          onClick={() => {
            if (setKudosTargetId && setKudosTargetName && setShowKudosModal) {
              setKudosTargetId(agente?.id || '');
              setKudosTargetName(agente?.nombre || 'Compañero');
              setShowKudosModal(true);
            }
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 active:scale-95 transition"
        >
          <Heart className="w-4 h-4 fill-current" /> Enviar Kudos Reconocimiento 💖
        </button>

        {/* Botón Cambiar Tema */}
        <button 
          onClick={() => showAlert('Modo de tema alternado', 'info')}
          className="w-full py-3.5 rounded-2xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <Sun className="w-4 h-4 text-amber-400" /> Modo Claro / Oscuro
        </button>
      </div>

      {/* 🏅 Badge Collection — Octalysis CD2+CD4 */}
      {gamProfile && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> MIS INSIGNIAS
          </h3>
          <BadgeCollection
            earnedBadges={gamProfile.badges || []}
            allBadges={BADGE_CATALOG.filter(b => !b.role_filter || b.role_filter.includes(agente?.rol || 'STAFF'))}
          />
        </div>
      )}
    </motion.div>
  );
}
