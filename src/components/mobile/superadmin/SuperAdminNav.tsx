'use client';

import React from 'react';
import { ShieldCheck, Wrench, FileText, Sliders, LogOut } from 'lucide-react';

export type SuperAdminTab = 'mando' | 'destrabe' | 'logs' | 'config';

interface SuperAdminNavProps {
  activeTab: SuperAdminTab;
  onSelectTab: (tab: SuperAdminTab) => void;
  onLogout: () => void;
}

export function SuperAdminNav({ activeTab, onSelectTab, onLogout }: SuperAdminNavProps) {
  const tabs = [
    { id: 'mando' as const, label: 'Mando', icon: ShieldCheck, badge: 'Live' },
    { id: 'destrabe' as const, label: 'Destrabe', icon: Wrench, badge: 'Fix' },
    { id: 'logs' as const, label: 'Auditoría', icon: FileText },
    { id: 'config' as const, label: 'Sede Config', icon: Sliders }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800/90 px-3 py-2 max-w-md mx-auto select-none transition-colors">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all relative cursor-pointer ${
                isActive
                  ? 'text-purple-600 dark:text-purple-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors relative ${
                isActive ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 shadow-sm shadow-purple-500/20' : ''
              }`}>
                <Icon className="w-5 h-5" />
                {tab.badge && (
                  <span className={`absolute -top-1 -right-1 text-[8px] font-black px-1 py-0.2 rounded-full ${
                    tab.badge === 'Live' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400 absolute bottom-0" />
              )}
            </button>
          );
        })}

        {/* Salir */}
        <button onClick={onLogout}
          title="Cerrar Sesión"
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
        >
          <div className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-[9px]">Salir</span>
        </button>
      </div>
    </div>
  );
}
