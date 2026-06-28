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
    try {
      const response = await fetch(`/api/admin/users/${agenteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: agente.nombre,
          email: agente.email,
          rol: agente.rol,
          especialidad: agente.especialidad,
          estado: agente.estado,
          sedes_ids: sedes_ids
        })
      });
      const result = await response.json();
      if (!response.ok) {
        console.error("Error desde API:", result.error);
        alert(`Error al actualizar usuario: ${result.error}`);
        return false;
      }
    } catch (err) {
      console.error("Error llamando a API:", err);
      return false;
    }
  } else {
    // Crear vía API (Supabase Auth)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: agente.nombre,
          email: agente.email,
          password: agente.password,
          rol: agente.rol,
          especialidad: agente.especialidad,
          sedes_ids: sedes_ids
        })
      });
      const result = await response.json();
      if (!response.ok) {
        console.error("Error desde API:", result.error);
        alert(`Error al crear usuario: ${result.error}`);
        return false;
      }
      agenteId = result.userId;
      
      await registrarLog('ADMIN', `Creó usuario ${agente.email}`, { rol: agente.rol, sedes: sedes_ids.length });
      return true;
    } catch (err) {
      console.error("Error llamando a API:", err);
      return false;
    }
  }

  await registrarLog('ADMIN', `Gestionó usuario ${agente.email}`, { rol: agente.rol, sedes: sedes_ids.length });
  
  return true;
}
