import { createClient } from '@/lib/supabase/client';

export interface Cliente {
  id?: string;
  nombre: string;
  dni?: string;
  celular?: string;
  created_at?: string;
  // origen_captacion?: string; (Depende si modificamos el schema o usamos metadata, por ahora usar tabla base)
}

const supabase = createClient();

export async function buscarClientes(query: string): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
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
        celular: cliente.celular || null
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
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error obteniendo clientes:", error);
    return [];
  }
  return data as Cliente[];
}
