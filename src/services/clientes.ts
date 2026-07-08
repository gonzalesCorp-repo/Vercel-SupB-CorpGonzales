import { createClient } from '@/lib/supabase/client';

export interface Cliente {
  id?: string;
  nombre: string;
  dni?: string;
  celular?: string;
  created_at?: string;
  sede_id?: string | null;
  agente_id?: string | null;
  sedes?: { nombre: string } | null;
  agentes?: { nombre: string } | null;
}

const supabase = createClient();

export async function buscarClientes(query: string): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*, sedes(nombre), agentes(nombre)')
    .or(`nombre.ilike.%${query}%,dni.ilike.%${query}%,celular.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error("Error buscando clientes:", error);
    return [];
  }
  return data as Cliente[];
}

export async function crearCliente(cliente: Cliente): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from('clientes')
    .insert([
      {
        nombre: cliente.nombre,
        dni: cliente.dni || null,
        celular: cliente.celular || null,
        sede_id: cliente.sede_id || null,
        agente_id: cliente.agente_id || null
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creando cliente:", error);
    return null;
  }
  
  return data as Cliente;
}

export async function obtenerTodosLosClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*, sedes(nombre), agentes(nombre)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error obteniendo clientes:", error);
    return [];
  }
  return data as Cliente[];
}
