import { createClient } from '@/lib/supabase/client';
import { registrarLog } from './logger';
import { obtenerConfiguracionSede } from './sedesConfig';

export type TipoTicketOATC = 'servicio' | 'producto' | 'mixto';
export type EstadoTicketOATC = 'EN_PROCESO' | 'EN_EXPOSICION' | 'PENDIENTE_VALIDACION' | 'APROBADO' | 'FINALIZADO' | 'CANCELADO';

export interface ItemTicket {
  id?: string;
  bien_id?: string;
  nombre: string;
  tipo: 'servicio' | 'producto' | 'insumo';
  categoria?: string;
  precio_base: number;
  precio_final: number;
  es_cortesia?: boolean;
  cantidad: number;
  atributos?: Record<string, any>;
}

export interface OatcTicket {
  id: string;
  oatc_id: string;
  agente_id?: string;
  agente_nombre: string;
  tipo_ticket: TipoTicketOATC;
  estacion_nombre?: string;
  estacion_id?: string;
  items: ItemTicket[];
  monto_total: number;
  estado_ticket: EstadoTicketOATC;
  requiere_validacion: boolean;
  motivo_validacion?: string;
  tiempo_exposicion_minutos?: number;
  hora_inicio_exposicion?: string;
  motivo_exposicion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  created_at?: string;
}

export async function obtenerTicketsDeOatc(oatcId: string): Promise<OatcTicket[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('oatc_tickets')
    .select('*')
    .eq('oatc_id', oatcId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error obteniendo tickets de OATC:', error);
    return [];
  }
  return (data || []) as OatcTicket[];
}

export async function crearTicketAnidado(ticket: Partial<OatcTicket>): Promise<OatcTicket | null> {
  const supabase = createClient();
  
  const items = ticket.items || [];
  const tieneCortesia = items.some(i => i.precio_final === 0 || i.es_cortesia);
  const montoTotal = items.reduce((acc, i) => acc + (Number(i.precio_final || 0) * Number(i.cantidad || 1)), 0);

  const payload = {
    oatc_id: ticket.oatc_id,
    agente_id: ticket.agente_id || null,
    agente_nombre: ticket.agente_nombre || 'Staff',
    tipo_ticket: ticket.tipo_ticket || 'servicio',
    estacion_nombre: ticket.estacion_nombre || 'Estación Principal',
    estacion_id: ticket.estacion_id || null,
    items,
    monto_total: montoTotal,
    estado_ticket: tieneCortesia ? 'PENDIENTE_VALIDACION' : 'EN_PROCESO',
    requiere_validacion: tieneCortesia,
    motivo_validacion: tieneCortesia ? 'Cortesía de Fidelización (Precio S/ 0.00)' : null,
    hora_inicio: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('oatc_tickets')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creando ticket anidado:', error);
    throw error;
  }

  await registrarLog('OATC_TICKET', `Creado ticket anidado para OATC: ${ticket.oatc_id}`, {
    staff: ticket.agente_nombre,
    monto: montoTotal,
    requiere_validacion: tieneCortesia
  });

  return data as OatcTicket;
}

export async function actualizarPrecioItemTicket(
  ticketId: string, 
  itemIndex: number, 
  nuevoPrecio: number, 
  motivo?: string
): Promise<OatcTicket | null> {
  const supabase = createClient();

  // 1. Obtener ticket actual
  const { data: ticket, error: errFetch } = await supabase
    .from('oatc_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (errFetch || !ticket) return null;

  const items = [...(ticket.items || [])];
  if (!items[itemIndex]) return null;

  const esCortesia = nuevoPrecio === 0;
  items[itemIndex] = {
    ...items[itemIndex],
    precio_final: nuevoPrecio,
    es_cortesia: esCortesia
  };

  const montoTotal = items.reduce((acc, i) => acc + (Number(i.precio_final || 0) * Number(i.cantidad || 1)), 0);
  const tieneCortesia = items.some(i => i.precio_final === 0 || i.es_cortesia);

  const updatePayload = {
    items,
    monto_total: montoTotal,
    requiere_validacion: tieneCortesia,
    motivo_validacion: tieneCortesia ? (motivo || 'Cortesía de Fidelización (Precio S/ 0.00)') : null,
    estado_ticket: tieneCortesia ? 'PENDIENTE_VALIDACION' : ticket.estado_ticket
  };

  const { data, error } = await supabase
    .from('oatc_tickets')
    .update(updatePayload)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando precio de item:', error);
    throw error;
  }

  return data as OatcTicket;
}

