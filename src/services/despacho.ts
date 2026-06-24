import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { OATC } from './recepcion';

const supabase = createClient();

// Obtener OATCs que están siendo atendidos en este momento
export async function obtenerOrdenesEnTranscurso(): Promise<OATC[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const { data, error } = await supabase
    .from('oatc')
    .select('*')
    .eq('estado_proceso', 'ASESORANDO')
    .eq('sede_id', sedeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error obteniendo órdenes en transcurso:", error);
    return [];
  }
  return data as OATC[];
}
