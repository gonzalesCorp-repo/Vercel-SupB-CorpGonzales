'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const BienSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  categoria: z.string().min(1, "La categoría o línea es obligatoria"),
  tipo_bien: z.enum(['producto', 'insumo', 'servicio']),
  precio_venta: z.number().min(0, "El precio de venta no puede ser negativo"),
  stockInicial: z.number().min(0, "El stock no puede ser negativo").default(0),
  atributos_producto: z.object({
    marca: z.string().optional(),
    linea: z.string().optional(),
    presentacion: z.string().optional(),
    proveedor: z.string().optional(),
    costo_unitario: z.number().min(0).optional(),
    tipo_catalogo: z.string().optional(),
    estado: z.string().optional(),
    sku: z.string().optional()
  }).passthrough()
});

export async function getCatalogo(filtroTipo: string, mostrarInactivos: boolean = false) {
  let query = supabaseAdmin.from('bienes').select('*').order('created_at', { ascending: false }).limit(2000);
  
  if (filtroTipo === 'servicio') {
    query = query.eq('tipo_bien', 'servicio');
  } else if (filtroTipo === 'insumo') {
    query = query.eq('tipo_bien', 'producto').eq('atributos_producto->>tipo_catalogo', 'insumo');
  } else if (filtroTipo === 'producto') {
    query = query.eq('tipo_bien', 'producto').eq('atributos_producto->>tipo_catalogo', 'retail');
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
    throw new Error(parseResult.error.errors.map(e => e.message).join(', '));
  }
  
  const payload = parseResult.data;
  const { nombre, categoria, tipo_bien, precio_venta, atributos_producto, stockInicial } = payload;
  
  let id = bienId;

  // Handles Generics
  if (!atributos_producto.marca) atributos_producto.marca = 'Marca_Generica';
  if (!atributos_producto.linea) atributos_producto.linea = 'Linea_Generica';
  if (!atributos_producto.presentacion) atributos_producto.presentacion = 'Pres_Generica';

  if (id) {
    // UPDATE
    const { error } = await supabaseAdmin.from('bienes').update({
      nombre, categoria, tipo_bien, precio_venta, atributos_producto
    }).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    // CREATE
    const { data, error } = await supabaseAdmin.from('bienes').insert([{
      nombre, categoria, tipo_bien, precio_venta, atributos_producto
    }]).select('id').single();
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