export async function aprobarValidacionTicket(ticketId: string, aprobadoPor: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('oatc_tickets')
    .update({
      estado_ticket: 'APROBADO',
      requiere_validacion: false,
      motivo_validacion: `Aprobado por ${aprobadoPor}`
    })
    .eq('id', ticketId);

  if (error) {
    console.error('Error aprobando ticket:', error);
    return false;
  }

  await registrarLog('OATC_VALIDACION', `Aprobada cortesía/validación de ticket ${ticketId} por ${aprobadoPor}`);
  return true;
}

export async function cambiarFaseOatc(
  oatcId: string, 
  nuevaFase: 'EN_ESPERA' | 'ASESORIA' | 'EN_PROCESO' | 'POR_COBRAR' | 'FINALIZADO' | 'CANCELADO'
): Promise<boolean> {
  const supabase = createClient();
  const updatePayload: any = { estado_proceso: nuevaFase };

  if (nuevaFase === 'EN_PROCESO') {
    updatePayload.hora_inicio_atencion = new Date().toISOString();
  } else if (nuevaFase === 'POR_COBRAR' || nuevaFase === 'FINALIZADO') {
    updatePayload.hora_fin_atencion = new Date().toISOString();
  }

  const { error } = await supabase
    .from('oatc')
    .update(updatePayload)
    .eq('id', oatcId);

  if (error) {
    console.error('Error cambiando fase de OATC:', error);
    return false;
  }

  // Si pasa a POR_COBRAR, FINALIZADO o CANCELADO, liberar a los especialistas y la estación física
  if (nuevaFase === 'POR_COBRAR' || nuevaFase === 'FINALIZADO' || nuevaFase === 'CANCELADO') {
    const { data: oatcData } = await supabase.from('oatc').select('agente_id').eq('id', oatcId).single();
    if (oatcData?.agente_id) {
      await supabase
        .from('agentes')
        .update({ estado_operativo: 'DISPONIBLE', ultimo_cambio_estado: new Date().toISOString() })
        .eq('id', oatcData.agente_id);
    }

    const { data: ticketsData } = await supabase.from('oatc_tickets').select('agente_id').eq('oatc_id', oatcId);
    if (ticketsData) {
      for (const t of ticketsData) {
        if (t.agente_id) {
          await supabase
            .from('agentes')
            .update({ estado_operativo: 'DISPONIBLE', ultimo_cambio_estado: new Date().toISOString() })
            .eq('id', t.agente_id);
        }
      }
    }

    await supabase
      .from('estaciones_piso')
      .update({ estado_ocupacion: 'ESPERA' })
      .eq('oatc_id_actual', oatcId);
  }

  await registrarLog('OATC_FASE', `OATC ${oatcId} cambió a fase ${nuevaFase}`);
  return true;
}

export async function iniciarServicioConProforma(params: {
  oatcId: string;
  items: ItemTicket[];
  estacionNombre: string;
  agenteNombre: string;
  agenteId?: string;
  ticketIdExistente?: string;
}): Promise<boolean> {
  const supabase = createClient();
  const { oatcId, items, estacionNombre, agenteNombre, agenteId, ticketIdExistente } = params;

  const montoTotal = items.reduce((acc, i) => acc + (Number(i.precio_final || 0) * Number(i.cantidad || 1)), 0);
  const tieneCortesia = items.some(i => i.precio_final === 0 || i.es_cortesia);

  // 1. Actualizar OATC a EN_PROCESO
  const { error: errOatc } = await supabase
    .from('oatc')
    .update({
      estado_proceso: 'EN_PROCESO',
      hora_inicio_atencion: new Date().toISOString()
    })
    .eq('id', oatcId);

  if (errOatc) {
    console.error('Error iniciando servicio en OATC:', errOatc);
    return false;
  }

  // 2. Actualizar o insertar Ticket #1 oficial
  if (ticketIdExistente) {
    await supabase
      .from('oatc_tickets')
      .update({
        items,
        monto_total: montoTotal,
        estado_ticket: tieneCortesia ? 'PENDIENTE_VALIDACION' : 'EN_PROCESO',
        requiere_validacion: tieneCortesia,
        motivo_validacion: tieneCortesia ? 'Cortesía de Fidelización (Precio S/ 0.00)' : null,
        estacion_nombre: estacionNombre
      })
      .eq('id', ticketIdExistente);
  } else {
    await crearTicketAnidado({
      oatc_id: oatcId,
      agente_id: agenteId,
      agente_nombre: agenteNombre,
      tipo_ticket: 'servicio',
      estacion_nombre: estacionNombre,
      items
    });
  }

  // 3. Actualizar timestamp del agente para rotación en cola
  if (agenteId) {
    await supabase
      .from('agentes')
      .update({ ultimo_cambio_estado: new Date().toISOString() })
      .eq('id', agenteId);
  }

  await registrarLog('OATC_PROFORMA_ACEPTADA', `Servicio iniciado con proforma de S/ ${montoTotal.toFixed(2)} para OATC ${oatcId}`, {
    staff: agenteNombre,
    itemsCount: items.length,
    monto: montoTotal
  });

  return true;
}

