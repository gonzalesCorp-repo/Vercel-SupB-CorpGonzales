export type ThemeCategory = 'ANIME_MECHA' | 'GAMING_CYBERPUNK' | 'MINIMAL_LUXURY';

export interface ThemePalette {
  primary: string;
  accent: string;
  dark: string;
  light: string;
  glow: string;
  surface?: string;
  border?: string;
}

export interface SkinDefinition {
  id: string;
  name: string;
  pilotOrSubtitle: string;
  category: ThemeCategory;
  typeBadge: string;
  syncRate?: string;
  description: string;
  palette: ThemePalette;
}

export const SKINS_CATALOG: SkinDefinition[] = [
  // ==========================================
  // 🧬 COLECCIÓN ANIME & MECHA: PROTOCOLO NERV
  // ==========================================
  {
    id: 'eva-01',
    name: 'EVA-01 TEST TYPE',
    pilotOrSubtitle: 'Shinji Ikari',
    category: 'ANIME_MECHA',
    typeBadge: 'Prototipo de Prueba (Test Type)',
    syncRate: '100.0%',
    description: 'Morado icónico con acentos verde fluorescente y toques naranja de advertencia.',
    palette: {
      primary: '#6b3fa0',
      accent: '#76ff03',
      dark: '#1b1625',
      light: '#e8e0f5',
      glow: 'rgba(118, 255, 3, 0.45)'
    }
  },
  {
    id: 'eva-02',
    name: 'EVA-02 PRODUCTION',
    pilotOrSubtitle: 'Asuka Langley',
    category: 'ANIME_MECHA',
    typeBadge: 'Modelo de Producción en Masa',
    syncRate: '98.4%',
    description: 'Rojo carmesí ardiente, naranja fuego y acentos ópticos amarillos.',
    palette: {
      primary: '#c9182b',
      accent: '#ff5722',
      dark: '#201719',
      light: '#ffffff',
      glow: 'rgba(255, 87, 34, 0.45)'
    }
  },
  {
    id: 'eva-00-blue',
    name: 'EVA-00 REPAIRED',
    pilotOrSubtitle: 'Rei Ayanami',
    category: 'ANIME_MECHA',
    typeBadge: 'Prototipo Reparado (Azul)',
    syncRate: '96.2%',
    description: 'Azul cobalto profundo, blanco armadura y destellos de rojo óptico.',
    palette: {
      primary: '#19529e',
      accent: '#e53935',
      dark: '#161c24',
      light: '#eef3f8',
      glow: 'rgba(25, 82, 158, 0.45)'
    }
  },
  {
    id: 'eva-00-orange',
    name: 'EVA-00 PROTO',
    pilotOrSubtitle: 'Rei Inicial',
    category: 'ANIME_MECHA',
    typeBadge: 'Prototipo Inicial (Naranja)',
    syncRate: '94.0%',
    description: 'Naranja de pruebas proto, gris blindaje y visor cian.',
    palette: {
      primary: '#e65100',
      accent: '#00e5ff',
      dark: '#212121',
      light: '#fafafa',
      glow: 'rgba(230, 81, 0, 0.45)'
    }
  },
  {
    id: 'eva-mark06',
    name: 'MARK.06 SPACE',
    pilotOrSubtitle: 'Kaworu Nagisa',
    category: 'ANIME_MECHA',
    typeBadge: 'Unidad Autónoma Lunar',
    syncRate: '120.0%',
    description: 'Azul marino espacial, visores rojo carmesí y acabados dorado cobre.',
    palette: {
      primary: '#0d1b2a',
      accent: '#ff0055',
      dark: '#070b12',
      light: '#e0e1dd',
      glow: 'rgba(255, 0, 85, 0.45)'
    }
  },

  // ==========================================
  // ⚡ COLECCIÓN GAMING & CYBERPUNK
  // ==========================================
  {
    id: 'cyberpunk-neon',
    name: 'CYBERPUNK 2077',
    pilotOrSubtitle: 'Night City Overdrive',
    category: 'GAMING_CYBERPUNK',
    typeBadge: 'High-Tech / Low-Life',
    syncRate: '99.9%',
    description: 'Cian neón de alta energía, amarillo furia y grafito sintético.',
    palette: {
      primary: '#00f0ff',
      accent: '#fee715',
      dark: '#10141d',
      light: '#f0f6fc',
      glow: 'rgba(0, 240, 255, 0.45)'
    }
  },
  {
    id: 'matrix-terminal',
    name: 'MATRIX CODE',
    pilotOrSubtitle: 'Construct v4.0',
    category: 'GAMING_CYBERPUNK',
    typeBadge: 'Consola Mainframe',
    syncRate: '100.0%',
    description: 'Verde fósforo terminal sobre negro profundo digital.',
    palette: {
      primary: '#00ff66',
      accent: '#50fa7b',
      dark: '#050a06',
      light: '#e2fbe8',
      glow: 'rgba(0, 255, 102, 0.45)'
    }
  },

  // ==========================================
  // 💎 COLECCIÓN MINIMAL LUXURY
  // ==========================================
  {
    id: 'lumina-gold',
    name: 'LUMINA VIP GOLD',
    pilotOrSubtitle: 'Haute Coiffure Edition',
    category: 'MINIMAL_LUXURY',
    typeBadge: 'Luxury Salon',
    syncRate: '100.0%',
    description: 'Dorado champaña con acentos esmeralda sobre obsidiana pulida.',
    palette: {
      primary: '#d4af37',
      accent: '#10b981',
      dark: '#0f1115',
      light: '#fdfbf7',
      glow: 'rgba(212, 175, 55, 0.4)'
    }
  }
];

export function getSkinById(id: string): SkinDefinition | undefined {
  return SKINS_CATALOG.find(s => s.id === id);
}

export function getSkinsByCategory(category: ThemeCategory): SkinDefinition[] {
  return SKINS_CATALOG.filter(s => s.category === category);
}
