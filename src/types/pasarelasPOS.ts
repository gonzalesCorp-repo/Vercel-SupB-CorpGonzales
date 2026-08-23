export type MedioPagoPasarela = 
  | 'TARJETA_DEBITO' 
  | 'TARJETA_CREDITO' 
  | 'BILLETERA_DIGITAL' 
  | 'EFECTIVO' 
  | 'TRANSFERENCIA';

export type TipoAcreditacionPasarela = 'INMEDIATA' | 'EN_TRANSITO_LOTE';

export type EstadoLoteLiquidacionPOS = 'EN_TRANSITO' | 'CONCILIADO_DEPOSITADO' | 'OBSERVADO';

export interface ConfigPasarelaPago {
  id: string;
  sede_id: string;
  nombre: string;
  medio_pago: MedioPagoPasarela;
  cuenta_puente_id?: string;
  cuenta_puente_nombre?: string;
  cuenta_destino_id: string;
  cuenta_destino_nombre?: string;
  porcentaje_comision: number; // Ej. 3.25
  costo_fijo_transaccion: number; // Ej. 0.00
  aplica_igv_comision: boolean;
  dias_liquidacion: number; // 0, 1, 2
  tipo_acreditacion: TipoAcreditacionPasarela;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoteLiquidacionPOS {
  id: string;
  sede_id: string;
  pasarela_id: string;
  pasarela_nombre: string;
  fecha_lote: string; // YYYY-MM-DD
  cantidad_transacciones: number;
  monto_bruto_total: number;
  comision_estimada: number;
  monto_neto_estimado: number;
  monto_neto_real_depositado?: number | null;
  diferencia_varianza: number;
  estado: EstadoLoteLiquidacionPOS;
  numero_operacion_bancaria?: string | null;
  comprobante_deposito_url?: string | null;
  conciliado_por?: string | null;
  fecha_conciliacion?: string | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CalculoComisionResult {
  montoBruto: number;
  comisionBase: number;
  costoFijo: number;
  igvComision: number;
  comisionTotal: number;
  montoNeto: number;
  porcentajeEfectivo: number;
}
