import { createClient } from '@/lib/supabase/client';
import { 
  AgenteConfigRemunerativa, 
  LiquidacionPersonal, 
  LiquidacionItem, 
  ItemVentaAuditoria,
  TipoRemuneracion,
  FrecuenciaCorte
} from '@/types/liquidaciones';
import { registrarMovimientoTesoreria } from './finanzas';
import { registrarLog } from './logger';

const supabase = createClient();

// ============================================================================
// 1. CONFIGURACIÓN REMUNERATIVA POR COLABORADOR
// ============================================================================

export const CONFIG_DEFAULT_STAFF: Omit<AgenteConfigRemunerativa, 'agente_id'> = {
  tipo_remuneracion: 'SOLO_COMISIONES',
  sueldo_base: 0.00,
  porcentaje_comision_servicios: 40.00,
  porcentaje_comision_productos: 10.00,
  frecuencia_corte: 'DIARIA',
  permite_solicitud_manual: true
};

export const CONFIG_DEFAULT_SOPORTE: Omit<AgenteConfigRemunerativa, 'agente_id'> = {
  tipo_remuneracion: 'SOLO_SUELDO_BASE',
  sueldo_base: 1300.00,
  porcentaje_comision_servicios: 0.00,
  porcentaje_comision_productos: 5.00,
  frecuencia_corte: 'QUINCENAL',
  permite_solicitud_manual: false
};

export async function obtenerConfiguracionRemunerativa(agenteId: string, rol?: string): Promise<AgenteConfigRemunerativa> {
  try {
    const { data, error } = await supabase
      .from('agente_configuracion_remunerativa')
      .select('*')
      .eq('agente_id', agenteId)
      .maybeSingle();

    if (!error && data) {
      return data as AgenteConfigRemunerativa;
    }
  } catch (err) {
    console.warn('Tabla agente_configuracion_remunerativa aún no disponible:', err);
  }

  const isStaff = rol === 'STAFF' || !rol;
  const def = isStaff ? CONFIG_DEFAULT_STAFF : CONFIG_DEFAULT_SOPORTE;

  return {
    agente_id: agenteId,
    ...def
  };
}

