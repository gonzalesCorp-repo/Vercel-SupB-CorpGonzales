export type ModoInteraccionSalon = 'ZEN_SILENCIO' | 'CONVERSACIONAL';

export type TipoCabello = 'LISO' | 'ONDULADO' | 'RIZADO' | 'AFRO';

export type FrecuenciaLavado = 'DIARIA' | 'CADA_2_DIAS' | 'SEMANAL';

export type ExposicionCalor = 'NUNCA' | 'MODERADA' | 'DIARIA';

export type MetaSaludCapilar = 
  | 'RECONSTRUCCION' 
  | 'BRILLO_LUMINOSO' 
  | 'HIDRATACION_PROFUNDA' 
  | 'CRECIMIENTO_FUERTE' 
  | 'MANTENER_COLOR';

export interface PreferenciaSensorialCliente {
  modo_interaccion: ModoInteraccionSalon;
  bebida_preferida: string;
  aroma_preferido?: string;
  sensibilidades_alergias: string[];
  tipo_cabello: TipoCabello;
  frecuencia_lavado: FrecuenciaLavado;
  exposicion_calor: ExposicionCalor;
  meta_principal: MetaSaludCapilar;
  notas_personales?: string;
}

export interface VitalidadCapilarStitch {
  score_general: number; // 0 - 100
  hidratacion: number;    // 0 - 100
  nutricion_lipidica: number; // 0 - 100
  proteccion_termica: number; // 0 - 100
  estado_cuticula: 'SELLADA' | 'LIGERAMENTE_ABIERTA' | 'POROSA';
  ultimo_calculo: string;
}

export interface PasoRutinaAutocuidado {
  id: string;
  orden: number;
  titulo: string;
  descripcion: string;
  duracion_minutos: number;
  producto_sugerido?: string;
  es_mascarilla_o_masaje?: boolean;
}

export interface RutinaClimatologicaOpal {
  clima: {
    temperatura_celsius: number;
    humedad_relativa: number;
    indice_uv: number;
    condicion_texto: string;
  };
  alerta_ambiental: string;
  rutina_am: PasoRutinaAutocuidado[];
  rutina_pm: PasoRutinaAutocuidado[];
  consejo_zen: string;
}

export interface PredictorCicloCapilarOpal {
  dias_desde_ultimo_servicio: number;
  ultimo_servicio_nombre?: string;
  proximo_servicio_recomendado: string;
  dias_restantes_estimados: number;
  nivel_urgencia: 'PREVENTIVO' | 'IDEAL' | 'RECOMENDADO_URGENTE';
  motivo_tecnico: string;
  accion_sugerida: string;
}

export interface LuminaHqPluginConfig {
  activo: boolean;
  version: string;
  modulos_habilitados: {
    scanner_biometrico: boolean;
    copilot_ai: boolean;
    expediente_clinico: boolean;
  };
}

export interface MensajeLuminaCopilot {
  id: string;
  emisor: 'USER' | 'LUMINA_AI';
  texto: string;
  timestamp: string;
  sugerencia_accion?: string;
}
