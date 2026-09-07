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
  resolved_at?: string;
  tipo?: string;
  solicitante_nombre?: string;
  detalle?: string;
  config_peticiones?: {
    nombre: string;
    color: string;
    estado_destino: string;
    actualiza_timestamp: boolean;
    penaliza_cola: boolean;
  };
  agente?: {
    nombre: string;
    rol: string;
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

export async function solicitarAsistenciaKiosko(tipo_id: string, agente_id: string): Promise<boolean> {
  const supabase = createClient();
  const { sedeActiva } = useAppStore.getState();
  
  if (!sedeActiva) throw new Error("No hay una sede seleccionada en el Workspace");

  const { error } = await supabase.from('cola_peticiones').insert([{
    agente_id,
    sede_id: sedeActiva.id,
    tipo_id,
    estado: 'PENDIENTE'
  }]);

  if (error) {
    console.error("Error solicitando asistencia kiosko:", error);
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
    .maybeSingle();

  if (error || !data) return null;
  return data as Peticion;
}

export async function obtenerPeticionPendientePorAgente(agente_id: string): Promise<Peticion | null> {
  const supabase = createClient();
  const { sedeActiva } = useAppStore.getState();
  if (!sedeActiva || !agente_id) return null;

  const { data, error } = await supabase
    .from('cola_peticiones')
    .select('*, config_peticiones(*)')
    .eq('agente_id', agente_id)
    .eq('estado', 'PENDIENTE')
    .eq('sede_id', sedeActiva.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as Peticion;
}

export async function obtenerPeticionesPendientesPorSede(): Promise<Peticion[]> {
  const supabase = createClient();
  const { sedeActiva } = useAppStore.getState();
  if (!sedeActiva?.id) return [];

  try {
    // 1. Obtener los agentes asignados a la sede activa para no perder ninguna solicitud
    const { data: suData } = await supabase
      .from('sedes_usuarios')
      .select('agente_id')
      .eq('sede_id', sedeActiva.id);

    const agenteIds = (suData || []).map((r: any) => r.agente_id).filter(Boolean);

    // 2. Query ultra-resiliente: coincide la sede, la sede es nula, o el agente pertenece a esta sede
    let query = supabase
      .from('cola_peticiones')
      .select(`
        id, created_at, agente_id, estado, tipo_id, oatc_id, sede_id, tipo, solicitante_nombre, detalle,
        agente:agentes(nombre, rol),
        config_peticiones(nombre, estado_destino, actualiza_timestamp, penaliza_cola, color)
      `)
      .eq('estado', 'PENDIENTE');

    if (agenteIds.length > 0) {
      query = query.or(`sede_id.eq.${sedeActiva.id},sede_id.is.null,agente_id.in.(${agenteIds.join(',')})`);
    } else {
      query = query.or(`sede_id.eq.${sedeActiva.id},sede_id.is.null`);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.warn('Error al obtener peticiones pendientes por sede:', error);
      return [];
    }
    return (data as unknown as Peticion[]) || [];
  } catch (e) {
    console.warn('Excepción en obtenerPeticionesPendientesPorSede:', e);
    return [];
  }
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

    const updatePayload: any = { estado_operativo: destino };
    
    if (actualiza) {
      updatePayload.ultimo_cambio_estado = new Date().toISOString();
    }

    const { error: errorAgente } = await supabase.from('agentes').update(updatePayload).eq('id', pet.agente_id);
    if (errorAgente) {
      console.error("Error actualizando estado operativo del agente:", errorAgente);
      throw new Error("No se pudo actualizar el estado operativo del agente: " + errorAgente.message);
    }

    // Registrar en asistencias_turnos si corresponde a un movimiento de turno/asistencia
    const nombrePet = conf?.nombre || pet.detalle || '';
    let tipoMov: any = null;
    if (nombrePet.includes('Inicio de Turno') || nombrePet.includes('Asistencia')) {
      tipoMov = 'ENTRADA';
    } else if (nombrePet.includes('Refrigerio')) {
      tipoMov = 'INICIO_REFRIGERIO';
    } else if (nombrePet.includes('Retorno de Servicio')) {
      tipoMov = 'FIN_REFRIGERIO';
    } else if (nombrePet.includes('Fin de Turno') || nombrePet.includes('Salida')) {
      tipoMov = 'SALIDA';
    }

    if (tipoMov) {
      try {
        const targetSede = pet.sede_id || useAppStore.getState().sedeActiva?.id;
        const targetNombre = (pet as any).agente?.nombre || (pet as any).agentes?.nombre || pet.solicitante_nombre || 'Colaborador';
        const { validarYRegistrarAsistenciaNfc } = await import('./asistencias');
        await validarYRegistrarAsistenciaNfc({
          agente_id: pet.agente_id,
          agente_nombre: targetNombre,
          sede_id: targetSede,
          tipo_movimiento: tipoMov,
          punto_acceso: 'Recepción Central (Desktop)',
          dispositivo: 'Recepción Workspace',
          metadatos: {
            metodo: 'RECEPCION_DESKTOP',
            peticion_id: pet.id,
            validado_fisicamente: true
          }
        });
      } catch (e) {
        console.warn('Error registrando asistencia desde peticiones:', e);
      }
    }
  }

  await registrarLog('WFM', 'PETICION_RESUELTA', { peticion_id: pet.id, resolucion: estado, agente_id: pet.agente_id });
  return true;
}

export async function obtenerHistorialWFMDelDia(agenteId: string): Promise<Peticion[]> {
  const supabase = createClient();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('cola_peticiones')
    .select(`
      id, created_at, resolved_at, estado, tipo_id,
      config_peticiones(nombre)
    `)
    .eq('agente_id', agenteId)
    .gte('created_at', hoy.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error obteniendo historial WFM:", error);
    return [];
  }
  return data as any[];
}
