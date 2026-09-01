export interface BrandMetadata {
  id: string;
  code: string;
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  icon192: string;
  icon512: string;
  appleTouchIcon: string;
  favicon: string;
  startUrl: string;
}

export const DEFAULT_BRAND: BrandMetadata = {
  id: 'default',
  code: 'VKN',
  name: 'Vaikuntha ERP Engine',
  shortName: 'Vaikuntha ERP',
  description: 'Sistema Operativo y ERP Integral Multi-Sede',
  themeColor: '#0f172a',
  backgroundColor: '#020617',
  icon192: '/icon.png',
  icon512: '/icon.png',
  appleTouchIcon: '/apple-icon.png',
  favicon: '/favicon.ico',
  startUrl: '/mobile'
};

export const REGISTERED_BRANDS: Record<string, BrandMetadata> = {
  // Sede Gloss Salón and Relax (Jesús María)
  'c9755dbc-11e0-452d-b971-209f5476bbcb': {
    id: 'c9755dbc-11e0-452d-b971-209f5476bbcb',
    code: 'GLOS',
    name: 'Gloss Salón and Relax',
    shortName: 'Gloss Salón',
    description: 'Belleza, Estética Capilar, Cosmiatría y Cuidado Personal',
    themeColor: '#18181b',
    backgroundColor: '#18181b',
    icon192: '/brands/gloss-icon-192.png',
    icon512: '/brands/gloss-icon-512.png',
    appleTouchIcon: '/brands/gloss-apple-touch-icon.png',
    favicon: '/brands/gloss-favicon.png',
    startUrl: '/mobile'
  },
  'glos': {
    id: 'c9755dbc-11e0-452d-b971-209f5476bbcb',
    code: 'GLOS',
    name: 'Gloss Salón and Relax',
    shortName: 'Gloss Salón',
    description: 'Belleza, Estética Capilar, Cosmiatría y Cuidado Personal',
    themeColor: '#18181b',
    backgroundColor: '#18181b',
    icon192: '/brands/gloss-icon-192.png',
    icon512: '/brands/gloss-icon-512.png',
    appleTouchIcon: '/brands/gloss-apple-touch-icon.png',
    favicon: '/brands/gloss-favicon.png',
    startUrl: '/mobile'
  }
};

export function resolveBrand(sedeIdentifier?: string | null): BrandMetadata {
  if (!sedeIdentifier) return REGISTERED_BRANDS['c9755dbc-11e0-452d-b971-209f5476bbcb'] || DEFAULT_BRAND;

  const key = sedeIdentifier.trim().toLowerCase();
  
  if (REGISTERED_BRANDS[key]) {
    return REGISTERED_BRANDS[key];
  }

  // Buscar por coincidencia de nombre o código
  for (const b of Object.values(REGISTERED_BRANDS)) {
    if (
      b.id.toLowerCase() === key ||
      b.code.toLowerCase() === key ||
      b.name.toLowerCase().includes(key) ||
      key.includes(b.code.toLowerCase())
    ) {
      return b;
    }
  }

  return DEFAULT_BRAND;
}
