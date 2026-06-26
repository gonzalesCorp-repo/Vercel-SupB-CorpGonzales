'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode, primaryColor, fontSize } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    
    // Aplicar Modo Oscuro
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Sobreescribir el color índigo (que usamos en casi todos los botones) 
    // con el color seleccionado por el usuario
    root.style.setProperty('--color-indigo-500', primaryColor);
    root.style.setProperty('--color-indigo-600', primaryColor);
    root.style.setProperty('--color-indigo-700', primaryColor);

    // Ajustar font size base en el body (o root)
    if (fontSize === 'small') root.style.fontSize = '14px';
    else if (fontSize === 'large') root.style.fontSize = '18px';
    else root.style.fontSize = '16px';
    
  }, [themeMode, primaryColor, fontSize, mounted]);

  // Retornamos sin estilos para evitar hydration mismatch, y en client inyectamos
  return <>{children}</>;
}
