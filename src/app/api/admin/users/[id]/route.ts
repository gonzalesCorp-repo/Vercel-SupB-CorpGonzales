import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 0. Validar autenticación y rol de Administrador
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authUserErr } = await supabaseServer.auth.getUser();

    if (authUserErr || !user) {
      return NextResponse.json({ error: 'No autorizado. Se requiere sesión activa.' }, { status: 401 });
    }

    const { data: callerAgente } = await supabaseServer
      .from('agentes')
      .select('rol')
      .eq('id', user.id)
      .single();

    const esAdmin = callerAgente?.rol === 'SUPERADMIN' || callerAgente?.rol === 'ADMIN';
    if (!esAdmin) {
      return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de Administrador.' }, { status: 403 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { 
      nombre, email, rol, especialidad, estado, sedes_ids,
      regimen_laboral, sueldo_base, tipo_pension, asignacion_familiar,
      porcentaje_comision, tarifa_hora
    } = body;
    const { id } = await params;
    const userId = id;

    if (!userId) {
      return NextResponse.json({ error: 'Falta el ID de usuario' }, { status: 400 });
    }

    // 1. Actualizar tabla agentes
    const { error: agenteError } = await supabaseAdmin
      .from('agentes')
      .update({
        nombre: nombre?.trim(),
        email: email?.trim(),
        rol,
        especialidad: especialidad?.trim() || null,
        estado,
        regimen_laboral: regimen_laboral || 'HONORARIOS_RHE',
        sueldo_base: Number(sueldo_base || 0),
        tipo_pension: tipo_pension || 'AFP',
        asignacion_familiar: Boolean(asignacion_familiar),
        porcentaje_comision: Number(porcentaje_comision || 40),
        tarifa_hora: Number(tarifa_hora || 0)
      })
      .eq('id', userId);

    if (agenteError) {
      console.error("Error actualizando agente:", agenteError);
      return NextResponse.json({ error: 'Error actualizando perfil de agente' }, { status: 500 });
    }

    // 2. Sincronizar sedes
    await supabaseAdmin.from('sedes_usuarios').delete().eq('agente_id', userId);

    if (sedes_ids && sedes_ids.length > 0) {
      const sedesToInsert = sedes_ids.map((sede_id: string) => ({
        agente_id: userId,
        sede_id: sede_id
      }));
      const { error: errorSedes } = await supabaseAdmin.from('sedes_usuarios').insert(sedesToInsert);
      if (errorSedes) {
        console.error("Error insertando sedes_usuarios:", errorSedes);
        return NextResponse.json({ error: 'Error asignando sedes' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Usuario actualizado exitosamente' });

  } catch (error: any) {
    console.error("Error inesperado en API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
