import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Inicializar cliente dentro del handler para evitar errores en build time de Next.js
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { nombre, email, password, rol, sedes_ids } = body;

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
        id: userId, // Forzamos el mismo UUID
        nombre: nombre.trim(),
        email: email.trim(),
        rol,
        estado: 'DISPONIBLE'
      }]);

    if (agenteError) {
      console.error("Error insertando en agentes:", agenteError);
      // Rollback opcional: borrar el auth.user si falla el perfil
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
