import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vercel-sup-b-corp-gonzales.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/kiosk', '/cliente', '/login', '/llms.txt', '/llms-full.txt'],
        disallow: [
          '/admin/',
          '/caja/',
          '/finanzas/',
          '/lab/',
          '/operaciones/',
          '/recepcion/',
          '/wfm/',
          '/mobile/',
          '/api/',
          '/dev/',
          '/perfil/',
        ],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot'],
        allow: ['/', '/kiosk', '/cliente', '/llms.txt', '/llms-full.txt'],
        disallow: [
          '/admin/',
          '/caja/',
          '/finanzas/',
          '/lab/',
          '/operaciones/',
          '/recepcion/',
          '/wfm/',
          '/mobile/',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
