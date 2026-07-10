import { createClient } from '@/lib/supabase/client';
import { Agente } from './recepcion';
import { registrarLog } from './logger';
import { useAppStore } from '@/store/useAppStore';

const supabase = createClient();

// Obtiene todos los agentes para el buscador de ingreso
export async function obtenerTodosLosAgentes(): Promise<Agente[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  
  const { data, error } = await supabase
    .from('agentes')
    .select('*, sedes_usuarios!inner(sede_id)')
    .eq('sedes_usuarios.sede_id', sedeId)
    .order('nombre');
    
  if (error) {
    console.error("Error obteniendo agentes:", error);
    return [];
  }
  
  return data as Agente[];
}

// Cambia el estado de un agente
export async function cambiarEstadoAgente(id: string, nuevoEstado: string) {
  const { data: agentePrevio } = await supabase.from('agentes').select('estado').eq('id', id).single();
  
  const { error } = await supabase
    .from('agentes')
    .update({ 
      estado: nuevoEstado,
      ultimo_cambio_estado: new Date().toISOString()
    })
    .eq('id', id);
    
  if (error) {
    console.error("Error cambiando estado del agente:", error);
    throw error;
  }

  // Registrar Asistencia
  if (agentePrevio && agentePrevio.estado === 'INACTIVO' && nuevoEstado !== 'INACTIVO') {
    await registrarLog('ASISTENCIA', 'INGRESO', { agente_id: id });
  } else if (agentePrevio && agentePrevio.estado !== 'INACTIVO' && nuevoEstado === 'INACTIVO') {
    await registrarLog('ASISTENCIA', 'SALIDA', { agente_id: id });
  }
}
