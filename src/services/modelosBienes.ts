// ============================================================================
// modelosBienes.ts - Servicio de Gestión de Modelos y Moldes de Bienes
// Permite al SuperAdmin / Admin definir plantillas parametrizadas para
// Servicios, Productos, Insumos, Equipos/Dispositivos, Muebles y Máquinas.
// ============================================================================

import { createClient } from '@/lib/supabase/client';

export type TipoNaturalezaBien = 
  | 'SERVICIO'
  | 'PRODUCTO'
  | 'INSUMO'
  | 'EQUIPO_DISPOSITIVO'
  | 'MUEBLE'
  | 'MAQUINA';

export interface InsumoRecetaMolde {
  nombre: string;
  gramos_estimados: number;
  tipo?: string;
}

export interface EsquemaAtributosServicio {
  duracion_minutos: number;
  estacion_sugerida: string;
  comision_porcentaje: number;
  comision_fija_monto?: number;
  requiere_insumos_taller: boolean;
  receta_insumos: InsumoRecetaMolde[];
  tipo_afectacion_igv?: string; // '10' Gravado, '20' Exonerado
  puntos_vp_otorgados?: number;
  permite_simultaneo?: boolean;
}

export interface EsquemaAtributosProducto {
  presentacion_default: string;
  unidad_medida: string;
  stock_minimo_alerta: number;
  comision_venta_porcentaje: number;
  tipo_afectacion_igv?: string;
  puntos_vp_otorgados?: number;
  margen_sugerido_porcentaje?: number;
}

export interface EsquemaAtributosInsumo {
  presentacion_default: string;
  unidad_medida: 'g' | 'ml' | 'oz' | 'und';
  peso_neto_total_gramos: number;
  peso_envase_tara_gramos: number;
  factor_densidad: number;
  merma_tolerancia_porcentaje: number;
  pao_meses: number;
  stock_minimo_alerta_gramos: number;
  area_produccion_boh?: string;
}

export interface EsquemaAtributosEquipo {
  protocolo_comunicacion: 'WEB_BLUETOOTH_BLE' | 'WEB_SERIAL_USB' | 'WIFI_WEBSOCKET' | 'NFC_READER' | 'STANDALONE_PLUG';
  estacion_sugerida: string;
  vida_util_meses_base: number;
  frecuencia_mantenimiento_dias: number;
  meses_extension_por_reparacion: number;
  requiere_calibracion: boolean;
  descripcion_partes_renovables?: string;
}

export interface EsquemaAtributosMueble {
  tipo_mueble: string;
  estacion_sugerida: string;
  capacidad_carga_kg: number;
  grados_reclinacion: number;
  material_tapiz: string;
  vida_util_meses_base: number;
  frecuencia_mantenimiento_dias: number;
  meses_extension_por_reparacion: number;
  descripcion_partes_renovables?: string;
}

export interface EsquemaAtributosMaquina {
  tipo_maquina: string;
  potencia_watts: number;
  voltaje_operacion: '220V' | '110V' | 'TRIFASICO_380V' | 'BATERIA_LITIO';
  amperaje_nominal_a?: number;
  horas_vida_util_maxima: number;
  vida_util_meses_base: number;
  frecuencia_overhaul_horas: number;
  frecuencia_mantenimiento_dias: number;
  meses_extension_por_reparacion: number;
  temperatura_maxima_c?: number;
  presion_maxima_bar?: number;
  estacion_sugerida: string;
  descripcion_partes_renovables?: string;
}

export interface ModeloBien {
  id: string;
  nombre: string;
  tipo_naturaleza: TipoNaturalezaBien;
  categoria_default?: string;
  descripcion?: string;
  icono?: string;
  esquema_atributos: 
    | EsquemaAtributosServicio 
    | EsquemaAtributosProducto 
    | EsquemaAtributosInsumo 
    | EsquemaAtributosEquipo 
    | EsquemaAtributosMueble 
    | EsquemaAtributosMaquina 
    | Record<string, any>;
  es_plantilla_sistema: boolean;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

const supabase = createClient();

/**
 * Obtiene todos los moldes o modelos de bienes activos, opcionalmente filtrados por naturaleza.
 */
export async function obtenerModelosBienes(tipo?: TipoNaturalezaBien): Promise<ModeloBien[]> {
  try {
    let query = supabase
      .from('modelos_bienes')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (tipo) {
      query = query.eq('tipo_naturaleza', tipo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ModeloBien[];
  } catch (err: any) {
    console.error('Error obteniendo modelos de bienes:', err);
    return [];
  }
}

/**
 * Obtiene un molde específico por su UUID
 */
export async function obtenerModeloBienPorId(id: string): Promise<ModeloBien | null> {
  try {
    const { data, error } = await supabase
      .from('modelos_bienes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as ModeloBien | null;
  } catch (err: any) {
    console.error(`Error obteniendo modelo ${id}:`, err);
    return null;
  }
}

/**
 * Crea un nuevo molde de bien (disponible para el SuperAdmin / Admin)
 */
export async function crearModeloBien(modelo: Partial<ModeloBien>): Promise<{ ok: boolean; data?: ModeloBien; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('modelos_bienes')
      .insert([{
        nombre: modelo.nombre?.trim(),
        tipo_naturaleza: modelo.tipo_naturaleza || 'SERVICIO',
        categoria_default: modelo.categoria_default?.trim() || null,
        descripcion: modelo.descripcion?.trim() || null,
        icono: modelo.icono || 'Sparkles',
        esquema_atributos: modelo.esquema_atributos || {},
        es_plantilla_sistema: false,
        activo: true
      }])
      .select()
      .single();

    if (error) throw error;
    return { ok: true, data: data as ModeloBien };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Actualiza un molde existente
 */
export async function actualizarModeloBien(id: string, cambios: Partial<ModeloBien>): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('modelos_bienes')
      .update({
        ...cambios,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
