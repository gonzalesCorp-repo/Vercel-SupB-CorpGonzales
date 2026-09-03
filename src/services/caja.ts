import { createClient } from '@/lib/supabase/client';
import { registrarLog } from './logger';
import { ItemTicket } from './tickets';
import { procesarAcreditacionPagoPOS } from './pasarelasPOS';
import { useAppStore } from '@/store/useAppStore';

export interface SesionCaja {
  id: string;
  sede_id?: string;
  cajero_id?: string;
  cajero_nombre: string;
  monto_apertura: number;
  monto_cierre_real?: number | null;
  monto_cierre_teorico?: number | null;
  varianza?: number | null;
  estado: 'ABIERTA' | 'CERRADA';
  notas_apertura?: string;
  notas_cierre?: string;
  created_at: string;
  closed_at?: string;
}

export interface PagoDetalle {
  metodo: 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA';
  monto: number;
  referencia?: string;
}

export interface ComprobantePago {
  id: string;
  sede_id?: string;
  sesion_caja_id?: string;
  tipo_comprobante: 'BOLETA' | 'FACTURA' | 'NOTA_VENTA';
  serie: string;
  numero: number;
  correlativo?: number;
  cliente_id?: string;
  cliente_nombre: string;
  cliente_doc?: string;
  tipo_doc?: string;
  subtotal: number;
  igv: number;
  total: number;
  descuento_total?: number;
  items: ItemTicket[];
  pagos: PagoDetalle[];
  oatc_ids: string[];
  cajero_nombre: string;
  estado: 'EMITIDO' | 'ANULADO';
  fecha_emision?: string;
  metadata_fiscal?: any;
  created_at: string;
}

export async function obtenerSesionCajaActiva(cajeroId?: string): Promise<SesionCaja | null> {
  const supabase = createClient();
  let query = supabase
    .from('sesiones_caja')
    .select('*')
    .eq('estado', 'ABIERTA')
    .order('created_at', { ascending: false })
    .limit(1);

  if (cajeroId) {
    query = query.eq('cajero_id', cajeroId);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;
  return data[0] as SesionCaja;
}

export async function abrirSesionCaja(params: {
  cajeroId?: string;
  cajeroNombre: string;
  montoApertura: number;
  notas?: string;
}): Promise<SesionCaja | null> {
  const supabase = createClient();
  const { cajeroId, cajeroNombre, montoApertura, notas } = params;

  const payload = {
    cajero_id: cajeroId || null,
    cajero_nombre: cajeroNombre,
    monto_apertura: montoApertura,
    notas_apertura: notas || 'Apertura de turno de caja',
    estado: 'ABIERTA'
  };

  const { data, error } = await supabase
    .from('sesiones_caja')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error al abrir sesión de caja:', error);
    throw error;
  }

  // Registrar movimiento de fondo inicial
  await supabase.from('movimientos_caja').insert([{
    sesion_caja_id: data.id,
    tipo_movimiento: 'FONDO_INICIAL',
    metodo_pago: 'EFECTIVO',
    monto: montoApertura,
    descripcion: `Fondo inicial declarado por ${cajeroNombre}`
  }]);

  await registrarLog('CAJA_APERTURA', `Sesión de caja abierta por ${cajeroNombre} con fondo inicial S/ ${montoApertura.toFixed(2)}`);
  return data as SesionCaja;
}

export async function cerrarSesionCajaCiega(params: {
  sesionId: string;
  montoCierreReal: number;
  notas?: string;
}): Promise<{ sesion: SesionCaja; varianza: number; montoTeorico: number }> {
  const supabase = createClient();
  const { sesionId, montoCierreReal, notas } = params;

  // 1. Calcular saldo teórico recaudado en efectivo
  const { data: movimientos } = await supabase
    .from('movimientos_caja')
    .select('monto, tipo_movimiento')
    .eq('sesion_caja_id', sesionId)
    .eq('metodo_pago', 'EFECTIVO');

  let montoTeorico = 0;
  if (movimientos) {
    movimientos.forEach((m: any) => {
      if (m.tipo_movimiento === 'FONDO_INICIAL' || m.tipo_movimiento === 'INGRESO_VENTA') {
        montoTeorico += Number(m.monto || 0);
      } else if (m.tipo_movimiento === 'EGRESO_GASTO') {
        montoTeorico -= Number(m.monto || 0);
      }
    });
  }

  const varianza = Number(montoCierreReal) - montoTeorico;

  const { data: sesionCerrada, error } = await supabase
    .from('sesiones_caja')
    .update({
      estado: 'CERRADA',
      monto_cierre_real: montoCierreReal,
      monto_cierre_teorico: montoTeorico,
      varianza,
      notas_cierre: notas || 'Cierre de turno ciego',
      closed_at: new Date().toISOString()
    })
    .eq('id', sesionId)
    .select()
    .single();

  if (error) {
    console.error('Error al cerrar sesión de caja:', error);
    throw error;
  }

  await registrarLog('CAJA_CIERRE', `Cierre de caja ciego. Real: S/ ${montoCierreReal.toFixed(2)} | Teórico: S/ ${montoTeorico.toFixed(2)} | Varianza: S/ ${varianza.toFixed(2)}`);
  return { sesion: sesionCerrada as SesionCaja, varianza, montoTeorico };
}

