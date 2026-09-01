'use client';

import React from 'react';
import { 
  Sun, Moon, Type, Palette, Check, Eye 
} from 'lucide-react';
import { useThemeStore, FontSize, FontFamily } from '@/store/useThemeStore';

interface MobileAccessibilityCardProps {
  userId?: string;
  className?: string;
}

export function MobileAccessibilityCard({ userId, className = '' }: MobileAccessibilityCardProps) {
  const { 
    themeMode, setThemeMode, 
    fontSize, setFontSize, 
    fontFamily, setFontFamily,
    uppercaseMode, setUppercaseMode,
    primaryColor, setPrimaryColor 
  } = useThemeStore();

  const fontSizes: { id: FontSize; label: string; px: string; desc: string }[] = [
    { id: 'small', label: '14px', px: '14px', desc: 'Pequeño' },
    { id: 'normal', label: '16px', px: '16px', desc: 'Normal' },
    { id: 'large', label: '18px', px: '18px', desc: 'Grande' },
    { id: 'extra-large', label: '20px', px: '20px', desc: 'Extra' },
    { id: 'huge', label: '22px', px: '22px', desc: 'Gigante' },
  ];

  const fontFamilies: { id: FontFamily; name: string; sample: string }[] = [
    { id: 'inter', name: 'Inter', sample: 'UI Estándar' },
    { id: 'jakarta', name: 'Plus Jakarta', sample: 'Geométrica' },
    { id: 'hyperlegible', name: 'Atkinson', sample: 'Alta Legibilidad' },
    { id: 'mono', name: 'Mono', sample: 'Técnica' },
  ];

  const colors = [
    { name: 'Índigo', value: '#4f46e5' },
    { name: 'Rosa / Gloss', value: '#ec4899' },
    { name: 'Esmeralda', value: '#10b981' },
    { name: 'Violeta', value: '#8b5cf6' },
    { name: 'Naranja', value: '#f97316' },
    { name: 'Azul', value: '#3b82f6' }
  ];

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl transition-colors duration-200 ${className}`}>
      
      {/* Título de Sección */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Accesibilidad & Legibilidad Visual</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Personaliza la interfaz para una lectura cómoda</p>
          </div>
        </div>
      </div>

      {/* 1. MODO DE TEMA (CLARO / OSCURO) */}
      <div>
        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
          <Sun className="w-3.5 h-3.5 text-amber-500" /> Modo Visual (Tema)
        </label>
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setThemeMode('light', userId)}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              themeMode === 'light'
                ? 'bg-white text-amber-600 shadow-md border border-amber-200'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Modo Claro</span>
          </button>
          <button
            type="button"
            onClick={() => setThemeMode('dark', userId)}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              themeMode === 'dark'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-300" />
            <span>Modo Oscuro</span>
          </button>
        </div>
      </div>

      {/* 2. TAMAÑO DE FUENTE (5 NIVELES) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Tamaño de Letra
          </label>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
            {fontSizes.find(f => f.id === (fontSize || 'normal'))?.desc} ({fontSizes.find(f => f.id === (fontSize || 'normal'))?.px})
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {fontSizes.map((item) => {
            const isSelected = (fontSize || 'normal') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFontSize(item.id, userId)}
                className={`py-2 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="text-xs font-bold leading-tight">{item.label}</span>
                <span className="text-[9px] opacity-80 leading-none mt-0.5">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FAMILIA TIPOGRÁFICA */}
      <div>
        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
          Tipo de Letra (Tipografía)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {fontFamilies.map((f) => {
            const isSelected = (fontFamily || 'inter') === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFontFamily(f.id, userId)}
                className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-black shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="leading-tight">
                  <span className="text-xs font-bold block">{f.name}</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block">{f.sample}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MODO TODO EN MAYÚSCULAS */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="leading-tight pr-2">
          <span className="text-xs font-black text-slate-900 dark:text-white block">
            MODO TODO EN MAYÚSCULAS
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Convierte automáticamente todos los textos para una lectura clara y nítida.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setUppercaseMode(!uppercaseMode, userId)}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
            uppercaseMode ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {/* 5. COLOR DE ACENTO */}
      <div>
        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
          <Palette className="w-3.5 h-3.5 text-indigo-500" /> Color de Acento
        </label>
        <div className="flex items-center justify-between gap-2 px-1">
          {colors.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setPrimaryColor(c.value, userId)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                primaryColor === c.value 
                  ? 'scale-125 ring-2 ring-indigo-500 dark:ring-white shadow-lg' 
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            >
              {primaryColor === c.value && <Check className="w-4 h-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* 6. CAJA DE PREVISUALIZACIÓN EN VIVO */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          <Eye className="w-3.5 h-3.5" /> Previsualización en Vivo
        </div>
        <p className="text-slate-900 dark:text-white font-medium leading-snug">
          Gloss Salón & Relax: Atenciones activas en sillón 01. Corte, Cepillado & Balayage.
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          ABCDEF 0123456789 (S/ 120.00)
        </p>
      </div>

    </div>
  );
}
