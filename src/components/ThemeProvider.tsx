'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/useThemeStore';
import { getSkinById } from '@/config/themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { 
    themeMode, 
    primaryColor, 
    fontSize, 
    fontFamily,
    uppercaseMode,
    nervProtocolEnabled, 
    evaTheme, 
    houdiniGlowEnabled,
    glowOpacity,
    cargarPreferenciasNube 
  } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sincronizar preferencias desde la nube
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('vaikuntha_user_email');
      if (email) {
        cargarPreferenciasNube(email);
      }
    }
  }, [cargarPreferenciasNube]);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    const isEvaActive = nervProtocolEnabled && evaTheme && evaTheme !== 'none';
    const activeSkin = isEvaActive ? getSkinById(evaTheme) : null;

    // 1. Manejo del Atributo data-theme y clase dark
    if (isEvaActive) {
      root.setAttribute('data-theme', evaTheme);
      root.classList.add('dark');
    } else {
      root.removeAttribute('data-theme');
      if (themeMode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }

    // 2. Inyección Dinámica de Variables de Color del Sistema
    let activePrimary = primaryColor;
    let activeAccent = primaryColor;
    let activeGlow = 'rgba(79, 70, 229, 0.3)';

    if (activeSkin) {
      activePrimary = activeSkin.palette.primary;
      activeAccent = activeSkin.palette.accent;
      activeGlow = activeSkin.palette.glow;
    }

    root.style.setProperty('--color-indigo-500', activePrimary);
    root.style.setProperty('--color-indigo-600', activePrimary);
    root.style.setProperty('--color-indigo-700', activePrimary);
    root.style.setProperty('--active-theme-primary', activePrimary);
    root.style.setProperty('--active-theme-accent', activeAccent);
    root.style.setProperty('--active-theme-glow', activeGlow);

    // 3. Variables de Control CSS Houdini Glow
    const effectiveGlowOpacity = houdiniGlowEnabled ? (glowOpacity ?? 0.6) : 0;
    root.style.setProperty('--glow-opacity', effectiveGlowOpacity.toString());

    // 4. Ajustar font size base (5 Niveles de Accesibilidad)
    if (fontSize === 'small') root.style.fontSize = '14px';
    else if (fontSize === 'large') root.style.fontSize = '18px';
    else if (fontSize === 'extra-large') root.style.fontSize = '20px';
    else if (fontSize === 'huge') root.style.fontSize = '22px';
    else root.style.fontSize = '16px';

    // 5. Ajustar Familia Tipográfica
    let fontStack = 'var(--font-inter), system-ui, -apple-system, sans-serif';
    if (fontFamily === 'jakarta') {
      fontStack = 'var(--font-plus-jakarta), system-ui, sans-serif';
    } else if (fontFamily === 'hyperlegible') {
      fontStack = "'Atkinson Hyperlegible', system-ui, -apple-system, sans-serif";
    } else if (fontFamily === 'mono') {
      fontStack = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    }
    root.style.setProperty('--active-font-family', fontStack);
    root.style.fontFamily = fontStack;

    // 6. Ajustar Modo Todo en MAYÚSCULAS
    if (uppercaseMode) {
      root.setAttribute('data-uppercase', 'true');
    } else {
      root.removeAttribute('data-uppercase');
    }
    
  }, [themeMode, primaryColor, fontSize, fontFamily, uppercaseMode, nervProtocolEnabled, evaTheme, houdiniGlowEnabled, glowOpacity, mounted]);

  return <>{children}</>;
}
