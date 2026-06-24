import { createClient } from '@/lib/supabase/client';
import { OATC } from './recepcion';

const supabase = createClient();

export interface PedidoInsumo {
  id?: string;
  agente_id: string;
  agente_nombre: string;
  insumo_solicitado: string;
  estado?: string;
  created_at?: string;
}

// 1. Obtener los tickets (OATC) asignados a un agente que están en proceso
export async function obtenerTicketsAsignados(agenteNombre: string): Promise<OATC[]> {
  const { data, error } = await supabase
    .from('oatc')
    .select('*')
    .eq('agente_nombre', agenteNombre)
    .eq('estado_proceso', 'ASESORANDO');

  if (error) {
    console.error("Error obteniendo tickets asignados:", error);
    return [];
  }
  return data as OATC[];
}

// 2. Terminar Atención (Liquidación)
export async function terminarAtencion(oatcId: string): Promise<boolean> {
  const { error } = await supabase
    .from('oatc')
    .update({ 
      estado_proceso: 'FINALIZADO',
      hora_fin_atencion: new Date().toISOString()
    })
    .eq('id', oatcId);

  if (error) {
    console.error("Error terminando atención:", error);
    return false;
  }
  return true;
}

// 3. Crear pedido de insumos a laboratorio
export async function pedirInsumo(pedido: PedidoInsumo): Promise<boolean> {
  const { error } = await supabase
    .from('pedidos_insumos')
    .insert([
      {
        agente_id: pedido.agente_id,
        agente_nombre: pedido.agente_nombre,
        insumo_solicitado: pedido.insumo_solicitado
      }
    ]);

  if (error) {
    console.error("Error pidiendo insumo:", error);
    return false;
  }
  return true;
}
