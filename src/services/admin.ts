import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { Agente } from './recepcion';

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

  const totalVentas = (facturas || []).reduce((sum, item) => sum + Number(item.total), 0);
  const cantFacturas = (facturas || []).length;
  const ticketPromedio = cantFacturas > 0 ? totalVentas / cantFacturas : 0;

  return {
    totalVentas,
    ticketsAtendidos: ticketsAtendidos || 0,
    ticketPromedio
  };
}

// Para Gestión de Usuarios
export async function obtenerTodosLosAgentes(): Promise<Agente[]> {
  const { data, error } = await supabase
    .from('agentes')
    .select('*')
    .order('nombre');

  if (error) {
    console.error("Error obteniendo agentes para admin:", error);
    return [];
  }
  return data as Agente[];
}

export async function guardarAgente(agente: any): Promise<boolean> {
  if (agente.id) {
    // Actualizar
    const { error } = await supabase
      .from('agentes')
      .update({
        nombre: agente.nombre,
        email: agente.email,
        rol: agente.rol,
        estado: agente.estado
      })
      .eq('id', agente.id);

    if (error) {
      console.error("Error actualizando agente:", error);
      return false;
    }
  } else {
    // Crear
    const { error } = await supabase
      .from('agentes')
      .insert([{
        nombre: agente.nombre,
        email: agente.email,
        rol: agente.rol,
        estado: 'DISPONIBLE'
      }]);

    if (error) {
      console.error("Error creando agente:", error);
      return false;
    }
  }
  return true;
}
