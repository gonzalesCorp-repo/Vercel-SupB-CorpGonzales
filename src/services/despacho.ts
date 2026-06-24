import { createClient } from '@/lib/supabase/client';
import { OATC } from './recepcion';

const supabase = createClient();

// Obtener OATCs que están siendo atendidos en este momento
export async function obtenerOrdenesEnTranscurso(): Promise<OATC[]> {
  const { data, error } = await supabase
    .from('oatc')
    .select('*')
    .eq('estado_proceso', 'ASESORANDO')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error obteniendo órdenes en transcurso:", error);
    return [];
  }
  return data as OATC[];
}
