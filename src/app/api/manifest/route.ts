import { NextRequest, NextResponse } from 'next/server';
import { resolveBrand } from '@/lib/branding/brandsConfig';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sedeIdParam = searchParams.get('sedeId') || searchParams.get('sede') || searchParams.get('id');
  const cookieSedeId = request.cookies.get('vaikuntha_sede_id')?.value;

  const activeSedeId = sedeIdParam || cookieSedeId || 'c9755dbc-11e0-452d-b971-209f5476bbcb';
  const brand = resolveBrand(activeSedeId);

  const manifest = {
    name: brand.name,
    short_name: brand.shortName,
    description: brand.description,
    start_url: `/mobile?pwa=true&sede=${brand.code}`,
    display: 'standalone',
    background_color: brand.backgroundColor,
    theme_color: brand.themeColor,
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: brand.icon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: brand.icon512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    categories: ['business', 'lifestyle', 'productivity'],
    shortcuts: [
      {
        name: 'Operaciones & Turno',
        url: '/mobile/operacion',
        description: 'Acceso rápido al panel de órdenes y piso'
      },
      {
        name: 'Mi Perfil & Ajustes',
        url: '/mobile/cuenta',
        description: 'Configuración personal, accesibilidad y WFM'
      }
    ]
  };

  return new NextResponse(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60'
    }
  });
}
