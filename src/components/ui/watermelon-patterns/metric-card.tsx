'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '../motion-primitives/animated-number';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  badge?: string;
  badgeColor?: string;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  icon,
  trend,
  badge,
  badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  className = '',
  onClick,
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={onClick ? { y: -2, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
      onClick={onClick}
      className={`p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-lg flex flex-col justify-between space-y-3 transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              {icon}
            </div>
          )}
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
        </div>
        {badge && (
          <span
            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-xs ${badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          <AnimatedNumber
            value={value}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
          />
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg border ${
              trend.isPositive === true
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : trend.isPositive === false
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            {trend.isPositive === true ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend.isPositive === false ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>{trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}</span>
            {trend.label && (
              <span className="text-[9px] text-slate-400 ml-0.5">{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
