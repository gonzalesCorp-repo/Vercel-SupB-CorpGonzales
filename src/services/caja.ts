import { createClient } from '@/lib/supabase/client';
import { registrarLog } from './logger';
import { ItemTicket } from './tickets';

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

  // 1. Crear el Comprobante de Pago
  const serie = tipoComprobante === 'FACTURA' ? 'F001' : tipoComprobante === 'BOLETA' ? 'B001' : 'NV01';
  const { data: comprobante, error: errComp } = await supabase
    .from('comprobantes_pago')
    .insert([{
      sesion_caja_id: sesionCajaId || null,
      tipo_comprobante: tipoComprobante,
      serie,
      cliente_nombre: clienteNombre,
      cliente_doc: clienteDoc || '00000000',
      tipo_doc: tipoDoc || 'DNI',
      subtotal,
      igv,
      total,
      descuento_total: descuentoTotal,
      items,
      pagos,
      oatc_ids: oatcIds,
      cajero_nombre: cajeroNombre,
      estado: 'EMITIDO'
    }])
    .select()
    .single();

  if (errComp) {
    console.error('Error emitiendo comprobante:', errComp);
    throw errComp;
  }

  // 2. Registrar movimientos de caja por cada medio de pago
  if (sesionCajaId) {
    for (const pago of pagos) {
      await supabase.from('movimientos_caja').insert([{
        sesion_caja_id: sesionCajaId,
        comprobante_id: comprobante.id,
        tipo_movimiento: 'INGRESO_VENTA',
        metodo_pago: pago.metodo,
        monto: pago.monto,
        descripcion: `Pago ${tipoComprobante} #${serie}-${comprobante.numero} de ${clienteNombre}`
      }]);
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
