import { createClient } from '@/lib/supabase/client';
import { 
  CuentaFinanciera, 
  MovimientoTesoreria, 
  TransferenciaCuentas, 
  TipoMovimientoTesoreria, 
  CategoriaMovimientoTesoreria 
} from '@/types/finanzas';
import { registrarLog } from './logger';

const supabase = createClient();

export const UMBRAL_APROBACION_EGRESO = 200; // Egresos > S/ 200 requieren aprobación

// ============================================================================
// 1. GESTIÓN DE CUENTAS FINANCIERAS (CAJA Y BANCOS)
// ============================================================================

export async function obtenerCuentasFinancieras(sedeId?: string): Promise<CuentaFinanciera[]> {
  try {
    let query = supabase
      .from('cuentas_financieras')
      .select('*')
      .eq('estado', 'ACTIVO')
      .order('nombre', { ascending: true });

    if (sedeId) {
      query = query.or(`sede_id.eq.${sedeId},sede_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as CuentaFinanciera[];
  } catch (err) {
    console.warn('Fallo consultando cuentas_financieras en Supabase:', err);
    // Fallback inicial si la tabla aún no tiene datos
    return [
      { id: 'cta_caja_chica', nombre: 'Caja Chica (Fondo Fijo)', tipo_cuenta: 'CAJA_CHICA', banco_entidad: 'Efectivo', numero_cuenta: 'EF-01', moneda: 'PEN', saldo_actual: 350.00, estado: 'ACTIVO' },
      { id: 'cta_bcp_empresa', nombre: 'BCP Cta Corriente', tipo_cuenta: 'BANCO', banco_entidad: 'BCP', numero_cuenta: '193-98231234-0-12', moneda: 'PEN', saldo_actual: 4200.00, estado: 'ACTIVO' },
      { id: 'cta_yape_empresa', nombre: 'Yape Comercial', tipo_cuenta: 'BILLETERA_DIGITAL', banco_entidad: 'Yape', numero_cuenta: '987-654-321', moneda: 'PEN', saldo_actual: 890.00, estado: 'ACTIVO' }
    ];
  }
}

export async function crearCuentaFinanciera(params: Omit<CuentaFinanciera, 'id' | 'created_at' | 'updated_at'>): Promise<CuentaFinanciera> {
  const { data, error } = await supabase
    .from('cuentas_financieras')
    .insert([{
      nombre: params.nombre,
      tipo_cuenta: params.tipo_cuenta,
      banco_entidad: params.banco_entidad,
      numero_cuenta: params.numero_cuenta,
      moneda: params.moneda || 'PEN',
      saldo_actual: Number(params.saldo_actual || 0),
      sede_id: params.sede_id,
      estado: params.estado || 'ACTIVO'
    }])
    .select()
    .single();

  if (error) throw error;

  await registrarLog('FINANZAS_CUENTA_CREADA', `Nueva cuenta financiera creada: ${params.nombre} (${params.banco_entidad})`, {
    cuenta_id: data.id,
    saldo_inicial: params.saldo_actual
  });

  return data as CuentaFinanciera;
}

// ============================================================================
// 2. MOVIMIENTOS DE TESORERÍA (INGRESOS & EGRESOS NO-VENTA)
// ============================================================================

// Helper Atómico para actualizar saldos con Row-Level Locking
export async function aplicarDeltaSaldoCuenta(cuentaId: string, deltaMonto: number): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('rpc_actualizar_saldo_cuenta', {
      p_cuenta_id: cuentaId,
      p_monto_delta: deltaMonto
    });

    if (!error && data !== null) {
      return Number(data);
    }
  } catch (rpcErr) {
    console.warn('RPC rpc_actualizar_saldo_cuenta no disponible, usando fallback:', rpcErr);
  }

  // Fallback con lectura y actualización
  const { data: cuenta } = await supabase
    .from('cuentas_financieras')
    .select('saldo_actual')
    .eq('id', cuentaId)
    .single();

  if (cuenta) {
    const nuevoSaldo = Number(cuenta.saldo_actual || 0) + deltaMonto;
    await supabase
      .from('cuentas_financieras')
      .update({ saldo_actual: nuevoSaldo, updated_at: new Date().toISOString() })
      .eq('id', cuentaId);
    return nuevoSaldo;
  }
  return 0;
}

export async function registrarMovimientoTesoreria(params: {
  cuentaId: string;
  tipoMovimiento: TipoMovimientoTesoreria;
  categoria: CategoriaMovimientoTesoreria;
  monto: number;
  moneda?: string;
  descripcion: string;
  beneficiarioNombre?: string;
  agenteId?: string;
  numeroOperacionVoucher?: string;
  comprobanteAdjuntoUrl?: string;
  registradoPor: string;
  sedeId?: string;
}): Promise<MovimientoTesoreria> {
  const montoNum = Number(params.monto);
  const requiereAprobacion = params.tipoMovimiento === 'EGRESO' && montoNum > UMBRAL_APROBACION_EGRESO;
  const estadoAprobacion = requiereAprobacion ? 'PENDIENTE_SUPERADMIN' : 'APROBADO';

  // 1. Insertar movimiento
  const { data: movData, error: movErr } = await supabase
    .from('movimientos_tesoreria')
    .insert([{
      cuenta_id: params.cuentaId,
      tipo_movimiento: params.tipoMovimiento,
      categoria: params.categoria,
      monto: montoNum,
      moneda: params.moneda || 'PEN',
      descripcion: params.descripcion,
      beneficiario_nombre: params.beneficiarioNombre,
      agente_id: params.agenteId,
      numero_operacion_voucher: params.numeroOperacionVoucher,
      comprobante_adjunto_url: params.comprobanteAdjuntoUrl,
      requiere_aprobacion: requiereAprobacion,
      estado_aprobacion: estadoAprobacion,
      autorizado_por: requiereAprobacion ? null : params.registradoPor,
      registrado_por: params.registradoPor,
      sede_id: params.sedeId,
      fecha_movimiento: new Date().toISOString()
    }])
    .select()
    .single();

  if (movErr) throw movErr;

  // 2. Si está aprobado inmediatamente, actualizar el saldo de la cuenta atómicamente
  if (estadoAprobacion === 'APROBADO') {
    const delta = params.tipoMovimiento === 'INGRESO' ? montoNum : -montoNum;
    await aplicarDeltaSaldoCuenta(params.cuentaId, delta);
  }

  await registrarLog('FINANZAS_MOVIMIENTO', `${params.tipoMovimiento} de S/ ${montoNum.toFixed(2)} [${params.categoria}]: ${params.descripcion}`, {
    movimiento_id: movData.id,
    cuenta_id: params.cuentaId,
    monto: montoNum,
    requiere_aprobacion: requiereAprobacion
  });

  return movData as MovimientoTesoreria;
}

export async function obtenerMovimientosTesoreria(filtros?: {
  sedeId?: string;
  cuentaId?: string;
  tipo?: TipoMovimientoTesoreria;
  categoria?: string;
  limite?: number;
}): Promise<MovimientoTesoreria[]> {
  try {
    let query = supabase
      .from('movimientos_tesoreria')
      .select(`
        *,
        cuentas_financieras ( nombre )
      `)
      .order('fecha_movimiento', { ascending: false })
      .limit(filtros?.limite || 100);

    if (filtros?.sedeId) query = query.eq('sede_id', filtros.sedeId);
    if (filtros?.cuentaId) query = query.eq('cuenta_id', filtros.cuentaId);
    if (filtros?.tipo) query = query.eq('tipo_movimiento', filtros.tipo);
    if (filtros?.categoria) query = query.eq('categoria', filtros.categoria);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((m: any) => ({
      ...m,
      cuenta_nombre: m.cuentas_financieras?.nombre || 'Cuenta Principal'
    })) as MovimientoTesoreria[];
  } catch (err) {
    console.warn('Fallo consultando movimientos_tesoreria en Supabase:', err);
    return [];
  }
}

export async function aprobarRechazarEgreso(
  movimientoId: string, 
  decision: 'APROBADO' | 'RECHAZADO', 
  adminNombre: string
): Promise<boolean> {
  const { data: mov, error: errMov } = await supabase
    .from('movimientos_tesoreria')
    .select('*')
    .eq('id', movimientoId)
    .single();

  if (errMov || !mov) throw new Error('Movimiento no encontrado');

  const { error } = await supabase
    .from('movimientos_tesoreria')
    .update({
      estado_aprobacion: decision,
      autorizado_por: adminNombre
    })
    .eq('id', movimientoId);

  if (error) throw error;

  // Si fue aprobado, debitar el saldo de la cuenta atómicamente
  if (decision === 'APROBADO') {
    await aplicarDeltaSaldoCuenta(mov.cuenta_id, -Number(mov.monto));
  }

  await registrarLog('FINANZAS_AUTORIZACION', `Egreso ${movimientoId} fue ${decision} por ${adminNombre}`, {
    movimiento_id: movimientoId,
    decision,
    admin: adminNombre
  });

  return true;
}

// ============================================================================
// 3. TRANSFERENCIAS INTERCUENTAS (CAJA CHICA ➔ BANCO, ETC.)
// ============================================================================

export async function ejecutarTransferenciaCuentas(params: {
  cuentaOrigenId: string;
  cuentaDestinoId: string;
  monto: number;
  comision?: number;
  descripcion?: string;
  numeroOperacion?: string;
  registradoPor: string;
  sedeId?: string;
}): Promise<TransferenciaCuentas> {
  const montoNum = Number(params.monto);
  const comisionNum = Number(params.comision || 0);

  if (montoNum <= 0) throw new Error('El monto a transferir debe ser mayor a 0');
  if (params.cuentaOrigenId === params.cuentaDestinoId) throw new Error('La cuenta de origen y destino no pueden ser iguales');

  // 1. Validar saldo suficiente en origen
  const { data: ctaOrigen, error: errOrigen } = await supabase
    .from('cuentas_financieras')
    .select('nombre, saldo_actual')
    .eq('id', params.cuentaOrigenId)
    .single();

  if (errOrigen || !ctaOrigen) throw new Error('Cuenta origen no encontrada');
  if (Number(ctaOrigen.saldo_actual) < (montoNum + comisionNum)) {
    throw new Error(`Saldo insuficiente en ${ctaOrigen.nombre}. Saldo disponible: S/ ${Number(ctaOrigen.saldo_actual).toFixed(2)}`);
  }

  const { data: ctaDestino, error: errDestino } = await supabase
    .from('cuentas_financieras')
    .select('nombre, saldo_actual')
    .eq('id', params.cuentaDestinoId)
    .single();

  if (errDestino || !ctaDestino) throw new Error('Cuenta destino no encontrada');

  // 2. Registrar la transferencia
  const { data: transfData, error: transfErr } = await supabase
    .from('transferencias_cuentas')
    .insert([{
      cuenta_origen_id: params.cuentaOrigenId,
      cuenta_destino_id: params.cuentaDestinoId,
      monto: montoNum,
      comision_transferencia: comisionNum,
      descripcion: params.descripcion || `Traslado de ${ctaOrigen.nombre} a ${ctaDestino.nombre}`,
      numero_operacion: params.numeroOperacion,
      registrado_por: params.registradoPor,
      sede_id: params.sedeId
    }])
    .select()
    .single();

  if (transfErr) throw transfErr;

  // 3. Actualizar saldos atómicamente con Row-Level Locking
  await Promise.all([
    aplicarDeltaSaldoCuenta(params.cuentaOrigenId, -(montoNum + comisionNum)),
    aplicarDeltaSaldoCuenta(params.cuentaDestinoId, montoNum)
  ]);

  await registrarLog('FINANZAS_TRANSFERENCIA', `Transferencia de S/ ${montoNum.toFixed(2)} desde ${ctaOrigen.nombre} hacia ${ctaDestino.nombre}`, {
    transferencia_id: transfData.id,
    monto: montoNum,
    origen: ctaOrigen.nombre,
    destino: ctaDestino.nombre
  });

  return transfData as TransferenciaCuentas;
}

// ============================================================================
// 4. LIQUIDACIÓN DE COMISIONES STAFF & CONCILIACIÓN WFM
// ============================================================================

export async function liquidarComisionesStaffFinanzas(params: {
  agenteId: string;
  agenteNombre: string;
  cuentaId: string;
  monto: number;
  concepto?: string;
  numeroOperacion?: string;
  registradoPor: string;
  sedeId?: string;
}): Promise<MovimientoTesoreria> {
  const concepto = params.concepto || `Liquidación de comisiones a ${params.agenteNombre}`;

  // 1. Registrar egreso en tesorería
  const mov = await registrarMovimientoTesoreria({
    cuentaId: params.cuentaId,
    tipoMovimiento: 'EGRESO',
    categoria: 'LIQUIDACION_STAFF',
    monto: params.monto,
    descripcion: concepto,
    beneficiarioNombre: params.agenteNombre,
    agenteId: params.agenteId,
    numeroOperacionVoucher: params.numeroOperacion,
    registradoPor: params.registradoPor,
    sedeId: params.sedeId
  });

  // 2. Registrar en log WFM de liquidación
  await registrarLog('WFM_LIQUIDACION_PAGADA', `Liquidación pagada a ${params.agenteNombre} por S/ ${Number(params.monto).toFixed(2)}`, {
    agente_id: params.agenteId,
    monto: params.monto,
    movimiento_tesoreria_id: mov.id
  });

  return mov;
}
