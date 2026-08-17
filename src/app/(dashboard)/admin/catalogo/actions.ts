'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const BienSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  categoria: z.string().min(1, "La categoría o línea es obligatoria"),
  tipo_bien: z.enum(['producto', 'insumo', 'servicio', 'equipo', 'mueble', 'maquina']),
  precio_venta: z.number().min(0, "El precio de venta no puede ser negativo"),
  stockInicial: z.number().min(0, "El stock no puede ser negativo").default(0),
  codigo_barras: z.string().optional().nullable(),
  modelo_id: z.string().optional().nullable(),
  duracion_minutos: z.number().optional(),
  comision_porcentaje: z.number().optional(),
  es_servicio: z.boolean().optional(),
  receta_insumos: z.array(z.any()).optional(),
  atributos_servicio: z.record(z.string(), z.any()).optional(),
  atributos_ecosistema: z.record(z.string(), z.any()).optional(),
  peso_envase_tara_gramos: z.number().optional(),
  peso_neto_total_gramos: z.number().optional(),
  factor_densidad: z.number().optional(),
  merma_tolerancia_porcentaje: z.number().optional(),
  pao_meses: z.number().optional(),
  unidad_medida: z.string().optional(),
  area_produccion_boh: z.string().optional(),
  // Equipos & Dispositivos Hardware / Depreciación
  numero_serie: z.string().optional().nullable(),
  mac_address: z.string().optional().nullable(),
  bluetooth_uuid: z.string().optional().nullable(),
  ip_address: z.string().optional().nullable(),
  protocolo_comunicacion: z.string().optional(),
  estacion_asignada: z.string().optional(),
  estado_operativo: z.string().optional(),
  vida_util_meses_base: z.number().optional(),
  meses_extension_reparacion: z.number().optional(),
  fecha_adquisicion: z.string().optional(),
  valor_residual_estimado: z.number().optional(),
  frecuencia_mantenimiento_dias: z.number().optional(),
  fecha_ultimo_mantenimiento: z.string().optional().nullable(),
  historial_reparaciones_partes: z.array(z.any()).optional(),
  // Muebles & Estaciones de Trabajo
  codigo_patrimonial_tag: z.string().optional().nullable(),
  tipo_mueble: z.string().optional(),
  capacidad_carga_kg: z.number().optional(),
  grados_reclinacion: z.number().optional(),
  material_tapiz: z.string().optional(),
  // Máquinas & Aparatología Termo-Mecánica
  es_maquina: z.boolean().optional(),
  tipo_maquina: z.string().optional(),
  potencia_watts: z.number().optional(),
  voltaje_operacion: z.string().optional(),
  horas_uso_acumuladas: z.number().optional(),
  horas_vida_util_maxima: z.number().optional(),
  frecuencia_overhaul_horas: z.number().optional(),
  temperatura_maxima_c: z.number().optional(),
  presion_maxima_bar: z.number().optional(),
  atributos_producto: z.object({
    marca: z.string().optional(),
    linea: z.string().optional(),
    presentacion: z.string().optional(),
    proveedor: z.string().optional(),
    costo_unitario: z.number().min(0).optional(),
    tipo_catalogo: z.string().optional(),
    estado: z.string().optional(),
    sku: z.string().optional(),
    codigo_barras: z.string().optional(),
    stock_minimo_alerta: z.number().optional(),
    comision_venta_porcentaje: z.number().optional()
  }).passthrough().optional()
});

export async function getCatalogo(filtroTipo: string, mostrarInactivos: boolean = false) {
  let query = supabaseAdmin.from('bienes').select('*').order('created_at', { ascending: false }).limit(2000);
  
  if (filtroTipo === 'servicio') {
    query = query.or('tipo_bien.eq.servicio,es_servicio.eq.true');
  } else if (filtroTipo === 'insumo') {
    query = query.or('tipo_bien.eq.insumo,es_insumo_taller.eq.true,atributos_producto->>tipo_catalogo.eq.insumo');
  } else if (filtroTipo === 'producto') {
    query = query.eq('tipo_bien', 'producto').eq('atributos_producto->>tipo_catalogo', 'retail');
  } else if (filtroTipo === 'equipo') {
    query = query.or('tipo_bien.eq.equipo,es_equipo_dispositivo.eq.true,atributos_producto->>tipo_catalogo.eq.equipo');
  } else if (filtroTipo === 'mueble') {
    query = query.or('tipo_bien.eq.mueble,es_mueble.eq.true,atributos_producto->>tipo_catalogo.eq.mueble');
  } else if (filtroTipo === 'maquina') {
    query = query.or('tipo_bien.eq.maquina,es_maquina.eq.true,atributos_producto->>tipo_catalogo.eq.maquina');
  }

  // Filter inactives
  if (mostrarInactivos) {
    query = query.eq('atributos_producto->>estado', 'inactivo');
  } 
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching catalogo:', error);
    throw new Error(error.message);
  }
  
  if (!mostrarInactivos) {
    return data.filter((item: any) => item.atributos_producto?.estado !== 'inactivo');
  }
  
  return data;
}

