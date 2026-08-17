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

export interface ResultadoArqueo {
  totalEfectivoContado: number;
  totalVouchersContado: number;
  totalDeclarado: number;
  totalEsperadoSistema: number;
  diferencia: number;
  estadoArqueo: 'CONFORME' | 'SOBRANTE' | 'FALTANTE';
}

export async function calcularSaldoEsperadoSistema(): Promise<number> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return 0;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('facturas')
    .select('total')
    .eq('sede_id', sedeId)
    .gte('created_at', startOfDay.toISOString());

  if (error) {
    console.error('[Arqueo] Error obteniendo saldo esperado:', error);
    return 0;
  }

  return (data || []).reduce((sum: number, item: { total: number }) => sum + Number(item.total), 0);
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
  const totalEsperadoSistema = await calcularSaldoEsperadoSistema();
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
          diferencia,
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
    diferencia,
    estadoArqueo
  };
}
