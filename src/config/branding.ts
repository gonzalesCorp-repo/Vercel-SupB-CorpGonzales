/**
 * VAIKUNTHA ERP - WHITE-LABEL & BRANDING CONFIGURATION
 * 
 * Configuración centralizada de marca blanca y fidelización para el ERP Multi-Tenant.
 * Permite cambiar dinámicamente el nombre de la empresa, logo, slogan y el token
 * del programa de lealtad (Vaikuntha Points por defecto) por cada inquilino.
 */

export interface TenantBranding {
  id: string;
  brandName: string;
  brandShortName: string;
  tagline: string;
  logoLetter: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  // Programa de Fidelidad / Loyalty
  loyalty: {
    pointsName: string;         // 'Vaikuntha Points'
    pointsShort: string;        // 'VP'
    pointsSymbol: string;       // '💎'
    coinConversionRate: number; // 1 PEN = 1 VP
    welcomeBonus: number;       // 100 VP
    tiers: {
      bronze: { name: string; minPoints: number; badgeColor: string };
      silver: { name: string; minPoints: number; badgeColor: string };
      gold: { name: string; minPoints: number; badgeColor: string };
      platinum: { name: string; minPoints: number; badgeColor: string };
      diamond: { name: string; minPoints: number; badgeColor: string };
    };
  };
}

export const DEFAULT_BRANDING: TenantBranding = {
  id: 'vaikuntha_core',
  brandName: 'Vaikuntha',
  brandShortName: 'VKN',
  tagline: 'Intelligent Beauty & Wellness Ecosystem',
  logoLetter: 'V',
  primaryColor: '#6366f1', // Indigo
  accentColor: '#a855f7',  // Purple
  loyalty: {
    pointsName: 'Vaikuntha Points',
    pointsShort: 'VP',
    pointsSymbol: '💎',
    coinConversionRate: 1,
    welcomeBonus: 100,
    tiers: {
      bronze: { name: 'Bronce VIP', minPoints: 0, badgeColor: 'bg-amber-700/20 text-amber-500 border-amber-600/30' },
      silver: { name: 'Plata VIP', minPoints: 200, badgeColor: 'bg-slate-400/20 text-slate-300 border-slate-400/30' },
      gold: { name: 'Oro VIP', minPoints: 400, badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/40' },
      platinum: { name: 'Platino VIP', minPoints: 800, badgeColor: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40' },
      diamond: { name: 'Diamante VIP', minPoints: 1200, badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-purple-500/20' }
    }
  }
};

/**
 * Obtiene la configuración de marca activa (con fallback a Vaikuntha por defecto)
 */
export function getActiveBranding(): TenantBranding {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('vaikuntha_branding_config');
      if (saved) {
        return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
  }
  return DEFAULT_BRANDING;
}

/**
 * Calcula el nivel / tier de lealtad en función de los Vaikuntha Points acumulados
 */
export function getLoyaltyTier(points: number, branding: TenantBranding = DEFAULT_BRANDING) {
  const { tiers } = branding.loyalty;
  if (points >= tiers.diamond.minPoints) return tiers.diamond;
  if (points >= tiers.platinum.minPoints) return tiers.platinum;
  if (points >= tiers.gold.minPoints) return tiers.gold;
  if (points >= tiers.silver.minPoints) return tiers.silver;
  return tiers.bronze;
}
