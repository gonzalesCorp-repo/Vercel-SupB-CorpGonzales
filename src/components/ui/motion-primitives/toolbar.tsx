'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function Toolbar({ children, className = '' }: ToolbarProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export interface ToolbarButtonProps extends HTMLMotionProps<'button'> {
  icon?: React.ReactNode;
  label?: string;
  isActive?: boolean;
  badge?: string | number;
}

export function ToolbarButton({
  icon,
  label,
  isActive = false,
  badge,
  className = '',
  ...props
}: ToolbarButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
        isActive
          ? 'bg-indigo-600 text-white shadow-md'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
      } ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label && <span className="text-[11px] font-semibold">{label}</span>}
      {badge !== undefined && (
        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          {badge}
        </span>
      )}
    </motion.button>
  );
}
