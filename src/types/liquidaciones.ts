export type TipoRemuneracion = 
  | 'SOLO_COMISIONES' 
  | 'SOLO_SUELDO_BASE' 
  | 'SUELDO_BASE_MAS_COMISIONES';

export type FrecuenciaCorte = 
  | 'DIARIA' 
  | 'SEMANAL' 
  | 'QUINCENAL' 
  | 'MENSUAL' 
  | 'A_DEMANDA';

export type EstadoLiquidacion = 
  | 'BORRADOR_AUTOMATICO' 
  | 'SOLICITADO_STAFF' 
  | 'PAGADO' 
  | 'ANULADO';

export type TipoItemLiquidacion = 
  | 'SERVICIO' 
  | 'PRODUCTO' 
  | 'PROPINA' 
  | 'ADELANTO' 
  | 'SUELDO_BASE';

export interface AgenteConfigRemunerativa {
  agente_id: string;
  tipo_remuneracion: TipoRemuneracion;
  sueldo_base: number;
  porcentaje_comision_servicios: number;
  porcentaje_comision_productos: number;
  frecuencia_corte: FrecuenciaCorte;
  permite_solicitud_manual: boolean;
  cuenta_bancaria_pago_preferida?: string;
  banco_preferido?: string;
  numero_documento_pago?: string;
  updated_at?: string;
}

export interface LiquidacionPersonal {
  id: string;
  numero_correlativo: string;
  agente_id: string;
  agente_nombre: string;
  agente_rol: string;
  periodo_inicio: string;
  periodo_fin: string;
  tipo_remuneracion: TipoRemuneracion;
  monto_sueldo_base: number;
  monto_comisiones_servicios: number;
  monto_comisiones_productos: number;
  monto_propinas: number;
  monto_adelantos_deducidos: number;
  monto_total_neto: number;
  cuenta_pago_id?: string;
  cuenta_pago_nombre?: string;
  movimiento_tesoreria_id?: string;
  estado: EstadoLiquidacion;
  solicitado_por?: string;
  aprobado_por?: string;
  fecha_pago?: string;
  sede_id?: string;
  notas?: string;
  created_at?: string;
  items?: LiquidacionItem[];
}

export interface LiquidacionItem {
  id?: string;
  liquidacion_id?: string;
  tipo_item: TipoItemLiquidacion;
  origen_id: string;
  descripcion: string;
  fecha_servicio: string;
  monto_venta: number;
  porcentaje_aplicado: number;
  monto_comision: number;
  cliente_nombre?: string;
  created_at?: string;
}

export interface ItemVentaAuditoria {
  origen_id: string;
  tipo: 'SERVICIO' | 'PRODUCTO';
  descripcion: string;
  fecha: string;
  monto_venta: number;
  porcentaje_comision: number;
  monto_comision: number;
  cliente_nombre?: string;
  esta_liquidado: boolean;
  liquidacion_correlativo?: string;
}