export async function rechazarAsesoria(params: {
  oatcId: string;
  motivo: string;
  detalle?: string;
  crearLeadCrm?: boolean;
  agenteId?: string;
  agenteNombre?: string;
  clienteNombre?: string;
}): Promise<boolean> {
  const supabase = createClient();
  const { oatcId, motivo, detalle, crearLeadCrm, agenteId, agenteNombre, clienteNombre } = params;

  // 1. Cancelar la OATC
  const { error } = await supabase
    .from('oatc')
    .update({
      estado_proceso: 'CANCELADO',
      detalle_cancelacion: `${motivo}${detalle ? ` - ${detalle}` : ''}`
    })
    .eq('id', oatcId);

  if (error) {
    console.error('Error al rechazar asesoría:', error);
    return false;
  }

  // 2. Si se solicita, crear Lead CRM
  if (crearLeadCrm && clienteNombre) {
    await supabase
      .from('crm_leads')
      .insert([{
        cliente_nombre: clienteNombre,
        agente_preferido_id: agenteId || null,
        agente_preferido_nombre: agenteNombre || null,
        motivo_abandono: `Rechazo en Asesoría: ${motivo}`,
        estado: 'NUEVO',
        notas: detalle || 'Cliente rechazó proforma. Se requiere contacto posterior para reprogramar.'
      }]);
  }

  await registrarLog('OATC_ASESORIA_RECHAZADA', `Asesoría rechazada en OATC ${oatcId}: ${motivo}`, {
    staff: agenteNombre,
    motivo,
    detalle
  });

  return true;
}

export async function derivarTicketCruzado(params: {
  oatcId: string;
  destino: 'PROPIO' | 'COLEGA' | 'RECEPCION';
  colegaId?: string;
  colegaNombre?: string;
  tipoTicket: TipoTicketOATC;
  estacionNombre?: string;
  items: ItemTicket[];
  solicitadoPor: string;
}): Promise<OatcTicket | null> {
  const { oatcId, destino, colegaId, colegaNombre, tipoTicket, estacionNombre, items, solicitadoPor } = params;
  const supabase = createClient();

  // 1. Si el destino es 'PROPIO', buscar si ya existe un ticket del mismo tipo para este colaborador y anexarlo
  if (destino === 'PROPIO') {
    const { data: ticketsExistentes } = await supabase
      .from('oatc_tickets')
      .select('*')
      .eq('oatc_id', oatcId)
      .eq('agente_nombre', solicitadoPor)
      .eq('tipo_ticket', tipoTicket);

    if (ticketsExistentes && ticketsExistentes.length > 0) {
      const tExistente = ticketsExistentes[0] as OatcTicket;
      const itemsActualizados = [...(tExistente.items || []), ...items];
      const nuevoMontoTotal = itemsActualizados.reduce((acc, i) => acc + (Number(i.precio_final || 0) * Number(i.cantidad || 1)), 0);
      const tieneCortesia = itemsActualizados.some(i => i.precio_final === 0 || i.es_cortesia);

      const { data: ticketActualizado, error: errUpdate } = await supabase
        .from('oatc_tickets')
        .update({
          items: itemsActualizados,
          monto_total: nuevoMontoTotal,
          requiere_validacion: tieneCortesia,
          motivo_validacion: tieneCortesia ? 'Cortesía de Fidelización (Precio S/ 0.00)' : null
        })
        .eq('id', tExistente.id)
        .select()
        .single();

      if (!errUpdate && ticketActualizado) {
        await registrarLog('OATC_ITEM_ANEXADO', `Anexado(s) ${items.length} ítem(s) al Ticket existente #${tExistente.id.slice(0, 4)} de ${solicitadoPor}`);
        return ticketActualizado as OatcTicket;
      }
    }
  }

  // 2. Si no existe o es un colega / recepción, crear un nuevo ticket anidado
  let agenteIdFinal = null;
  let agenteNombreFinal = 'POR ASIGNAR';
  let estadoFinal: EstadoTicketOATC = 'EN_PROCESO';

  if (destino === 'PROPIO') {
    agenteNombreFinal = solicitadoPor;
  } else if (destino === 'COLEGA' && colegaNombre) {
    agenteIdFinal = colegaId;
    agenteNombreFinal = colegaNombre;
    estadoFinal = 'PENDIENTE_VALIDACION'; // Pendiente de que el colega confirme o inicie
  } else if (destino === 'RECEPCION') {
    agenteNombreFinal = 'POR ASIGNAR (Recepción)';
    estadoFinal = 'PENDIENTE_VALIDACION';
  }

  return await crearTicketAnidado({
    oatc_id: oatcId,
    agente_id: agenteIdFinal || undefined,
    agente_nombre: agenteNombreFinal,
    tipo_ticket: tipoTicket,
    estacion_nombre: estacionNombre || 'Estación Secundaria',
    items,
    estado_ticket: estadoFinal
  });
}

