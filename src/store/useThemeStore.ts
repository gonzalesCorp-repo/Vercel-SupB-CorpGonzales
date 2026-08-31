import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';
import { SKINS_CATALOG, getSkinById } from '@/config/themes';

export type ThemeMode = 'light' | 'dark';
export type FontSize = 'small' | 'normal' | 'large' | 'extra-large' | 'huge';
export type FontFamily = 'inter' | 'jakarta' | 'hyperlegible' | 'mono';
export type KioskTheme = 'lumina' | 'eva-01' | 'cyberpunk' | 'luxury';

interface ThemeState {
  themeMode: ThemeMode;
  primaryColor: string;
  fontSize: FontSize;
  fontFamily: FontFamily;
  uppercaseMode: boolean;
  nervProtocolEnabled: boolean;
  evaTheme: string;
  kioskTheme: KioskTheme;
  houdiniGlowEnabled: boolean;
  glowOpacity: number;
  
  setThemeMode: (mode: ThemeMode, userId?: string) => Promise<void>;
  setPrimaryColor: (color: string, userId?: string) => Promise<void>;
  setFontSize: (size: FontSize, userId?: string) => Promise<void>;
  setFontFamily: (font: FontFamily, userId?: string) => Promise<void>;
  setUppercaseMode: (enabled: boolean, userId?: string) => Promise<void>;
  setNervProtocolEnabled: (enabled: boolean, userId?: string) => Promise<void>;
  setEvaTheme: (theme: string, userId?: string) => Promise<void>;
  setHoudiniGlowEnabled: (enabled: boolean, userId?: string) => Promise<void>;
  setGlowOpacity: (opacity: number, userId?: string) => Promise<void>;
  setKioskTheme: (theme: KioskTheme) => void;
  cargarPreferenciasNube: (userEmailOrId: string) => Promise<void>;
  resetTheme: () => void;
}

const DEFAULT_COLOR = '#4f46e5'; // Indigo-600

const syncToSupabase = async (userId: string | undefined, partialData: Record<string, any>) => {
  if (!userId || typeof window === 'undefined') return;
  try {
    const supabase = createClient();
    const { data: agente } = await supabase.from('agentes').select('atributos').eq('id', userId).maybeSingle();
    const atributosActuales = agente?.atributos || {};
    const nuevasPreferencias = {
      ...(atributosActuales.preferencias_visuales || {}),
      ...partialData
    };

    await supabase.from('agentes').update({
      atributos: {
        ...atributosActuales,
        preferencias_visuales: nuevasPreferencias
      }
    }).eq('id', userId);
  } catch (err) {
    console.warn('[useThemeStore] No se pudo sincronizar con Supabase:', err);
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'dark',
      primaryColor: DEFAULT_COLOR,
      fontSize: 'normal',
      fontFamily: 'inter',
      uppercaseMode: false,
      nervProtocolEnabled: false,
      evaTheme: 'none',
      kioskTheme: 'lumina',
      houdiniGlowEnabled: true,
      glowOpacity: 0.6,
      
      setThemeMode: async (mode, userId) => {
        set({ themeMode: mode });
        await syncToSupabase(userId, { themeMode: mode });
      },

      setPrimaryColor: async (color, userId) => {
        set({ primaryColor: color });
        await syncToSupabase(userId, { primaryColor: color });
      },

      setFontSize: async (size, userId) => {
        set({ fontSize: size });
        await syncToSupabase(userId, { fontSize: size });
      },

      setFontFamily: async (font, userId) => {
        set({ fontFamily: font });
        await syncToSupabase(userId, { fontFamily: font });
      },

      setUppercaseMode: async (enabled, userId) => {
        set({ uppercaseMode: enabled });
        await syncToSupabase(userId, { uppercaseMode: enabled });
      },

      setNervProtocolEnabled: async (enabled, userId) => {
        const nextTheme = enabled ? (get().evaTheme === 'none' ? 'eva-01' : get().evaTheme) : 'none';
        set({ 
          nervProtocolEnabled: enabled,
          evaTheme: nextTheme
        });
        await syncToSupabase(userId, { 
          nervProtocolEnabled: enabled, 
          evaTheme: nextTheme 
        });
      },

      setEvaTheme: async (theme, userId) => {
        const isEnabled = theme !== 'none';
        set({ 
          evaTheme: theme,
          nervProtocolEnabled: isEnabled
        });
        await syncToSupabase(userId, { 
          evaTheme: theme, 
          nervProtocolEnabled: isEnabled 
        });
      },

      setHoudiniGlowEnabled: async (enabled, userId) => {
        set({ houdiniGlowEnabled: enabled });
        await syncToSupabase(userId, { houdiniGlowEnabled: enabled });
      },

      setGlowOpacity: async (opacity, userId) => {
        set({ glowOpacity: opacity });
        await syncToSupabase(userId, { glowOpacity: opacity });
      },

      setKioskTheme: (theme) => {
        set({ kioskTheme: theme });
      },

      cargarPreferenciasNube: async (userEmailOrId) => {
        if (!userEmailOrId || typeof window === 'undefined') return;
        try {
          const supabase = createClient();
          let query = supabase.from('agentes').select('id, atributos');
          if (userEmailOrId.includes('@')) {
            query = query.eq('email', userEmailOrId);
          } else {
            query = query.eq('id', userEmailOrId);
          }

          const { data } = await query.maybeSingle();
          const prefs = data?.atributos?.preferencias_visuales;
          if (prefs) {
            set((state) => ({
              themeMode: prefs.themeMode || state.themeMode,
              primaryColor: prefs.primaryColor || state.primaryColor,
              fontSize: prefs.fontSize || state.fontSize,
              fontFamily: prefs.fontFamily || state.fontFamily,
              uppercaseMode: prefs.uppercaseMode !== undefined ? prefs.uppercaseMode : state.uppercaseMode,
              nervProtocolEnabled: prefs.nervProtocolEnabled !== undefined ? prefs.nervProtocolEnabled : (prefs.evaTheme && prefs.evaTheme !== 'none'),
              evaTheme: prefs.evaTheme || state.evaTheme,
              kioskTheme: prefs.kioskTheme || state.kioskTheme,
              houdiniGlowEnabled: prefs.houdiniGlowEnabled !== undefined ? prefs.houdiniGlowEnabled : state.houdiniGlowEnabled,
              glowOpacity: prefs.glowOpacity !== undefined ? prefs.glowOpacity : state.glowOpacity
            }));
          }
        } catch (err) {
          console.warn('[useThemeStore] Error cargando preferencias:', err);
        }
      },

      resetTheme: () => set({ 
        themeMode: 'dark', 
        primaryColor: DEFAULT_COLOR, 
        fontSize: 'normal', 
        fontFamily: 'inter',
        uppercaseMode: false,
        nervProtocolEnabled: false,
        evaTheme: 'none',
        kioskTheme: 'lumina',
        houdiniGlowEnabled: true,
        glowOpacity: 0.6
      })
    }),
    {
      name: 'erp-gonzales-theme',
    }
  )
);
