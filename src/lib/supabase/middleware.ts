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

  // If user is logged in and tries to go to login or home, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/recepcion'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