export async function iniciarTiempoExposicionTicket(params: {
  ticketId: string;
  oatcId: string;
  agenteId?: string;
  agenteNombre: string;
  minutos: number;
  motivo: string;
  estacionNombre?: string;
}): Promise<boolean> {
  const supabase = createClient();
  const { ticketId, oatcId, agenteId, agenteNombre, minutos, motivo, estacionNombre } = params;

  // 1. Actualizar el ticket individual a EN_EXPOSICION
  const { error: errTicket } = await supabase
    .from('oatc_tickets')
    .update({
      estado_ticket: 'EN_EXPOSICION',
      tiempo_exposicion_minutos: minutos,
      hora_inicio_exposicion: new Date().toISOString(),
      motivo_exposicion: motivo
    })
    .eq('id', ticketId);

  if (errTicket) {
    console.error('Error actualizando ticket a EN_EXPOSICION:', errTicket);
    return false;
  }

  // 2. Liberar temporalmente al especialista que inició la pose
  if (agenteId) {
    await supabase
      .from('agentes')
      .update({
        estado: 'DISPONIBLE',
        ultimo_cambio_estado: new Date().toISOString()
      })
      .eq('id', agenteId);
  }

  // 3. Evaluar el estado global de la OATC
  // Si no hay otros tickets en ejecución 'EN_PROCESO', la OATC pasa globalmente a 'EN_EXPOSICION'
  const { data: otrosTickets } = await supabase
    .from('oatc_tickets')
    .select('id, estado_ticket')
    .eq('oatc_id', oatcId)
    .neq('id', ticketId);

  const hayOtrosEnServicio = (otrosTickets || []).some((t: any) => t.estado_ticket === 'EN_PROCESO');

  if (!hayOtrosEnServicio) {
    await supabase
      .from('oatc')
      .update({
        estado_proceso: 'EN_EXPOSICION',
        detalle_cancelacion: `Pose Química: ${minutos} min (${motivo})`
      })
      .eq('id', oatcId);

    await supabase
      .from('estaciones_piso')
      .update({ estado_ocupacion: 'ESPERA' })
      .eq('oatc_id_actual', oatcId);
  }

  await registrarLog('OATC_TICKET_EXPOSICION', `Ticket #${ticketId.slice(0, 4)} de ${agenteNombre} entró en exposición (${minutos} min - ${motivo}).`);
  return true;
}

