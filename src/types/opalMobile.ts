/**
 * Contratos de datos e interfaces TypeScript para las suites móviles
 * de ADMIN y SOPORTE potenciadas con Google Opal AI & Google Stitch UI.
 */

// =========================================================================
// 1. SUITE MÓVIL ADMIN: EXECUTIVE COPILOT & AUDITORÍA
// =========================================================================

export interface AdminExecutiveBriefingInput {
  sede_id?: string;
  sede_nombre: string;
  total_ventas_hoy: number;
  meta_ventas_hoy?: number;
  oatcs_activas_count: number;
  colaboradores_activos_count: number;
  colaboradores_en_atencion_count: number;
  clientes_en_espera_count: number;
  liquidaciones_pendientes_count: number;
}

export interface AdminExecutiveBriefingOutput {
  resumen_ejecutivo: string;
  alerta_cuello_botella?: string;
  porcentaje_cumplimiento_meta: number;
  tasa_ocupacion_sillones: number;
  estado_operativo_sede: 'OPTIMO' | 'ALTA_DEMANDA' | 'CUELLO_BOTELLA' | 'ATENCION_REQUERIDA';
  acciones_recomendadas: string[];
}

export interface PinAutorizacionRequest {
  pin_ingresado: string;
  agente_id: string;
  accion_solicitada: 'PAGO_LIQUIDACION' | 'ANULACION_COMPROBANTE' | 'CAMBIO_TURNO_FORZADO';
  detalles?: string;
}

export interface PinAutorizacionResponse {
  autorizado: boolean;
  mensaje: string;
  timestamp: string;
}

// =========================================================================
// 2. SUITE MÓVIL SOPORTE: ASISTENTE DE FÓRMULAS QUÍMICAS & BALANZA STITCH
// =========================================================================

export interface InsumoFormulaReceta {
  id: string;
  nombre: string;
  gramos_requeridos: number;
  categoria: 'POLVO_DECOLORANTE' | 'OXIDANTE' | 'TINTE' | 'TRATAMIENTO';
  instruccion?: string;
}

export interface PedidoFormulaLabInput {
  pedido_id: string;
  oatc_id?: string;
  estilista_nombre: string;
  estacion_nombre?: string;
  servicio_nombre: string;
  formula_solicitada: string;
}

export interface FormulaLabDespachoOutput {
  receta_desglosada: InsumoFormulaReceta[];
  ratio_mezcla: string; // ej. "1:2"
  tolerancia_gramos: number; // margen de precisión (ej. ±2g)
  tiempo_pose_recomendado_min: number;
  consejo_tecnico: string;
}
