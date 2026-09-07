import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run middleware on static files or API routes unless explicitly needed
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return supabaseResponse
  }

  // Fetch user to verify active session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define public routes (Login, Home, Portal Cliente QR, Tótem Kiosko, Manifest PWA, Branding e Iconos)
  const isPublicRoute = 
    request.nextUrl.pathname === '/login' || 
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/cliente') ||
    request.nextUrl.pathname.startsWith('/kiosk') ||
    request.nextUrl.pathname.startsWith('/api/manifest') ||
    request.nextUrl.pathname.startsWith('/api/branding') ||
    request.nextUrl.pathname.startsWith('/api/cron');

  // Protect all private routes
  if (!user && !isPublicRoute) {
    // Para endpoints de API, devolver JSON 401 en lugar de redirigir a HTML /login
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado. Se requiere sesión activa.' }, { status: 401 });
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si el usuario está autenticado, validar autorización por rol y redirecciones adaptativas (SEC-003 / SEC-004)
  if (user) {
    const pathname = request.nextUrl.pathname;
    const userRole = typeof user.user_metadata?.rol === 'string'
      ? user.user_metadata.rol.trim().toUpperCase()
      : '';

    // Helper para verificar coincidencia exacta o subrutas
    const matchesPrefix = (path: string, prefixes: string[]): boolean => {
      return prefixes.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
    };

    // Si el usuario autenticado intenta acceder a /login o /
    if (pathname === '/login' || pathname === '/') {
      const url = request.nextUrl.clone();
      if (userRole === 'CLIENTE') {
        url.pathname = '/mobile/cliente';
      } else if (userRole === 'STAFF') {
        url.pathname = '/mobile/operacion';
      } else if (userRole === 'ADMIN') {
        url.pathname = '/admin/usuarios';
      } else {
        url.pathname = '/recepcion';
      }
      return NextResponse.redirect(url);
    }

    // Reglas de autorización adaptativa por rol:
    // 1. CLIENTE: no puede acceder a rutas de gestión
    if (userRole === 'CLIENTE') {
      const forbidden = [
        '/admin',
        '/finanzas',
        '/rrhh',
        '/recepcion',
        '/lab',
        '/wfm',
        '/mobile/superadmin',
        '/mobile/admin',
        '/mobile/soporte'
      ];
      if (matchesPrefix(pathname, forbidden)) {
        const url = request.nextUrl.clone();
        url.pathname = '/mobile/cliente';
        return NextResponse.redirect(url);
      }
    }

    // 2. STAFF: no puede acceder a administración o finanzas/rrhh/superadmin/admin
    if (userRole === 'STAFF') {
      const forbidden = [
        '/admin',
        '/finanzas',
        '/rrhh',
        '/mobile/superadmin',
        '/mobile/admin'
      ];
      if (matchesPrefix(pathname, forbidden)) {
        const url = request.nextUrl.clone();
        url.pathname = '/mobile/operacion';
        return NextResponse.redirect(url);
      }
    }

    // 3. OPERADOR: no puede acceder a admin/finanzas/rrhh/superadmin
    if (userRole === 'OPERADOR') {
      const forbidden = [
        '/admin',
        '/finanzas',
        '/rrhh',
        '/mobile/superadmin'
      ];
      if (matchesPrefix(pathname, forbidden)) {
        const url = request.nextUrl.clone();
        url.pathname = '/recepcion';
        return NextResponse.redirect(url);
      }
    }

    // 4. ADMIN: no puede acceder a superadmin
    if (userRole === 'ADMIN') {
      const forbidden = [
        '/mobile/superadmin'
      ];
      if (matchesPrefix(pathname, forbidden)) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/usuarios';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse
}
