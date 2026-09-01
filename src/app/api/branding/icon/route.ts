import { NextRequest, NextResponse } from 'next/server';
import { resolveBrand } from '@/lib/branding/brandsConfig';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sedeId = searchParams.get('sedeId') || searchParams.get('sede');
  const size = searchParams.get('size') || '192';

  const brand = resolveBrand(sedeId);

  let iconRelativePath = brand.icon192;
  if (size === '512') {
    iconRelativePath = brand.icon512;
  } else if (size === 'apple' || size === '180') {
    iconRelativePath = brand.appleTouchIcon;
  } else if (size === 'favicon' || size === '64') {
    iconRelativePath = brand.favicon;
  }

  // Si la ruta es un asset local dentro de /public
  if (iconRelativePath.startsWith('/')) {
    const filePath = path.join(process.cwd(), 'public', iconRelativePath);
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const isPng = filePath.endsWith('.png');
      const isSvg = filePath.endsWith('.svg');
      const contentType = isPng ? 'image/png' : isSvg ? 'image/svg+xml' : 'image/x-icon';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      });
    }
  }

  // Fallback a ícono genérico
  const fallbackPath = path.join(process.cwd(), 'public', 'icon.png');
  if (fs.existsSync(fallbackPath)) {
    const fallbackBuffer = fs.readFileSync(fallbackPath);
    return new NextResponse(fallbackBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return new NextResponse('Icon not found', { status: 404 });
}
