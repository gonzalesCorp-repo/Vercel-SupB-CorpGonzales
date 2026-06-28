import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { nombre, email, rol, especialidad, estado, sedes_ids } = body;
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
        estado
      })
      .eq('id', userId);

    if (agenteError) {
      console.error("Error actualizando agente:", agenteError);
      return NextResponse.json({ error: 'Error actualizando perfil de agente' }, { status: 500 });
    }

    // 2. Sincronizar sedes
    // Primero borramos las existentes
    await supabaseAdmin.from('sedes_usuarios').delete().eq('agente_id', userId);

    // Luego insertamos las nuevas
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