export async function reanudarServicioTicket(params: {
  ticketId: string;
  oatcId: string;
  agenteId?: string;
  agenteNombre: string;
  estacionNombre?: string;
}): Promise<boolean> {
  const supabase = createClient();
  const { ticketId, oatcId, agenteId, agenteNombre, estacionNombre } = params;

  // 1. Actualizar el ticket a EN_PROCESO
  await supabase
    .from('oatc_tickets')
    .update({ estado_ticket: 'EN_PROCESO' })
    .eq('id', ticketId);

  // 2. Especialista vuelve a estar OCUPADO
  if (agenteId) {
    await supabase
      .from('agentes')
      .update({
        estado: 'OCUPADO',
        ultimo_cambio_estado: new Date().toISOString()
      })
      .eq('id', agenteId);
  }

  // 3. OATC y Estación vuelven a EN_PROCESO / SERVICIO
  await supabase
    .from('oatc')
    .update({ estado_proceso: 'EN_PROCESO' })
    .eq('id', oatcId);

  await supabase
    .from('estaciones_piso')
    .update({ estado_ocupacion: 'SERVICIO' })
    .eq('oatc_id_actual', oatcId);

  await registrarLog('OATC_TICKET_REANUDADO', `Ticket #${ticketId.slice(0, 4)} reanudado por ${agenteNombre}.`);
  return true;
}

export async function finalizarTicketIndividual(params: {
  ticketId: string;
  oatcId: string;
  agenteId?: string;
  agenteNombre: string;
}): Promise<{ todosFinalizados: boolean; ticketsRestantes: number }> {
  const supabase = createClient();
  const { ticketId, oatcId, agenteId, agenteNombre } = params;

  // 1. Finalizar ticket individual
  await supabase
    .from('oatc_tickets')
    .update({
      estado_ticket: 'FINALIZADO',
      hora_fin: new Date().toISOString()
    })
    .eq('id', ticketId);

  // 2. Liberar al especialista que finalizó su atención
  if (agenteId) {
    await supabase
      .from('agentes')
      .update({
        estado: 'DISPONIBLE',
        ultimo_cambio_estado: new Date().toISOString()
      })
      .eq('id', agenteId);
  }

  // 3. Evaluar orquestador multi-ticket
  const { data: todosLosTickets } = await supabase
    .from('oatc_tickets')
    .select('id, estado_ticket')
    .eq('oatc_id', oatcId);

  const activosRestantes = (todosLosTickets || []).filter(
    (t: any) => t.id !== ticketId && ['EN_PROCESO', 'EN_EXPOSICION', 'PENDIENTE_VALIDACION'].includes(t.estado_ticket)
  );

  const todosFinalizados = activosRestantes.length === 0;

  if (todosFinalizados) {
    // 1. Obtener estado de pago de la OATC y toggles de la sede
    const { data: oatcActual } = await supabase
      .from('oatc')
      .select('sede_id, estado_pago')
      .eq('id', oatcId)
      .single();

    const toggles = await obtenerConfiguracionSede(oatcActual?.sede_id);
    const estaPreCobradoTotal = oatcActual?.estado_pago === 'PRE_COBRADO_TOTAL';

    if (estaPreCobradoTotal && (toggles.cronAutoCierreOatcFueraHorario ?? true)) {
      // Auto-cierre desatendido fuera de horario
      await supabase
        .from('oatc')
        .update({ 
          estado_proceso: 'FINALIZADO',
          estado_pago: 'PAGADO'
        })
        .eq('id', oatcId);

      await registrarLog('OATC_AUTO_CIERRE_CRON', `OATC #${oatcId.slice(0, 5)} cerrada y liquidada automáticamente por Cronjob Fuera de Horario (100% Pre-Cobrada).`);
    } else {
      // Si no está pre-cobrada, pasa a POR_COBRAR lista para Caja
      await supabase
        .from('oatc')
        .update({ estado_proceso: 'POR_COBRAR' })
        .eq('id', oatcId);

      await registrarLog('OATC_COMPLETA_A_CAJA', `Todos los tickets de la OATC ${oatcId} fueron finalizados. Lista para cobranza en Caja.`);
    }

    await supabase
      .from('estaciones_piso')
      .update({ estado_ocupacion: 'ESPERA' })
      .eq('oatc_id_actual', oatcId);
  } else {
    await registrarLog('OATC_TICKET_FINALIZADO_PARCIAL', `Ticket #${ticketId.slice(0, 4)} de ${agenteNombre} finalizado. Quedan ${activosRestantes.length} ticket(s) en curso.`);
  }

  return { todosFinalizados, ticketsRestantes: activosRestantes.length };
}

// Aliases de compatibilidad legacy
export const iniciarTiempoExposicion = (p: any) => iniciarTiempoExposicionTicket({ ...p, ticketId: p.ticketId || p.oatcId });
export const reanudarServicioExposicion = (p: any) => reanudarServicioTicket({ ...p, ticketId: p.ticketId || p.oatcId });



