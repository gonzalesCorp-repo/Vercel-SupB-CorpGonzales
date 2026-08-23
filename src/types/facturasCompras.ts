export type TipoComprobanteCompra = 
  | 'FACTURA' 
  | 'BOLETA' 
  | 'RECIBO_HONORARIOS' 
  | 'NOTA_CREDITO'
  | 'GUIA_REMISION';

export type CondicionPagoCompra = 
  | 'CONTADO' 
  | 'CREDITO_15D' 
  | 'CREDITO_30D' 
  | 'CREDITO_45D' 
  | 'CREDITO_60D' 
  | 'CREDITO_CUOTAS';

export type EstadoPagoFactura = 
  | 'PENDIENTE' 
  | 'PAGADO_PARCIAL' 
  | 'PAGADO_TOTAL' 
  | 'VENCIDO';

export interface CuotaFacturaCompra {
  id: string;
  factura_compra_id: string;
  numero_cuota: number;
  monto_cuota: number;
  fecha_vencimiento: string; // YYYY-MM-DD
  estado: 'PENDIENTE' | 'PAGADO';
  movimiento_tesoreria_id?: string;
  created_at?: string;
}

export interface FacturaCompra {
  id: string;
  sede_id: string;
  proveedor_ruc: string;
  proveedor_razon_social: string;
  tipo_comprobante: TipoComprobanteCompra;
  serie: string;
  numero: string;
  fecha_emision: string; // YYYY-MM-DD
  condicion_pago: CondicionPagoCompra;
  fecha_vencimiento: string; // YYYY-MM-DD
  moneda: string;
  subtotal: number;
  igv: number;
  total: number;
  monto_pagado: number;
  saldo_pendiente: number;
  estado_pago: EstadoPagoFactura;
  cuenta_pago_id?: string;
  cuenta_pago_nombre?: string;
  categoria_gasto: string;
  comprobante_adjunto_url?: string;
  notas?: string;
  registrado_por: string;
  cuotas?: CuotaFacturaCompra[];
  created_at?: string;
  updated_at?: string;
}

export interface CalendarioEventoPago {
  fecha: string; // YYYY-MM-DD
  totalPorPagar: number;
  cantidadFacturas: number;
  facturas: FacturaCompra[];
  cuotas: CuotaFacturaCompra[];
}
