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
