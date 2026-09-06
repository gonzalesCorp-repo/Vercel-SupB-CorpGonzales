import { generateLlmsTxt } from '@/lib/ai/system-manifest';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24 horas

export async function GET() {
  const content = generateLlmsTxt();

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
