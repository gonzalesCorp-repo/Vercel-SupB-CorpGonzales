import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type FontSize = 'small' | 'normal' | 'large';

interface ThemeState {
  themeMode: ThemeMode;
  primaryColor: string;
  fontSize: FontSize;
  
  setThemeMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: FontSize) => void;
  resetTheme: () => void;
}

const DEFAULT_COLOR = '#4f46e5'; // Indigo-600

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      primaryColor: DEFAULT_COLOR,
      fontSize: 'normal',
      
      setThemeMode: (mode) => set({ themeMode: mode }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setFontSize: (size) => set({ fontSize: size }),
      resetTheme: () => set({ themeMode: 'light', primaryColor: DEFAULT_COLOR, fontSize: 'normal' })
    }),
    {
      name: 'erp-gonzales-theme', // Unique name for localStorage
    }
  )
);
