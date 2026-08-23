'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Zap, Users, Calendar, Plus, History, BarChart2, User, DollarSign } from 'lucide-react';

export type MainTabType = 'inicio' | 'turno' | 'clientes' | 'agenda';
export type SecondaryViewType = 'historico' | 'metricas' | 'perfil' | 'liquidaciones' | null;

export interface FloatingBottomDockProps {
  mainTab: MainTabType;
  setMainTab: (tab: MainTabType) => void;
  activeSecondaryView: SecondaryViewType;
  setActiveSecondaryView: (view: SecondaryViewType) => void;
  isFabOpen: boolean;
  setIsFabOpen: (b: boolean) => void;
}

export default function FloatingBottomDock({
  mainTab,
  setMainTab,
  activeSecondaryView,
  setActiveSecondaryView,
  isFabOpen,
  setIsFabOpen,
}: FloatingBottomDockProps) {
  const tabsLeft = [
    { id: 'inicio' as const, label: 'Inicio', icon: Bell },
    { id: 'turno' as const, label: 'Turno', icon: Zap },
  ];

  const tabsRight = [
    { id: 'clientes' as const, label: 'Clientes', icon: Users },
    { id: 'agenda' as const, label: 'Agenda', icon: Calendar },
  ];

  const handleTabClick = (tabId: MainTabType) => {
    setActiveSecondaryView(null);
    setMainTab(tabId);
    if (isFabOpen) setIsFabOpen(false);
  };

  return (
    <>
      {/* FAB Overlay Backdrop & Secondary View Popover */}
      <AnimatePresence>
        {isFabOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFabOpen(false)}
              className="fixed inset-0 z-[45] bg-slate-950/70 backdrop-blur-sm"
            />

            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[50] flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.8 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                className="flex items-end justify-center gap-3 mb-2 flex-wrap max-w-xs"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsFabOpen(false);
                    setActiveSecondaryView('liquidaciones');
                  }}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-slate-900 border-2 border-emerald-500/50 text-emerald-400 shadow-2xl flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-100 bg-slate-900/90 border border-slate-700/80 px-2.5 py-0.5 rounded-full shadow-lg">
                    Comisiones
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsFabOpen(false);
                    setActiveSecondaryView('historico');
                  }}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-slate-900 border-2 border-indigo-500/50 text-indigo-400 shadow-2xl flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
                    <History className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-100 bg-slate-900/90 border border-slate-700/80 px-2.5 py-0.5 rounded-full shadow-lg">
                    Historial
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsFabOpen(false);
                    setActiveSecondaryView('metricas');
                  }}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-slate-900 border-2 border-purple-500/50 text-purple-400 shadow-2xl flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-100 bg-slate-900/90 border border-slate-700/80 px-2.5 py-0.5 rounded-full shadow-lg">
                    Métricas
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsFabOpen(false);
                    setActiveSecondaryView('perfil');
                  }}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full bg-slate-900 border-2 border-pink-500/50 text-pink-400 shadow-2xl flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-100 bg-slate-900/90 border border-slate-700/80 px-2.5 py-0.5 rounded-full shadow-lg">
                    Perfil
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Glassmorphism Bottom Dock */}
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto rounded-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 shadow-2xl p-2 flex justify-around items-center">
        {tabsLeft.map((tab) => {
          const Icon = tab.icon;
          const isActive = mainTab === tab.id && activeSecondaryView === null;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* FAB Button */}
        <motion.button
          onClick={() => setIsFabOpen(!isFabOpen)}
          animate={{ rotate: isFabOpen ? 135 : 0 }}
          transition={{ duration: 0.3, ease: 'backOut' }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-black flex items-center justify-center shadow-lg shadow-purple-500/40 border-2 border-slate-950 cursor-pointer -my-2"
          aria-label="Abrir opciones de navegación"
        >
          <Plus className="w-6 h-6" />
        </motion.button>

        {tabsRight.map((tab) => {
          const Icon = tab.icon;
          const isActive = mainTab === tab.id && activeSecondaryView === null;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
