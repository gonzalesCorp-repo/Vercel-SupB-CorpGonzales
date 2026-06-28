import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { registrarLog } from './logger';

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
    estado_destino: string;
    actualiza_timestamp: boolean;
    penaliza_cola: boolean;
  };
  agentes?: {
    nombre: string;
    rol: string;
  };
  oatc_id?: string;
}

export async function solicitarAsistencia(tipo_id: string): Promise<boolean> {
  const supabase = createClient();
  const { sedeActiva } = useAppStore.getState();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) throw new Error("Error de autenticación: " + authError.message);
  if (!user?.email) throw new Error("Usuario no autenticado");
  if (!sedeActiva) throw new Error("No hay una sede seleccionada en el Workspace");
  
  const userEmail = user.email;

  // Obtener agente_id por email
  const { data: agente, error: errA } = await supabase
    .from('agentes')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (errA || !agente) {
    throw new Error("No se encontró el perfil de agente asociado a tu usuario (" + userEmail + "). Comunícate con tu administrador.");
  }

  // Insertar petición
  const { error } = await supabase.from('cola_peticiones').insert([{
    agente_id: agente.id,
    sede_id: sedeActiva.id,
    tipo_id,
    estado: 'PENDIENTE'
  }]);

  if (error) {
    console.error("Error solicitando asistencia:", error);
    throw new Error("Error de base de datos al solicitar asistencia: " + error.message);
  }
  return true;
}

export async function obtenerMiPeticionPendiente(): Promise<Peticion | null> {
  const supabase = createClient();
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
  const supabase = createClient();
  const { sedeActiva } = useAppStore.getState();
  if (!sedeActiva) return [];

  const { data, error } = await supabase
    .from('cola_peticiones')
    .select(`
      id, created_at, agente_id, estado, config_id, oatc_id,
      agente:agentes!cola_peticiones_agente_id_fkey(nombre, rol),
      config_peticiones(nombre, estado_destino, actualiza_timestamp, penaliza_cola)
    `)
    .eq('estado', 'PENDIENTE')
    .eq('sede_id', sedeActiva.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error obteniendo peticiones pendientes:", error);
    return [];
  }
  return data as Peticion[];
}

export async function resolverPeticion(pet: Peticion, estado: 'APROBADO' | 'RECHAZADO'): Promise<boolean> {
  const supabase = createClient();
  // 1. Update petition state
  const { error } = await supabase
    .from('cola_peticiones')
    .update({ estado, resolved_at: new Date().toISOString() })
    .eq('id', pet.id);

  if (error) {
    console.error("Error resolviendo peticion:", error);
    return false;
  }

  // 2. If approved, change agent state
  if (estado === 'APROBADO') {
    const conf = pet.config_peticiones;
    const destino = conf?.estado_destino || 'DISPONIBLE';
    
    // Determinar si actualiza timestamp
    let actualiza = conf?.actualiza_timestamp || false;
    
    // Logica especial para Retorno de Servicio
    if (conf?.nombre === 'Retorno de Servicio' && pet.oatc_id) {
      const { data: oatc } = await supabase.from('oatc').select('tipo_demanda').eq('id', pet.oatc_id).single();
      if (oatc && (oatc.tipo_demanda === 'cliente' || oatc.tipo_demanda === 'turno')) {
        actualiza = true;
      }
    }

    const updatePayload: any = { estado: destino };
    
    if (actualiza) {
      updatePayload.ultimo_cambio_estado = new Date().toISOString();
    }

    await supabase.from('agentes').update(updatePayload).eq('id', pet.agente_id);
  }

  await registrarLog('WFM', 'PETICION_RESUELTA', { peticion_id: pet.id, resolucion: estado, agente_id: pet.agente_id });
  return true;
}
