/**
 * ===================================================
 * 🎨 VAIKUNTHA DESIGN TOKENS (SUITE MÓVIL & RESPONSIVE)
 * Tokens estandarizados para soporte dual Claro / Oscuro,
 * accesibilidad, z-index y ergonomía táctil.
 * ===================================================
 */

// Superficies y Tarjetas
export const SURFACE_PRIMARY = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200';
export const SURFACE_SECONDARY = 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors duration-200';
export const SURFACE_PAGE = 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200';
export const SURFACE_HEADER = 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-colors duration-200';
export const SURFACE_NAVBAR = 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 transition-colors duration-200';

// Tipografía y Contraste
export const TEXT_PRIMARY = 'text-slate-900 dark:text-white';
export const TEXT_SECONDARY = 'text-slate-500 dark:text-slate-400';
export const TEXT_MUTED = 'text-slate-400 dark:text-slate-500';

// Formularios e Inputs
export const INPUT_BASE = 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors duration-200';

// Botones e Interactividad Táctil
export const BTN_INTERACTIVE = 'cursor-pointer transition-colors duration-200 active:scale-[0.98]';
export const BTN_PRIMARY = 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition-all duration-200 active:scale-[0.98] shadow-md shadow-indigo-600/20';
export const BTN_SECONDARY = 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold cursor-pointer transition-all duration-200 active:scale-[0.98]';
export const BTN_DANGER = 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 font-bold cursor-pointer transition-all duration-200 active:scale-[0.98]';

// Modales y Drawers
export const MODAL_BACKDROP = 'fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm';
export const MODAL_CARD = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors duration-200';

// Escala Canónica de Z-Index
export const Z_HEADER = 'z-30';
export const Z_BOTTOM_NAV = 'z-40';
export const Z_MODAL = 'z-50';
export const Z_PICKER = 'z-[60]';
export const Z_SCANNER = 'z-[70]';
