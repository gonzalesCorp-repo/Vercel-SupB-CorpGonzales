import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

const supabase = createClient();

export interface Cita {
  id?: string;
  cliente_nombre: string;
  cliente_id?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  notas?: string;
}

export async function obtenerCitas(): Promise<Cita[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .eq('sede_id', sedeId)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true });

  if (error) {
    console.error("Error obteniendo citas:", error);
    return [];
  }
  return data as Cita[];
}

export async function crearCita(cita: Cita): Promise<boolean> {
  const sedeId = useAppStore.getState().sedeActiva?.id;

  const { error } = await supabase
    .from('citas')
    .insert([
      {
        cliente_nombre: cita.cliente_nombre,
        fecha: cita.fecha,
        hora_inicio: cita.hora_inicio,
        hora_fin: cita.hora_fin,
        notas: cita.notas,
        sede_id: sedeId
      }
    ]);

  if (error) {
    console.error("Error creando cita:", error);
    return false;
  }
  return true;
}

export async function actualizarEstadoCita(id: string, nuevoEstado: string): Promise<boolean> {
  const { error } = await supabase
    .from('citas')
    .update({ estado: nuevoEstado })
    .eq('id', id);

  if (error) {
    console.error("Error actualizando cita:", error);
    return false;
  }
  return true;
}
