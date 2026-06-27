import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

export interface Peticion {
  id: string;
  agente_id: string;
  sede_id: string;
  tipo_id: string;
  estado: string;
  created_at: string;
  config_peticiones?: {
    nombre: string;
    color: string;
    penaliza_cola: boolean;
  };
  agentes?: {
    nombre: string;
    rol: string;
  };
}

export async function solicitarAsistencia(tipo_id: string): Promise<boolean> {
  const { sedeActiva } = useAppStore.getState();
  const { data: { user } } = await supabase.auth.getUser();
  if (!sedeActiva || !user?.email) return false;
  
  const userEmail = user.email;

  // Obtener agente_id por email
  const { data: agente, error: errA } = await supabase
    .from('agentes')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (errA || !agente) return false;

  // Insertar petición
  const { error } = await supabase.from('cola_peticiones').insert([{
    agente_id: agente.id,
    sede_id: sedeActiva.id,
    tipo_id,
    estado: 'PENDIENTE'
  }]);

  if (error) {
    console.error("Error solicitando asistencia:", error);
    return false;
  }
  return true;
}

export async function obtenerMiPeticionPendiente(): Promise<Peticion | null> {
  const { sedeActiva } = useAppStore.getState();
  const { data: { user } } = await supabase.auth.getUser();
  if (!sedeActiva || !user?.email) return null;
  
  const userEmail = user.email;

  const { data: agente, error: errA } = await supabase
    .from('agentes')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (errA || !agente) return null;

  const { data, error } = await supabase
    .from('cola_peticiones')
    .select('*, config_peticiones(*)')
    .eq('agente_id', agente.id)
    .eq('estado', 'PENDIENTE')
    .eq('sede_id', sedeActiva.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Peticion;
}

export async function obtenerPeticionesPendientesPorSede(): Promise<Peticion[]> {
  const { sedeActiva } = useAppStore.getState();
  if (!sedeActiva) return [];

  const { data, error } = await supabase
    .from('cola_peticiones')
    .select('*, config_peticiones(nombre, color, penaliza_cola), agentes(nombre, rol)')
    .eq('estado', 'PENDIENTE')
    .eq('sede_id', sedeActiva.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error obteniendo peticiones pendientes:", error);
    return [];
  }
  return data as Peticion[];
}

export async function resolverPeticion(id: string, estado: 'APROBADO' | 'RECHAZADO', agente_id: string, penaliza_cola: boolean, es_operativo: boolean): Promise<boolean> {
  // 1. Update petition state
  const { error } = await supabase
    .from('cola_peticiones')
    .update({ estado, resolved_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error("Error resolviendo peticion:", error);
    return false;
  }

  // 2. If approved, change agent state
  if (estado === 'APROBADO') {
    if (penaliza_cola) {
      // Sale de la cola (ej. Fin de Turno, Refrigerio)
      await supabase.from('agentes').update({ estado: 'INACTIVO' }).eq('id', agente_id);
    } else {
      // Mantiene su posicion. Si entra por primera vez o es un pase rapido.
      if (es_operativo) {
        // Asegurar que esta disponible si no penaliza
        await supabase.from('agentes').update({ estado: 'DISPONIBLE' }).eq('id', agente_id);
      } else {
        // Es administrativo, solo marco asistencia pero no atiende clientes en piso
        await supabase.from('agentes').update({ estado: 'ADMINISTRATIVO' }).eq('id', agente_id);
      }
    }
  }

  return true;
}
