'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, ArrowRight, User, Sparkles, CheckCircle2, Scissors, Layers, Settings } from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  category: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items?: CommandItem[];
  placeholder?: string;
}

export function CommandPalette({
  open,
  onClose,
  items = [],
  placeholder = 'Buscar clientes, órdenes o acciones rápidas...',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  // Atajo de teclado en Desktop (Cmd+K / Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const filteredItems = items.filter((item) => {
    const term = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(term)) ||
      item.category.toLowerCase().includes(term)
    );
  });

  const categories = Array.from(new Set(filteredItems.map((item) => item.category)));

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:pt-20">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 font-sans"
          >
            {/* Input Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
              />
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">
                  <Command className="w-3 h-3" /> K
                </div>
              )}
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <div key={category} className="space-y-1">
                    <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      {category}
                    </span>
                    <div className="space-y-1">
                      {filteredItems
                        .filter((i) => i.category === category)
                        .map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              item.onSelect();
                              onClose();
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-2xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              {item.icon ? (
                                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-indigo-500 shrink-0">
                                  {item.icon}
                                </div>
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                              )}
                              <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                  {item.title}
                                </h4>
                                {item.subtitle && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
                          </button>
                        ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No se encontraron resultados para &ldquo;{query}&rdquo;
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
              <span>Navega y pulsa para ejecutar acción</span>
              <button
                onClick={onClose}
                className="font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Cerrar (Esc)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
