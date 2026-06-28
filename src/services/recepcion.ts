import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { registrarLog } from './logger';

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
  rol?: string;
  especialidad?: string;
  badge?: string;
  created_at?: string;
  ultimo_cambio_estado?: string;
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
  tipo_demanda?: string;
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
  }
  
  // MOCK FALLBACK SI LA BD ESTÁ VACÍA (Para propósitos de demostración/mockup)
  if (!data || data.length === 0) {
    if (tipo === 'servicio') {
      return [
        { id: 's1', nombre: 'Corte Clásico', tipo_bien: 'servicio', categoria: 'Barbería', precio_venta: 35, atributos_servicio: { tiempo_estimado_min: 30 } },
        { id: 's2', nombre: 'Tinte Completo', tipo_bien: 'servicio', categoria: 'Colorimetría', precio_venta: 120, atributos_servicio: { tiempo_estimado_min: 90 } },
        { id: 's3', nombre: 'Manicure Gel', tipo_bien: 'servicio', categoria: 'Manos y Pies', precio_venta: 45, atributos_servicio: { tiempo_estimado_min: 45 } },
        { id: 's4', nombre: 'Corte Fade', tipo_bien: 'servicio', categoria: 'Barbería', precio_venta: 40, atributos_servicio: { tiempo_estimado_min: 40 } },
        { id: 's5', nombre: 'Lavado Especial', tipo_bien: 'servicio', categoria: 'Cuidado Capilar', precio_venta: 25, atributos_servicio: { tiempo_estimado_min: 20 } },
      ];
    } else {
      return [
        { id: 'p1', nombre: 'Cera para cabello', tipo_bien: 'producto', categoria: 'Styling', precio_venta: 50, atributos_producto: { marca: 'Suavecito' } },
        { id: 'p2', nombre: 'Shampoo Matizador', tipo_bien: 'producto', categoria: 'Cuidado Capilar', precio_venta: 85, atributos_producto: { marca: 'Loreal' } },
        { id: 'p3', nombre: 'Aceite de Argán', tipo_bien: 'producto', categoria: 'Cuidado Capilar', precio_venta: 65, atributos_producto: { marca: 'Moroccanoil' } },
      ];
    }
  }
  
  return data as Bien[];
}

export async function obtenerAgentesDisponibles(): Promise<Agente[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  // Temporalmente traemos todos los agentes sin hacer join con sedes_usuarios
  // ya que RLS bloquea la lectura cruzada para usuarios estándar.
  const { data, error } = await supabase
    .from('agentes')
    .select('*');
    
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
  puntoPartida: any[],
  tipoDemanda: string = 'cliente'
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
      tipo_demanda: tipoDemanda,
      estado_proceso: 'ASESORIA',
      sede_id: sedeId
    }])
    .select();
    
  if (error) {
    console.error("Error creando OATC:", error);
    throw new Error(error.message);
  }
  
  // Registrar en Logs
  await registrarLog('RECEPCION', `Generó orden para el cliente ${clienteNombre}`, { 
    servicios: puntoPartida.map(p => p.nombre).join(', '),
    agenteAsignado: agenteNombre
  });
  
  return data;
}

export async function obtenerOatcsActivosDelDia(): Promise<OATC[]> {
  const sedeId = useAppStore.getState().sedeActiva?.id;
  if (!sedeId) return [];

  // Nota: Al ejecutarse en el cliente (Browser), setHours asume la zona horaria local de la sede.
  // toISOString() lo convierte a UTC para comparar correctamente con 'timestamptz' en Supabase.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('oatc')
    .select('*')
    .eq('sede_id', sedeId)
    .gte('created_at', startOfDay.toISOString())
    .neq('estado_proceso', 'FINALIZADO')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error obteniendo OATCs del día:", error);
    return [];
  }

  return data as OATC[];
}
