import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

export interface Cliente {
  id: string;
  nombre: string;
  dni: string | null;
  celular: string | null;
}

export interface Bien {
  id: string;
  nombre: string;
  tipo_bien: 'servicio' | 'producto';
  categoria: string;
  precio_venta: number;
  atributos_producto?: any;
  atributos_servicio?: any;
}

export interface Agente {
  id: string;
  nombre: string;
  estado: string;
}

export interface OATC {
  id?: string;
  cliente_id?: string;
  cliente_nombre: string;
  agente_id?: string;
  agente_nombre?: string;
  punto_partida: any[];
  estado_proceso?: string;
  estado_pago?: string;
  created_at?: string;
}

export async function buscarCliente(query: string): Promise<Cliente[]> {
  if (query.length < 3) return [];
  
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, dni, celular')
    .or(`nombre.ilike.%${query}%,dni.ilike.%${query}%,celular.ilike.%${query}%`)
    .limit(10);
    
  if (error) {
    console.error("Error buscando cliente:", error);
    return [];
  }
  
  return data as Cliente[];
}

export async function obtenerCatalogo(tipo: 'servicio' | 'producto'): Promise<Bien[]> {
  const { data, error } = await supabase
    .from('bienes')
    .select('*')
    .eq('tipo_bien', tipo);
    
  if (error) {
    console.error(`Error obteniendo catálogo de ${tipo}:`, error);
    return [];
  }
  
  return data as Bien[];
}

export async function obtenerAgentesDisponibles(): Promise<Agente[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  // Hacer join con sedes_usuarios para filtrar
  const { data, error } = await supabase
    .from('agentes')
    .select('id, nombre, estado, sedes_usuarios!inner(sede_id)')
    .eq('sedes_usuarios.sede_id', sedeId);
    
  if (error) {
    console.error("Error obteniendo agentes:", error);
    return [];
  }
  
  return data as Agente[];
}

export async function crearOatc(
  clienteId: string | null,
  clienteNombre: string,
  agenteId: string | null,
  agenteNombre: string,
  puntoPartida: any[]
) {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  
  const { data, error } = await supabase
    .from('oatc')
    .insert([{
      cliente_id: clienteId,
      cliente_nombre: clienteNombre,
      agente_id: agenteId,
      agente_nombre: agenteNombre,
      punto_partida: puntoPartida,
      estado_proceso: 'ESPERA',
      sede_id: sedeId
    }])
    .select();
    
  if (error) {
    console.error("Error creando OATC:", error);
    throw new Error(error.message);
  }
  
  return data;
}
