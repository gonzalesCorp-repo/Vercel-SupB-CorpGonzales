'use client';

import { Settings, Palette, Moon, Sun, Type, RefreshCcw } from 'lucide-react';
import { useThemeStore, ThemeMode, FontSize } from '@/store/useThemeStore';

const COLOR_PRESETS = [
  { name: 'Índigo (Por Defecto)', hex: '#4f46e5', class: 'bg-[#4f46e5]' },
  { name: 'Rosa Vibrante', hex: '#e11d48', class: 'bg-[#e11d48]' },
  { name: 'Esmeralda', hex: '#059669', class: 'bg-[#059669]' },
  { name: 'Ámbar', hex: '#d97706', class: 'bg-[#d97706]' },
  { name: 'Pizarra Oscura', hex: '#475569', class: 'bg-[#475569]' },
  { name: 'Violeta Real', hex: '#7c3aed', class: 'bg-[#7c3aed]' },
];

export default function ConfiguracionVisualPage() {
  const { 
    themeMode, primaryColor, fontSize, 
    setThemeMode, setPrimaryColor, setFontSize, resetTheme 
  } = useThemeStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-2 md:p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Configuración Visual</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Personaliza tu experiencia. Estos cambios se guardan localmente en tu dispositivo.</p>
          </div>
        </div>
        <button 
          onClick={resetTheme}
          className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors font-semibold dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          <RefreshCcw className="w-4 h-4" />
          Restaurar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Color Primario */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700">
          <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2 dark:text-slate-100">
            <Palette className="w-5 h-5 text-indigo-500" />
            Color Primario
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Selecciona el color de acento para los botones y elementos principales.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {COLOR_PRESETS.map(color => (
              <button
                key={color.hex}
                onClick={() => setPrimaryColor(color.hex)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  primaryColor === color.hex 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-full mb-2 shadow-sm ${color.class}`} />
                <span className="text-xs font-semibold text-gray-700 text-center dark:text-slate-300 leading-tight">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Modo Oscuro */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700">
          <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2 dark:text-slate-100">
            <Moon className="w-5 h-5 text-indigo-500" />
            Apariencia
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Alterna entre el modo claro tradicional o el modo oscuro para reducir la fatiga visual.</p>
          
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setThemeMode('light')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                themeMode === 'light' 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' 
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:bg-slate-800 dark:border-slate-600'
              }`}
            >
              <Sun className="w-8 h-8 mb-2" />
              <span className="font-bold">Claro</span>
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                themeMode === 'dark' 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' 
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:bg-slate-800 dark:border-slate-600'
              }`}
            >
              <Moon className="w-8 h-8 mb-2" />
              <span className="font-bold">Oscuro (Beta)</span>
            </button>
          </div>
        </div>

        {/* Tamaño de Texto */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 md:col-span-2 dark:bg-slate-800 dark:border-slate-700">
          <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2 dark:text-slate-100">
            <Type className="w-5 h-5 text-indigo-500" />
            Tamaño de Letra
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Ajusta el tamaño global del texto para mayor comodidad.</p>
          
          <div className="flex gap-4 pt-2">
            {(['small', 'normal', 'large'] as FontSize[]).map(size => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all capitalize ${
                  fontSize === size 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' 
                    : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {size === 'small' ? 'Pequeño' : size === 'large' ? 'Grande' : 'Normal'}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
