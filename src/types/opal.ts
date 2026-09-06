export interface InsumoRecetaOpal {
  codigo_insumo: string;
  nombre: string;
  cantidad_gramos: number;
}

export interface PasoRecetaOpal {
  orden: number;
  accion: string;
  tiempo_exposicion_minutos: number;
  insumos: InsumoRecetaOpal[];
  precauciones: string[];
}

export interface RecetaQuimicaSugerida {
  pasos: PasoRecetaOpal[];
  costo_estimado_insumos: number;
  recomendacion_cuidado_posterior: string[];
}

export interface HistorialQuimicoCliente {
  fecha: string;
  servicio: string;
  formula_utilizada?: string;
  sensibilidad_cuero_cabelludo?: string;
}

export interface EvaluacionCapilarInput {
  porosidad: 'BAJA' | 'MEDIA' | 'ALTA';
  elasticidad: 'BUENA' | 'REGULAR' | 'DANADA';
  tono_base: string; // Altura 1 a 10
  tono_deseado: string; // Altura 1 a 10
  tipo_cuero_cabelludo: 'NORMAL' | 'GRASO' | 'SENSIBLE' | 'IRRITADO';
  observaciones_estilista?: string;
}

export interface InventarioItemOpal {
  codigo_insumo: string;
  nombre: string;
  categoria: 'DECOLORANTE' | 'TINTE' | 'OXIDANTE' | 'TRATAMIENTO';
  stock_actual: number;
  unidad_medida: string;
}

export interface OpalWorkflowInputPayload {
  workflow_id: string;
  entorno: 'PROD' | 'STAGING';
  timestamp: string;
  contexto: {
    cliente: {
      id?: string;
      nombre: string;
      historial_quimico_previo?: HistorialQuimicoCliente[];
    };
    evaluacion_actual: EvaluacionCapilarInput;
    inventario_disponible?: InventarioItemOpal[];
  };
}

export interface OpalWorkflowOutputPayload {
  status: 'SUCCESS' | 'ERROR';
  diagnostico_resumen: string;
  riesgo_quimico: 'BAJO' | 'MODERADO' | 'ALTO' | 'CRITICO';
  score_salud_fibra: number; // 0 - 100
  receta_sugerida: RecetaQuimicaSugerida;
  metadatos_ia: {
    modelo: string;
    confianza: number;
    sugerencia_venta_cruzada: string[];
  };
}

// ================= SUITE MÓVIL: STAFF CHAIRSIDE ASSISTANT =================
export interface ProductoCrossSellingOpal {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  comision_estimada: number;
  motivo_recomendacion: string;
}

export interface StaffChairsideInput {
  oatc_id?: string;
  cliente_nombre?: string;
  servicios_activos?: Array<{
    nombre: string;
    precio: number;
    categoria?: string;
  }>;
  porcentaje_comision_staff?: number;
}

export interface StaffChairsideOutput {
  tiempo_exposicion_sugerido_minutos: number;
  alerta_tecnica?: string;
  productos_cross_selling: ProductoCrossSellingOpal[];
  comision_servicio_actual: number;
  comision_potencial_upsell: number;
}

// ================= SUITE MÓVIL: CLIENT BEAUTY ADVISOR =================
export interface ClientBeautyInput {
  cliente_id?: string;
  nombre_cliente?: string;
  ultimos_servicios?: Array<{
    nombre: string;
    fecha: string;
  }>;
  puntos_actuales?: number;
}

export interface ClientBeautyOutput {
  consejo_personalizado: string;
  proxima_cita_recomendada: {
    dias_sugeridos: number;
    fecha_estimada: string;
    servicio_sugerido: string;
    motivo: string;
  };
  beneficio_fidelidad?: {
    recompensa: string;
    puntos_necesarios: number;
    disponible_ahora: boolean;
  };
}

// ================= DESKTOP ERP: AUDITOR 360° OPAL =================

// 1. Módulo Caja: Auditoría de Arqueo
export interface CajaAuditoriaInput {
  sede_id?: string;
  total_declarado: number;
  total_esperado_sistema: number;
  diferencia: number;
  diferencia_efectivo: number;
  diferencia_vouchers: number;
  total_efectivo_contado: number;
  total_vouchers_contado: number;
  notas?: string;
}

export interface AlertaAuditoriaCaja {
  id: string;
  nivel: 'INFO' | 'ADVERTENCIA' | 'CRITICO';
  titulo: string;
  descripcion: string;
  accion_recomendada: string;
}

export interface CajaAuditoriaOutput {
  estado_veredicto: 'CONFORME' | 'OBSERVACION_LEVE' | 'DESCUADRE_CRITICO';
  score_confianza: number; // 0 - 100
  resumen_ejecutivo: string;
  alertas: AlertaAuditoriaCaja[];
  protocolo_cierre_recomendado: string;
}

// 2. Módulo Laboratorio: Predictor de Demanda de Insumos Químicos
export interface InsumoQuimicoCritico {
  id: string;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  demanda_proyectada_7d: number;
  dias_cobertura_restantes: number;
  estado_abastecimiento: 'OPTIMO' | 'ALERTA_REPOSICION' | 'QUIEBRE_INMINENTE';
  reposicion_sugerida_unidades: number;
}

export interface LabPredictorInput {
  sede_id?: string;
  inventario_items: Array<{
    id: string;
    nombre: string;
    categoria: string;
    stock_total: number;
    stock_minimo: number;
  }>;
  citas_proximas_count?: number;
}

export interface LabPredictorOutput {
  score_salud_stock: number; // 0 - 100
  resumen_diagnostico: string;
  insumos_criticos: InsumoQuimicoCritico[];
  recomendacion_compras: string;
}

// 3. Módulo Finanzas / WFM: Pre-Auditor de Liquidaciones de Personal
export interface PreAuditoriaLiquidacionInput {
  sede_id?: string;
  liquidaciones_pendientes: Array<{
    id: string;
    agente_nombre: string;
    rol?: string;
    total_servicios: number;
    total_comisiones: number;
    items_count?: number;
  }>;
}

export interface ObservacionPreAuditoria {
  liquidacion_id: string;
  colaborador: string;
  estado: 'APROBADA' | 'REVISAR' | 'ANOMALIA';
  mensaje: string;
  ratio_comision_promedio: number;
}

export interface PreAuditoriaLiquidacionOutput {
  total_auditado: number;
  monto_total_por_desembolsar: number;
  tasa_conformidad_porcentaje: number;
  observaciones: ObservacionPreAuditoria[];
  dictamen_auditoria: string;
}
