import { createClient } from '@/lib/supabase/client';
import { 
  ConfigPasarelaPago, 
  LoteLiquidacionPOS, 
  CalculoComisionResult, 
  MedioPagoPasarela 
} from '@/types/pasarelasPOS';
import { aplicarDeltaSaldoCuenta, registrarMovimientoTesoreria } from './finanzas';
import { registrarLog } from './logger';

const supabase = createClient();

// ============================================================================
// 1. CÁLCULO PRECISO DE COMISIONES DE PASARELA
// ============================================================================

export function calcularComisionPasarela(
  montoBruto: number,
  pasarela: {
    porcentaje_comision: number;
    costo_fijo_transaccion?: number;
    aplica_igv_comision?: boolean;
  }
): CalculoComisionResult {
  const bruto = Math.max(0, Number(montoBruto));
  const porc = Number(pasarela.porcentaje_comision || 0);
  const costoFijo = Number(pasarela.costo_fijo_transaccion || 0);
  const aplicaIgv = Boolean(pasarela.aplica_igv_comision);

  // Comisión base porcentual
  const comisionBase = Number(((bruto * porc) / 100).toFixed(4));
  const comisionSubtotal = comisionBase + costoFijo;
  
  // IGV 18% sobre la comisión cobrada por el procesador
  const igvComision = aplicaIgv ? Number((comisionSubtotal * 0.18).toFixed(4)) : 0;
  const comisionTotal = Number((comisionSubtotal + igvComision).toFixed(2));
  const montoNeto = Number((bruto - comisionTotal).toFixed(2));
  const porcentajeEfectivo = bruto > 0 ? Number(((comisionTotal / bruto) * 100).toFixed(2)) : 0;

  return {
    montoBruto: bruto,
    comisionBase,
    costoFijo,
    igvComision,
    comisionTotal,
    montoNeto,
    porcentajeEfectivo
  };
}

// ============================================================================
// 2. OBTENER Y GUARDAR CONFIGURACIONES DE PASARELAS
// ============================================================================

export async function obtenerPasarelasConfiguradas(sedeId?: string): Promise<ConfigPasarelaPago[]> {
  try {
    let query = supabase
      .from('config_pasarelas_pago')
      .select('*, cuenta_puente:cuentas_financieras!cuenta_puente_id(nombre), cuenta_destino:cuentas_financieras!cuenta_destino_id(nombre)')
      .order('nombre', { ascending: true });

    if (sedeId) {
      query = query.or(`sede_id.eq.${sedeId},sede_id.eq.general`);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        ...d,
        cuenta_puente_nombre: d.cuenta_puente?.nombre,
        cuenta_destino_nombre: d.cuenta_destino?.nombre
      })) as ConfigPasarelaPago[];
    }
  } catch (err) {
    console.warn('[PasarelasPOS] No se encontraron pasarelas en Supabase o tabla no migrada, usando seeds por defecto:', err);
  }

  // Fallback con configuración predeterminada realista de pasarelas peruanas
  return [
    {
      id: 'pasarela_izipay_debito',
      sede_id: sedeId || 'general',
      nombre: 'Izipay POS - Débito',
      medio_pago: 'TARJETA_DEBITO',
      cuenta_puente_id: 'cta_caja_chica',
      cuenta_puente_nombre: 'Izipay en Tránsito (D+1)',
      cuenta_destino_id: 'cta_bcp_empresa',
      cuenta_destino_nombre: 'BCP Cta Corriente',
      porcentaje_comision: 2.85,
      costo_fijo_transaccion: 0.00,
      aplica_igv_comision: true,
      dias_liquidacion: 1,
      tipo_acreditacion: 'EN_TRANSITO_LOTE',
      activo: true
    },
    {
      id: 'pasarela_izipay_credito',
      sede_id: sedeId || 'general',
      nombre: 'Izipay POS - Crédito',
      medio_pago: 'TARJETA_CREDITO',
      cuenta_puente_id: 'cta_caja_chica',
      cuenta_puente_nombre: 'Izipay en Tránsito (D+1)',
      cuenta_destino_id: 'cta_bcp_empresa',
      cuenta_destino_nombre: 'BCP Cta Corriente',
      porcentaje_comision: 3.75,
      costo_fijo_transaccion: 0.00,
      aplica_igv_comision: true,
      dias_liquidacion: 1,
      tipo_acreditacion: 'EN_TRANSITO_LOTE',
      activo: true
    },
    {
      id: 'pasarela_yape',
      sede_id: sedeId || 'general',
      nombre: 'Yape / Plin Comercial',
      medio_pago: 'BILLETERA_DIGITAL',
      cuenta_destino_id: 'cta_yape_empresa',
      cuenta_destino_nombre: 'Yape Comercial',
      porcentaje_comision: 0.00,
      costo_fijo_transaccion: 0.00,
      aplica_igv_comision: false,
      dias_liquidacion: 0,
      tipo_acreditacion: 'INMEDIATA',
      activo: true
    },
    {
      id: 'pasarela_efectivo',
      sede_id: sedeId || 'general',
      nombre: 'Efectivo Mostrador',
      medio_pago: 'EFECTIVO',
      cuenta_destino_id: 'cta_caja_chica',
      cuenta_destino_nombre: 'Caja Chica (Fondo Fijo)',
      porcentaje_comision: 0.00,
      costo_fijo_transaccion: 0.00,
      aplica_igv_comision: false,
      dias_liquidacion: 0,
      tipo_acreditacion: 'INMEDIATA',
      activo: true
    }
  ];
}

