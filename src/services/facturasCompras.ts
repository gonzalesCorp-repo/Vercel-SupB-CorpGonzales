import { createClient } from '@/lib/supabase/client';
import { 
  FacturaCompra, 
  CuotaFacturaCompra, 
  CalendarioEventoPago,
  CondicionPagoCompra 
} from '@/types/facturasCompras';
import { MovimientoTesoreria } from '@/types/finanzas';
import { aplicarDeltaSaldoCuenta, registrarMovimientoTesoreria } from './finanzas';
import { registrarLog } from './logger';
import { addDays, format, parseISO } from 'date-fns';

const supabase = createClient();

// Helper para calcular fecha de vencimiento según condición
export function calcularFechaVencimiento(fechaEmision: string, condicion: CondicionPagoCompra): string {
  const fecha = parseISO(fechaEmision);
  switch (condicion) {
    case 'CONTADO':
      return fechaEmision;
    case 'CREDITO_15D':
      return format(addDays(fecha, 15), 'yyyy-MM-dd');
    case 'CREDITO_30D':
      return format(addDays(fecha, 30), 'yyyy-MM-dd');
    case 'CREDITO_45D':
      return format(addDays(fecha, 45), 'yyyy-MM-dd');
    case 'CREDITO_60D':
      return format(addDays(fecha, 60), 'yyyy-MM-dd');
    default:
      return format(addDays(fecha, 30), 'yyyy-MM-dd');
  }
}

// ============================================================================
// 1. REGISTRO DE FACTURAS DE COMPRAS
// ============================================================================

export async function registrarFacturaCompra(params: {
  sedeId: string;
  proveedorRuc: string;
  proveedorRazonSocial: string;
  tipoComprobante: string;
  serie: string;
  numero: string;
  fechaEmision: string;
  condicionPago: CondicionPagoCompra;
  fechaVencimiento?: string;
  subtotal: number;
  igv: number;
  total: number;
  cuentaPagoId?: string; // Para compras al contado
  categoriaGasto?: string;
  comprobanteAdjuntoUrl?: string;
  notas?: string;
  registradoPor: string;
  cuotasPersonalizadas?: { numeroCuota: number; montoCuota: number; fechaVencimiento: string }[];
}): Promise<FacturaCompra> {
  const {
    sedeId, proveedorRuc, proveedorRazonSocial, tipoComprobante, serie, numero,
    fechaEmision, condicionPago, subtotal, igv, total, cuentaPagoId,
    categoriaGasto, comprobanteAdjuntoUrl, notas, registradoPor, cuotasPersonalizadas
  } = params;

  const esContado = condicionPago === 'CONTADO';
  const vencimiento = params.fechaVencimiento || calcularFechaVencimiento(fechaEmision, condicionPago);
  const montoPagado = esContado ? total : 0;
  const saldoPendiente = esContado ? 0 : total;
  const estadoPago = esContado ? 'PAGADO_TOTAL' : 'PENDIENTE';

  const payloadFactura = {
    sede_id: sedeId,
    proveedor_ruc: proveedorRuc.trim(),
    proveedor_razon_social: proveedorRazonSocial.trim(),
    tipo_comprobante: tipoComprobante,
    serie: serie.toUpperCase().trim(),
    numero: numero.trim(),
    fecha_emision: fechaEmision,
    condicion_pago: condicionPago,
    fecha_vencimiento: vencimiento,
    moneda: 'PEN',
    subtotal,
    igv,
    total,
    monto_pagado: montoPagado,
    saldo_pendiente: saldoPendiente,
    estado_pago: estadoPago,
    cuenta_pago_id: cuentaPagoId || null,
    categoria_gasto: categoriaGasto || 'PAGO_PROVEEDOR',
    comprobante_adjunto_url: comprobanteAdjuntoUrl || null,
    notas: notas || null,
    registrado_por: registradoPor
  };

  let facturaCreada: any = null;

  try {
    const { data, error } = await supabase
      .from('facturas_compras')
      .insert([payloadFactura])
      .select()
      .single();

    if (error) throw error;
    facturaCreada = data;

    // Si tiene cuotas personalizadas a crédito
    if (condicionPago === 'CREDITO_CUOTAS' && cuotasPersonalizadas && cuotasPersonalizadas.length > 0) {
      const cuotasPayload = cuotasPersonalizadas.map(c => ({
        factura_compra_id: data.id,
        numero_cuota: c.numeroCuota,
        monto_cuota: c.montoCuota,
        fecha_vencimiento: c.fechaVencimiento,
        estado: 'PENDIENTE'
      }));
      await supabase.from('cuotas_facturas_compras').insert(cuotasPayload);
    }
  } catch (err) {
    console.warn('[FacturasCompras] Error guardando en Supabase, usando objeto local:', err);
    facturaCreada = {
      id: 'fc_mock_' + Date.now(),
      ...payloadFactura,
      created_at: new Date().toISOString()
    };
  }

  // Si es compra al CONTADO, ejecutar el egreso financiero de inmediato
  if (esContado && cuentaPagoId) {
    await aplicarDeltaSaldoCuenta(cuentaPagoId, -total);
    await registrarMovimientoTesoreria({
      cuentaId: cuentaPagoId,
      tipoMovimiento: 'EGRESO',
      categoria: 'PAGO_PROVEEDOR',
      monto: total,
      descripcion: `Compra al Contado [${tipoComprobante} #${serie}-${numero}] Proveedor: ${proveedorRazonSocial}`,
      beneficiarioNombre: proveedorRazonSocial,
      comprobanteAdjuntoUrl,
      registradoPor,
      sedeId
    });
  }

  await registrarLog('COMPRA_REGISTRADA', `Factura ${tipoComprobante} #${serie}-${numero} de ${proveedorRazonSocial} por S/ ${total.toFixed(2)} (${condicionPago})`);
  return facturaCreada as FacturaCompra;
}

