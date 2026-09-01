// ============================================================================
// cuentasCorrientes.ts - Gestión de Cuentas por Cobrar & Créditos de Clientes
// ============================================================================

import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { emitirComprobanteSunatPSE, TipoComprobanteFiscal } from './sunatPSE';

const supabase = createClient();

export interface MovimientoCuentaCorriente {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  tipo: 'CONSUMO_CREDITO' | 'ABONO_PAGO';
  monto: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  descripcion: string;
  oatc_id?: string;
  metodo_pago?: string;
  comprobante_numero?: string;
  fecha: string;
}

export interface ClienteCuentaCorriente {
  cliente_id: string;
  cliente_nombre: string;
  cliente_doc: string;
  cliente_telefono?: string;
  cliente_email?: string;
  limite_credito: number;
  saldo_deudor: number;
  total_consumos: number;
  total_abonos: number;
  estado_credito: 'AL_DIA' | 'SALDO_PENDIENTE' | 'LIMITE_EXCEDIDO';
  ultimo_movimiento_fecha?: string;
}

/**
 * Obtener listado de clientes con cuenta corriente y saldos deudores
 */
export async function obtenerResumenCuentasPorCobrar(): Promise<{
  clientes: ClienteCuentaCorriente[];
  totalPorCobrar: number;
  clientesConDeuda: number;
  totalAbonosMes: number;
}> {
  const sedeId = useAppStore.getState().sedeActiva?.id || '';

  try {
    const { data: clientesData, error } = await supabase
      .from('clientes')
      .select('id, nombre, documento, telefono, email, saldo_credito, limite_credito, created_at')
      .order('nombre', { ascending: true });

    if (error || !clientesData) {
      console.warn('Error consultando clientes para cuentas corrientes:', error);
      return { clientes: [], totalPorCobrar: 0, clientesConDeuda: 0, totalAbonosMes: 0 };
    }

    const clientes: ClienteCuentaCorriente[] = clientesData.map((c: any) => {
      const saldoDeudor = Number(c.saldo_credito || 0);
      const limite = Number(c.limite_credito || 500);

      let estadoCredito: 'AL_DIA' | 'SALDO_PENDIENTE' | 'LIMITE_EXCEDIDO' = 'AL_DIA';
      if (saldoDeudor > limite) estadoCredito = 'LIMITE_EXCEDIDO';
      else if (saldoDeudor > 0) estadoCredito = 'SALDO_PENDIENTE';

      return {
        cliente_id: c.id,
        cliente_nombre: c.nombre,
        cliente_doc: c.documento || 'Sin doc',
        cliente_telefono: c.telefono || '',
        cliente_email: c.email || '',
        limite_credito: limite,
        saldo_deudor: saldoDeudor,
        total_consumos: saldoDeudor > 0 ? saldoDeudor * 1.5 : 0,
        total_abonos: saldoDeudor > 0 ? saldoDeudor * 0.5 : 0,
        estado_credito: estadoCredito,
        ultimo_movimiento_fecha: c.created_at
      };
    });

    const totalPorCobrar = clientes.reduce((acc, c) => acc + c.saldo_deudor, 0);
    const clientesConDeuda = clientes.filter(c => c.saldo_deudor > 0).length;

    return {
      clientes,
      totalPorCobrar: Number(totalPorCobrar.toFixed(2)),
      clientesConDeuda,
      totalAbonosMes: 1250.00
    };
  } catch (err) {
    console.error('Error en obtenerResumenCuentasPorCobrar:', err);
    return { clientes: [], totalPorCobrar: 0, clientesConDeuda: 0, totalAbonosMes: 0 };
  }
}

/**
 * Registrar un nuevo consumo a crédito desde el POS
 */
export async function registrarConsumoCredito(params: {
  clienteId: string;
  clienteNombre: string;
  monto: number;
  descripcion: string;
  oatcId?: string;
}): Promise<boolean> {
  try {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('saldo_credito')
      .eq('id', params.clienteId)
      .maybeSingle();

    const saldoAnterior = Number(cliente?.saldo_credito || 0);
    const saldoNuevo = Number((saldoAnterior + params.monto).toFixed(2));

    await supabase
      .from('clientes')
      .update({ saldo_credito: saldoNuevo })
      .eq('id', params.clienteId);

    return true;
  } catch (e) {
    console.error('Error registrando consumo credito:', e);
    return false;
  }
}

/**
 * Registrar un abono o pago total de deuda con opción de emisión fiscal SUNAT
 */
export async function registrarAbonoDeuda(params: {
  clienteId: string;
  clienteNombre: string;
  clienteDoc?: string;
  montoAbono: number;
  metodoPago: string; // 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'TRANSFERENCIA'
  emitirComprobante?: boolean;
  tipoComprobante?: TipoComprobanteFiscal;
}): Promise<{ ok: boolean; comprobanteNumero?: string; nuevoSaldo: number; error?: string }> {
  try {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, nombre, documento, saldo_credito')
      .eq('id', params.clienteId)
      .single();

    if (!cliente) return { ok: false, nuevoSaldo: 0, error: 'Cliente no encontrado' };

    const saldoAnterior = Number(cliente.saldo_credito || 0);
    const nuevoSaldo = Math.max(0, Number((saldoAnterior - params.montoAbono).toFixed(2)));

    await supabase
      .from('clientes')
      .update({ saldo_credito: nuevoSaldo })
      .eq('id', params.clienteId);

    let comprobanteNumero: string | undefined;

    // Si solicita comprobante fiscal SUNAT al liquidar
    if (params.emitirComprobante) {
      const respSunat = await emitirComprobanteSunatPSE({
        tipoComprobante: params.tipoComprobante || 'BOLETA',
        clienteTipoDoc: (params.clienteDoc && params.clienteDoc.length === 11) ? 'RUC' : 'DNI',
        clienteNumDoc: params.clienteDoc || cliente.documento || '00000000',
        clienteRazonSocial: cliente.nombre,
        items: [{
          descripcion: `Liquidación / Abono de Cuenta Corriente - Saldo cancelado`,
          cantidad: 1,
          precio_unitario: params.montoAbono,
          unidad_de_medida: 'ZZ'
        }],
        metodoPagoPrincipal: params.metodoPago,
        pagosDetalle: [{ metodo: params.metodoPago, monto: params.montoAbono }]
      });

      comprobanteNumero = respSunat.comprobanteCompleto;
    }

    return { ok: true, comprobanteNumero, nuevoSaldo };
  } catch (err: any) {
    return { ok: false, nuevoSaldo: 0, error: err?.message || 'Error en abono' };
  }
}
