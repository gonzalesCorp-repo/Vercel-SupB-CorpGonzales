'use client';

import React from 'react';
import { Zap, Bell, Coffee, Users, Award } from 'lucide-react';

export type MobileTab = 'estacion' | 'alertas' | 'bar' | 'cola' | 'produccion';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
}

export function MobileBottomNav({ activeTab, onSelectTab }: MobileBottomNavProps) {
  const tabs = [
    { id: 'estacion' as const, label: 'Estación', icon: Zap },
    { id: 'alertas' as const, label: 'Asistencia', icon: Bell },
    { id: 'bar' as const, label: 'Bar', icon: Coffee },
    { id: 'cola' as const, label: 'Cola', icon: Users },
    { id: 'produccion' as const, label: 'Comisiones', icon: Award }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-3 py-2 max-w-md mx-auto transition-colors duration-200">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all relative cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${
                isActive ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : ''
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute bottom-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