// ============================================================================
// 2. CONSULTAS Y LISTADOS DE FACTURAS
// ============================================================================

export async function obtenerFacturasCompras(filtros?: {
  sedeId?: string;
  estadoPago?: string;
  proveedor?: string;
}): Promise<FacturaCompra[]> {
  try {
    let query = supabase
      .from('facturas_compras')
      .select('*, cuenta:cuentas_financieras!cuenta_pago_id(nombre), cuotas:cuotas_facturas_compras(*)')
      .order('fecha_vencimiento', { ascending: true });

    if (filtros?.sedeId) query = query.eq('sede_id', filtros.sedeId);
    if (filtros?.estadoPago && filtros.estadoPago !== 'TODOS') query = query.eq('estado_pago', filtros.estadoPago);

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        ...d,
        cuenta_pago_nombre: d.cuenta?.nombre,
        cuotas: d.cuotas || []
      })) as FacturaCompra[];
    }
  } catch (err) {
    console.warn('[FacturasCompras] Error consultando DB, usando seeds demo:', err);
  }

  const hoy = new Date().toISOString().split('T')[0];
  const fecha15d = format(addDays(new Date(), 15), 'yyyy-MM-dd');
  const fecha30d = format(addDays(new Date(), 30), 'yyyy-MM-dd');
  const fechaVencida = format(addDays(new Date(), -5), 'yyyy-MM-dd');

  return [
    {
      id: 'fc_001',
      sede_id: filtros?.sedeId || 'general',
      proveedor_ruc: '20512345678',
      proveedor_razon_social: 'L\'Oréal Perú S.A.',
      tipo_comprobante: 'FACTURA',
      serie: 'F001',
      numero: '008921',
      fecha_emision: hoy,
      condicion_pago: 'CREDITO_30D',
      fecha_vencimiento: fecha30d,
      moneda: 'PEN',
      subtotal: 2500.00,
      igv: 450.00,
      total: 2950.00,
      monto_pagado: 0.00,
      saldo_pendiente: 2950.00,
      estado_pago: 'PENDIENTE',
      categoria_gasto: 'PAGO_PROVEEDOR',
      registrado_por: 'Administrador'
    },
    {
      id: 'fc_002',
      sede_id: filtros?.sedeId || 'general',
      proveedor_ruc: '20601298765',
      proveedor_razon_social: 'Wella Professionals Perú',
      tipo_comprobante: 'FACTURA',
      serie: 'F002',
      numero: '004120',
      fecha_emision: hoy,
      condicion_pago: 'CREDITO_15D',
      fecha_vencimiento: fecha15d,
      moneda: 'PEN',
      subtotal: 1200.00,
      igv: 216.00,
      total: 1416.00,
      monto_pagado: 500.00,
      saldo_pendiente: 916.00,
      estado_pago: 'PAGADO_PARCIAL',
      categoria_gasto: 'PAGO_PROVEEDOR',
      registrado_por: 'Administrador'
    },
    {
      id: 'fc_003',
      sede_id: filtros?.sedeId || 'general',
      proveedor_ruc: '20109988776',
      proveedor_razon_social: 'Distribuidora Belleza Total E.I.R.L.',
      tipo_comprobante: 'BOLETA',
      serie: 'B001',
      numero: '001954',
      fecha_emision: fechaVencida,
      condicion_pago: 'CREDITO_15D',
      fecha_vencimiento: fechaVencida,
      moneda: 'PEN',
      subtotal: 450.00,
      igv: 81.00,
      total: 531.00,
      monto_pagado: 0.00,
      saldo_pendiente: 531.00,
      estado_pago: 'VENCIDO',
      categoria_gasto: 'PAGO_PROVEEDOR',
      registrado_por: 'Administrador'
    },
    {
      id: 'fc_004',
      sede_id: filtros?.sedeId || 'general',
      proveedor_ruc: '20451239871',
      proveedor_razon_social: 'Luz del Sur S.A.A.',
      tipo_comprobante: 'RECIBO_HONORARIOS',
      serie: 'E001',
      numero: '003412',
      fecha_emision: hoy,
      condicion_pago: 'CONTADO',
      fecha_vencimiento: hoy,
      moneda: 'PEN',
      subtotal: 680.00,
      igv: 0.00,
      total: 680.00,
      monto_pagado: 680.00,
      saldo_pendiente: 0.00,
      estado_pago: 'PAGADO_TOTAL',
      categoria_gasto: 'SERVICIOS_BASICOS',
      registrado_por: 'Administrador'
    }
  ];
}

