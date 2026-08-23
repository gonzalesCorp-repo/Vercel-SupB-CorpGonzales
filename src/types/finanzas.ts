export type TipoCuentaFinanciera = 'CAJA_CHICA' | 'BANCO' | 'BILLETERA_DIGITAL' | 'PASARELA_POS';

export type TipoMovimientoTesoreria = 'INGRESO' | 'EGRESO';

export type CategoriaMovimientoTesoreria = 
  | 'LIQUIDACION_STAFF' 
  | 'ADELANTO_SUELDO' 
  | 'CAJA_CHICA_OPERATIVO' 
  | 'REPOSICION_FONDO' 
  | 'PAGO_PROVEEDOR' 
  | 'SERVICIOS_BASICOS' 
  | 'OTROS_INGRESOS' 
  | 'OTROS_EGRESOS';

export interface CuentaFinanciera {
  id: string;
  nombre: string;
  tipo_cuenta: TipoCuentaFinanciera;
  banco_entidad: string;
  numero_cuenta?: string;
  moneda: string;
  saldo_actual: number;
  sede_id?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  created_at?: string;
  updated_at?: string;
}

export interface MovimientoTesoreria {
  id: string;
  cuenta_id: string;
  cuenta_nombre?: string;
  tipo_movimiento: TipoMovimientoTesoreria;
  categoria: CategoriaMovimientoTesoreria;
  monto: number;
  moneda: string;
  descripcion: string;
  beneficiario_nombre?: string;
  agente_id?: string;
  comprobante_adjunto_url?: string;
  numero_operacion_voucher?: string;
  requiere_aprobacion: boolean;
  estado_aprobacion: 'APROBADO' | 'PENDIENTE_SUPERADMIN' | 'RECHAZADO';
  autorizado_por?: string;
  registrado_por: string;
  sede_id?: string;
  fecha_movimiento: string;
  created_at?: string;
}

export interface TransferenciaCuentas {
  id: string;
  cuenta_origen_id: string;
  cuenta_origen_nombre?: string;
  cuenta_destino_id: string;
  cuenta_destino_nombre?: string;
  monto: number;
  comision_transferencia?: number;
  descripcion?: string;
  numero_operacion?: string;
  registrado_por: string;
  sede_id?: string;
  created_at?: string;
}

export interface DatosReciboEgresoTermico {
  numeroComprobante: string;
  fechaHora: string;
  sedeNombre: string;
  cuentaNombre: string;
  categoria: string;
  concepto: string;
  beneficiario: string;
  monto: number;
  moneda: string;
  registradoPor: string;
  autorizadoPor?: string;
}
