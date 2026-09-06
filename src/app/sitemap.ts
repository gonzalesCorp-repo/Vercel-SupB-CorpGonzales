import type { MetadataRoute } from 'next';
import { SYSTEM_MANIFEST } from '@/lib/ai/system-manifest';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vercel-sup-b-corp-gonzales.vercel.app';

  return SYSTEM_MANIFEST.publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path === '/' ? '' : route.path}`,
    lastModified: new Date(),
    changeFrequency: (route.path === '/' ? 'daily' : 'weekly') as 'daily' | 'weekly',
    priority: route.path === '/' ? 1.0 : 0.8,
  }));
}