function getFirst3Letters(str: string) {
  if (!str) return 'XXX';
  return String(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');
}

export async function guardarBien(bienId: string | null, rawPayload: any, sedeId: string, isAdmin: boolean) {
  const parseResult = BienSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    throw new Error(parseResult.error.issues.map((e: any) => e.message).join(', '));
  }
  
  const payload = parseResult.data;
  const { 
    nombre, categoria, tipo_bien, precio_venta, atributos_producto = {}, stockInicial,
    codigo_barras, modelo_id, duracion_minutos, comision_porcentaje, es_servicio, receta_insumos,
    atributos_servicio, atributos_ecosistema,
    peso_envase_tara_gramos, peso_neto_total_gramos, factor_densidad,
    merma_tolerancia_porcentaje, pao_meses, unidad_medida, area_produccion_boh,
    numero_serie, mac_address, bluetooth_uuid, ip_address, protocolo_comunicacion,
    estacion_asignada, estado_operativo, vida_util_meses_base, meses_extension_reparacion,
    fecha_adquisicion, valor_residual_estimado, frecuencia_mantenimiento_dias,
    fecha_ultimo_mantenimiento, historial_reparaciones_partes,
    codigo_patrimonial_tag, tipo_mueble, capacidad_carga_kg, grados_reclinacion, material_tapiz,
    es_maquina, tipo_maquina, potencia_watts, voltaje_operacion, horas_uso_acumuladas,
    horas_vida_util_maxima, frecuencia_overhaul_horas, temperatura_maxima_c, presion_maxima_bar
  } = payload;
  
  let id = bienId;

  // Handles Generics
  if (!atributos_producto.marca) atributos_producto.marca = 'Marca_Generica';
  if (!atributos_producto.linea) atributos_producto.linea = categoria || 'Linea_Generica';
  if (!atributos_producto.presentacion) atributos_producto.presentacion = 'Pres_Generica';

  const datosBien: any = {
    nombre,
    categoria,
    tipo_bien,
    precio_venta,
    codigo_barras: codigo_barras || null,
    atributos_producto,
    modelo_id: modelo_id || null,
    duracion_minutos: duracion_minutos ?? 30,
    comision_porcentaje: comision_porcentaje ?? 0,
    es_servicio: tipo_bien === 'servicio' || Boolean(es_servicio),
    es_producto_venta: tipo_bien === 'producto',
    es_insumo_taller: tipo_bien === 'insumo' || atributos_producto.tipo_catalogo === 'insumo',
    es_equipo_dispositivo: tipo_bien === 'equipo' || atributos_producto.tipo_catalogo === 'equipo',
    es_mueble: tipo_bien === 'mueble' || atributos_producto.tipo_catalogo === 'mueble',
    es_maquina: tipo_bien === 'maquina' || Boolean(es_maquina) || atributos_producto.tipo_catalogo === 'maquina',
    receta_insumos: receta_insumos || [],
    atributos_servicio: atributos_servicio || {},
    atributos_ecosistema: atributos_ecosistema || {},
    peso_envase_tara_gramos: peso_envase_tara_gramos ?? 0,
    peso_neto_total_gramos: peso_neto_total_gramos ?? 0,
    factor_densidad: factor_densidad ?? 1.0,
    merma_tolerancia_porcentaje: merma_tolerancia_porcentaje ?? 3.0,
    pao_meses: pao_meses ?? 12,
    unidad_medida: unidad_medida || 'g',
    area_produccion_boh: area_produccion_boh || 'LABORATORIO_CENTRAL',
    // Hardware & Depreciación
    numero_serie: numero_serie || null,
    mac_address: mac_address || null,
    bluetooth_uuid: bluetooth_uuid || null,
    ip_address: ip_address || null,
    protocolo_comunicacion: protocolo_comunicacion || 'STANDALONE_PLUG',
    estacion_asignada: estacion_asignada || 'Almacén Técnico',
    estado_operativo: estado_operativo || 'OPERATIVO',
    vida_util_meses_base: vida_util_meses_base ?? 24,
    meses_extension_reparacion: meses_extension_reparacion ?? 0,
    fecha_adquisicion: fecha_adquisicion || new Date().toISOString().split('T')[0],
    valor_residual_estimado: valor_residual_estimado ?? 0,
    frecuencia_mantenimiento_dias: frecuencia_mantenimiento_dias ?? 90,
    fecha_ultimo_mantenimiento: fecha_ultimo_mantenimiento || null,
    historial_reparaciones_partes: historial_reparaciones_partes || [],
    // Muebles & Estaciones
    codigo_patrimonial_tag: codigo_patrimonial_tag || null,
    tipo_mueble: tipo_mueble || 'SILLON_CORTE',
    capacidad_carga_kg: capacidad_carga_kg ?? 150,
    grados_reclinacion: grados_reclinacion ?? 0,
    material_tapiz: material_tapiz || 'Vinil Náutico',
    // Máquinas & Termo-Mecánica
    tipo_maquina: tipo_maquina || 'CLIMAZON_TERMOESTIMULADOR',
    potencia_watts: potencia_watts ?? 0,
    voltaje_operacion: voltaje_operacion || '220V',
    horas_uso_acumuladas: horas_uso_acumuladas ?? 0,
    horas_vida_util_maxima: horas_vida_util_maxima ?? 6000,
    frecuencia_overhaul_horas: frecuencia_overhaul_horas ?? 500,
    temperatura_maxima_c: temperatura_maxima_c ?? null,
    presion_maxima_bar: presion_maxima_bar ?? null
  };

  if (id) {
    // UPDATE
    const { error } = await supabaseAdmin.from('bienes').update(datosBien).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    // CREATE
    const { data, error } = await supabaseAdmin.from('bienes').insert([datosBien]).select('id').single();
    if (error) throw new Error(error.message);
    id = data.id;

    // INSERT STOCK IF ADMIN
    if (isAdmin && stockInicial > 0) {
      // Inyectar a almacen principal
      await supabaseAdmin.from('almacen_principal').insert([{
        sede_id: sedeId,
        bien_id: id,
        proveedor: atributos_producto.proveedor || 'Inicial',
        marca: atributos_producto.marca || '',
        linea: atributos_producto.linea || '',
        presentacion: atributos_producto.presentacion || '',
        stock: stockInicial,
        costo_unitario: atributos_producto.costo_unitario || 0,
        ubicacion: 'RACK INICIAL'
      }]);

      if (atributos_producto.tipo_catalogo === 'insumo') {
        await supabaseAdmin.from('almacen_laboratorio').insert([{
          sede_id: sedeId,
          bien_id: id,
          stock_actual: stockInicial,
          stock_en_uso: 0
        }]);
      }
    }
  }

  return { success: true, id };
}