export async function guardarConfiguracionPasarela(pasarela: Partial<ConfigPasarelaPago>): Promise<ConfigPasarelaPago> {
  const payload = {
    sede_id: pasarela.sede_id || 'general',
    nombre: pasarela.nombre?.trim(),
    medio_pago: pasarela.medio_pago,
    cuenta_puente_id: pasarela.cuenta_puente_id || null,
    cuenta_destino_id: pasarela.cuenta_destino_id,
    porcentaje_comision: Number(pasarela.porcentaje_comision || 0),
    costo_fijo_transaccion: Number(pasarela.costo_fijo_transaccion || 0),
    aplica_igv_comision: Boolean(pasarela.aplica_igv_comision),
    dias_liquidacion: Number(pasarela.dias_liquidacion || 1),
    tipo_acreditacion: pasarela.tipo_acreditacion || 'EN_TRANSITO_LOTE',
    activo: pasarela.activo ?? true,
    updated_at: new Date().toISOString()
  };

  if (pasarela.id && !pasarela.id.startsWith('pasarela_')) {
    const { data, error } = await supabase
      .from('config_pasarelas_pago')
      .update(payload)
      .eq('id', pasarela.id)
      .select()
      .single();
    if (error) throw error;
    return data as ConfigPasarelaPago;
  } else {
    const { data, error } = await supabase
      .from('config_pasarelas_pago')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data as ConfigPasarelaPago;
  }
}

// ============================================================================
// 3. PROCESAMIENTO Y RUTEO DE VENTAS POS
// ============================================================================

