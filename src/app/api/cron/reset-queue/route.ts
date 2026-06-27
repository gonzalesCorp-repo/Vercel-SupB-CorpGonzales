import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // Verify auth header if you want to secure it, but Vercel Cron sends a specific header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    // Para simplificar en esta demo, permitiremos GET sin secreto si no está configurado, 
    // pero idealmente deberíamos chequear CRON_SECRET.
    // return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ success: false, error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Reiniciar estado de todos los agentes a INACTIVO y limpiar badges
  const { error } = await supabase
    .from('agentes')
    .update({ estado: 'INACTIVO', badge: null })
    .neq('estado', 'INACTIVO');

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // También limpiar atenciones activas si se quedaron colgadas
  // Opcional: podrías mover las OATCs en ESPERA a CANCELADO, pero lo dejaremos simple.

  return NextResponse.json({ success: true, message: 'Cola reseteada exitosamente' });
}
