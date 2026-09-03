// ============================================================================
// arqueo.ts - Servicio de Arqueo Ciego de Caja para Vaikuntha ERP
// Resuelve DEUDA-CAJA-002: Arqueo ciego con comparación de saldo y auditoría
// ============================================================================

import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { registrarLog } from './logger';

const supabase = createClient();

export interface ConteoCiego {
  billetes200: number;
  billetes100: number;
  billetes50: number;
  billetes20: number;
  billetes10: number;
  monedas5: number;
  monedas2: number;
  monedas1: number;
  monedasCentimos: number;
  totalVouchersTarjeta: number;
  totalVouchersDigitales: number; // Yape / Plin
}

export interface DesgloseSaldoEsperado {
  totalEsperado: number;
  fondoApertura: number;
  totalEfectivo: number;
  totalTarjetas: number;
  totalDigitales: number;
  totalTransferencias: number;
}

export interface ResultadoArqueo {
  totalEfectivoContado: number;
  totalVouchersContado: number;
  totalDeclarado: number;
  totalEsperadoSistema: number;
  desgloseEsperado?: DesgloseSaldoEsperado;
  diferencia: number;
  diferenciaEfectivo: number;
  diferenciaVouchers: number;
  estadoArqueo: 'CONFORME' | 'SOBRANTE' | 'FALTANTE';
}

export async function calcularSaldoEsperadoSistema(): Promise<DesgloseSaldoEsperado> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return { totalEsperado: 0, fondoApertura: 0, totalEfectivo: 0, totalTarjetas: 0, totalDigitales: 0, totalTransferencias: 0 };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // 1. Obtener sesión de caja activa de la sede para considerar monto_apertura
  let fondoApertura = 0;
  try {
    const { data: sesion } = await supabase
      .from('sesiones_caja')
      .select('monto_apertura')
      .eq('sede_id', sedeId)
      .eq('estado', 'ABIERTA')
      .order('fecha_apertura', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sesion?.monto_apertura) {
      fondoApertura = Number(sesion.monto_apertura);
    }
  } catch (e) {
    console.warn('[Arqueo] Error consultando sesion de caja:', e);
  }

  // 2. Obtener comprobantes de pago del día desde la tabla canónica comprobantes_pago
  const { data: comprobantes, error } = await supabase
    .from('comprobantes_pago')
    .select('total, metodo_pago, estado')
    .eq('sede_id', sedeId)
    .neq('estado', 'ANULADO')
    .gte('fecha_emision', startOfDay.toISOString());

  if (error) {
    console.error('[Arqueo] Error obteniendo saldo esperado de comprobantes_pago:', error);
  }

  let totalEfectivo = 0;
  let totalTarjetas = 0;
  let totalDigitales = 0;
  let totalTransferencias = 0;

  (comprobantes || []).forEach((c: any) => {
    const total = Number(c.total || 0);
    const metodo = (c.metodo_pago || '').toUpperCase();

    if (metodo.includes('EFECTIVO')) {
      totalEfectivo += total;
    } else if (metodo.includes('TARJETA') || metodo.includes('POS')) {
      totalTarjetas += total;
    } else if (metodo.includes('YAPE') || metodo.includes('PLIN')) {
      totalDigitales += total;
    } else if (metodo.includes('TRANSFERENCIA')) {
      totalTransferencias += total;
    } else {
      totalEfectivo += total;
    }
  });

  const totalEsperado = fondoApertura + totalEfectivo + totalTarjetas + totalDigitales + totalTransferencias;

  return {
    totalEsperado,
    fondoApertura,
    totalEfectivo: fondoApertura + totalEfectivo,
    totalTarjetas,
    totalDigitales,
    totalTransferencias
  };
}

export async function procesarArqueoCiego(conteo: ConteoCiego, notas?: string): Promise<ResultadoArqueo> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) throw new Error('No hay sede activa seleccionada');

  const totalEfectivoContado = 
    (conteo.billetes200 * 200) +
    (conteo.billetes100 * 100) +
    (conteo.billetes50 * 50) +
    (conteo.billetes20 * 20) +
    (conteo.billetes10 * 10) +
    (conteo.monedas5 * 5) +
    (conteo.monedas2 * 2) +
    (conteo.monedas1 * 1) +
    conteo.monedasCentimos;

  const totalVouchersContado = conteo.totalVouchersTarjeta + conteo.totalVouchersDigitales;
  const totalDeclarado = totalEfectivoContado + totalVouchersContado;
  const desglose = await calcularSaldoEsperadoSistema();
  const totalEsperadoSistema = desglose.totalEsperado;
  
  const diferenciaEfectivo = totalEfectivoContado - desglose.totalEfectivo;
  const vouchersEsperados = desglose.totalTarjetas + desglose.totalDigitales;
  const diferenciaVouchers = totalVouchersContado - vouchersEsperados;
  const diferencia = totalDeclarado - totalEsperadoSistema;

  let estadoArqueo: ResultadoArqueo['estadoArqueo'] = 'CONFORME';
  if (Math.abs(diferencia) > 0.5) {
    estadoArqueo = diferencia > 0 ? 'SOBRANTE' : 'FALTANTE';
  }

  const { error } = await supabase
    .from('system_logs')
    .insert([
      {
        tipo: 'ARQUEO_CAJA',
        detalle: `Arqueo Ciego de Caja - Estado: ${estadoArqueo}`,
        agente_id: null,
        metadata: {
          sede_id: sedeId,
          totalEfectivoContado,
          totalVouchersContado,
          totalDeclarado,
          totalEsperadoSistema,
          desgloseEsperado: desglose,
          diferencia,
          diferenciaEfectivo,
          diferenciaVouchers,
          estadoArqueo,
          notas: notas || ''
        }
      }
    ]);

  if (error) {
    console.error('[Arqueo] Error al registrar log de arqueo:', error);
  }

  await registrarLog('CAJA', `Realizó Arqueo Ciego de Caja (${estadoArqueo})`, {
    diferencia,
    totalDeclarado
  });

  return {
    totalEfectivoContado,
    totalVouchersContado,
    totalDeclarado,
    totalEsperadoSistema,
    desgloseEsperado: desglose,
    diferencia,
    diferenciaEfectivo,
    diferenciaVouchers,
    estadoArqueo
  };
}

