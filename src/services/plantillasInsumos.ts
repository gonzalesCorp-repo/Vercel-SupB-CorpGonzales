import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';

export type TipoCampoInsumo = 'TEXTO' | 'NUMERO' | 'SELECTOR' | 'BOOLEANO' | 'PORCENTAJE';

export interface CampoAtributoInsumo {
  id: string;
  clave: string;
  etiqueta: string;
  tipo: TipoCampoInsumo;
  valorDefecto?: any;
  opciones?: string[]; // Para SELECTOR
  unidad?: string; // ej. 'g', 'ml', '%', 'Vol'
  requerido?: boolean;
}

export interface ReglaCalculoInsumo {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaAplica: string; // ej. 'COLOR', 'DECOLORACION', 'TRATAMIENTO', 'COCINA', 'BAR'
  campoOrigen: string; // ej. 'gramos_tinte'
  campoDestino: string; // ej. 'ml_oxigenta'
  skuInsumoComplementario: string; // ej. 'SKU-OXI-20VOL'
  nombreInsumoComplementario: string;
  formulaTipo: 'MULTIPLICADOR' | 'PORCENTAJE_PESO' | 'RATIO_DINAMICO';
  factorMultiplicador?: number; // ej. 1.5 para 1:1.5
  ratioCampoClave?: string; // clave del selector de ratio ej. '1:1.5'
}

export interface PlantillaInsumosConfig {
  campos: CampoAtributoInsumo[];
  reglas: ReglaCalculoInsumo[];
}

export const PLANTILLA_INSUMOS_DEFAULT: PlantillaInsumosConfig = {
  campos: [
    {
      id: 'c_marca',
      clave: 'marca',
      etiqueta: 'Marca / Laboratorio',
      tipo: 'SELECTOR',
      opciones: ['L’Oréal Professionnel', 'Kérastase', 'Wella', 'Schwarzkopf', 'Olaplex', 'Bar & Mise en Place'],
      valorDefecto: 'L’Oréal Professionnel',
      requerido: true
    },
    {
      id: 'c_linea',
      clave: 'linea',
      etiqueta: 'Línea Técnica',
      tipo: 'TEXTO',
      valorDefecto: 'Majirel Cool Inforced'
    },
    {
      id: 'c_ratio_color',
      clave: 'ratio_oxigenta',
      etiqueta: 'Ratio de Mezcla (Oxigenta / Revelador)',
      tipo: 'SELECTOR',
      opciones: ['1:1 (Tinte x 1.0)', '1:1.5 (Tinte x 1.5 Estándar)', '1:2 (Tinte x 2.0 Superaclarante)'],
      valorDefecto: '1:1.5 (Tinte x 1.5 Estándar)',
      requerido: true
    },
    {
      id: 'c_volumen_oxi',
      clave: 'volumen_oxigenta',
      etiqueta: 'Fuerza de Peróxido',
      tipo: 'SELECTOR',
      opciones: ['10 Vol (3%)', '20 Vol (6% Estándar)', '30 Vol (9%)', '40 Vol (12%)'],
      valorDefecto: '20 Vol (6% Estándar)'
    },
    {
      id: 'c_plex',
      clave: 'requiere_plex_protector',
      etiqueta: 'Incluir Aditivo Plex / Protector de Enlaces',
      tipo: 'BOOLEANO',
      valorDefecto: false
    }
  ],
  reglas: [
    {
      id: 'r_oxigenta_ratio',
      nombre: 'Cálculo Automático de Oxigenta por Ratio',
      descripcion: 'Calcula los mililitros de oxigenta requeridos multiplicando los gramos de tinte según el ratio seleccionado (1:1, 1:1.5, 1:2).',
      categoriaAplica: 'COLOR',
      campoOrigen: 'gramos_insumo_principal',
      campoDestino: 'gramos_oxigenta_calculada',
      skuInsumoComplementario: 'SKU-OXI-20VOL',
      nombreInsumoComplementario: 'Oxigenta Reveladora',
      formulaTipo: 'RATIO_DINAMICO',
      factorMultiplicador: 1.5
    },
    {
      id: 'r_plex_bonding',
      nombre: 'Cálculo de Aditivo Plex (10% sobre decolorante)',
      descripcion: 'Si se activa el aditivo Plex en decoloración, calcula automáticamente el 10% del peso en polvo decolorante.',
      categoriaAplica: 'DECOLORACION',
      campoOrigen: 'gramos_insumo_principal',
      campoDestino: 'gramos_plex_calculado',
      skuInsumoComplementario: 'SKU-TRA-PLEX01',
      nombreInsumoComplementario: 'Aditivo Protector Smartbond Plex',
      formulaTipo: 'PORCENTAJE_PESO',
      factorMultiplicador: 0.10
    }
  ]
};

/**
 * Obtener la plantilla de atributos y reglas de insumos para la sede activa
 */
