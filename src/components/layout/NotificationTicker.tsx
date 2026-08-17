'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, Activity, Bell } from 'lucide-react';
import { liveFeedService, LiveFeedItem } from '@/services/liveFeed';
import { useAppStore } from '@/store/useAppStore';

interface NotificationTickerProps {
  onOpenDrawer?: () => void;
}

const DOT_COLORS: Record<string, { ping: string; dot: string; text: string }> = {
  blue: {
    ping: 'bg-blue-400',
    dot: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400'
  },
  emerald: {
    ping: 'bg-emerald-400',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  amber: {
    ping: 'bg-amber-400',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400'
  },
  rose: {
    ping: 'bg-rose-400',
    dot: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400'
  },
  purple: {
    ping: 'bg-purple-400',
    dot: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400'
  }
};

export function NotificationTicker({ onOpenDrawer }: NotificationTickerProps) {
  const { sedeActiva } = useAppStore();
  const [items, setItems] = useState<LiveFeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!sedeActiva?.id) return;

    const unsub = liveFeedService.subscribe(sedeActiva.id, (liveItems) => {
      setItems(liveItems);
      setCurrentIndex(0); // Reiniciar al primer ítem cuando llega un evento nuevo
    });

    return () => unsub();
  }, [sedeActiva?.id]);

  // Rotar notificaciones cada 6 segundos si hay más de 1 ítem
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsVisible(true);
      }, 400); // 400ms para la transición suave
      
    }, 6000);

    return () => clearInterval(interval);
  }, [items.length]);

  const currentItem = items.length > 0 ? items[currentIndex] : null;
  const dotColor = currentItem ? DOT_COLORS[currentItem.color] || DOT_COLORS.blue : DOT_COLORS.blue;

  return (
    <div className="flex-1 max-w-xl mx-4 hidden md:block">
      <div 
        onClick={onOpenDrawer}
        title="Clic para abrir el Feed de Actividad en Vivo"
        className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-full py-1.5 px-3.5 flex items-center gap-2.5 overflow-hidden shadow-inner relative group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
      >
        {/* Icono animado con ping dinámico */}
        <div className="relative flex items-center justify-center shrink-0">
          <Activity className={`w-3.5 h-3.5 ${dotColor.text}`} />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor.ping} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor.dot}`}></span>
          </span>
        </div>

        {/* Separador */}
        <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 shrink-0"></div>

        {/* Texto del Ticker */}
        <div className="flex-1 relative h-5 overflow-hidden flex items-center min-w-0">
          <p 
            className={`text-xs font-medium text-slate-700 dark:text-slate-300 truncate transition-all duration-400 transform ${
              isVisible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
            }`}
          >
            <span className={`font-black text-[11px] uppercase tracking-wider mr-1.5 ${dotColor.text}`}>
              EN VIVO:
            </span>
            {currentItem ? currentItem.mensaje : '✨ Sistema en línea • Esperando actividad en piso'}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {items.length > 0 && (
            <span className="text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.2 rounded-full">
              {currentIndex + 1}/{items.length}
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
