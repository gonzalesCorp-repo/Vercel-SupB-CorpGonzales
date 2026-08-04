'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Coffee } from 'lucide-react';
import StreakCounter from '@/components/mobile/StreakCounter';
import HallOfFameBanner from '@/components/mobile/HallOfFameBanner';

export interface StaffInicioTabProps {
  hallOfFame: any[];
  agente: any;
  calcularFinCiclo: () => Date;
  gamProfile: any;
  inicioSubTab: 'alertas' | 'bar';
  setInicioSubTab: (tab: 'alertas' | 'bar') => void;
  handleAlertaRapidaWFM: (accion: string, estado: string) => void;
  handleNfcTagScan: () => void;
  barOrder: { cafe: number; infusion: number; agua: number };
  setBarOrder: React.Dispatch<React.SetStateAction<{ cafe: number; infusion: number; agua: number }>>;
  handleEnviarPedidoBar: () => void;
}

export default function StaffInicioTab({
  hallOfFame,
  agente,
  calcularFinCiclo,
  gamProfile,
  inicioSubTab,
  setInicioSubTab,
  handleAlertaRapidaWFM,
  handleNfcTagScan,
  barOrder,
  setBarOrder,
  handleEnviarPedidoBar
}: StaffInicioTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* 🏆 Hall of Fame Banner — Octalysis CD2+CD5 */}
      {hallOfFame.length > 0 && (
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
          streak={gamProfile.streak_asistencia}
          streakMax={gamProfile.streak_max}
        />
      )}
      
      {/* Sub Tabs: Alertas vs Bar */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
        <button
          onClick={() => setInicioSubTab('alertas')}
          className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
            inicioSubTab === 'alertas'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" /> Alertas
        </button>

        <button
          onClick={() => setInicioSubTab('bar')}
          className={`py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
            inicioSubTab === 'bar'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coffee className="w-4 h-4" /> Bar
        </button>
      </div>

      {/* SECCIÓN ALERTAS INMEDIATAS */}
      {inicioSubTab === 'alertas' && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="text-center space-y-1">
            <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
              🚨 PANEL DE ALERTAS INMEDIATAS
            </span>
            <p className="text-xs text-slate-400 font-medium">
              Presiona para notificar al panel de recepción al instante.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => handleAlertaRapidaWFM('YA LLEGUÉ', 'DISPONIBLE')}
              className="p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">👋</span>
              <span className="font-black text-xs text-slate-100 tracking-wider">YA LLEGUÉ</span>
            </button>

            <button 
              onClick={() => handleAlertaRapidaWFM('VOY A COMER', 'PAUSA')}
              className="p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 hover:border-amber-500/50 flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">🍕</span>
              <span className="font-black text-xs text-slate-100 tracking-wider">VOY A COMER</span>
            </button>

            <button 
              onClick={() => handleAlertaRapidaWFM('REGRESÉ', 'DISPONIBLE')}
              className="p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 hover:border-blue-500/50 flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">🔄</span>
              <span className="font-black text-xs text-slate-100 tracking-wider">REGRESÉ</span>
            </button>

            <button 
              onClick={() => handleAlertaRapidaWFM('ACABÓ MI DÍA', 'INACTIVO')}
              className="p-5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 hover:border-red-500/50 flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">🏁</span>
              <span className="font-black text-xs text-slate-100 tracking-wider">ACABÓ MI DÍA</span>
            </button>
          </div>

          {/* Botón de Autogestión vía Tag NFC */}
          <div className="pt-2">
            <button
              onClick={handleNfcTagScan}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-600/20 border border-emerald-400/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              🏷️ Escanear / Simular Tag NFC Sede (Auto-Marcado)
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN BAR */}
      {inicioSubTab === 'bar' && (
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="text-center space-y-1">
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
              🍹 SECCIÓN BAR
            </span>
            <p className="text-xs text-slate-400 font-medium">
              Agrega las cantidades deseadas y envía el pedido completo.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">☕</span>
                <span className="font-bold text-sm text-slate-200">Café</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setBarOrder(p => ({ ...p, cafe: Math.max(0, p.cafe - 1) }))} className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 font-black flex items-center justify-center active:scale-90 transition">-</button>
                <span className="font-black text-base w-4 text-center text-purple-400">{barOrder.cafe}</span>
                <button onClick={() => setBarOrder(p => ({ ...p, cafe: p.cafe + 1 }))} className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center shadow-lg active:scale-90 transition">+</button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍵</span>
                <span className="font-bold text-sm text-slate-200">Infusión</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setBarOrder(p => ({ ...p, infusion: Math.max(0, p.infusion - 1) }))} className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 font-black flex items-center justify-center active:scale-90 transition">-</button>
                <span className="font-black text-base w-4 text-center text-purple-400">{barOrder.infusion}</span>
                <button onClick={() => setBarOrder(p => ({ ...p, infusion: p.infusion + 1 }))} className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center shadow-lg active:scale-90 transition">+</button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💧</span>
                <span className="font-bold text-sm text-slate-200">Agua</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setBarOrder(p => ({ ...p, agua: Math.max(0, p.agua - 1) }))} className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 font-black flex items-center justify-center active:scale-90 transition">-</button>
                <span className="font-black text-base w-4 text-center text-purple-400">{barOrder.agua}</span>
                <button onClick={() => setBarOrder(p => ({ ...p, agua: p.agua + 1 }))} className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center shadow-lg active:scale-90 transition">+</button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleEnviarPedidoBar}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-sm shadow-xl shadow-purple-600/30 active:scale-95 transition-all mt-2"
          >
            Enviar Pedido a Recepción
          </button>
        </div>
      )}
    </motion.div>
  );
}
