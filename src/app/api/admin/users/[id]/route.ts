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

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolución híbrida del agente: por user.id (Auth) o por user.email
    let callerAgente: { id: string; rol: string } | null = null;
    const { data: agById } = await supabaseAdmin
      .from('agentes')
      .select('id, rol')
      .eq('id', user.id)
      .maybeSingle();

    if (agById) {
      callerAgente = agById;
    } else if (user.email) {
      const { data: agByEmail } = await supabaseAdmin
        .from('agentes')
        .select('id, rol')
        .ilike('email', user.email.trim())
        .maybeSingle();
      if (agByEmail) {
        callerAgente = agByEmail;
      }
    }

    const esAdmin = callerAgente?.rol === 'SUPERADMIN' || callerAgente?.rol === 'ADMIN';
    if (!esAdmin || !callerAgente) {
      return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de Administrador.' }, { status: 403 });
    }

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

    // 0.1 Validación de seguridad para Administradores locales (ADMIN)
    if (callerAgente.rol === 'ADMIN') {
      const { data: targetUser } = await supabaseAdmin
        .from('agentes')
        .select('rol, sedes_usuarios(sede_id)')
        .eq('id', userId)
        .single();

      if (!targetUser) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      // No permitir modificar a otros administradores ni a SuperAdmins
      if (targetUser.rol === 'ADMIN' || targetUser.rol === 'SUPERADMIN') {
        return NextResponse.json({ error: 'Acceso denegado. No tienes autorización para modificar a otros administradores.' }, { status: 403 });
      }

      // No permitir promover a ADMIN o SUPERADMIN
      if (rol === 'ADMIN' || rol === 'SUPERADMIN') {
        return NextResponse.json({ error: 'Acceso denegado. Un Administrador local no puede promover usuarios a Administrador.' }, { status: 403 });
      }

      // Obtener sedes autorizadas del caller utilizando su id canónico de agentes
      const { data: callerSedes } = await supabaseAdmin
        .from('sedes_usuarios')
        .select('sede_id')
        .eq('agente_id', callerAgente.id);
      
      const permittedSedeIds = (callerSedes || []).map((s: any) => s.sede_id);
      const targetSedesIds = (targetUser.sedes_usuarios || []).map((s: any) => s.sede_id);

      const comparteSede = targetSedesIds.some((sid: string) => permittedSedeIds.includes(sid));
      if (!comparteSede && targetSedesIds.length > 0) {
        return NextResponse.json({ error: 'Acceso denegado. El usuario no pertenece a tus sedes autorizadas.' }, { status: 403 });
      }

      // Validar que las nuevas sedes asignadas estén dentro de permittedSedeIds
      if (sedes_ids && sedes_ids.length > 0) {
        const sedesValidas = sedes_ids.every((sid: string) => permittedSedeIds.includes(sid));
        if (!sedesValidas) {
          return NextResponse.json({ error: 'Acceso denegado. Solo puedes asignar usuarios a tus sedes autorizadas.' }, { status: 403 });
        }
      }
    }


    // 1. Actualizar tabla agentes
    const estadoLimpio = estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const updatePayload: any = {
      nombre: nombre?.trim(),
      email: email?.trim(),
      rol,
      especialidad: especialidad?.trim() || null,
      estado: estadoLimpio,
      regimen_laboral: regimen_laboral || 'HONORARIOS_RHE',
      sueldo_base: Number(sueldo_base || 0),
      tipo_pension: tipo_pension || 'AFP',
      asignacion_familiar: Boolean(asignacion_familiar),
      porcentaje_comision: Number(porcentaje_comision || 40),
      tarifa_hora: Number(tarifa_hora || 0)
    };

    if (estadoLimpio === 'INACTIVO') {
      updatePayload.estado_operativo = 'FUERA_DE_TURNO';
    }

    const { error: agenteError } = await supabaseAdmin
      .from('agentes')
      .update(updatePayload)
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
