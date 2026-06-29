import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { OATC, Bien } from './recepcion';
import { registrarLog } from './logger';

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
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const { data, error } = await supabase
    .from('oatc')
    .select('*')
    .eq('agente_nombre', agenteNombre)
    .neq('estado_proceso', 'FINALIZADO')
    .neq('estado_proceso', 'CANCELADO')
    .eq('sede_id', sedeId);

  if (error) {
    console.error("Error obteniendo tickets asignados:", error);
    return [];
  }
  return data as OATC[];
}

export async function terminarAtencion(oatcId: string): Promise<boolean> {
  // 1. Obtener la OATC actual
  const { data: oatc, error: errOatc } = await supabase
    .from('oatc')
    .select('*')
    .eq('id', oatcId)
    .single();

  if (errOatc || !oatc) return false;

  // 2. Obtener Agente ID
  const { data: agente } = await supabase
    .from('agentes')
    .select('id')
    .eq('nombre', oatc.agente_nombre)
    .single();

  if (agente) {
    if (oatc.estado_pago === 'Pagado') {
      // FAST-PASS: Si ya está pagado (Pre-cobro o cobrado), reingresa directo a DISPONIBLE
      await supabase.from('agentes').update({ estado: 'DISPONIBLE' }).eq('id', agente.id);
    } else {
      // No está pagado: Va al Inbox de Recepción
      // Buscar o crear la configuración de "Retorno de Servicio"
      let { data: configRetorno } = await supabase
        .from('config_peticiones')
        .select('id')
        .eq('nombre', 'Retorno de Servicio')
        .single();
        
      if (!configRetorno) {
        const { data: newConfig } = await supabase.from('config_peticiones').insert([{
          nombre: 'Retorno de Servicio',
          penaliza_cola: false,
          color: 'bg-indigo-100 text-indigo-800'
        }]).select('id').single();
        configRetorno = newConfig;
      }

      if (configRetorno) {
        await supabase.from('cola_peticiones').insert([{
          agente_id: agente.id,
          sede_id: oatc.sede_id,
          tipo_id: configRetorno.id,
          estado: 'PENDIENTE',
          oatc_id: oatc.id
        }]);
      }
    }
  }

  // 3. Finalizar OATC
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
  
  await registrarLog('OPERACIONES', `Terminó atención del ticket`, { ticket_id: oatcId });
  return true;
}

// 3. Crear pedido de insumos a laboratorio
export async function pedirInsumo(pedido: PedidoInsumo): Promise<boolean> {
  const sedeId = useAppStore.getState().sedeActiva?.id;

  const { error } = await supabase
    .from('pedidos_insumos')
    .insert([
      {
        agente_id: pedido.agente_id,
        agente_nombre: pedido.agente_nombre,
        insumo_solicitado: pedido.insumo_solicitado,
        sede_id: sedeId
      }
    ]);

  if (error) {
    console.error("Error pidiendo insumo:", error);
    return false;
  }
  
  await registrarLog('OPERACIONES', `Pidió insumo a laboratorio`, { insumo: pedido.insumo_solicitado });
  return true;
}

// 4. Solicitar adición de servicio (Gatekeeping - Upsell) a una OATC
export async function solicitarCambiosOatc(oatcId: string, nuevoBien: Bien, nuevaDemandaId?: string): Promise<boolean> {
  const { data: oatc, error: errOatc } = await supabase
    .from('oatc')
    .select('*')
    .eq('id', oatcId)
    .single();

  if (errOatc || !oatc) {
    console.error("Error obteniendo OATC para solicitud de upsell:", errOatc);
    return false;
  }

  // Si envían una demanda nueva, obtenemos su nombre
  let nuevoTipoDemanda = oatc.tipo_demanda;
  if (nuevaDemandaId) {
    const { data: dem } = await supabase.from('config_demandas').select('nombre').eq('id', nuevaDemandaId).single();
    if (dem) nuevoTipoDemanda = dem.nombre;
  }

  const solicitud = {
    nuevos_servicios: [
      {
        servicio_id: nuevoBien.id,
        nombre: nuevoBien.nombre,
        precio: nuevoBien.precio_venta,
        cantidad: 1,
        categoria: nuevoBien.categoria,
        tipo_bien: nuevoBien.tipo_bien
      }
    ],
    nuevo_tipo_demanda: nuevoTipoDemanda,
    solicitado_en: new Date().toISOString()
  };

  // Agregar a cambios_pendientes (combinando si ya había uno, aunque normalmente se sobrescribe)
  const cambiosPendientes = oatc.cambios_pendientes ? { ...oatc.cambios_pendientes, ...solicitud } : solicitud;

  const { error } = await supabase
    .from('oatc')
    .update({ 
      cambios_pendientes: cambiosPendientes,
      estado_proceso: 'PENDIENTE_CONFIRMACION' 
    })
    .eq('id', oatcId);

  if (error) {
    console.error("Error guardando solicitud de cambios:", error);
    return false;
  }

  await registrarLog('OPERACIONES', `Solicitó agregar servicio a OATC`, { oatc_id: oatcId, servicio: nuevoBien.nombre });
  return true;
}