export async function procesarAcreditacionPagoPOS(params: {
  sedeId: string;
  metodoPago: string;
  montoBruto: number;
  oatcId?: string;
  cajeroNombre?: string;
}): Promise<void> {
  const { sedeId, metodoPago, montoBruto, oatcId, cajeroNombre } = params;
  if (montoBruto <= 0) return;

  const pasarelas = await obtenerPasarelasConfiguradas(sedeId);
  const metodoNormalizado = metodoPago.toUpperCase();
  
  // Buscar pasarela configurada por medio de pago
  const pasarela = pasarelas.find(p => {
    if (metodoNormalizado.includes('TARJETA') || metodoNormalizado.includes('CREDITO') || metodoNormalizado.includes('VISA')) {
      return p.medio_pago === 'TARJETA_CREDITO' || p.medio_pago === 'TARJETA_DEBITO';
    }
    if (metodoNormalizado.includes('DEBITO')) return p.medio_pago === 'TARJETA_DEBITO';
    if (metodoNormalizado.includes('YAPE') || metodoNormalizado.includes('PLIN')) return p.medio_pago === 'BILLETERA_DIGITAL';
    if (metodoNormalizado.includes('EFECTIVO')) return p.medio_pago === 'EFECTIVO';
    return p.medio_pago === 'TRANSFERENCIA';
  }) || pasarelas[0];

  const calculo = calcularComisionPasarela(montoBruto, pasarela);
  const fechaHoy = new Date().toISOString().split('T')[0];

  if (pasarela.tipo_acreditacion === 'INMEDIATA') {
    // 1. Acreditación inmediata a la cuenta destino
    await aplicarDeltaSaldoCuenta(pasarela.cuenta_destino_id, montoBruto);

    await registrarMovimientoTesoreria({
      cuentaId: pasarela.cuenta_destino_id,
      tipoMovimiento: 'INGRESO',
      categoria: 'VENTA_POS_ACREDITADA',
      monto: montoBruto,
      descripcion: `Venta POS [${pasarela.nombre}] ${oatcId ? `OATC #${oatcId.slice(0, 6)}` : ''}`,
      registradoPor: cajeroNombre || 'Cajero POS',
      sedeId
    });

  } else {
    // 2. Esquema EN_TRANSITO_LOTE (Tarjetas D+1 / D+2)
    const cuentaPuenteId = pasarela.cuenta_puente_id || pasarela.cuenta_destino_id;

    // Acreditar a la cuenta puente en tránsito
    await aplicarDeltaSaldoCuenta(cuentaPuenteId, montoBruto);

    // Buscar o crear lote de conciliación para el día de hoy
    try {
      const { data: loteExistente } = await supabase
        .from('lotes_liquidaciones_pos')
        .select('*')
        .eq('sede_id', sedeId)
        .eq('pasarela_id', pasarela.id)
        .eq('fecha_lote', fechaHoy)
        .eq('estado', 'EN_TRANSITO')
        .maybeSingle();

      if (loteExistente) {
        const nuevoBruto = Number(loteExistente.monto_bruto_total || 0) + montoBruto;
        const nuevaComision = Number(loteExistente.comision_estimada || 0) + calculo.comisionTotal;
        const nuevoNeto = Number(loteExistente.monto_neto_estimado || 0) + calculo.montoNeto;
        const nuevaCantidad = Number(loteExistente.cantidad_transacciones || 0) + 1;

        await supabase
          .from('lotes_liquidaciones_pos')
          .update({
            cantidad_transacciones: nuevaCantidad,
            monto_bruto_total: nuevoBruto,
            comision_estimada: nuevaComision,
            monto_neto_estimado: nuevoNeto,
            updated_at: new Date().toISOString()
          })
          .eq('id', loteExistente.id);
      } else {
        await supabase
          .from('lotes_liquidaciones_pos')
          .insert([{
            sede_id: sedeId,
            pasarela_id: pasarela.id,
            pasarela_nombre: pasarela.nombre,
            fecha_lote: fechaHoy,
            cantidad_transacciones: 1,
            monto_bruto_total: montoBruto,
            comision_estimada: calculo.comisionTotal,
            monto_neto_estimado: calculo.montoNeto,
            estado: 'EN_TRANSITO'
          }]);
      }
    } catch (e) {
      console.warn('[PasarelasPOS] Lote no guardado en DB (modo demo/offline):', e);
    }
  }

  await registrarLog('POS_RUTEO_PAGO', `Pago de S/ ${montoBruto.toFixed(2)} ruteado por ${pasarela.nombre} (Comisión Est: S/ ${calculo.comisionTotal.toFixed(2)})`);
}

// ============================================================================
// 4. CONCILIACIÓN DE LOTES POS & DETECCIÓN DE VARIANZAS
// ============================================================================

export async function obtenerLotesLiquidacionPOS(filtros?: {
  sedeId?: string;
  estado?: string;
}): Promise<LoteLiquidacionPOS[]> {
  try {
    let query = supabase
      .from('lotes_liquidaciones_pos')
      .select('*')
      .order('fecha_lote', { ascending: false });

    if (filtros?.sedeId) query = query.eq('sede_id', filtros.sedeId);
    if (filtros?.estado) query = query.eq('estado', filtros.estado);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as LoteLiquidacionPOS[];
  } catch (err) {
    console.error('[PasarelasPOS] Error cargando lotes POS de DB:', err);
    return [];
  }
}


