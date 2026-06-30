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

// 2. Obtener Stock del Almacén Principal
export async function obtenerStockPrincipal() {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const { data, error } = await supabase
    .from('almacen_principal')
    .select('*, bienes(nombre, categoria)')
    .eq('sede_id', sedeId);

  if (error) console.error("Error stock principal:", error);
  return data || [];
}

// 3. Obtener Stock del Laboratorio
export async function obtenerStockLaboratorio() {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  const { data, error } = await supabase
    .from('almacen_laboratorio')
    .select('*, almacen_principal(*, bienes(nombre))')
    .eq('sede_id', sedeId);

  if (error) console.error("Error stock lab:", error);
  return data || [];
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
