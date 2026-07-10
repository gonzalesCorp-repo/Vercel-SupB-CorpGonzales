import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    // Verificar token del cron (seguridad básica de Vercel)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Usamos el SERVICE_ROLE para bypass de RLS en el cron
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rango de fechas de "Hoy"
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: logs, error: logsError } = await supabase
      .from('system_logs')
      .select('usuario_email, accion, created_at')
      .eq('modulo', 'ASISTENCIA')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: true });

    if (logsError) throw logsError;

    // Agrupar por usuario
    const userStatus: Record<string, 'INGRESO' | 'SALIDA'> = {};
    
    logs?.forEach(log => {
      // El último log de asistencia determina si cerró o no
      if (log.usuario_email) {
        userStatus[log.usuario_email] = log.accion as 'INGRESO' | 'SALIDA';
      }
    });

    const rezagados = Object.entries(userStatus)
      .filter(([_, lastAction]) => lastAction === 'INGRESO')
      .map(([email]) => email);

    // Insertar alertas para los rezagados
    const alertsToInsert = rezagados.map(email => ({
      usuario_email: email,
      mensaje: `Hola ${email.split('@')[0]}, notamos que no marcaste salida hoy. ¡No te preocupes! Presiona el botón para marcar tu salida retroactiva ;)`,
      resuelta: false
    }));

    if (alertsToInsert.length > 0) {
      const { error: alertError } = await supabase
        .from('alertas_usuarios')
        .insert(alertsToInsert);
        
      if (alertError) throw alertError;
    }

    return NextResponse.json({ 
      success: true, 
      rezagadosProcesados: rezagados.length 
    });
  } catch (error: any) {
    console.error('Error en cron check-salidas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
