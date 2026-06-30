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

  let query = supabase
    .from('oatc')
    .select('*')
    .neq('estado_proceso', 'FINALIZADO')
    .neq('estado_proceso', 'CANCELADO')
    .neq('estado_proceso', 'POR_COBRAR')
    .eq('sede_id', sedeId);

  if (agenteNombre !== 'ALL') {
    query = query.eq('agente_nombre', agenteNombre);
  }

  const { data, error } = await query;

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

  let nuevoEstadoOatc = 'FINALIZADO';

  if (agente) {
    if (oatc.estado_pago === 'Pagado') {
      // FAST-PASS: Si ya está pagado (Pre-cobro o cobrado), reingresa directo a DISPONIBLE
      await supabase.from('agentes').update({ estado: 'DISPONIBLE' }).eq('id', agente.id);
    } else {
      // No está pagado: Va al Inbox de Recepción
      nuevoEstadoOatc = 'ASESORANDO'; // Esto alerta a recepción en la pizarra

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

  // 3. Finalizar o Actualizar OATC
  const { error } = await supabase
    .from('oatc')
    .update({ 
      estado_proceso: nuevoEstadoOatc,
      ...(nuevoEstadoOatc === 'FINALIZADO' ? { hora_fin_atencion: new Date().toISOString() } : {})
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

// 4. Actualizar servicios directamente en la OATC
export async function actualizarServiciosOatc(oatcId: string, nuevosServicios: any[]): Promise<boolean> {
  const { error } = await supabase
    .from('oatc')
    .update({ 
      punto_partida: nuevosServicios
    })
    .eq('id', oatcId);

  if (error) {
    console.error("Error actualizando servicios:", error);
    return false;
  }

  await registrarLog('OPERACIONES', `Servicios actualizados por staff`, { oatc_id: oatcId });
  return true;
}

// 5. Solicitar inicio de atencin
export async function solicitarInicioAtencion(oatcId: string, userRol?: string): Promise<boolean> {
  const rolUpper = userRol ? userRol.toUpperCase() : '';
  const isAutoApproved = rolUpper === 'ADMIN' || rolUpper === 'RECEPCION' || rolUpper === 'SUPERADMIN';
  const newState = isAutoApproved ? 'EN_CURSO' : 'PENDIENTE_INICIO';

  const { error } = await supabase
    .from('oatc')
    .update({ estado_proceso: newState })
    .eq('id', oatcId);
    
  if (error) return false;
  await registrarLog('OPERACIONES', isAutoApproved ? `Inicio de atención auto-aprobado` : `Solicitud de inicio de atención`, { oatc_id: oatcId });
  return true;
}

// 6. Solicitar fin de atencin
export async function solicitarFinAtencion(oatc: any, userRol?: string): Promise<boolean> {
  const isPrepaid = oatc.estado_pago === 'Pagado' || oatc.estado_pago === 'COBRADO' || oatc.estado_pago === 'PRE_COBRADO';
  const rolUpper = userRol ? userRol.toUpperCase() : '';
  const isAutoApproved = rolUpper === 'ADMIN' || rolUpper === 'RECEPCION' || rolUpper === 'SUPERADMIN';

  let newState = 'PENDIENTE_TERMINO';
  if (isPrepaid) {
    newState = 'FINALIZADO';
  } else if (isAutoApproved) {
    newState = 'POR_COBRAR';
  }

  const { error } = await supabase
    .from('oatc')
    .update({ 
      estado_proceso: newState,
      ...(newState === 'FINALIZADO' ? { hora_fin_atencion: new Date().toISOString() } : {})
    })
    .eq('id', oatc.id);
    
  if (error) return false;
  await registrarLog('OPERACIONES', `Fin de atencin procesado`, { oatc_id: oatc.id, estado: newState });

  if (newState === 'FINALIZADO') {
    const { data: agente } = await supabase.from('agentes').select('id').eq('nombre', oatc.agente_nombre).single();
    if (agente) {
      await supabase.from('agentes').update({ estado: 'DISPONIBLE' }).eq('id', agente.id);
    }
  }

  return true;
}

// 7. Solicitar Pre-Cobro (Staff lo pide antes de terminar)
export async function solicitarPreCobro(oatcId: string): Promise<boolean> {
  const { error } = await supabase
    .from('oatc')
    .update({ estado_proceso: 'PENDIENTE_PRE_COBRO' })
    .eq('id', oatcId);
    
  if (error) return false;
  await registrarLog('OPERACIONES', `Solicitud de Pre-Cobro`, { oatc_id: oatcId });
  return true;
}

// 8. Validar PIN Operativo
export async function validarPin(pin: string): Promise<{id: string, rol: string, nombre: string} | null> {
  const { data, error } = await supabase
    .from('agentes')
    .select('id, rol, nombre')
    .eq('pin', pin)
    .single();
    
  if (error || !data) return null;
  return data;
}
