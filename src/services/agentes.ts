import { createClient } from '@/lib/supabase/client';
import { Agente } from './recepcion';
import { registrarLog } from './logger';

const supabase = createClient();

// Obtiene todos los agentes para el buscador de ingreso
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

// Cambia el estado de un agente
export async function cambiarEstadoAgente(id: string, nuevoEstado: string) {
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
}
