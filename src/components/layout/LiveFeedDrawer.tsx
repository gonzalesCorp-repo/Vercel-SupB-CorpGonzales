'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Activity, Bell, BellOff, Scissors, Clock, CreditCard, 
  Armchair, Coffee, LogIn, Sparkles, UserPlus, CheckCircle2, 
  DollarSign, ChevronRight, Filter, ShieldAlert
} from 'lucide-react';
import { liveFeedService, LiveFeedItem, LiveFeedType } from '@/services/liveFeed';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface LiveFeedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sedeId: string | null;
}

const ICON_MAP: Record<string, any> = {
  Scissors,
  Clock,
  CreditCard,
  Armchair,
  Coffee,
  LogIn,
  Sparkles,
  UserPlus,
  CheckCircle2,
  DollarSign,
  Bell,
  Activity
};

const COLOR_STYLES: Record<string, { badge: string; border: string; glow: string; text: string; bg: string }> = {
  blue: {
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    glow: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20'
  },
  emerald: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    glow: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20'
  },
  amber: {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    glow: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20'
  },
  rose: {
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    border: 'border-rose-500/30 hover:border-rose-500/60',
    glow: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50/50 dark:bg-rose-950/20'
  },
  purple: {
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    border: 'border-purple-500/30 hover:border-purple-500/60',
    glow: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50/50 dark:bg-purple-950/20'
  }
};

export function LiveFeedDrawer({ isOpen, onClose, sedeId }: LiveFeedDrawerProps) {
  const [items, setItems] = useState<LiveFeedItem[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(liveFeedService.isSoundEnabled());

    if (!sedeId) return;

    const unsub = liveFeedService.subscribe(sedeId, (liveItems) => {
      setItems(liveItems);
    });

    return () => unsub();
  }, [sedeId]);

  const handleToggleSound = () => {
    const newState = liveFeedService.toggleSound();
    setSoundEnabled(newState);
    if (newState) {
      liveFeedService.reproducirChime('blue');
    }
  };

  const itemsFiltrados = items.filter(item => {
    if (filtroTipo === 'TODOS') return true;
    return item.tipo === filtroTipo;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[110] h-screen w-full sm:w-[480px] bg-white dark:bg-slate-900 shadow-2xl border-l border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                      Feed de Actividad en Vivo
                    </h3>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    Eventos y cambios operativos de Staff en tiempo real
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Sound Toggle Button */}
                <button onClick={handleToggleSound}
                  title={soundEnabled ? 'Silenciar notificaciones sonoras' : 'Activar sonido en vivo'}
                  className={`p-2.5 rounded-xl border transition-all ${
                    soundEnabled
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400'
                  } cursor-pointer`}
                >
                  {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </button>

                <button onClick={onClose}
                  className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto scrollbar-hide bg-white dark:bg-slate-900">
              {[
                { id: 'TODOS', label: 'Todos', count: items.length },
                { id: 'OATC', label: '🎫 Citas / OATC', count: items.filter(i => i.tipo === 'OATC').length },
                { id: 'WFM', label: '👥 Staff & WFM', count: items.filter(i => i.tipo === 'WFM').length },
                { id: 'PETICION', label: '🛎️ Peticiones', count: items.filter(i => i.tipo === 'PETICION').length },
                { id: 'ESPERA', label: '⏳ Esperas', count: items.filter(i => i.tipo === 'ESPERA').length }
              ].map(f => (
                <button key={f.id}
                  onClick={() => setFiltroTipo(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    filtroTipo === f.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{f.label}</span>
                  {f.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      filtroTipo === f.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                    }`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Timeline Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/30 dark:bg-slate-950/20">
              {itemsFiltrados.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 mb-3">
                    <Activity className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 dark:text-slate-300">
                    Sin actividad reciente en esta categoría
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-xs">
                    Los cambios de estado, inicios de atención y solicitudes del staff aparecerán aquí en tiempo real.
                  </p>
                </div>
              ) : (
                itemsFiltrados.map((item) => {
                  const style = COLOR_STYLES[item.color] || COLOR_STYLES.blue;
                  const IconComponent = ICON_MAP[item.icono] || Activity;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 ${style.bg} ${style.border} shadow-sm hover:shadow-md relative overflow-hidden group`}
                    >
                      {/* Left glow accent indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.glow}`} />

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${style.badge}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.badge}`}>
                                {item.tipo}
                              </span>
                              <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: es })}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug">
                              {item.mensaje}
                            </p>

                            {item.detalle && (
                              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 font-medium">
                                {item.detalle}
                              </p>
                            )}
                          </div>
                        </div>

                        {item.accionHref && (
                          <Link
                            href={item.accionHref}
                            onClick={onClose}
                            className="shrink-0 p-2 bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:hover:bg-indigo-600 transition-all flex items-center gap-1 shadow-sm group/btn"
                          >
                            <span className="hidden sm:inline">{item.accionTexto || 'Ver'}</span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Suscrito a Supabase Realtime</span>
              </span>
              <span className="font-mono text-[11px]">
                {items.length} eventos en memoria
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