export async function obtenerOrdenesPorCobrar(sedeId?: string): Promise<any[]> {
  const supabase = createClient();
  let query = supabase
    .from('oatc')
    .select('*')
    .not('estado_proceso', 'in', '("FINALIZADO","FINALIZADA","CANCELADO")')
    .or('estado_pago.is.null,estado_pago.neq.Pagado,estado_pago.neq.PAGADO,estado_pago.eq.PARCIAL_ADELANTO,estado_pago.eq.NO_PAGADO')
    .order('created_at', { ascending: true });

  if (sedeId) {
    query = query.eq('sede_id', sedeId);
  }

  const { data: oatcs, error } = await query;

  if (error || !oatcs) return [];

  // Traer los tickets anidados de cada OATC
  const oatcIds = oatcs.map((o: any) => o.id);
  const { data: tickets } = await supabase
    .from('oatc_tickets')
    .select('*')
    .in('oatc_id', oatcIds);

  return oatcs.map((o: any) => {
    const misTickets = (tickets || []).filter((t: any) => t.oatc_id === o.id);
    const totalCalculado = misTickets.reduce((acc: number, t: any) => acc + Number(t.monto_total || 0), 0);
    return {
      ...o,
      tickets: misTickets,
      total_oatc: totalCalculado > 0 ? totalCalculado : (o.punto_partida?.reduce((acc: number, p: any) => acc + Number(p.precio || p.precio_venta || 0), 0) || 0)
    };
  });
}

