import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { createServerClient } from '@supabase/ssr'; // Se usará más adelante para verificar sesión real

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir el acceso a la ruta de login y archivos públicos
  if (pathname.startsWith('/login') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // TODO: Aquí implementaremos la validación de sesión con Supabase.
  // Por ahora, simularemos que no hay sesión activa redirigiendo siempre a login 
  // si el usuario no tiene una cookie "simulada" de login.
  // Pero para pruebas de UI dejaremos pasar a todas las rutas.
  
  // const supabase = ...
  // const { data: { session } } = await supabase.auth.getSession()
  // if (!session) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
