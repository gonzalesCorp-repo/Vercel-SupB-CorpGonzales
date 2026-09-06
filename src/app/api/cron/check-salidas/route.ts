import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evaluarYDispararLiquidacionCierreJornada } from '@/services/liquidaciones';
import { formatearHoraLima } from '@/services/asistencias';

export async function GET(request: Request) {
  try {
    // 1. Verificar token del cron (seguridad de Vercel)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Consultar colaboradores que siguen con turno activo al cierre del día
    const { data: agentesActivos, error: agError } = await supabase
      .from('agentes')
      .select('id, nombre, email, rol, regimen_laboral, ubicacion_id, estado_operativo')
      .in('estado_operativo', ['DISPONIBLE', 'OCUPADO', 'EN_DESCANSO']);

    if (agError) throw agError;

    if (!agentesActivos || agentesActivos.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: 'No hay colaboradores con turnos rezagados activos hoy.',
        cerrados: 0
      });
    }

    const timestampIso = new Date().toISOString();
    const horaLima = formatearHoraLima(timestampIso);
    const alertasToInsert: any[] = [];
    let freelancersLiquidados = 0;
    let planillaRHEAuditados = 0;

    for (const ag of agentesActivos) {
      const esFreelancer = ag.regimen_laboral === 'FREELANCER_COMISION';

      // 2.1 Actualizar estado a FUERA_DE_TURNO
      await supabase
        .from('agentes')
        .update({
          estado_operativo: 'FUERA_DE_TURNO',
          ultimo_cambio_estado: timestampIso
        })
        .eq('id', ag.id);

      // 2.2 Registrar marcación oficial de SALIDA en asistencias_turnos
      await supabase.from('asistencias_turnos').insert([{
        agente_id: ag.id,
        agente_nombre: ag.nombre,
        sede_id: ag.ubicacion_id || undefined,
        sede_nombre: 'Sede Principal',
        tipo_movimiento: 'SALIDA',
        punto_acceso: 'Cron Nocturno Vercel (23:00)',
        dispositivo: 'Vercel Cron Automation',
        timestamp_registro: timestampIso,
        metadatos: {
          origen: 'CRON_CHECK_SALIDAS',
          hora_lima: horaLima,
          regimen_laboral: ag.regimen_laboral || 'FREELANCER_COMISION',
          requiere_validacion_horas: !esFreelancer
        }
      }]);

      // 2.3 Procesar según régimen
      if (esFreelancer) {
        try {
          await evaluarYDispararLiquidacionCierreJornada({
            agenteId: ag.id,
            agenteNombre: ag.nombre,
            agenteRol: ag.rol,
            sedeId: ag.ubicacion_id || undefined,
            cerradoPor: 'CRON_NOCTURNO_AUTOMATIZADO'
          });
          freelancersLiquidados++;
        } catch (errLiq) {
          console.error(`Error liquidando freelancer ${ag.nombre} en cron:`, errLiq);
        }

        alertasToInsert.push({
          usuario_email: ag.email || `${ag.id}@empresa.com`,
          mensaje: `Hola ${ag.nombre.split(' ')[0]}, tu turno fue cerrado automáticamente al término de la jornada (23:00) y se generó tu liquidación/constancia preventiva del día (SUNAFIL compliance).`,
          resuelta: false
        });
      } else {
        planillaRHEAuditados++;
        alertasToInsert.push({
          usuario_email: ag.email || `${ag.id}@empresa.com`,
          mensaje: `Hola ${ag.nombre.split(' ')[0]}, notamos que no marcaste salida hoy. Tu turno fue cerrado a las 23:00 con bandera de revisión de horas para RRHH.`,
          resuelta: false
        });
      }
    }

    // 2.4 Insertar alertas a colaboradores
    if (alertasToInsert.length > 0) {
      await supabase.from('alertas_usuarios').insert(alertasToInsert);
    }

    return NextResponse.json({
      success: true,
      mensaje: `Procesados ${agentesActivos.length} colaboradores rezagados.`,
      cerradosTotal: agentesActivos.length,
      freelancersLiquidados,
      planillaRHEAuditados
    });
  } catch (error: any) {
    console.error('Error en cron check-salidas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
