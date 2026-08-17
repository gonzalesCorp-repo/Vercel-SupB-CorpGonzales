import { createClient } from '@/lib/supabase/client';
import { registrarLog } from './logger';

export interface CategoriaBien {
  id: string;
  nombre: string;
  tipo_bien: 'servicio' | 'producto' | 'insumo' | 'equipo' | 'mueble';
  division_padre_id?: string | null;
  icono?: string;
  color?: string;
  orden?: number;
  sublineas?: CategoriaBien[];
}

export interface BienItem {
  id: string;
  nombre: string;
  tipo_bien: 'servicio' | 'producto' | 'insumo' | 'equipo' | 'mueble';
  sku?: string;
  codigo_barras?: string;
  qr_code_id?: string;
  categoria?: string;
  categoria_id?: string;
  linea_id?: string;
  precio_venta: number;
  costo_base?: number;
  duracion_minutos?: number;
  comision_porcentaje?: number;
  es_servicio?: boolean;
  es_producto_venta?: boolean;
  es_insumo_taller?: boolean;
  es_intermedio_subreceta?: boolean;
  area_produccion_boh?: string;
  unidad_medida?: 'g' | 'ml' | 'oz' | 'und' | 'porc';
  peso_envase_tara_gramos?: number;
  peso_neto_total_gramos?: number;
  factor_densidad?: number;
  merma_tolerancia_porcentaje?: number;
  pao_meses?: number;
  requiere_refrigeracion?: boolean;
  receta_insumos?: Array<{ bien_id: string; sku?: string; nombre: string; cantidad: number; unidad?: string }>;
  atributos_ecosistema?: {
    lumina_ai?: Record<string, any>;
    mnsh_gamification?: Record<string, any>;
    sunat_fiscal?: Record<string, any>;
    [key: string]: any;
  };
  atributos_configurados?: Record<string, any>;
  atributos_producto?: Record<string, any>;
  atributos_servicio?: Record<string, any>;
  created_at?: string;
}

export interface ArbolCatalogo {
  divisiones: CategoriaBien[];
  bienesPorLinea: Record<string, BienItem[]>;
}

export async function obtenerCategoriasJerarquicas(): Promise<CategoriaBien[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categorias_bienes')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error cargando categorías jerárquicas:', error);
    return [];
  }

  const todas = data as CategoriaBien[];
  const divisiones = todas.filter(c => !c.division_padre_id);

  return divisiones.map(div => ({
    ...div,
    sublineas: todas.filter(sub => sub.division_padre_id === div.id)
  }));
}

export async function obtenerBienesCatalogo(): Promise<BienItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('bienes')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error cargando bienes del catálogo:', error);
    return [];
  }

  return (data || []) as BienItem[];
}

export async function guardarBienCatalogo(bien: Partial<BienItem>): Promise<BienItem | null> {
  const supabase = createClient();

  const payload: any = {
    nombre: bien.nombre,
    tipo_bien: bien.tipo_bien || (bien.es_servicio ? 'servicio' : 'producto'),
    categoria: bien.categoria,
    categoria_id: bien.categoria_id,
    linea_id: bien.linea_id,
    precio_venta: bien.precio_venta || 0,
    costo_base: bien.costo_base || 0,
    duracion_minutos: bien.duracion_minutos || 30,
    comision_porcentaje: bien.comision_porcentaje || 0,
    es_servicio: bien.es_servicio ?? (bien.tipo_bien === 'servicio'),
    es_producto_venta: bien.es_producto_venta ?? (bien.tipo_bien === 'producto'),
    es_insumo_taller: bien.es_insumo_taller ?? (bien.tipo_bien === 'insumo'),
    atributos_configurados: bien.atributos_configurados || {}
  };

  if (bien.id) {
    const { data, error } = await supabase
      .from('bienes')
      .update(payload)
      .eq('id', bien.id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando bien:', error);
      throw error;
    }
    await registrarLog('CATALOGO', `Actualizado bien: ${bien.nombre}`, { bien_id: bien.id });
    return data as BienItem;
  } else {
    const { data, error } = await supabase
      .from('bienes')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error insertando bien:', error);
      throw error;
    }
    await registrarLog('CATALOGO', `Creado bien: ${bien.nombre}`, { bien_id: data.id });
    return data as BienItem;
  }
}

export function calcularRentabilidadBien(precioVenta: number, costoBase: number, comisionPorcentaje: number = 0) {
  const montoComision = (precioVenta * (comisionPorcentaje || 0)) / 100;
  const margenBruto = precioVenta - (costoBase || 0) - montoComision;
  const porcentajeMargen = precioVenta > 0 ? (margenBruto / precioVenta) * 100 : 0;

  return {
    precioVenta,
    costoBase,
    montoComision,
    margenBruto,
    porcentajeMargen: Number(porcentajeMargen.toFixed(1))
  };
}
