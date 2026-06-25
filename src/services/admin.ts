import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { Agente } from './recepcion';
import { registrarLog } from './logger';

const supabase = createClient();

export interface KPIReporte {
  totalVentas: number;
  ticketsAtendidos: number;
  ticketPromedio: number;
}

// Para Reportes
export async function obtenerMeticasGlobales(): Promise<KPIReporte> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return { totalVentas: 0, ticketsAtendidos: 0, ticketPromedio: 0 };

  const { data: facturas, error: errorFacturas } = await supabase
    .from('facturas')
    .select('total')
    .eq('sede_id', sedeId);

  if (errorFacturas) {
    console.error("Error obteniendo métricas (facturas):", errorFacturas);
    return { totalVentas: 0, ticketsAtendidos: 0, ticketPromedio: 0 };
  }

  const { count: ticketsAtendidos, error: errorTickets } = await supabase
    .from('oatc')
    .select('*', { count: 'exact', head: true })
    .in('estado_proceso', ['FINALIZADO', 'ASESORANDO'])
    .eq('sede_id', sedeId); // Asumimos activos + finalizados como atendidos

  if (errorTickets) {
    console.error("Error obteniendo métricas (tickets):", errorTickets);
  }

  const totalVentas = (facturas || []).reduce((sum: number, item: any) => sum + Number(item.total), 0);
  const cantFacturas = (facturas || []).length;
  const ticketPromedio = cantFacturas > 0 ? totalVentas / cantFacturas : 0;

  return {
    totalVentas,
    ticketsAtendidos: ticketsAtendidos || 0,
    ticketPromedio
  };
}

// Para Gestión de Usuarios
export async function obtenerTodosLosAgentes(): Promise<any[]> {
  const { data, error } = await supabase
    .from('agentes')
    .select(`
      *,
      sedes_usuarios(sede_id)
    `)
    .order('nombre');

  if (error) {
    console.error("Error obteniendo agentes para admin:", error);
    return [];
  }
  
  // Transformar la data para que sea más fácil de usar en el frontend
  return data.map((agente: any) => ({
    ...agente,
    sedes_ids: agente.sedes_usuarios ? agente.sedes_usuarios.map((su: any) => su.sede_id) : []
  }));
}

export async function obtenerTodasLasSedes(): Promise<{id: string, nombre: string}[]> {
  const { data, error } = await supabase.from('sedes').select('id, nombre').order('nombre');
  if (error) {
    console.error("Error obteniendo sedes:", error);
    return [];
  }
  return data;
}

export async function guardarAgente(agente: any, sedes_ids: string[] = []): Promise<boolean> {
  let agenteId = agente.id;

  if (agenteId) {
    // Actualizar
    const { error } = await supabase
      .from('agentes')
      .update({
        nombre: agente.nombre,
        email: agente.email,
        rol: agente.rol,
        estado: agente.estado
      })
      .eq('id', agenteId);

    if (error) {
      console.error("Error actualizando agente:", error);
      return false;
    }
  } else {
    // Crear
    const { data, error } = await supabase
      .from('agentes')
      .insert([{
        nombre: agente.nombre,
        email: agente.email,
        rol: agente.rol,
        estado: 'DISPONIBLE'
      }])
      .select('id')
      .single();

    if (error || !data) {
      console.error("Error creando agente:", error);
      return false;
    }
    agenteId = data.id;
  }

  // Sincronizar Sedes
  if (agenteId) {
    // 1. Borrar accesos anteriores
    await supabase.from('sedes_usuarios').delete().eq('agente_id', agenteId);
    
    // 2. Insertar nuevos accesos
    if (sedes_ids.length > 0) {
      const sedesToInsert = sedes_ids.map(sede_id => ({
        agente_id: agenteId,
        sede_id: sede_id
      }));
      const { error: errorSedes } = await supabase.from('sedes_usuarios').insert(sedesToInsert);
      if (errorSedes) {
        console.error("Error asignando sedes:", errorSedes);
      }
    }
  }

  await registrarLog('ADMIN', `Gestionó usuario ${agente.email}`, { rol: agente.rol, sedes: sedes_ids.length });
  
  return true;
}
