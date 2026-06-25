import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface Sede {
  id: string;
  nombre: string;
  direccion?: string;
}

export async function obtenerSedesUsuario(userEmail: string): Promise<Sede[]> {
  // 1. Obtener ID y rol del agente
  const { data: agente, error: errAgente } = await supabase
    .from('agentes')
    .select('id, rol')
    .ilike('email', userEmail)
    .maybeSingle();

  if (errAgente || !agente) {
    console.error("Error obteniendo agente para sedes:", errAgente);
    return [];
  }

  // Si es SUPERADMIN, darle acceso automático a TODAS las sedes
  if (agente.rol && agente.rol.toUpperCase() === 'SUPERADMIN') {
    const { data: todasSedes, error: errTodas } = await supabase
      .from('sedes')
      .select('id, nombre, direccion');
      
    if (!errTodas && todasSedes) {
      return todasSedes;
    }
  }

  // 2. Obtener sedes permitidas si no es SUPERADMIN
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
