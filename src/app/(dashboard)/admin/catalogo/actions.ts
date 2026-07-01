'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

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
  } else {
    // PostgREST doesn't natively support "is missing OR not eq" perfectly in simple builder for JSONB,
    // so we can either fetch all and filter in JS, or use a negative filter.
    // For simplicity with JSONB, we'll fetch all matching type and filter in JS if needed,
    // or use neq. Let's use neq since most active items won't have 'estado' or will have 'activo'.
    // Actually, 'neq' drops rows where the key doesn't exist. So we better fetch and filter in JS,
    // or set 'activo' explicitly.
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

export async function guardarBien(bienId: string | null, payload: any, sedeId: string, isAdmin: boolean) {
  const { nombre, categoria, tipo_bien, precio_venta, atributos_producto, stockInicial } = payload;
  
  let id = bienId;

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
