'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';

export interface SegmentOption {
  id: string;
  label: string;
  badge?: string | number;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  layoutId?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
  layoutId,
}: SegmentedControlProps) {
  const defaultLayoutId = useId();
  const activeLayoutId = layoutId || `segmented_pill_${defaultLayoutId}`;

  return (
    <div
      className={`relative grid p-1 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-inner ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const isSelected = value === option.id;

        return (
          <button key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className="relative py-2.5 px-3 rounded-xl text-xs font-black transition-colors duration-200 flex items-center justify-center gap-2 select-none z-10 cursor-pointer"
          >
            {isSelected && (
              <motion.div
                layoutId={activeLayoutId}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/30 border border-indigo-400/30"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 transition-colors ${
                isSelected ? 'text-white font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-200 font-bold'
              }`}
            >
              {option.label}
            </span>
            {option.badge !== undefined && option.badge !== null && (
              <span
                className={`relative z-10 px-2 py-0.5 text-[10px] font-black rounded-full transition-colors ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