// ============================================================================
// 3. PAGO Y ABONO A FACTURAS DE COMPRAS
// ============================================================================

export async function pagarFacturaCompra(params: {
  facturaId: string;
  cuentaId: string;
  montoAbono: number;
  numeroOperacion?: string;
  comprobanteUrl?: string;
  notas?: string;
  adminNombre: string;
  sedeId?: string;
}): Promise<FacturaCompra> {
  const { facturaId, cuentaId, montoAbono, numeroOperacion, comprobanteUrl, notas, adminNombre, sedeId } = params;
  const abono = Number(montoAbono);
  if (abono <= 0) throw new Error('El monto de abono debe ser mayor a 0');

  const facturas = await obtenerFacturasCompras({ sedeId });
  const factura = facturas.find(f => f.id === facturaId);
  if (!factura) throw new Error('Factura de compra no encontrada');

  const nuevoMontoPagado = Number(factura.monto_pagado || 0) + abono;
  const nuevoSaldoPendiente = Math.max(0, Number(factura.total) - nuevoMontoPagado);
  const nuevoEstado = nuevoSaldoPendiente <= 0 ? 'PAGADO_TOTAL' : 'PAGADO_PARCIAL';

  // 1. Debitar saldo de la cuenta financiera
  await aplicarDeltaSaldoCuenta(cuentaId, -abono);

  // 2. Registrar egreso en Tesorería
  await registrarMovimientoTesoreria({
    cuentaId,
    tipoMovimiento: 'EGRESO',
    categoria: 'PAGO_PROVEEDOR',
    monto: abono,
    descripcion: `Pago ${nuevoEstado === 'PAGADO_TOTAL' ? 'Total' : 'Parcial'} Factura [${factura.tipo_comprobante} #${factura.serie}-${factura.numero}] Proveedor: ${factura.proveedor_razon_social}`,
    beneficiarioNombre: factura.proveedor_razon_social,
    numeroOperacionVoucher: numeroOperacion,
    comprobanteAdjuntoUrl: comprobanteUrl,
    registradoPor: adminNombre,
    sedeId
  });

  // 3. Actualizar factura en DB
  try {
    await supabase
      .from('facturas_compras')
      .update({
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: nuevoSaldoPendiente,
        estado_pago: nuevoEstado,
        cuenta_pago_id: cuentaId,
        updated_at: new Date().toISOString()
      })
      .eq('id', facturaId);
  } catch (e) {
    console.warn('[FacturasCompras] Factura actualizada en memoria local:', e);
  }

  await registrarLog('PAGO_FACTURA_COMPRA', `Abono de S/ ${abono.toFixed(2)} a Factura #${factura.serie}-${factura.numero} de ${factura.proveedor_razon_social} por ${adminNombre}`);

  return {
    ...factura,
    monto_pagado: nuevoMontoPagado,
    saldo_pendiente: nuevoSaldoPendiente,
    estado_pago: nuevoEstado
  };
}

// ============================================================================
// 4. BANDEJA DE ACEPTACIÓN PARA EL CUADRE DEL DÍA
// ============================================================================

export async function aceptarMovimientoEnCuadre(
  movimientoId: string,
  adminNombre: string
): Promise<void> {
  const fechaHoy = new Date().toISOString().split('T')[0];
  try {
    await supabase
      .from('movimientos_tesoreria')
      .update({
        incluido_en_cuadre: true,
        fecha_cuadre_dia: fechaHoy,
        aceptado_por_cuadre: adminNombre
      })
      .eq('id', movimientoId);
  } catch (e) {
    console.warn('[CuadreDia] Movimiento aceptado en memoria local:', e);
  }
  await registrarLog('CUADRE_DIA_ACEPTADO', `Movimiento #${movimientoId.slice(0, 8)} aceptado e incluido en el cuadre del día por ${adminNombre}`);
}

export async function aceptarTodosEnCuadre(
  movimientoIds: string[],
  adminNombre: string
): Promise<void> {
  const fechaHoy = new Date().toISOString().split('T')[0];
  try {
    await supabase
      .from('movimientos_tesoreria')
      .update({
        incluido_en_cuadre: true,
        fecha_cuadre_dia: fechaHoy,
        aceptado_por_cuadre: adminNombre
      })
      .in('id', movimientoIds);
  } catch (e) {
    console.warn('[CuadreDia] Movimientos aceptados en lote local:', e);
  }
  await registrarLog('CUADRE_DIA_LOTE_ACEPTADO', `${movimientoIds.length} movimientos consolidados en el cuadre del día por ${adminNombre}`);
}