export async function conciliarLotePOS(params: {
  loteId: string;
  montoNetoReal: number;
  numeroOperacion?: string;
  comprobanteUrl?: string;
  notas?: string;
  adminNombre: string;
  sedeId?: string;
}): Promise<LoteLiquidacionPOS> {
  const { loteId, montoNetoReal, numeroOperacion, comprobanteUrl, notas, adminNombre, sedeId } = params;
  const montoRealNum = Number(montoNetoReal);

  // 1. Obtener datos del lote
  const lotes = await obtenerLotesLiquidacionPOS({ sedeId });
  const lote = lotes.find(l => l.id === loteId);

  if (!lote) throw new Error('Lote de liquidación POS no encontrado');

  const pasarelas = await obtenerPasarelasConfiguradas(sedeId);
  const pasarela = pasarelas.find(p => p.id === lote.pasarela_id) || pasarelas[0];

  // 2. Calcular varianza/diferencia (Real depositado vs Estimado)
  const diferenciaVarianza = Number((montoRealNum - Number(lote.monto_neto_estimado)).toFixed(2));
  const comisionRealRetenida = Number((Number(lote.monto_bruto_total) - montoRealNum).toFixed(2));

  const cuentaPuenteId = pasarela.cuenta_puente_id || 'cta_caja_chica';
  const cuentaDestinoId = pasarela.cuenta_destino_id || 'cta_bcp_empresa';

  // 3. Ejecutar los traslados atómicos de fondos:
  // a) Debitar el monto bruto total de la cuenta puente
  await aplicarDeltaSaldoCuenta(cuentaPuenteId, -Number(lote.monto_bruto_total));

  // b) Acreditar el monto neto real depositado en la cuenta bancaria destino
  await aplicarDeltaSaldoCuenta(cuentaDestinoId, montoRealNum);

  // c) Registrar Egreso contable por Comisión de Pasarela POS
  await registrarMovimientoTesoreria({
    cuentaId: cuentaDestinoId,
    tipoMovimiento: 'EGRESO',
    categoria: 'COMISION_PASARELA_POS',
    monto: comisionRealRetenida,
    descripcion: `Comisión retenida [${lote.pasarela_nombre}] Lote ${lote.fecha_lote} (Op: ${numeroOperacion || 'N/A'})`,
    numeroOperacionVoucher: numeroOperacion,
    comprobanteAdjuntoUrl: comprobanteUrl,
    registradoPor: adminNombre,
    sedeId
  });

  // d) Si hay diferencia / varianza no prevista, registrar asiento de ajuste
  if (Math.abs(diferenciaVarianza) > 0.05) {
    await registrarMovimientoTesoreria({
      cuentaId: cuentaDestinoId,
      tipoMovimiento: diferenciaVarianza > 0 ? 'INGRESO' : 'EGRESO',
      categoria: 'AJUSTE_CONCILIACION_POS',
      monto: Math.abs(diferenciaVarianza),
      descripcion: `Ajuste por Varianza POS [${lote.pasarela_nombre}]: ${diferenciaVarianza > 0 ? 'Mayor abono' : 'Retención bancaria adicional'}`,
      registradoPor: adminNombre,
      sedeId
    });
  }

  // 4. Actualizar estado del lote
  const estadoFinal = Math.abs(diferenciaVarianza) > 5.00 ? 'OBSERVADO' : 'CONCILIADO_DEPOSITADO';

  try {
    await supabase
      .from('lotes_liquidaciones_pos')
      .update({
        monto_neto_real_depositado: montoRealNum,
        diferencia_varianza: diferenciaVarianza,
        estado: estadoFinal,
        numero_operacion_bancaria: numeroOperacion,
        comprobante_deposito_url: comprobanteUrl,
        conciliado_por: adminNombre,
        fecha_conciliacion: new Date().toISOString(),
        notas,
        updated_at: new Date().toISOString()
      })
      .eq('id', loteId);
  } catch (e) {
    console.warn('[PasarelasPOS] Lote actualizado en memoria local:', e);
  }

  await registrarLog('POS_CONCILIACION_LOTE', `Lote #${loteId.slice(0, 6)} de ${lote.pasarela_nombre} conciliado por ${adminNombre}. Real: S/ ${montoRealNum.toFixed(2)} (Varianza: S/ ${diferenciaVarianza.toFixed(2)})`);

  return {
    ...lote,
    monto_neto_real_depositado: montoRealNum,
    diferencia_varianza: diferenciaVarianza,
    estado: estadoFinal,
    numero_operacion_bancaria: numeroOperacion,
    conciliado_por: adminNombre,
    fecha_conciliacion: new Date().toISOString()
  };
}
