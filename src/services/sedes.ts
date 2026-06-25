import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface Sede {
  id: string;
  nombre: string;
  direccion?: string;
}

export async function obtenerSedesUsuario(userEmail: string): Promise<Sede[]> {
  // 1. Obtener ID del agente
  const { data: agente, error: errAgente } = await supabase
    .from('agentes')
    .select('id')
    .ilike('email', userEmail)
    .maybeSingle();

  if (errAgente || !agente) {
    console.error("Error obteniendo agente para sedes:", errAgente);
    return [];
  }

  // 2. Obtener sedes permitidas
  const { data: sedesUsuarios, error: errSedes } = await supabase
    .from('sedes_usuarios')
    .select('sede_id, sedes(id, nombre, direccion)')
    .eq('agente_id', agente.id);

  if (errSedes) {
    console.error("Error obteniendo sedes:", errSedes);
    return [];
  }

  // Mapear el inner join
  const sedes: Sede[] = (sedesUsuarios || []).map((item: any) => ({
    id: item.sedes.id,
    nombre: item.sedes.nombre,
    direccion: item.sedes.direccion
  }));

  return sedes;
}
