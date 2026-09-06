import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vercel-sup-b-corp-gonzales.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/kiosk', '/cliente', '/mobile/cliente', '/login', '/llms.txt', '/llms-full.txt'],
        disallow: [
          '/admin/',
          '/caja/',
          '/finanzas/',
          '/lab/',
          '/operaciones/',
          '/recepcion/',
          '/wfm/',
          '/mobile/admin',
          '/mobile/operacion',
          '/mobile/soporte',
          '/mobile/superadmin',
          '/mobile/cuenta',
          '/mobile/config',
          '/mobile/liquidacion',
          '/api/',
          '/dev/',
          '/perfil/',
        ],
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot'],
        allow: ['/', '/kiosk', '/cliente', '/mobile/cliente', '/llms.txt', '/llms-full.txt'],
        disallow: [
          '/admin/',
          '/caja/',
          '/finanzas/',
          '/lab/',
          '/operaciones/',
          '/recepcion/',
          '/wfm/',
          '/mobile/admin',
          '/mobile/operacion',
          '/mobile/soporte',
          '/mobile/superadmin',
          '/mobile/cuenta',
          '/mobile/config',
          '/mobile/liquidacion',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