export async function guardarConfiguracionRemunerativa(config: AgenteConfigRemunerativa): Promise<AgenteConfigRemunerativa> {
  const { data, error } = await supabase
    .from('agente_configuracion_remunerativa')
    .upsert({
      agente_id: config.agente_id,
      tipo_remuneracion: config.tipo_remuneracion,
      sueldo_base: Number(config.sueldo_base || 0),
      porcentaje_comision_servicios: Number(config.porcentaje_comision_servicios || 0),
      porcentaje_comision_productos: Number(config.porcentaje_comision_productos || 0),
      frecuencia_corte: config.frecuencia_corte,
      permite_solicitud_manual: config.permite_solicitud_manual,
      cuenta_bancaria_pago_preferida: config.cuenta_bancaria_pago_preferida,
      banco_preferido: config.banco_preferido,
      numero_documento_pago: config.numero_documento_pago,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  await registrarLog('CONFIG_REMUNERACION', `Contrato de remuneración actualizado para agente ${config.agente_id} (${config.tipo_remuneracion})`, config);

  return data as AgenteConfigRemunerativa;
}

// ============================================================================
// 2. AUDITORÍA DE VENTAS Y PREVENCIÓN DE DUPLICIDAD
// ============================================================================

export async function obtenerVentasAuditadasPorColaborador(
  agenteId: string, 
  agenteNombre?: string,
  fechaInicio?: string, 
  fechaFin?: string
): Promise<ItemVentaAuditoria[]> {
  try {
    // 1. Obtener los IDs de ítems ya liquidados para este agente
    const { data: itemsLiquidados } = await supabase
      .from('liquidaciones_items')
      .select('origen_id, liquidacion_id, liquidaciones_personal ( numero_correlativo, estado )')
      .eq('liquidaciones_personal.agente_id', agenteId);

    const mapLiquidados = new Map<string, string>();
    (itemsLiquidados || []).forEach((it: any) => {
      if (it.liquidaciones_personal?.estado !== 'ANULADO') {
        mapLiquidados.set(it.origen_id, it.liquidaciones_personal?.numero_correlativo || 'LIQUIDADO');
      }
    });

    // 2. Obtener OATCs finalizadas de este agente
    let queryOatc = supabase
      .from('oatc')
      .select('*')
      .in('estado_proceso', ['FINALIZADO', 'FINALIZADA']);

    if (agenteId && agenteNombre) {
      queryOatc = queryOatc.or(`agente_id.eq.${agenteId},agente_nombre.ilike.%${agenteNombre}%`);
    } else if (agenteId) {
      queryOatc = queryOatc.eq('agente_id', agenteId);
    }

    if (fechaInicio) queryOatc = queryOatc.gte('created_at', `${fechaInicio}T00:00:00.000Z`);
    if (fechaFin) queryOatc = queryOatc.lte('created_at', `${fechaFin}T23:59:59.999Z`);

    const { data: oatcs } = await queryOatc;
    const config = await obtenerConfiguracionRemunerativa(agenteId);

    const resultados: ItemVentaAuditoria[] = [];

    (oatcs || []).forEach((o: any) => {
      const itemsList = Array.isArray(o.punto_partida) ? o.punto_partida : [];
      itemsList.forEach((it: any, index: number) => {
        const itemOriginId = `${o.id}_serv_${index}`;
        const montoVenta = Number(it.precio || it.precio_final || it.precio_base || 0);
        const porcentaje = it.tipo_bien === 'producto' ? config.porcentaje_comision_productos : config.porcentaje_comision_servicios;
        const comisionMonto = (montoVenta * porcentaje) / 100;
        const yaLiquidado = mapLiquidados.has(itemOriginId);

        resultados.push({
          origen_id: itemOriginId,
          tipo: it.tipo_bien === 'producto' ? 'PRODUCTO' : 'SERVICIO',
          descripcion: it.nombre || 'Servicio en Salón',
          fecha: o.created_at || new Date().toISOString(),
          monto_venta: montoVenta,
          porcentaje_comision: porcentaje,
          monto_comision: comisionMonto,
          cliente_nombre: o.cliente_nombre,
          esta_liquidado: yaLiquidado,
          liquidacion_correlativo: mapLiquidados.get(itemOriginId)
        });
      });
    });

    return resultados;
  } catch (err) {
    console.warn('Error en obtenerVentasAuditadasPorColaborador:', err);
    return [];
  }
}

// ============================================================================
// 3. GENERACIÓN Y SOLICITUD DE LIQUIDACIÓN
// ============================================================================

export async function solicitarLiquidacionStaff(params: {
  agenteId: string;
  agenteNombre: string;
  agenteRol?: string;
  periodoInicio: string;
  periodoFin: string;
  solicitadoPor: string;
  sedeId?: string;
  notas?: string;
}): Promise<LiquidacionPersonal> {
  const config = await obtenerConfiguracionRemunerativa(params.agenteId, params.agenteRol);
  const ventas = await obtenerVentasAuditadasPorColaborador(
    params.agenteId, 
    params.agenteNombre, 
    params.periodoInicio, 
    params.periodoFin
  );

  // Filtrar solo las ventas NO liquidadas
  const ventasPendientes = ventas.filter(v => !v.esta_liquidado);

  const comisionServicios = ventasPendientes
    .filter(v => v.tipo === 'SERVICIO')
    .reduce((acc, v) => acc + v.monto_comision, 0);

  const comisionProductos = ventasPendientes
    .filter(v => v.tipo === 'PRODUCTO')
    .reduce((acc, v) => acc + v.monto_comision, 0);

  let sueldoBaseProrrateado = 0;
  if (config.tipo_remuneracion !== 'SOLO_COMISIONES' && config.sueldo_base > 0) {
    sueldoBaseProrrateado = config.sueldo_base; // Monto base acordado
  }

  const totalNeto = (config.tipo_remuneracion === 'SOLO_SUELDO_BASE')
    ? sueldoBaseProrrateado + comisionProductos
    : sueldoBaseProrrateado + comisionServicios + comisionProductos;

  const correlativo = `LIQ-${(params.agenteRol || 'STAFF').toUpperCase()}-${Date.now().toString().slice(-6)}`;

  // 1. Crear cabecera de liquidación
  const { data: liqData, error: liqErr } = await supabase
    .from('liquidaciones_personal')
    .insert([{
      numero_correlativo: correlativo,
      agente_id: params.agenteId,
      agente_nombre: params.agenteNombre,
      agente_rol: params.agenteRol || 'STAFF',
      periodo_inicio: params.periodoInicio,
      periodo_fin: params.periodoFin,
      tipo_remuneracion: config.tipo_remuneracion,
      monto_sueldo_base: sueldoBaseProrrateado,
      monto_comisiones_servicios: comisionServicios,
      monto_comisiones_productos: comisionProductos,
      monto_propinas: 0,
      monto_adelantos_deducidos: 0,
      monto_total_neto: totalNeto,
      estado: 'SOLICITADO_STAFF',
      solicitado_por: params.solicitadoPor,
      sede_id: params.sedeId,
      notas: params.notas
    }])
    .select()
    .single();

  if (liqErr) throw liqErr;

  // 2. Asociar los ítems para bloqueo anti-duplicidad
  if (ventasPendientes.length > 0) {
    const itemsInsert = ventasPendientes.map(v => ({
      liquidacion_id: liqData.id,
      tipo_item: v.tipo as any,
      origen_id: v.origen_id,
      descripcion: v.descripcion,
      fecha_servicio: v.fecha,
      monto_venta: v.monto_venta,
      porcentaje_aplicado: v.porcentaje_comision,
      monto_comision: v.monto_comision,
      cliente_nombre: v.cliente_nombre
    }));

    await supabase.from('liquidaciones_items').insert(itemsInsert);
  }

  await registrarLog('LIQUIDACION_SOLICITADA', `Solicitud de liquidación ${correlativo} generada para ${params.agenteNombre} por S/ ${totalNeto.toFixed(2)}`, {
    liquidacion_id: liqData.id,
    total_neto: totalNeto,
    items_count: ventasPendientes.length
  });

  return liqData as LiquidacionPersonal;
}

// ============================================================================
// 4. CONSULTA Y PAGO DE LIQUIDACIONES EN CAJA / FINANZAS
// ============================================================================

export async function obtenerLiquidaciones(filtros?: {
  agenteId?: string;
  rolGrupo?: 'STAFF' | 'SOPORTE';
  estado?: string;
  sedeId?: string;
}): Promise<LiquidacionPersonal[]> {
  try {
    let query = supabase
      .from('liquidaciones_personal')
      .select(`
        *,
        liquidaciones_items ( * )
      `)
      .order('created_at', { ascending: false });

    if (filtros?.agenteId) query = query.eq('agente_id', filtros.agenteId);
    if (filtros?.estado) query = query.eq('estado', filtros.estado);
    if (filtros?.sedeId) query = query.eq('sede_id', filtros.sedeId);

    if (filtros?.rolGrupo === 'STAFF') {
      query = query.in('agente_rol', ['STAFF', 'ESTILISTA', 'BARBERO', 'MANICURISTA', 'COSMIATRA', 'OPERACION']);
    } else if (filtros?.rolGrupo === 'SOPORTE') {
      query = query.in('agente_rol', ['SOPORTE', 'CAJA', 'ADMIN', 'JEFE_OPERATIVO', 'RECEPCION']);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((l: any) => ({
      ...l,
      items: l.liquidaciones_items || []
    })) as LiquidacionPersonal[];
  } catch (err) {
    console.warn('Error consultando liquidaciones_personal:', err);
    return [];
  }
}

export async function pagarLiquidacionPersonal(params: {
  liquidacionId: string;
  cuentaPagoId: string;
  cuentaPagoNombre?: string;
  adminNombre: string;
  sedeId?: string;
}): Promise<LiquidacionPersonal> {
  const { data: liq, error: errLiq } = await supabase
    .from('liquidaciones_personal')
    .select('*')
    .eq('id', params.liquidacionId)
    .single();

  if (errLiq || !liq) throw new Error('Liquidación no encontrada');
  if (liq.estado === 'PAGADO') throw new Error('Esta liquidación ya fue pagada anteriormente');

  // 1. Registrar egreso en Tesorería y debitar saldo de la cuenta
  const mov = await registrarMovimientoTesoreria({
    cuentaId: params.cuentaPagoId,
    tipoMovimiento: 'EGRESO',
    categoria: 'LIQUIDACION_STAFF',
    monto: Number(liq.monto_total_neto),
    descripcion: `Pago de liquidación ${liq.numero_correlativo} a ${liq.agente_nombre} (${liq.periodo_inicio} al ${liq.periodo_fin})`,
    beneficiarioNombre: liq.agente_nombre,
    agenteId: liq.agente_id,
    numeroOperacionVoucher: liq.numero_correlativo,
    registradoPor: params.adminNombre,
    sedeId: params.sedeId
  });

  // 2. Marcar liquidación como PAGADA
  const { data: liqActualizada, error: updErr } = await supabase
    .from('liquidaciones_personal')
    .update({
      estado: 'PAGADO',
      cuenta_pago_id: params.cuentaPagoId,
      cuenta_pago_nombre: params.cuentaPagoNombre || 'Caja Chica',
      movimiento_tesoreria_id: mov.id,
      aprobado_por: params.adminNombre,
      fecha_pago: new Date().toISOString()
    })
    .eq('id', params.liquidacionId)
    .select()
    .single();

  if (updErr) throw updErr;

  await registrarLog('LIQUIDACION_PAGADA', `Liquidación ${liq.numero_correlativo} pagada a ${liq.agente_nombre} por S/ ${Number(liq.monto_total_neto).toFixed(2)}`, {
    liquidacion_id: liq.id,
    movimiento_tesoreria_id: mov.id,
    aprobado_por: params.adminNombre
  });

  return liqActualizada as LiquidacionPersonal;
}
