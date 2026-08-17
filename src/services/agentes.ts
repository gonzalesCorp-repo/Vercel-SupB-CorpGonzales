import { createClient } from '@/lib/supabase/client';
import { Agente } from './recepcion';
import { registrarLog } from './logger';
import { useAppStore } from '@/store/useAppStore';

const supabase = createClient();

// Obtiene todos los agentes
export async function obtenerTodosLosAgentes(): Promise<Agente[]> {
  const { data, error } = await supabase
    .from('agentes')
    .select('*')
    .order('nombre');
    
  if (error) {
    console.error("Error obteniendo agentes:", error);
    return [];
  }
  
  return data as Agente[];
}

// Cambia el estado operativo del agente en piso (WFM / Turno)
export async function cambiarEstadoAgente(id: string, nuevoEstado: string) {
  const { error } = await supabase
    .from('agentes')
    .update({ 
      estado_operativo: nuevoEstado,
      ultimo_cambio_estado: new Date().toISOString()
    })
    .eq('id', id);
    
  if (error) {
    console.error("Error cambiando estado operativo del agente:", error);
    throw error;
  }
}

// Dar de baja definitiva o cesar a un colaborador (Exclusivo SUPERADMIN / ADMIN)
export async function darDeBajaColaborador(agenteId: string, motivo: string, adminNombre: string) {
  const { data: agente, error: errAgente } = await supabase
    .from('agentes')
    .select('nombre, email, rol')
    .eq('id', agenteId)
    .single();

  if (errAgente || !agente) throw new Error("Colaborador no encontrado");

  const { error } = await supabase
    .from('agentes')
    .update({ 
      estado: 'INACTIVO',
      ultimo_cambio_estado: new Date().toISOString()
    })
    .eq('id', agenteId);

  if (error) throw error;

  await registrarLog('BAJA_LABORAL', `Cese laboral de ${agente.nombre} (${agente.rol}) autorizado por ${adminNombre}`, {
    agente_id: agenteId,
    agente_nombre: agente.nombre,
    motivo,
    autorizado_por: adminNombre
  });

  return true;
}

// Reactivar colaborador
export async function reactivarColaborador(agenteId: string, adminNombre: string) {
  const { data: agente, error: errAgente } = await supabase
    .from('agentes')
    .select('nombre, email, rol')
    .eq('id', agenteId)
    .single();

  if (errAgente || !agente) throw new Error("Colaborador no encontrado");

  const { error } = await supabase
    .from('agentes')
    .update({ 
      estado: 'ACTIVO',
      ultimo_cambio_estado: new Date().toISOString()
    })
    .eq('id', agenteId);

  if (error) throw error;

  await registrarLog('REACTIVACION_LABORAL', `Reactivación laboral de ${agente.nombre} autorizada por ${adminNombre}`, {
    agente_id: agenteId,
    agente_nombre: agente.nombre,
    autorizado_por: adminNombre
  });

  return true;
}