export async function inactivarBien(id: string, inactivar: boolean) {
  // Fetch first
  const { data: bien } = await supabaseAdmin.from('bienes').select('atributos_producto').eq('id', id).single();
  if (!bien) throw new Error("Item no encontrado");

  const atributos = bien.atributos_producto || {};
  if (inactivar) {
    atributos.estado = 'inactivo';
  } else {
    delete atributos.estado;
  }

  const { error } = await supabaseAdmin.from('bienes').update({ atributos_producto: atributos }).eq('id', id);
  if (error) throw new Error(error.message);
  
  return { success: true };
}

export async function actualizarJerarquia(tipo: 'marca' | 'linea', valorAntiguo: string, valorNuevo: string) {
  if (!valorNuevo || !valorAntiguo) throw new Error("Valores inválidos");
  const { data: items, error: fetchError } = await supabaseAdmin.from('bienes').select('id, nombre, categoria, atributos_producto').eq(`atributos_producto->>${tipo}`, valorAntiguo);
  if (fetchError) throw new Error(fetchError.message);
  
  if (!items || items.length === 0) return { success: true };

  for (const item of items) {
    const attr = item.atributos_producto || {};
    attr[tipo] = valorNuevo;
    
    // Recalculate SKU
    const tipoSku = attr.tipo_catalogo === 'insumo' ? 'INS' : 'RET';
    attr.sku = `${getFirst3Letters(attr.marca)}-${getFirst3Letters(attr.linea)}-${getFirst3Letters(item.nombre)}-${tipoSku}-${getFirst3Letters(attr.presentacion)}`;
    
    // Keep in sync the main category if it's the line
    const updatePayload: any = { atributos_producto: attr };
    if (tipo === 'linea' && item.categoria === valorAntiguo) {
      updatePayload.categoria = valorNuevo;
    }

    await supabaseAdmin.from('bienes').update(updatePayload).eq('id', item.id);
  }
  return { success: true };
}

export async function inactivarJerarquia(tipo: 'marca' | 'linea', valor: string, inactivar: boolean) {
  const { data: items, error: fetchError } = await supabaseAdmin.from('bienes').select('id, atributos_producto').eq(`atributos_producto->>${tipo}`, valor);
  if (fetchError) throw new Error(fetchError.message);
  
  if (!items || items.length === 0) return { success: true };

  for (const item of items) {
    const attr = item.atributos_producto || {};
    if (inactivar) attr.estado = 'inactivo';
    else delete attr.estado;
    
    await supabaseAdmin.from('bienes').update({ atributos_producto: attr }).eq('id', item.id);
  }
  return { success: true };
}
