'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface TouchActionButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function TouchActionButton({
  variant = 'primary',
  icon: Icon,
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: TouchActionButtonProps) {
  const baseStyles =
    'h-12 min-h-[48px] px-5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 select-none transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30 hover:shadow-indigo-600/40',
    secondary:
      'bg-slate-900/90 text-slate-900 dark:text-slate-200 border border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-100 dark:bg-slate-800 shadow-md backdrop-blur-xl',
    danger:
      'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/25 border border-red-400/30 hover:shadow-red-600/40',
    ghost:
      'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent',
  };

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) return Icon;
    const IconComponent = Icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="w-4 h-4 shrink-0" />;
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {renderIcon()}
      <span>{children}</span>
    </motion.button>
  );
}
