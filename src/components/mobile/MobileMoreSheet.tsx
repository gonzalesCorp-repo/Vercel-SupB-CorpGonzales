'use client';

import React from 'react';
import { DollarSign, BarChart3, Bell, Coffee, X, LogOut, Sparkles, ChevronRight, Disc, Sliders, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';

export type MoreToolOption = 'historial' | 'liquidacion' | 'asistencia' | 'bar';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: MoreToolOption) => void;
  onToggleIpodMode?: () => void;
  onLogout?: () => void;
}

export function MobileMoreSheet({ isOpen, onClose, onSelectOption, onToggleIpodMode, onLogout }: MobileMoreSheetProps) {
  const userRol = useAppStore((state) => state.userRol);
  if (!isOpen) return null;

  const items = [
    {
      id: 'historial' as const,
      title: 'Historial & Auditoría',
      desc: 'Atenciones, insumos pedidos vs pesados y precios',
      icon: BarChart3,
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    {
      id: 'liquidacion' as const,
      title: 'Mi Liquidación & Pagos',
      desc: 'Estado de cuenta continuo, adelantos y comprobantes',
      icon: DollarSign,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'asistencia' as const,
      title: 'Asistencia & Web NFC',
      desc: 'Marcar llegada, refrigerio, retorno y salida',
      icon: Bell,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    },
    {
      id: 'bar' as const,
      title: 'Bar & Cafetería',
      desc: 'Bebidas de cortesía para el cliente en estación',
      icon: Coffee,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950/80 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] sm:rounded-3xl border-t sm:border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl transition-colors duration-200"
      >
        {/* Header Sheet */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Herramientas Operativas</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Auditoría, Liquidaciones y Servicios</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleIpodMode && (
              <button onClick={onToggleIpodMode}
                title="Cambiar a modo iPod Click Wheel"
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs flex items-center gap-1 font-bold transition cursor-pointer"
              >
                <Disc className="w-3.5 h-3.5" />
                <span className="text-[10px]">iPod Mode</span>
              </button>
            )}

            <button onClick={onClose}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista de Herramientas */}
        <div className="space-y-2.5">
          {/* Opción Exclusiva para SuperAdmin */}
          {userRol?.toUpperCase() === 'SUPERADMIN' && (
            <Link
              href="/mobile/superadmin"
              onClick={onClose}
              className="w-full p-3.5 bg-purple-50 dark:bg-gradient-to-r dark:from-purple-950/60 dark:to-slate-950/80 hover:bg-purple-100 dark:hover:bg-slate-100 dark:bg-slate-800 border border-purple-200 dark:border-purple-500/40 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl border border-purple-200 dark:border-purple-500/30 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <span>👑 Centro de Mando SuperAdmin</span>
                    <span className="text-[9px] bg-purple-200 dark:bg-purple-500/30 px-1.5 py-0.2 rounded font-black text-purple-800 dark:text-purple-200">ROOT</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Auditoría, Destrabe de piso & Logs</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* Opción Exclusiva para Admin / SuperAdmin */}
          {['ADMIN', 'SUPERADMIN', 'SOPORTE'].includes(userRol?.toUpperCase() || '') && (
            <Link
              href="/mobile/config"
              onClick={onClose}
              className="w-full p-3.5 bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-950/40 dark:to-slate-950/70 hover:bg-emerald-100 dark:hover:bg-slate-100 dark:bg-slate-800 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.99] group shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>Configuración Quirúrgica de Sede</span>
                    <span className="text-[9px] bg-emerald-200 dark:bg-emerald-500/20 px-1.5 py-0.2 rounded font-black text-emerald-800 dark:text-emerald-300">ADMIN</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Toggles de módulos, cronjobs y SUNAT</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id}
                onClick={() => {
                  onSelectOption(item.id);
                  onClose();
                }}
                className="w-full p-3.5 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.99] group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-900 dark:hover:text-white transition-colors" />
              </button>
            );
          })}
        </div>

        {/* Cerrar Sesión */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500">Vaikuntha Staff OS v2.0</span>
          <button type="button"
            onClick={onLogout || (() => { window.location.href = '/login'; })}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
          </button>
        </div>

      </motion.div>
    </div>
  );
}
