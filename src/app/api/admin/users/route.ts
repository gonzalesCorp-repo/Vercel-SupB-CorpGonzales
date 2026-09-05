import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // 0. Validar autenticación y rol de Administrador
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authUserErr } = await supabaseServer.auth.getUser();

    if (authUserErr || !user) {
      return NextResponse.json({ error: 'No autorizado. Se requiere sesión activa.' }, { status: 401 });
    }

    // Inicializar cliente con service role
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
      nombre, email, password, rol, especialidad, sedes_ids,
      regimen_laboral, sueldo_base, tipo_pension, asignacion_familiar,
      porcentaje_comision, tarifa_hora
    } = body;

    // Validación de alcance para Administradores locales (ADMIN)
    if (callerAgente.rol === 'ADMIN') {
      if (rol === 'SUPERADMIN' || rol === 'ADMIN') {
        return NextResponse.json({ error: 'Acceso denegado. Un Administrador local no puede crear Administradores o SuperAdmins.' }, { status: 403 });
      }

      const { data: callerSedes } = await supabaseAdmin
        .from('sedes_usuarios')
        .select('sede_id')
        .eq('agente_id', callerAgente.id);
      
      const permittedSedeIds = (callerSedes || []).map((s: any) => s.sede_id);
      const sedesValidas = (sedes_ids || []).every((sid: string) => permittedSedeIds.includes(sid));

      if (!sedesValidas || (sedes_ids && sedes_ids.length === 0 && permittedSedeIds.length > 0)) {
        return NextResponse.json({ error: 'Acceso denegado. Solo puedes asignar usuarios a tus sedes autorizadas.' }, { status: 403 });
      }
    }

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (nombre, email, password)' }, { status: 400 });
    }


    // 1. Crear usuario en auth.users (Supabase Authentication)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password.trim(),
      email_confirm: true,
      user_metadata: {
        full_name: nombre,
        rol: rol
      }
    });

    if (authError) {
      console.error("Error creando Auth user:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Crear registro en la tabla pública `agentes` usando el mismo ID
    const { error: agenteError } = await supabaseAdmin
      .from('agentes')
      .insert([{
        id: userId,
        nombre: nombre.trim(),
        email: email.trim(),
        rol,
        especialidad: especialidad?.trim() || null,
        estado: 'ACTIVO',
        estado_operativo: 'FUERA_DE_TURNO',
        regimen_laboral: regimen_laboral || 'HONORARIOS_RHE',
        sueldo_base: Number(sueldo_base || 0),
        tipo_pension: tipo_pension || 'AFP',
        asignacion_familiar: Boolean(asignacion_familiar),
        porcentaje_comision: Number(porcentaje_comision || 40),
        tarifa_hora: Number(tarifa_hora || 0)
      }]);

    if (agenteError) {
      console.error("Error insertando en agentes:", agenteError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Error creando perfil de agente' }, { status: 500 });
    }

    // 3. Asignar sedes (opcional)
    if (sedes_ids && sedes_ids.length > 0) {
      const sedesToInsert = sedes_ids.map((sede_id: string) => ({
        agente_id: userId,
        sede_id: sede_id
      }));
      await supabaseAdmin.from('sedes_usuarios').insert(sedesToInsert);
    }

    return NextResponse.json({ success: true, userId, message: 'Usuario creado exitosamente' });

  } catch (error: any) {
    console.error("Error inesperado en API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