export async function obtenerPlantillaInsumosConfig(sedeId?: string): Promise<PlantillaInsumosConfig> {
  const supabase = createClient();
  const activeSedeId = sedeId || useAppStore.getState().sedeActiva?.id;

  try {
    if (activeSedeId) {
      const { data } = await supabase
        .from('sedes')
        .select('atributos')
        .eq('id', activeSedeId)
        .maybeSingle();

      if (data?.atributos?.plantilla_insumos) {
        return {
          campos: data.atributos.plantilla_insumos.campos || PLANTILLA_INSUMOS_DEFAULT.campos,
          reglas: data.atributos.plantilla_insumos.reglas || PLANTILLA_INSUMOS_DEFAULT.reglas
        };
      }
    }
    return PLANTILLA_INSUMOS_DEFAULT;
  } catch (err) {
    console.warn('[plantillasInsumos] Error obteniendo plantilla:', err);
    return PLANTILLA_INSUMOS_DEFAULT;
  }
}

/**
 * Guardar la plantilla de atributos y reglas de insumos en la sede
 */
export async function guardarPlantillaInsumosConfig(
  config: PlantillaInsumosConfig,
  sedeId?: string
): Promise<boolean> {
  const supabase = createClient();
  const activeSedeId = sedeId || useAppStore.getState().sedeActiva?.id;
  if (!activeSedeId) return false;

  try {
    const { data: currentSede } = await supabase
      .from('sedes')
      .select('atributos')
      .eq('id', activeSedeId)
      .maybeSingle();

    const atributosActuales = currentSede?.atributos || {};
    const nuevosAtributos = {
      ...atributosActuales,
      plantilla_insumos: config
    };

    const { error } = await supabase
      .from('sedes')
      .update({ atributos: nuevosAtributos })
      .eq('id', activeSedeId);

    return !error;
  } catch (err) {
    console.error('[plantillasInsumos] Error guardando plantilla:', err);
    return false;
  }
}

/**
 * Ejecutar reglas de cálculo en tiempo real sobre los insumos ingresados
 */
export function calcularInsumosComplementariosPorReglas(
  insumoPrincipalNombre: string,
  gramosPrincipal: number,
  valoresAtributos: Record<string, any>,
  reglas: ReglaCalculoInsumo[]
): Array<{
  sku: string;
  nombre: string;
  pesoTeoricoG: number;
  taraEnvaseG: number;
  motivoRegla: string;
}> {
  const resultados: Array<{
    sku: string;
    nombre: string;
    pesoTeoricoG: number;
    taraEnvaseG: number;
    motivoRegla: string;
  }> = [];

  const nombreLower = insumoPrincipalNombre.toLowerCase();

  reglas.forEach((regla) => {
    // 1. Regla de Ratio de Oxigenta para Tintes
    if (regla.categoriaAplica === 'COLOR' && (nombreLower.includes('tinte') || nombreLower.includes('color'))) {
      const ratioStr = valoresAtributos['ratio_oxigenta'] || '1:1.5';
      let multiplicador = 1.5;
      if (ratioStr.includes('1:1 (')) multiplicador = 1.0;
      else if (ratioStr.includes('1:2')) multiplicador = 2.0;
      else if (regla.factorMultiplicador) multiplicador = regla.factorMultiplicador;

      const gramosOxigenta = Number((gramosPrincipal * multiplicador).toFixed(1));
      const fuerza = valoresAtributos['volumen_oxigenta'] || '20 Vol';

      resultados.push({
        sku: regla.skuInsumoComplementario || 'SKU-OXI-20VOL',
        nombre: `${regla.nombreInsumoComplementario} (${fuerza}) [Ratio ${multiplicador}]`,
        pesoTeoricoG: gramosOxigenta,
        taraEnvaseG: 65.0,
        motivoRegla: `Regla automática: ${gramosPrincipal}g tinte × ${multiplicador} ratio = ${gramosOxigenta}g`
      });
    }

    // 2. Regla de Aditivo Plex para Decoloraciones
    if (regla.categoriaAplica === 'DECOLORACION' && (nombreLower.includes('decolor') || nombreLower.includes('blond') || valoresAtributos['requiere_plex_protector'])) {
      const porcentaje = regla.factorMultiplicador || 0.10;
      const gramosPlex = Number((gramosPrincipal * porcentaje).toFixed(1));

      resultados.push({
        sku: regla.skuInsumoComplementario || 'SKU-TRA-PLEX01',
        nombre: regla.nombreInsumoComplementario,
        pesoTeoricoG: Math.max(2, gramosPlex),
        taraEnvaseG: 8.0,
        motivoRegla: `Regla Bonding Plex: 10% del peso en polvo (${gramosPrincipal}g × 0.1 = ${gramosPlex}g)`
      });
    }
  });

  return resultados;
}
