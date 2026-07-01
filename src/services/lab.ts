import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { OATC } from './recepcion';

const supabase = createClient();

// Tipos
export interface InsumoPrincipal {
  id: string;
  bien_id: string;
  bienes?: {
    nombre: string;
    categoria: string;
    tipo_bien: string;
  };
  proveedor: string;
  marca: string;
  linea: string;
  presentacion: string;
  stock: number;
  stock_minimo: number;
  costo_unitario: number;
  ubicacion: string;
}

export interface InsumoLaboratorio {
  id: string;
  bien_id: string;
  almacen_principal?: InsumoPrincipal; // Join
  stock_actual: number;
  stock_en_uso: number;
}

// 1. Obtener Órdenes de Servicio (OATC) con pedidos pendientes de Lab (estado_proceso = 'EN_CURSO')
// Depende de cómo modelamos los "pedidos", actualmente en `lab_pedidos`
export async function obtenerPedidosPendientesLab() {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const { data, error } = await supabase
    .from('lab_pedidos')
    .select('*, oatc(*)')
    .eq('estado', 'PENDIENTE')
    .eq('sede_id', sedeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error obteniendo pedidos lab:", error);
    return [];
  }
  return data;
}

// 2. Obtener Stock Completo (Principal + Lab combinados para la vista Stock & Ubicación)
export async function obtenerStockUbicacion() {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  // Traemos Principal
  const { data: principalData, error: principalErr } = await supabase
    .from('almacen_principal')
    .select('*, bienes(nombre, categoria)')
    .eq('sede_id', sedeId);

  // Traemos Lab
  const { data: labData, error: labErr } = await supabase
    .from('almacen_laboratorio')
    .select('*')
    .eq('sede_id', sedeId);

  if (principalErr || labErr) {
    console.error("Error obteniendo stock combinado:", principalErr || labErr);
    return [];
  }

  // Mapeamos y combinamos
  const combinado = (principalData || []).map((p: any) => {
    const labItem = (labData || []).find((l: any) => l.bien_id === p.bien_id);
    return {
      bien_id: p.bien_id,
      producto: p.bienes?.nombre || 'Desconocido',
      marca: p.marca || '',
      sku: p.sku || '',
      ubicacion: p.ubicacion || 'RACK SIN NOMBRE',
      stock_central: p.stock || 0,
      stock_lab: labItem ? labItem.stock_actual : 0,
      stock_minimo: p.stock_minimo || 0
    };
  });

  return combinado;
}

// 4. Obtener Kardex
export async function obtenerKardex(limite: number = 100) {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const { data, error } = await supabase
    .from('inventario_movimientos')
    .select('*, bienes(nombre), agentes(nombre)')
    .eq('sede_id', sedeId)
    .order('fecha_hora', { ascending: false })
    .limit(limite);

  if (error) console.error("Error kardex:", error);
  return data || [];
}

// 5. Ingreso Central
export async function registrarIngresoCentral(items: any[], referenciaDocumento: string, usuarioId: string) {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) throw new Error("No hay sede activa");

  for (const item of items) {
    // Check if exists in almacen_principal
    const { data: exists } = await supabase
      .from('almacen_principal')
      .select('id, stock')
      .eq('sede_id', sedeId)
      .eq('bien_id', item.bien_id)
      .maybeSingle();

    if (exists) {
      await supabase.from('almacen_principal').update({ 
        stock: Number(exists.stock) + Number(item.cantidad),
        costo_unitario: item.costo_unitario,
        updated_at: new Date().toISOString()
      }).eq('id', exists.id);
    } else {
      await supabase.from('almacen_principal').insert([{
        sede_id: sedeId,
        bien_id: item.bien_id,
        proveedor: 'Ingreso Directo',
        marca: item.marca || '',
        linea: item.linea || '',
        presentacion: item.presentacion || 'Unidad',
        stock: Number(item.cantidad),
        costo_unitario: item.costo_unitario,
        ubicacion: 'RACK PRINCIPAL'
      }]);
    }

    // Kardex
    await supabase.from('inventario_movimientos').insert([{
      sede_id: sedeId,
      tipo_movimiento: 'INGRESO',
      bien_id: item.bien_id,
      descripcion: `Doc: ${referenciaDocumento}`,
      cantidad: Number(item.cantidad),
      origen: 'EXTERNO',
      destino: 'ALMACEN CENTRAL',
      costo_unitario: item.costo_unitario,
      agente_id: usuarioId
    }]);
  }
}

// 6. Transferencia Masiva a Lab
export async function transferirAlmacen(items: any[], usuarioId: string) {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) throw new Error("No hay sede activa");

  for (const item of items) {
    const cantMover = Number(item.cantidad_mover);
    if (cantMover <= 0) continue;

    // 1. Restar de principal
    const { data: princ } = await supabase.from('almacen_principal').select('id, stock, costo_unitario').eq('sede_id', sedeId).eq('bien_id', item.bien_id).single();
    if (princ) {
      await supabase.from('almacen_principal').update({
        stock: Number(princ.stock) - cantMover
      }).eq('id', princ.id);
    }

    // 2. Sumar a Lab
    const { data: labExists } = await supabase.from('almacen_laboratorio').select('id, stock_actual').eq('sede_id', sedeId).eq('bien_id', item.bien_id).maybeSingle();
    if (labExists) {
      await supabase.from('almacen_laboratorio').update({
        stock_actual: Number(labExists.stock_actual) + cantMover
      }).eq('id', labExists.id);
    } else {
      await supabase.from('almacen_laboratorio').insert([{
        sede_id: sedeId,
        bien_id: item.bien_id,
        stock_actual: cantMover,
        stock_en_uso: 0
      }]);
    }

    // 3. Kardex
    await supabase.from('inventario_movimientos').insert([{
      sede_id: sedeId,
      tipo_movimiento: 'TRANSFERENCIA',
      bien_id: item.bien_id,
      descripcion: 'Traslado interno a Laboratorio',
      cantidad: cantMover,
      origen: 'ALMACEN CENTRAL',
      destino: 'LABORATORIO',
      costo_unitario: princ?.costo_unitario || 0,
      agente_id: usuarioId
    }]);
  }
}