export async function procesarCobroFlexible(params: {
  sesionCajaId?: string;
  oatcIds: string[];
  tipoComprobante: 'BOLETA' | 'FACTURA' | 'NOTA_VENTA';
  clienteNombre: string;
  clienteDoc?: string;
  tipoDoc?: string;
  items: ItemTicket[];
  pagos: PagoDetalle[];
  cajeroNombre: string;
}): Promise<ComprobantePago> {
  const supabase = createClient();
  const { sesionCajaId, oatcIds, tipoComprobante, clienteNombre, clienteDoc, tipoDoc, items, pagos, cajeroNombre } = params;

  const total = items.reduce((acc, i) => acc + (Number(i.precio_final || 0) * Number(i.cantidad || 1)), 0);
  const subtotal = Number((total / 1.18).toFixed(2));
  const igv = Number((total - subtotal).toFixed(2));
  const descuentoTotal = items.filter(i => i.es_cortesia).reduce((acc, i) => acc + (Number(i.precio_base || 0) * Number(i.cantidad || 1)), 0);

  // 1. Emitir Comprobante de Pago de forma atómica con Advisory Lock (rpc_emitir_comprobante_pago)
  const serie = tipoComprobante === 'FACTURA' ? 'F001' : tipoComprobante === 'BOLETA' ? 'B001' : 'T001';
  const sedeId = useAppStore.getState().sedeActiva?.id || '';

  let comprobante: ComprobantePago | null = null;

  try {
    const { data: rpcComp, error: rpcErr } = await supabase.rpc('rpc_emitir_comprobante_pago', {
      p_sede_id: sedeId || 'c9755dbc-11e0-452d-b971-209f5476bbcb',
      p_sesion_caja_id: sesionCajaId || null,
      p_tipo_comprobante: tipoComprobante,
      p_serie: serie,
      p_cliente_id: null,
      p_cliente_nombre: clienteNombre || 'Cliente General',
      p_cliente_doc: clienteDoc || '00000000',
      p_tipo_doc: tipoDoc || 'DNI',
      p_subtotal: subtotal,
      p_igv: igv,
      p_total: total,
      p_descuento_total: descuentoTotal,
      p_items: items,
      p_pagos: pagos,
      p_oatc_ids: (oatcIds || []).filter(id => id && !id.startsWith('libre_')),
      p_cajero_nombre: cajeroNombre || 'Cajero POS',
      p_metadata_fiscal: {}
    });

    if (!rpcErr && rpcComp) {
      comprobante = rpcComp as ComprobantePago;
    } else {
      throw rpcErr || new Error('RPC rpc_emitir_comprobante_pago no disponible');
    }
  } catch (emitErr) {
    console.warn('Fallback a emisión manual por error en rpc_emitir_comprobante_pago:', emitErr);
    let correlativo = 1;
    try {
      const { data: rpcCorr, error: rpcErr } = await supabase.rpc('rpc_siguiente_correlativo_comprobante', {
        p_sede_id: sedeId || 'c9755dbc-11e0-452d-b971-209f5476bbcb',
        p_serie: serie
      });
      if (!rpcErr && rpcCorr !== null) {
        correlativo = Number(rpcCorr);
      } else {
        throw rpcErr || new Error('RPC no disponible');
      }
    } catch {
      const { data: lastComp } = await supabase
        .from('comprobantes_pago')
        .select('numero, correlativo')
        .eq('serie', serie)
        .order('numero', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastComp) {
        correlativo = Math.max(Number(lastComp.correlativo || 0), Number(lastComp.numero || 0)) + 1;
      }
    }

    const { data: insComp, error: errComp } = await supabase
      .from('comprobantes_pago')
      .insert([{
        sede_id: sedeId || null,
        sesion_caja_id: sesionCajaId || null,
        tipo_comprobante: tipoComprobante,
        serie,
        numero: correlativo,
        correlativo: correlativo,
        cliente_nombre: clienteNombre || 'Cliente General',
        cliente_doc: clienteDoc || '00000000',
        tipo_doc: tipoDoc || 'DNI',
        subtotal,
        igv,
        total,
        descuento_total: descuentoTotal,
        items,
        pagos,
        oatc_ids: oatcIds,
        cajero_nombre: cajeroNombre || 'Cajero POS',
        estado: 'EMITIDO',
        fecha_emision: new Date().toISOString()
      }])
      .select()
      .single();

    if (errComp || !insComp) {
      console.error('Error emitiendo comprobante en fallback:', errComp);
      throw errComp || new Error('Error emitiendo comprobante');
    }
    comprobante = insComp as ComprobantePago;
  }

  // 2. Registrar movimientos de caja por cada medio de pago y rutear fondos a cuentas financieras
  const sedeActivaId = sedeId || 'general';
  for (const pago of pagos) {
    if (sesionCajaId) {
      await supabase.from('movimientos_caja').insert([{
        sesion_caja_id: sesionCajaId,
        comprobante_id: comprobante.id,
        tipo_movimiento: 'INGRESO_VENTA',
        metodo_pago: pago.metodo,
        monto: pago.monto,
        descripcion: `Pago ${tipoComprobante} #${serie}-${comprobante.numero} de ${clienteNombre}`
      }]);
    }

    // Ruteo a cuentas financieras / Lotes POS en Tránsito
    try {
      await procesarAcreditacionPagoPOS({
        sedeId: sedeActivaId,
        metodoPago: pago.metodo,
        montoBruto: pago.monto,
        oatcId: oatcIds[0],
        cajeroNombre
      });
    } catch (ruteoErr) {
      console.warn('[Caja] Error en ruteo automático de fondos POS:', ruteoErr);
    }
  }

  // 3. Finalizar las OATCs y sus tickets asociados
  if (oatcIds.length > 0) {
    await supabase
      .from('oatc')
      .update({
        estado_proceso: 'FINALIZADO',
        estado_pago: 'Pagado',
        hora_fin_atencion: new Date().toISOString()
      })
      .in('id', oatcIds);

    await supabase
      .from('oatc_tickets')
      .update({ estado_ticket: 'FINALIZADO' })
      .in('oatc_id', oatcIds);

    // Liberar especialistas asignados a estas OATCs en estado_operativo
    const { data: oatcsData } = await supabase
      .from('oatc')
      .select('agente_id')
      .in('id', oatcIds);

    if (oatcsData) {
      const agenteIds = oatcsData.map((o: any) => o.agente_id).filter(Boolean);
      if (agenteIds.length > 0) {
        await supabase
          .from('agentes')
          .update({
            estado_operativo: 'DISPONIBLE',
            ultimo_cambio_estado: new Date().toISOString()
          })
          .in('id', agenteIds);
      }
    }

    // Liberar estaciones asignadas a estas OATCs
    await supabase
      .from('estaciones_piso')
      .update({
        estado_ocupacion: 'LIBRE',
        oatc_id_actual: null,
        agente_id_actual: null,
        cliente_nombre_actual: null
      })
      .in('oatc_id_actual', oatcIds);
  }

  await registrarLog('CAJA_COBRO', `Comprobante ${serie}-${comprobante.numero} emitido por S/ ${total.toFixed(2)} (${oatcIds.length} ordenes cobradas)`);
  return comprobante as ComprobantePago;
}
